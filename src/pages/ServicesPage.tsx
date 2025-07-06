
import { ServicesList } from '@/components/services/ServicesList';

export function ServicesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Serviços e Produtos</h1>
        <p className="text-gray-600">Gerencie os serviços oferecidos e produtos vendidos</p>
      </div>
      <ServicesList />
    </div>
  );
}
