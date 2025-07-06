
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppointmentsReportProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    professionalId: string;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_LABELS = {
  'agendado': 'Agendado',
  'confirmado': 'Confirmado',
  'em_andamento': 'Em Andamento',
  'concluido': 'Concluído',
  'cancelado': 'Cancelado'
};

export function AppointmentsReport({ filters }: AppointmentsReportProps) {
  const { toast } = useToast();

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments-report', filters],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles:professional_id(name),
          clients:client_id(name),
          services:service_id(name)
        `)
        .order('scheduled_date', { ascending: true });

      if (filters.dateFrom) {
        query = query.gte('scheduled_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('scheduled_date', filters.dateTo);
      }
      if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }

      const { data: appointments } = await query;

      if (!appointments) return null;

      // Agrupar por status
      const statusData = appointments.reduce((acc: any, apt) => {
        const status = STATUS_LABELS[apt.status as keyof typeof STATUS_LABELS] || apt.status;
        if (!acc[status]) {
          acc[status] = 0;
        }
        acc[status]++;
        return acc;
      }, {});

      const statusChartData = Object.entries(statusData).map(([name, value]) => ({
        name,
        value: Number(value)
      }));

      // Agrupar por serviço
      const serviceData = appointments.reduce((acc: any, apt) => {
        const serviceName = apt.services?.name || 'Serviço não informado';
        if (!acc[serviceName]) {
          acc[serviceName] = 0;
        }
        acc[serviceName]++;
        return acc;
      }, {});

      const serviceChartData = Object.entries(serviceData).map(([name, value]) => ({
        name,
        value: Number(value)
      }));

      // Agrupar por profissional
      const professionalData = appointments.reduce((acc: any, apt) => {
        const profName = apt.profiles?.name || 'Profissional não informado';
        if (!acc[profName]) {
          acc[profName] = 0;
        }
        acc[profName]++;
        return acc;
      }, {});

      const professionalChartData = Object.entries(professionalData).map(([name, value]) => ({
        name,
        value: Number(value)
      }));

      return {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(apt => apt.status === 'concluido').length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'cancelado').length,
        statusChartData,
        serviceChartData,
        professionalChartData,
        appointments
      };
    }
  });

  const handleExport = async (format: 'csv') => {
    try {
      if (!appointmentsData?.appointments) return;
      
      const csvContent = [
        ['Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Status'].join(','),
        ...appointmentsData.appointments.map(apt => [
          apt.scheduled_date,
          apt.scheduled_time,
          apt.clients?.name || 'N/A',
          apt.profiles?.name || 'N/A',
          apt.services?.name || 'N/A',
          STATUS_LABELS[apt.status as keyof typeof STATUS_LABELS] || apt.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-agendamentos-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportação realizada",
        description: "Relatório exportado em formato CSV",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!appointmentsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Nenhum agendamento encontrado para o período selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Total de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {appointmentsData.totalAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appointmentsData.completedAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Cancelados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {appointmentsData.cancelledAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {appointmentsData.totalAppointments > 0 
                ? ((appointmentsData.completedAppointments / appointmentsData.totalAppointments) * 100).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Exportação */}
      <div className="flex gap-2">
        <Button onClick={() => handleExport('csv')} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Status */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentsData.statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {appointmentsData.statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Por Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentsData.serviceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras - Por Profissional */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos por Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsData.professionalChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
