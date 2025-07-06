
import { CashFlowSection } from '@/components/cashflow/CashFlowSection';

export function CashFlowPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Caixa</h1>
        <p className="text-gray-600">Gerenciamento financeiro e fluxo de caixa</p>
      </div>
      <CashFlowSection />
    </div>
  );
}
