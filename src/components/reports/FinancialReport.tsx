
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinancialReportProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    professionalId: string;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function FinancialReport({ filters }: FinancialReportProps) {
  const { toast } = useToast();

  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-report', filters],
    queryFn: async () => {
      console.log('Fetching financial data with filters:', filters);
      
      let query = supabase
        .from('sales')
        .select(`
          *,
          profiles:professional_id(name),
          clients:client_id(name)
        `)
        .order('payment_date', { ascending: true });

      if (filters.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('payment_date', filters.dateTo);
      }
      if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }

      const { data: sales, error } = await query;
      
      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }

      console.log('Sales data:', sales);

      if (!sales || sales.length === 0) {
        return {
          totalRevenue: 0,
          totalSales: 0,
          paymentMethodData: [],
          professionalChartData: [],
          dailyRevenueData: [],
          sales: []
        };
      }

      // Calcular totais
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

      // Agrupar por método de pagamento
      const paymentMethods = sales.reduce((acc: any, sale) => {
        const method = sale.payment_method;
        const methodName = method === 'cartao_credito' ? 'Cartão Créd.' :
                          method === 'cartao_debito' ? 'Cartão Déb.' :
                          method === 'pix' ? 'PIX' :
                          method === 'dinheiro' ? 'Dinheiro' : 'Transferência';
        
        if (!acc[methodName]) {
          acc[methodName] = 0;
        }
        acc[methodName] += Number(sale.total_amount);
        return acc;
      }, {});

      const paymentMethodData = Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value: Number(value)
      }));

      // Agrupar por profissional
      const professionalData = sales.reduce((acc: any, sale) => {
        const profName = sale.profiles?.name || 'Desconhecido';
        if (!acc[profName]) {
          acc[profName] = 0;
        }
        acc[profName] += Number(sale.total_amount);
        return acc;
      }, {});

      const professionalChartData = Object.entries(professionalData).map(([name, value]) => ({
        name,
        value: Number(value)
      }));

      // Agrupar por data para gráfico de linha
      const dailyRevenue = sales.reduce((acc: any, sale) => {
        const date = sale.payment_date.split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += Number(sale.total_amount);
        return acc;
      }, {});

      const dailyRevenueData = Object.entries(dailyRevenue)
        .map(([date, value]) => ({
          date,
          value: Number(value)
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalRevenue,
        totalSales: sales.length,
        paymentMethodData,
        professionalChartData,
        dailyRevenueData,
        sales
      };
    }
  });

  const handleExport = async (format: 'csv') => {
    try {
      if (!financialData?.sales) return;
      
      const csvContent = [
        ['Data', 'Profissional', 'Cliente', 'Método Pagamento', 'Valor'].join(','),
        ...financialData.sales.map(sale => [
          sale.payment_date.split('T')[0],
          sale.profiles?.name || 'N/A',
          sale.clients?.name || 'N/A',
          sale.payment_method,
          Number(sale.total_amount).toFixed(2)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
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
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!financialData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Erro ao carregar dados financeiros</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {financialData.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {financialData.totalSales}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {financialData.totalSales > 0 ? (financialData.totalRevenue / financialData.totalSales).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Exportação */}
      <div className="flex gap-2">
        <Button onClick={() => handleExport('csv')} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {financialData.paymentMethodData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Métodos de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialData.paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financialData.paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Por Profissional */}
          {financialData.professionalChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData.professionalChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráfico de Linha - Evolução Diária */}
      {financialData.dailyRevenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialData.dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {financialData.totalSales === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Nenhuma venda encontrada para o período selecionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
