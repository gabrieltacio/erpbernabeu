
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface Sale {
  total_amount: number;
  created_at: string;
}

export function CashFlowChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['cash-flow-chart'],
    queryFn: async () => {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const [salesResult, transactionsResult] = await Promise.all([
        supabase
          .from('sales')
          .select('total_amount, created_at')
          .gte('created_at', last30Days.toISOString()),
        
        supabase
          .from('cash_transactions')
          .select('*')
          .gte('created_at', last30Days.toISOString())
      ]);

      const sales: Sale[] = salesResult.data || [];
      const transactions: CashTransaction[] = transactionsResult.data || [];

      // Agrupar por data
      const dailyData: { [key: string]: { date: string, income: number, expenses: number, balance: number } } = {};

      // Processar vendas
      sales.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString('pt-BR');
        if (!dailyData[date]) {
          dailyData[date] = { date, income: 0, expenses: 0, balance: 0 };
        }
        dailyData[date].income += Number(sale.total_amount);
      });

      // Processar transações
      transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString('pt-BR');
        if (!dailyData[date]) {
          dailyData[date] = { date, income: 0, expenses: 0, balance: 0 };
        }
        
        if (transaction.type === 'entrada') {
          dailyData[date].income += Number(transaction.amount);
        } else {
          dailyData[date].expenses += Number(transaction.amount);
        }
      });

      // Calcular saldo e ordenar por data
      const chartData = Object.values(dailyData)
        .map(day => ({
          ...day,
          balance: day.income - day.expenses
        }))
        .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                      new Date(b.date.split('/').reverse().join('-')).getTime());

      return chartData;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa (Últimos 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `R$ ${value.toFixed(2)}`, 
                  name === 'income' ? 'Entradas' : name === 'expenses' ? 'Saídas' : 'Saldo'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Entradas"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Saídas"
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Saldo"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
