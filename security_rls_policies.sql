-- Remove as políticas problemáticas que causaram o loop
DROP POLICY IF EXISTS "Todos podem ver os profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem tudo em profiles" ON public.profiles;

DROP POLICY IF EXISTS "Todos podem ver os players" ON public.players;
DROP POLICY IF EXISTS "Membros podem atualizar o próprio player" ON public.players;
DROP POLICY IF EXISTS "Admins podem tudo em players" ON public.players;

-- 1. Cria uma função segura (SECURITY DEFINER) que o banco pode usar para checar se é admin
-- O "SECURITY DEFINER" faz com que o banco pule RLS aqui dentro, evitando o Loop Infinito.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Habilita o RLS caso ainda não esteja
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------------------------------
-- POLÍTICAS PARA A TABELA `profiles`
----------------------------------------------------------------------------------

-- Leituras: Qualquer um pode VER (inclusive visitantes sem login)
CREATE POLICY "Leitura livre de profiles"
    ON public.profiles
    FOR SELECT
    USING (true);

-- O usuário só pode ATUALIZAR sua própria linha
CREATE POLICY "Atualizacao do proprio profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Administradores usando a função segura podem FAZER TUDO
CREATE POLICY "Admin controle total profiles"
    ON public.profiles
    FOR ALL
    USING (public.is_admin());

----------------------------------------------------------------------------------
-- POLÍTICAS PARA A TABELA `players`
----------------------------------------------------------------------------------

-- Leituras: Qualquer um pode VER os jogadores
CREATE POLICY "Leitura livre de players"
    ON public.players
    FOR SELECT
    USING (true);

-- O jogador comum só consegue ATUALIZAR os dados do SEU PRÓPRIO jogador
CREATE POLICY "Atualizacao do proprio player"
    ON public.players
    FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Administradores usando a função segura podem FAZER TUDO
CREATE POLICY "Admin controle total players"
    ON public.players
    FOR ALL
    USING (public.is_admin());
