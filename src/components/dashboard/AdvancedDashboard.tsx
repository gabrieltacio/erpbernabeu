
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  Scissors,
  Star,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KPICards } from './KPICards';
import { RevenueChart } from './RevenueChart';
import { AppointmentsChart } from './AppointmentsChart';
import { TopServicesChart } from './TopServicesChart';
import { ProfessionalPerformance } from './ProfessionalPerformance';

export function AdvancedDashboard() {
  const [dateRange, setDateRange] = useState('30'); // days

  // KPIs principais
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const [
        clientsResult,
        appointmentsResult,
        salesResult,
        servicesResult,
        professionalsResult
      ] = await Promise.all([
        // Total de clientes ativos
        supabase.from('clients').select('id', { count: 'exact' }),
        
        // Agendamentos por status
        supabase.from('appointments').select('status', { count: 'exact' }),
        
        // Vendas do período
        supabase
          .from('sales')
          .select('total_amount, created_at, professional_id')
          .gte('created_at', startDate.toISOString()),
          
        // Serviços mais vendidos
        supabase
          .from('sale_items')
          .select('service_name, quantity, total_price')
          .gte('created_at', startDate.toISOString()),
          
        // Performance dos profissionais
        supabase
          .from('profiles')
          .select('id, name, role')
          .eq('active', true)
      ]);

      const totalRevenue = salesResult.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      
      return {
        totalClients: clientsResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        totalRevenue,
        salesCount: salesResult.data?.length || 0,
        avgTicket: salesResult.data?.length ? totalRevenue / salesResult.data.length : 0,
        topServices: servicesResult.data || [],
        professionals: professionalsResult.data || [],
        salesData: salesResult.data || []
      };
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Avançado</h1>
          <p className="text-gray-600">Visão geral em tempo real do Bernabeu Barber</p>
        </div>
        
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpis} isLoading={kpisLoading} />

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Faturamento
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="services">
            <Scissors className="w-4 h-4 mr-2" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Star className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueChart dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsChart dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="services">
          <TopServicesChart dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="performance">
          <ProfessionalPerformance dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
