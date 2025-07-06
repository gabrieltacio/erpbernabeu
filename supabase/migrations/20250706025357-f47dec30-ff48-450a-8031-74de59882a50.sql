
-- Criar enum para roles
CREATE TYPE public.user_role AS ENUM ('admin', 'recepcionista', 'profissional');

-- Criar enum para status de agendamento
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado');

-- Criar enum para tipos de serviço
CREATE TYPE public.service_type AS ENUM ('servico', 'produto');

-- Criar enum para métodos de pagamento
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia');

-- Tabela de perfis (extensão do auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'profissional',
  phone TEXT,
  avatar_url TEXT,
  specialties TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de serviços e produtos
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- em minutos
  price DECIMAL(10,2) NOT NULL,
  type public.service_type NOT NULL DEFAULT 'servico',
  stock INTEGER DEFAULT 0, -- só para produtos
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  professional_id UUID NOT NULL REFERENCES public.profiles(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  professional_id UUID NOT NULL REFERENCES public.profiles(id),
  appointment_id UUID REFERENCES public.appointments(id),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de venda
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  service_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para sincronizar profiles com auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'profissional')
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar profile automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins podem criar perfis" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins podem atualizar perfis" ON public.profiles
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- Políticas RLS para clients (todos usuários autenticados podem acessar)
CREATE POLICY "Usuários autenticados podem ver clientes" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar clientes" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes" ON public.clients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins podem deletar clientes" ON public.clients
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Políticas RLS para services
CREATE POLICY "Usuários autenticados podem ver serviços" ON public.services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins e recepcionistas podem gerenciar serviços" ON public.services
  FOR ALL USING (public.get_user_role() IN ('admin', 'recepcionista'));

-- Políticas RLS para appointments
CREATE POLICY "Usuários autenticados podem ver agendamentos" ON public.appointments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar agendamentos" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar agendamentos" ON public.appointments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins podem deletar agendamentos" ON public.appointments
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Políticas RLS para sales
CREATE POLICY "Usuários autenticados podem ver vendas" ON public.sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar vendas" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar vendas" ON public.sales
  FOR UPDATE TO authenticated USING (true);

-- Políticas RLS para sale_items
CREATE POLICY "Usuários autenticados podem ver itens de venda" ON public.sale_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar itens de venda" ON public.sale_items
  FOR ALL TO authenticated USING (true);

-- Índices para performance
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_sales_payment_date ON public.sales(payment_date);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_services_type ON public.services(type);
