
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Package, Users } from 'lucide-react';

interface ReportSummaryProps {
  data: any;
  type: 'financial' | 'appointments' | 'stock' | 'clients';
}

export function ReportSummary({ data, type }: ReportSummaryProps) {
  if (!data) return null;

  const renderFinancialSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            R$ {data.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {data.totalSales || 0} vendas realizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            R$ {data.totalSales ? (data.totalRevenue / data.totalSales).toFixed(2) : '0.00'}
          </div>
          <p className="text-xs text-gray-600 mt-1">Por venda</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maior Venda</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            R$ {Math.max(...(data.sales?.map((s: any) => Number(s.total_amount)) || [0])).toFixed(2)}
          </div>
          <p className="text-xs text-gray-600 mt-1">Venda individual</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {data.sales?.filter((s: any) => 
              new Date(s.payment_date).toDateString() === new Date().toDateString()
            ).length || 0}
          </div>
          <p className="text-xs text-gray-600 mt-1">Vendas do dia</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointmentsSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {data.totalAppointments || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data.statusStats?.concluido || 0}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {data.totalAppointments ? 
              ((data.statusStats?.concluido || 0) / data.totalAppointments * 100).toFixed(1) 
              : 0}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
          <Calendar className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {data.statusStats?.cancelado || 0}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {data.totalAppointments ? 
              ((data.statusStats?.cancelado || 0) / data.totalAppointments * 100).toFixed(1) 
              : 0}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          <Calendar className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {data.totalAppointments ? 
              ((data.statusStats?.concluido || 0) / data.totalAppointments * 100).toFixed(1) 
              : 0}%
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStockSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {data.totalProducts || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <Package className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {data.lowStockItems?.length || 0}
          </div>
          <p className="text-xs text-gray-600 mt-1">Produtos com estoque ≤ 5</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
          <Package className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {data.products?.filter((p: any) => p.stock === 0).length || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            R$ {data.products?.reduce((sum: number, p: any) => 
              sum + (p.stock ? p.stock * Number(p.price) : 0), 0
            ).toFixed(2) || '0.00'}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClientsSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {data.totalClients || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data.activeClients || 0}
          </div>
          <p className="text-xs text-gray-600 mt-1">Últimos 90 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
          <Users className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {data.totalClients ? 
              ((data.activeClients / data.totalClients) * 100).toFixed(1) 
              : 0}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maior Valor Gasto</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            R$ {Math.max(...(data.clients?.map((c: any) => c.totalSpent) || [0])).toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (type) {
    case 'financial':
      return renderFinancialSummary();
    case 'appointments':
      return renderAppointmentsSummary();
    case 'stock':
      return renderStockSummary();
    case 'clients':
      return renderClientsSummary();
    default:
      return null;
  }
}
