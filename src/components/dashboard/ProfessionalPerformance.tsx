
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProfessionalPerformanceProps {
  dateRange: string;
}

export function ProfessionalPerformance({ dateRange }: ProfessionalPerformanceProps) {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['professional-performance', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const [salesResult, appointmentsResult] = await Promise.all([
        supabase
          .from('sales')
          .select('total_amount, professional_id, profiles(name)')
          .gte('payment_date', startDate.toISOString()),
        
        supabase
          .from('appointments')
          .select('professional_id, status, profiles(name)')
          .gte('scheduled_date', startDate.toISOString().split('T')[0])
          .eq('status', 'concluido')
      ]);

      const sales = salesResult.data || [];
      const appointments = appointmentsResult.data || [];

      // Agrupar dados por profissional
      const professionalStats: any = {};

      sales.forEach(sale => {
        const profId = sale.professional_id;
        const profName = sale.profiles?.name || 'Desconhecido';
        if (!professionalStats[profId]) {
          professionalStats[profId] = {
            name: profName,
            revenue: 0,
            salesCount: 0,
            appointmentsCount: 0
          };
        }
        professionalStats[profId].revenue += Number(sale.total_amount);
        professionalStats[profId].salesCount++;
      });

      appointments.forEach(appointment => {
        const profId = appointment.professional_id;
        const profName = appointment.profiles?.name || 'Desconhecido';
        if (!professionalStats[profId]) {
          professionalStats[profId] = {
            name: profName,
            revenue: 0,
            salesCount: 0,
            appointmentsCount: 0
          };
        }
        professionalStats[profId].appointmentsCount++;
      });

      return Object.values(professionalStats).sort((a: any, b: any) => b.revenue - a.revenue);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance dos Profissionais</CardTitle>
      </CardHeader>
      <CardContent>
        {performanceData && performanceData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((prof: any, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{prof.name}</TableCell>
                  <TableCell className="text-right">{prof.salesCount}</TableCell>
                  <TableCell className="text-right">{prof.appointmentsCount}</TableCell>
                  <TableCell className="text-right">R$ {prof.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhum dado de performance disponível no período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
