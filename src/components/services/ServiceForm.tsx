
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number | null;
  price: number;
  type: 'servico' | 'produto';
  stock: number | null;
  active: boolean;
}

interface ServiceFormProps {
  service?: Service | null;
  type: 'servico' | 'produto';
  onClose: () => void;
}

export function ServiceForm({ service, type, onClose }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration: service?.duration?.toString() || '',
    price: service?.price?.toString() || '',
    stock: service?.stock?.toString() || '',
    active: service?.active ?? true,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Verificar autenticação primeiro
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      console.log('User profile:', profile);

      const submitData = {
        name: data.name,
        description: data.description || null,
        duration: type === 'servico' ? parseInt(data.duration) || null : null,
        price: parseFloat(data.price),
        type,
        stock: type === 'produto' ? parseInt(data.stock) || 0 : null,
        active: data.active,
      };

      console.log('Submitting data:', submitData);

      if (service) {
        const { data: result, error } = await supabase
          .from('services')
          .update(submitData)
          .eq('id', service.id)
          .select();
        
        console.log('Update result:', result);
        console.log('Update error:', error);
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('services')
          .insert([submitData])
          .select();
        
        console.log('Insert result:', result);
        console.log('Insert error:', error);
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: service ? 'Item atualizado' : 'Item criado',
        description: `${type === 'servico' ? 'Serviço' : 'Produto'} ${service ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error saving service:', error);
      
      let errorMessage = 'Não foi possível salvar o item.';
      
      if (error.message?.includes('row-level security policy')) {
        errorMessage = 'Você não tem permissão para criar/editar serviços. Verifique se seu perfil tem o papel adequado (admin ou recepcionista).';
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = 'Você precisa estar logado para realizar esta ação.';
      }
      
      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, informe o nome e o preço.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(parseFloat(formData.price))) {
      toast({
        title: 'Preço inválido',
        description: 'Por favor, informe um preço válido.',
        variant: 'destructive',
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={`Nome do ${type === 'servico' ? 'serviço' : 'produto'}`}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descrição detalhada..."
          className="w-full min-h-[60px] px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {type === 'servico' && (
        <div>
          <Label htmlFor="duration">Duração (minutos)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            placeholder="30"
            min="1"
          />
        </div>
      )}

      <div>
        <Label htmlFor="price">Preço *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          placeholder="0.00"
          required
          min="0"
        />
      </div>

      {type === 'produto' && (
        <div>
          <Label htmlFor="stock">Estoque</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => handleChange('stock', e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => handleChange('active', checked as boolean)}
        />
        <Label htmlFor="active">Ativo</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : (service ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}
