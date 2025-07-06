
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AppointmentsChartProps {
  dateRange: string;
}

export function AppointmentsChart({ dateRange }: AppointmentsChartProps) {
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments-chart', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status, scheduled_date')
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .order('scheduled_date');

      if (!appointments) return [];

      // Contar agendamentos por status
      const statusCounts = appointments.reduce((acc: any, appointment) => {
        const status = appointment.status;
        const statusLabels = {
          'agendado': 'Agendado',
          'confirmado': 'Confirmado', 
          'em_andamento': 'Em Andamento',
          'concluido': 'Concluído',
          'cancelado': 'Cancelado'
        };
        
        const label = statusLabels[status as keyof typeof statusLabels] || status;
        
        if (!acc[label]) {
          acc[label] = { status: label, count: 0 };
        }
        acc[label].count++;
        return acc;
      }, {});

      return Object.values(statusCounts);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos por Status</CardTitle>
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
        <CardTitle>Agendamentos por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {appointmentsData && appointmentsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum agendamento registrado no período
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
