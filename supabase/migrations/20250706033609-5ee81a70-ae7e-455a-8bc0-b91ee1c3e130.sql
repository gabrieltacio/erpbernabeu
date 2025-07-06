
-- Criar tabela para transações de caixa
CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cash_transactions
CREATE POLICY "Usuários autenticados podem ver transações" ON public.cash_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar transações" ON public.cash_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar transações" ON public.cash_transactions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins podem deletar transações" ON public.cash_transactions
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Trigger para updated_at
CREATE TRIGGER handle_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices para performance
CREATE INDEX idx_cash_transactions_created_at ON public.cash_transactions(created_at);
CREATE INDEX idx_cash_transactions_type ON public.cash_transactions(type);
