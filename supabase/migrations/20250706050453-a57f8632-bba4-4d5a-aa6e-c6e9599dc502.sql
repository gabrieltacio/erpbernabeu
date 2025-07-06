
-- Criar tabela de barbearias
CREATE TABLE public.barbearias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  telefone TEXT,
  logo_url TEXT,
  slug TEXT UNIQUE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criada_por UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna barbearia_id na tabela profiles para relacionar profissionais com barbearias
ALTER TABLE public.profiles ADD COLUMN barbearia_id UUID REFERENCES public.barbearias(id);

-- Trigger para updated_at na tabela barbearias
CREATE TRIGGER handle_barbearias_updated_at
  BEFORE UPDATE ON public.barbearias
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS na tabela barbearias
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer um veja barbearias ativas (página pública)
CREATE POLICY "Qualquer um pode ver barbearias ativas" ON public.barbearias
  FOR SELECT USING (ativa = true);

-- Política para admins gerenciarem barbearias
CREATE POLICY "Admins podem gerenciar barbearias" ON public.barbearias
  FOR ALL USING (public.get_user_role() = 'admin');

-- Política para o criador da barbearia poder gerenciá-la
CREATE POLICY "Criador pode gerenciar sua barbearia" ON public.barbearias
  FOR ALL USING (criada_por = auth.uid());

-- Índices para performance
CREATE INDEX idx_barbearias_ativa ON public.barbearias(ativa);
CREATE INDEX idx_barbearias_cidade ON public.barbearias(cidade);
CREATE INDEX idx_barbearias_slug ON public.barbearias(slug);
CREATE INDEX idx_profiles_barbearia_id ON public.profiles(barbearia_id);
