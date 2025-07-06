
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface StockReportProps {
  onDataLoad?: (data: any) => void;
}

export function StockReport({ onDataLoad }: StockReportProps) {
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-report'],
    queryFn: async () => {
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('type', 'produto')
        .order('name');

      const lowStockItems = services?.filter(service => 
        service.stock !== null && service.stock <= 5
      ) || [];

      return {
        products: services || [],
        lowStockItems,
        totalProducts: services?.length || 0
      };
    }
  });

  useEffect(() => {
    if (stockData && onDataLoad) {
      onDataLoad(stockData);
    }
  }, [stockData, onDataLoad]);

  const getStockStatus = (stock: number | null) => {
    if (stock === null) return { label: 'N/A', color: 'bg-gray-100 text-gray-800' };
    if (stock <= 0) return { label: 'Sem estoque', color: 'bg-red-100 text-red-800' };
    if (stock <= 5) return { label: 'Estoque baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Em estoque', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-20 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas de Estoque Baixo */}
      {stockData?.lowStockItems && stockData.lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stockData.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {item.stock} unidades
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relatório Completo de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData?.products.map((product: any) => {
                const stockStatus = getStockStatus(product.stock);
                const totalValue = product.stock ? product.stock * Number(product.price) : 0;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600">{product.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>R$ {Number(product.price).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {product.stock !== null ? product.stock : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {totalValue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
