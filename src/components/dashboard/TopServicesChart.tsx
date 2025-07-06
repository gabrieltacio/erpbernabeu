
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TopServicesChartProps {
  dateRange: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function TopServicesChart({ dateRange }: TopServicesChartProps) {
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['top-services-chart', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('service_name, quantity, sales(payment_date)')
        .gte('sales.payment_date', startDate.toISOString());

      if (!saleItems) return [];

      // Agrupar serviços e contar quantidade
      const serviceStats = saleItems.reduce((acc: any, item) => {
        const serviceName = item.service_name;
        if (!acc[serviceName]) {
          acc[serviceName] = { name: serviceName, value: 0 };
        }
        acc[serviceName].value += item.quantity;
        return acc;
      }, {});

      return Object.values(serviceStats)
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Realizados</CardTitle>
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
        <CardTitle>Serviços Mais Realizados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {servicesData && servicesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {servicesData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum serviço realizado no período
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
