
import { AdvancedSettings } from '@/components/settings/AdvancedSettings';

export function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações Avançadas</h1>
        <p className="text-gray-600">Configurações completas do sistema Bernabeu Barber</p>
      </div>
      <AdvancedSettings />
    </div>
  );
}
