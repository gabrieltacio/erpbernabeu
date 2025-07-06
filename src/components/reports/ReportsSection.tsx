
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Calendar, Users, Package } from 'lucide-react';
import { ReportFilters } from './ReportFilters';
import { FinancialReport } from './FinancialReport';
import { AppointmentsReport } from './AppointmentsReport';
import { ProductsServicesReport } from './ProductsServicesReport';
import { ClientsReport } from './ClientsReport';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  professionalId: string;
}

export function ReportsSection() {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    professionalId: ''
  });

  const handleFiltersChange = (newFilters: ReportFilters) => {
    console.log('Applying filters:', newFilters);
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Análises detalhadas do desempenho da barbearia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filtros dos Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos/Serviços
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <FinancialReport filters={filters} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsReport filters={filters} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsServicesReport filters={filters} />
        </TabsContent>

        <TabsContent value="clients">
          <ClientsReport filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
