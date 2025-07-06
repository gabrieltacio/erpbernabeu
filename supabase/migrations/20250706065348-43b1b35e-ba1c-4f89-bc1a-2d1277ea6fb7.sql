-- Adicionar coluna barbearia_id na tabela services para associar serviços a barbearias específicas
ALTER TABLE public.services ADD COLUMN barbearia_id UUID REFERENCES public.barbearias(id);

-- Atualizar políticas RLS da tabela services
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços" ON public.services;

-- Política para ver serviços: usuários autenticados podem ver serviços da sua barbearia ou serviços globais (sem barbearia_id)
CREATE POLICY "Usuários podem ver serviços da sua barbearia ou globais" ON public.services
  FOR SELECT 
  USING (
    barbearia_id IS NULL OR 
    barbearia_id = public.get_user_barbearia() OR
    public.get_user_role() = 'admin'
  );

-- Política para inserir serviços: admins e recepcionistas podem criar serviços para sua barbearia
CREATE POLICY "Usuários podem criar serviços para sua barbearia" ON public.services
  FOR INSERT 
  WITH CHECK (
    public.get_user_role() = ANY (ARRAY['admin'::user_role, 'recepcionista'::user_role]) AND
    (barbearia_id IS NULL OR barbearia_id = public.get_user_barbearia())
  );

-- Política para atualizar serviços
CREATE POLICY "Usuários podem atualizar serviços da sua barbearia" ON public.services
  FOR UPDATE 
  USING (
    public.get_user_role() = ANY (ARRAY['admin'::user_role, 'recepcionista'::user_role]) AND
    (barbearia_id IS NULL OR barbearia_id = public.get_user_barbearia())
  );

-- Política para deletar serviços
CREATE POLICY "Usuários podem deletar serviços da sua barbearia" ON public.services
  FOR DELETE 
  USING (
    public.get_user_role() = ANY (ARRAY['admin'::user_role, 'recepcionista'::user_role]) AND
    (barbearia_id IS NULL OR barbearia_id = public.get_user_barbearia())
  );

-- Criar índice para performance
CREATE INDEX idx_services_barbearia_id ON public.services(barbearia_id);