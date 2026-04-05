-- ============================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA PERFIS
-- ============================================================

-- 1. Remover políticas existentes que estão bloqueando
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Owner can promote themselves to admin" ON profiles;

-- 2. Criar políticas corretas

-- Permitir que usuários autenticados vejam seus próprios profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Permitir que service_role faça tudo
CREATE POLICY "service_role full access profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Permitir que usuários insiram seu próprio profile (apenas na criação)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir que usuários atualizem seu próprio profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Inserir o profile manualmente para o usuário existente
-- Este comando deve ser executado no SQL Editor do Supabase
-- Substitua o UUID pelo ID do usuário encontrado no teste anterior

INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '9504a579-bc88-48d0-bb71-d97c5fc1b9ba'::uuid,
  'soundsvibee@gmail.com',
  'Lucas',
  'admin'::user_role
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role;

-- Verificar se o profile foi criado
SELECT * FROM public.profiles WHERE id = '9504a579-bc88-48d0-bb71-d97c5fc1b9ba'::uuid;
