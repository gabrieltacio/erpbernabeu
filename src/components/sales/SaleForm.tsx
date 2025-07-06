
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface SaleFormProps {
  onClose: () => void;
}

interface SaleItem {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function SaleForm({ onClose }: SaleFormProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    professional_id: '',
    payment_method: '',
    notes: '',
  });
  
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      return data || [];
    },
  });

  // Buscar profissionais
  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });

  // Buscar serviços
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*').eq('active', true).order('name');
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (saleItems.length === 0) {
        throw new Error('Adicione pelo menos um item à venda');
      }

      const totalAmount = saleItems.reduce((sum, item) => sum + item.total_price, 0);

      // Criar a venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          client_id: data.client_id || null,
          professional_id: data.professional_id,
          payment_method: data.payment_method,
          total_amount: totalAmount,
          notes: data.notes || null,
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar os itens da venda
      const itemsToInsert = saleItems.map(item => ({
        sale_id: sale.id,
        service_id: item.service_id,
        service_name: item.service_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Atualizar estoque se for produto
      for (const item of saleItems) {
        const service = services.find(s => s.id === item.service_id);
        if (service && service.type === 'produto' && service.stock !== null) {
          const newStock = service.stock - item.quantity;
          await supabase
            .from('services')
            .update({ stock: Math.max(0, newStock) })
            .eq('id', item.service_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: 'Venda registrada',
        description: 'Venda foi registrada com sucesso.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar venda',
        description: error.message || 'Não foi possível registrar a venda.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.professional_id || !formData.payment_method) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, informe o profissional e a forma de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    mutation.mutate(formData);
  };

  const addSaleItem = () => {
    setSaleItems([...saleItems, {
      service_id: '',
      service_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  const updateSaleItem = (index: number, field: string, value: any) => {
    const newItems = [...saleItems];
    
    if (field === 'service_id') {
      const service = services.find(s => s.id === value);
      if (service) {
        newItems[index] = {
          ...newItems[index],
          service_id: value,
          service_name: service.name,
          unit_price: Number(service.price),
          total_price: newItems[index].quantity * Number(service.price),
        };
      }
    } else if (field === 'quantity') {
      const quantity = Math.max(1, parseInt(value) || 1);
      newItems[index] = {
        ...newItems[index],
        quantity,
        total_price: quantity * newItems[index].unit_price,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setSaleItems(newItems);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const totalAmount = saleItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_id">Cliente (Opcional)</Label>
          <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
            <SelectTrigger className="bg-white border border-gray-300">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="none">Cliente avulso</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="professional_id">Profissional *</Label>
          <Select value={formData.professional_id} onValueChange={(value) => setFormData(prev => ({ ...prev, professional_id: value }))}>
            <SelectTrigger className="bg-white border border-gray-300">
              <SelectValue placeholder="Selecione um profissional" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Itens da Venda
            <Button type="button" onClick={addSaleItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {saleItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum item adicionado. Clique em "Adicionar Item" para começar.
            </p>
          ) : (
            saleItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-gray-50">
                <div className="col-span-5">
                  <Label className="text-xs">Serviço/Produto</Label>
                  <Select 
                    value={item.service_id} 
                    onValueChange={(value) => updateSaleItem(index, 'service_id', value)}
                  >
                    <SelectTrigger className="bg-white border border-gray-300">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R$ {Number(service.price).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateSaleItem(index, 'quantity', e.target.value)}
                    className="bg-white border border-gray-300"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label className="text-xs">Preço Unit.</Label>
                  <Input
                    value={`R$ ${item.unit_price.toFixed(2)}`}
                    disabled
                    className="bg-gray-100 border border-gray-300"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label className="text-xs">Total</Label>
                  <Input
                    value={`R$ ${item.total_price.toFixed(2)}`}
                    disabled
                    className="bg-gray-100 border border-gray-300"
                  />
                </div>
                
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSaleItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          
          {saleItems.length > 0 && (
            <div className="text-right">
              <strong>Total Geral: R$ {totalAmount.toFixed(2)}</strong>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="payment_method">Forma de Pagamento *</Label>
        <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
          <SelectTrigger className="bg-white border border-gray-300">
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações sobre a venda..."
          className="bg-white border border-gray-300"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Registrando...' : 'Registrar Venda'}
        </Button>
      </div>
    </form>
  );
}
