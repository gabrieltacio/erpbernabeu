
import { SalesList } from '@/components/sales/SalesList';

export function SalesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="text-gray-600">Registre e acompanhe as vendas de serviços e produtos</p>
      </div>
      <SalesList />
    </div>
  );
}
