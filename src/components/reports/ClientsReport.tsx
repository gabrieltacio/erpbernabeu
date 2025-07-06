
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Users, UserCheck, Clock, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientsReportProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    professionalId: string;
  };
}

export function ClientsReport({ filters }: ClientsReportProps) {
  const { toast } = useToast();

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients-report', filters],
    queryFn: async () => {
      // Buscar todos os clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (!clients) return null;

      // Buscar agendamentos para cada cliente no período
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          let appointmentsQuery = supabase
            .from('appointments')
            .select('id, scheduled_date, status')
            .eq('client_id', client.id);

          if (filters.dateFrom) {
            appointmentsQuery = appointmentsQuery.gte('scheduled_date', filters.dateFrom);
          }
          if (filters.dateTo) {
            appointmentsQuery = appointmentsQuery.lte('scheduled_date', filters.dateTo);
          }
          if (filters.professionalId) {
            appointmentsQuery = appointmentsQuery.eq('professional_id', filters.professionalId);
          }

          const { data: appointments } = await appointmentsQuery;

          // Calcular estatísticas
          const totalAppointments = appointments?.length || 0;
          const completedAppointments = appointments?.filter(apt => apt.status === 'concluido').length || 0;
          
          // Calcular tempo médio entre visitas (apenas se houver mais de 1 agendamento)
          let avgDaysBetweenVisits = 0;
          if (appointments && appointments.length > 1) {
            const dates = appointments
              .map(apt => new Date(apt.scheduled_date))
              .sort((a, b) => a.getTime() - b.getTime());
            
            let totalDays = 0;
            for (let i = 1; i < dates.length; i++) {
              const daysDiff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
              totalDays += daysDiff;
            }
            avgDaysBetweenVisits = totalDays / (dates.length - 1);
          }

          // Último agendamento
          const lastAppointment = appointments && appointments.length > 0 
            ? new Date(Math.max(...appointments.map(apt => new Date(apt.scheduled_date).getTime())))
            : null;

          // Cliente ativo (agendamento nos últimos 90 dias)
          const isActive = lastAppointment 
            ? (new Date().getTime() - lastAppointment.getTime()) <= (90 * 24 * 60 * 60 * 1000)
            : false;

          return {
            ...client,
            totalAppointments,
            completedAppointments,
            avgDaysBetweenVisits: Math.round(avgDaysBetweenVisits),
            lastAppointment,
            isActive
          };
        })
      );

      // Filtrar apenas clientes com agendamentos no período (se filtros aplicados)
      const filteredClients = filters.dateFrom || filters.dateTo || filters.professionalId
        ? clientsWithStats.filter(client => client.totalAppointments > 0)
        : clientsWithStats;

      // Ordenar por número de agendamentos
      const sortedClients = filteredClients.sort((a, b) => b.totalAppointments - a.totalAppointments);

      // Top 10 clientes com mais agendamentos
      const topClients = sortedClients.slice(0, 10).map(client => ({
        name: client.name.split(' ')[0], // Primeiro nome apenas
        appointments: client.totalAppointments
      }));

      // Estatísticas gerais
      const totalClients = filteredClients.length;
      const activeClients = filteredClients.filter(client => client.isActive).length;
      const recurrentClients = filteredClients.filter(client => client.totalAppointments > 1).length;
      const avgVisitsPerClient = totalClients > 0 
        ? filteredClients.reduce((sum, client) => sum + client.totalAppointments, 0) / totalClients 
        : 0;

      return {
        totalClients,
        activeClients,
        recurrentClients,
        avgVisitsPerClient: Math.round(avgVisitsPerClient * 10) / 10,
        topClients,
        allClients: sortedClients
      };
    }
  });

  const handleExport = async (format: 'csv') => {
    try {
      if (!clientsData?.allClients) return;
      
      const csvContent = [
        ['Nome', 'Email', 'Telefone', 'Total Agendamentos', 'Agendamentos Concluídos', 'Ativo', 'Último Agendamento'].join(','),
        ...clientsData.allClients.map((client: any) => [
          client.name,
          client.email || 'N/A',
          client.phone || 'N/A',
          client.totalAppointments,
          client.completedAppointments,
          client.isActive ? 'Sim' : 'Não',
          client.lastAppointment ? client.lastAppointment.toLocaleDateString('pt-BR') : 'Nunca'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-clientes-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (!clientsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Nenhum dado encontrado para o período selecionado</p>
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
              <Users className="w-4 h-4 text-blue-600" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clientsData.totalClients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientsData.activeClients}
            </div>
            <p className="text-xs text-gray-500 mt-1">Últimos 90 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-600" />
              Clientes Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {clientsData.recurrentClients}
            </div>
            <p className="text-xs text-gray-500 mt-1">Mais de 1 visita</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Média de Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {clientsData.avgVisitsPerClient}
            </div>
            <p className="text-xs text-gray-500 mt-1">Por cliente</p>
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

      {/* Gráfico Top 10 Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 - Clientes com Mais Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientsData.topClients} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [value, 'Agendamentos']} />
                <Bar dataKey="appointments" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
