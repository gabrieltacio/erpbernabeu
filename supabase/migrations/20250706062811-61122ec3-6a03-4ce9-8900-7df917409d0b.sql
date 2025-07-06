-- Criar tabela de pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  appointment_id UUID REFERENCES public.appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'stripe', -- 'stripe', 'pix'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  stripe_session_id TEXT,
  pix_qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campo paid na tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN paid BOOLEAN NOT NULL DEFAULT false;

-- Habilitar RLS na tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payments
CREATE POLICY "Usuários autenticados podem ver pagamentos" ON public.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar pagamentos" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pagamentos" ON public.payments
  FOR UPDATE TO authenticated USING (true);

-- Trigger para updated_at na tabela payments
CREATE TRIGGER handle_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices para performance
CREATE INDEX idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX idx_payments_stripe_session_id ON public.payments(stripe_session_id);
CREATE INDEX idx_payments_status ON public.payments(status);