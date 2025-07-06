import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CashFlowChart } from './CashFlowChart';
import { TransactionsList } from './TransactionsList';

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface EditingTransaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface Sale {
  total_amount: number;
  created_at: string;
}

export function CashFlowSection() {
  const [newTransaction, setNewTransaction] = useState({
    type: 'entrada',
    amount: '',
    description: '',
    category: ''
  });
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar dados do caixa
  const { data: cashData, isLoading } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      const [salesResult, transactionsResult] = await Promise.all([
        // Vendas do dia e do mês
        supabase
          .from('sales')
          .select('total_amount, created_at')
          .gte('created_at', startOfMonth.toISOString()),
        
        // Transações manuais
        supabase
          .from('cash_transactions')
          .select('*')
          .gte('created_at', startOfMonth.toISOString())
          .order('created_at', { ascending: false })
      ]);

      const sales: Sale[] = salesResult.data || [];
      const transactions: CashTransaction[] = transactionsResult.data || [];

      // Calcular totais do dia
      const todaySales = sales
        .filter(sale => new Date(sale.created_at) >= startOfDay)
        .reduce((sum, sale) => sum + Number(sale.total_amount), 0);

      const todayTransactions = transactions
        .filter(transaction => new Date(transaction.created_at) >= startOfDay);

      const todayIncome = todayTransactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const todayExpenses = todayTransactions
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Calcular totais do mês
      const monthlySales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const monthlyIncome = transactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const monthlyExpenses = transactions
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        today: {
          sales: todaySales,
          income: todayIncome,
          expenses: todayExpenses,
          balance: todaySales + todayIncome - todayExpenses
        },
        monthly: {
          sales: monthlySales,
          income: monthlyIncome,
          expenses: monthlyExpenses,
          balance: monthlySales + monthlyIncome - monthlyExpenses
        },
        transactions
      };
    }
  });

  // Mutation para adicionar transação
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const { error } = await supabase
        .from('cash_transactions')
        .insert([{
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description: transaction.description,
          category: transaction.category
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Transação adicionada',
        description: 'A movimentação foi registrada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      setIsDialogOpen(false);
      setNewTransaction({
        type: 'entrada',
        amount: '',
        description: '',
        category: ''
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a transação.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para editar transação
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, transaction }: { id: string, transaction: any }) => {
      const { error } = await supabase
        .from('cash_transactions')
        .update({
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description: transaction.description,
          category: transaction.category
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Transação atualizada',
        description: 'A movimentação foi atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a transação.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para deletar transação
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Transação removida',
        description: 'A movimentação foi removida com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a transação.',
        variant: 'destructive',
      });
    }
  });

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e a descrição.',
        variant: 'destructive',
      });
      return;
    }

    addTransactionMutation.mutate(newTransaction);
  };

  const handleEditTransaction = (transaction: CashTransaction) => {
    setEditingTransaction({
      ...transaction,
      amount: transaction.amount.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction?.amount || !editingTransaction?.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e a descrição.',
        variant: 'destructive',
      });
      return;
    }

    updateTransactionMutation.mutate({
      id: editingTransaction.id,
      transaction: editingTransaction
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta movimentação?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Diário */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Vendas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {cashData?.today.sales.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-blue-600" />
              Entradas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {cashData?.today.income.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-red-600" />
              Saídas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {cashData?.today.expenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Saldo Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              cashData?.today.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {cashData?.today.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Resumo Mensal
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Movimentação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={newTransaction.type} 
                      onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select 
                      value={newTransaction.category} 
                      onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retirada">Retirada</SelectItem>
                        <SelectItem value="despesa">Despesa Operacional</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva a movimentação..."
                    />
                  </div>

                  <Button 
                    onClick={handleAddTransaction} 
                    className="w-full"
                    disabled={addTransactionMutation.isPending}
                  >
                    {addTransactionMutation.isPending ? 'Salvando...' : 'Salvar Movimentação'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Vendas</div>
              <div className="text-xl font-bold text-green-600">
                R$ {cashData?.monthly.sales.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Entradas</div>
              <div className="text-xl font-bold text-blue-600">
                R$ {cashData?.monthly.income.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Saídas</div>
              <div className="text-xl font-bold text-red-600">
                R$ {cashData?.monthly.expenses.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Saldo</div>
              <div className={`text-xl font-bold ${
                cashData?.monthly.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                R$ {cashData?.monthly.balance.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar transação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={editingTransaction.type} 
                  onValueChange={(value) => setEditingTransaction(prev => prev ? ({ ...prev, type: value }) : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction(prev => prev ? ({ ...prev, amount: e.target.value }) : null)}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select 
                  value={editingTransaction.category || ''} 
                  onValueChange={(value) => setEditingTransaction(prev => prev ? ({ ...prev, category: value }) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retirada">Retirada</SelectItem>
                    <SelectItem value="despesa">Despesa Operacional</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="Descreva a movimentação..."
                />
              </div>

              <Button 
                onClick={handleUpdateTransaction} 
                className="w-full"
                disabled={updateTransactionMutation.isPending}
              >
                {updateTransactionMutation.isPending ? 'Salvando...' : 'Atualizar Movimentação'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gráfico de Fluxo de Caixa */}
      <CashFlowChart />

      {/* Lista de Transações */}
      <TransactionsList 
        transactions={cashData?.transactions || []} 
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}
