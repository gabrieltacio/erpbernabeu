
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, ShoppingBag, TrendingUp, Clock } from 'lucide-react';

interface KPICardsProps {
  data: any;
  isLoading: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total de Clientes',
      value: data?.totalClients || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Agendamentos',
      value: data?.totalAppointments || 0,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Faturamento',
      value: `R$ ${(data?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Vendas Realizadas',
      value: data?.salesCount || 0,
      icon: ShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${(data?.avgTicket || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Profissionais Ativos',
      value: data?.professionals?.length || 0,
      icon: Clock,
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
