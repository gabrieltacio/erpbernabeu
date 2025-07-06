-- Função para verificar se um admin tem barbearia associada
CREATE OR REPLACE FUNCTION public.admin_has_barbearia(admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.barbearias 
    WHERE criada_por = admin_id AND ativa = true
  );
$$;

-- Função para obter a barbearia do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_barbearia()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT barbearia_id 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

-- Atualizar políticas RLS da tabela profiles para permitir que usuarios vejam profiles da mesma barbearia
CREATE POLICY "Usuários podem ver perfis da mesma barbearia" ON public.profiles
  FOR SELECT 
  USING (
    barbearia_id = public.get_user_barbearia() OR 
    auth.uid() = id OR 
    public.get_user_role() = 'admin'
  );

-- Atualizar políticas da tabela appointments para filtrar por barbearia
DROP POLICY IF EXISTS "Usuários autenticados podem ver agendamentos" ON public.appointments;

CREATE POLICY "Usuários podem ver agendamentos da sua barbearia" ON public.appointments
  FOR SELECT 
  USING (
    public.get_user_role() = 'admin' OR
    professional_id IN (
      SELECT id FROM public.profiles 
      WHERE barbearia_id = public.get_user_barbearia()
    )
  );

-- Atualizar políticas da tabela clients para filtrar por barbearia via appointments
DROP POLICY IF EXISTS "Usuários autenticados podem ver clientes" ON public.clients;

CREATE POLICY "Usuários podem ver clientes da sua barbearia" ON public.clients
  FOR SELECT 
  USING (
    public.get_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.profiles p ON a.professional_id = p.id
      WHERE a.client_id = clients.id 
      AND p.barbearia_id = public.get_user_barbearia()
    )
  );