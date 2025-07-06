
import { ClientsList } from '@/components/clients/ClientsList';

export function ClientsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600">Gerencie a base de clientes da barbearia</p>
      </div>
      <ClientsList />
    </div>
  );
}
