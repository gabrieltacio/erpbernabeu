
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  dateRange: string;
}

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-chart', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount, payment_date')
        .gte('payment_date', startDate.toISOString())
        .order('payment_date');

      if (!sales) return [];

      // Agrupar vendas por dia
      const groupedData = sales.reduce((acc: any, sale) => {
        const date = new Date(sale.payment_date).toLocaleDateString('pt-BR');
        if (!acc[date]) {
          acc[date] = { date, revenue: 0 };
        }
        acc[date].revenue += Number(sale.total_amount);
        return acc;
      }, {});

      return Object.values(groupedData);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturamento por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhuma venda registrada no período
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
