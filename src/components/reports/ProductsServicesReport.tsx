
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Package, TrendingUp, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductsServicesReportProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    professionalId: string;
  };
}

export function ProductsServicesReport({ filters }: ProductsServicesReportProps) {
  const { toast } = useToast();

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products-services-report', filters],
    queryFn: async () => {
      console.log('Loading products/services report with filters:', filters);
      
      // Primeiro, buscar todas as vendas com itens
      let salesQuery = supabase
        .from('sales')
        .select(`
          id,
          payment_date,
          professional_id,
          sale_items(
            id,
            service_name,
            quantity,
            unit_price,
            total_price,
            service_id,
            services(
              name,
              type
            )
          )
        `)
        .order('payment_date', { ascending: true });

      if (filters.dateFrom) {
        salesQuery = salesQuery.gte('payment_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        salesQuery = salesQuery.lte('payment_date', filters.dateTo);
      }
      if (filters.professionalId) {
        salesQuery = salesQuery.eq('professional_id', filters.professionalId);
      }

      const { data: sales, error: salesError } = await salesQuery;

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw salesError;
      }

      console.log('Sales data fetched:', sales);

      if (!sales || sales.length === 0) {
        return {
          totalItems: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          topItems: [],
          allItems: []
        };
      }

      // Processar dados dos itens vendidos
      const itemsMap = new Map();
      let totalQuantity = 0;
      let totalRevenue = 0;

      sales.forEach(sale => {
        if (sale.sale_items && Array.isArray(sale.sale_items)) {
          sale.sale_items.forEach(item => {
            const itemName = item.service_name || 'Item sem nome';
            const quantity = item.quantity || 0;
            const revenue = Number(item.total_price) || 0;

            if (itemsMap.has(itemName)) {
              const existing = itemsMap.get(itemName);
              existing.quantity += quantity;
              existing.revenue += revenue;
            } else {
              itemsMap.set(itemName, {
                name: itemName,
                quantity: quantity,
                revenue: revenue,
                type: item.services?.type || 'servico'
              });
            }

            totalQuantity += quantity;
            totalRevenue += revenue;
          });
        }
      });

      // Converter para array e ordenar
      const itemsArray = Array.from(itemsMap.values()).sort((a, b) => b.quantity - a.quantity);
      const topItems = itemsArray.slice(0, 10); // Top 10

      console.log('Processed data:', {
        totalItems: itemsArray.length,
        totalQuantity,
        totalRevenue,
        topItems
      });

      return {
        totalItems: itemsArray.length,
        totalQuantity,
        totalRevenue,
        topItems,
        allItems: itemsArray
      };
    }
  });

  const handleExport = async (format: 'csv') => {
    try {
      if (!productsData?.allItems || productsData.allItems.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhum dado para exportar",
          description: "Não há dados suficientes para gerar o relatório",
        });
        return;
      }
      
      const csvContent = [
        ['Produto/Serviço', 'Quantidade Vendida', 'Receita Total', 'Tipo'].join(','),
        ...productsData.allItems.map((item: any) => [
          `"${item.name}"`,
          item.quantity,
          item.revenue.toFixed(2).replace('.', ','),
          item.type === 'produto' ? 'Produto' : 'Serviço'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-produtos-servicos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportação realizada",
        description: "Relatório exportado em formato CSV",
      });
    } catch (error) {
      console.error('Export error:', error);
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

  if (error) {
    console.error('Report error:', error);
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Erro ao carregar relatório: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!productsData || productsData.totalItems === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Nenhuma venda encontrada para o período selecionado</p>
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
              <Package className="w-4 h-4 text-blue-600" />
              Itens Diferentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {productsData.totalItems}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Quantidade Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productsData.totalQuantity}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {productsData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* Gráfico de Ranking por Quantidade */}
      {productsData.topItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Mais Vendidos (por Quantidade)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsData.topItems} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => [value, 'Quantidade']} />
                  <Bar dataKey="quantity" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Ranking por Receita */}
      {productsData.topItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Maior Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsData.topItems} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
