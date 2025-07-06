
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ReportChartsProps {
  data: any;
  type: 'financial' | 'appointments' | 'stock' | 'clients';
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ReportCharts({ data, type }: ReportChartsProps) {
  if (!data) return null;

  const renderFinancialCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Faturamento por Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(data.paymentMethodStats || {}).map(([method, stats]: [string, any]) => ({
                    name: method.replace('_', ' '),
                    value: stats.total
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(data.paymentMethodStats || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(data.professionalStats || {}).map(([name, stats]: [string, any]) => ({
                  name,
                  vendas: stats.count,
                  faturamento: stats.total
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="faturamento" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointmentsCharts = () => (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={Object.entries(data.statusStats || {}).map(([status, count]) => ({
                  name: status,
                  value: count
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(data.statusStats || {}).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderStockCharts = () => (
    <Card>
      <CardHeader>
        <CardTitle>Valor do Estoque por Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.products?.slice(0, 10).map((product: any) => ({
                name: product.name,
                valor: product.stock ? product.stock * Number(product.price) : 0,
                estoque: product.stock || 0
              })) || []}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => 
                name === 'valor' ? [`R$ ${Number(value).toFixed(2)}`, 'Valor'] : [value, 'Estoque']
              } />
              <Bar dataKey="valor" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderClientsCharts = () => (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Clientes por Valor Gasto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.clients?.slice(0, 10).map((client: any) => ({
                name: client.name.split(' ')[0],
                gasto: client.totalSpent,
                agendamentos: client.totalAppointments
              })) || []}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => 
                name === 'gasto' ? [`R$ ${Number(value).toFixed(2)}`, 'Valor Gasto'] : [value, 'Agendamentos']
              } />
              <Bar dataKey="gasto" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  switch (type) {
    case 'financial':
      return renderFinancialCharts();
    case 'appointments':
      return renderAppointmentsCharts();
    case 'stock':
      return renderStockCharts();
    case 'clients':
      return renderClientsCharts();
    default:
      return null;
  }
}
