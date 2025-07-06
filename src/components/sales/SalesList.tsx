
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, ShoppingBag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { SaleForm } from './SaleForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  clients: {
    name: string;
  } | null;
  profiles: {
    name: string;
  };
}

const paymentMethodMap = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  pix: 'PIX',
  transferencia: 'Transferência',
};

export function SalesList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          clients(name),
          profiles(name)
        `)
        .order('payment_date', { ascending: false });

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);
        
        query = query
          .gte('payment_date', startDate.toISOString())
          .lte('payment_date', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sale[];
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleNewSale = () => {
    setIsDialogOpen(true);
  };

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dateFilter ? `Em ${format(new Date(dateFilter), 'dd/MM/yyyy', { locale: ptBR })}` : 'Total geral'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Número de Vendas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">
              {dateFilter ? 'No período selecionado' : 'Total de vendas'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Vendas
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="dateFilter">Filtrar por data:</Label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-auto"
                />
                {dateFilter && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDateFilter('')}
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <Button onClick={handleNewSale}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Venda
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando vendas...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {dateFilter ? 'Nenhuma venda encontrada para esta data.' : 'Nenhuma venda registrada ainda.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.payment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{sale.clients?.name || 'Cliente avulso'}</TableCell>
                      <TableCell>{sale.profiles.name}</TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(sale.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {paymentMethodMap[sale.payment_method as keyof typeof paymentMethodMap] || sale.payment_method}
                        </span>
                      </TableCell>
                      <TableCell>{sale.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <SaleForm onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
