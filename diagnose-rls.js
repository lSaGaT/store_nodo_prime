/*
DIAGNÓSTICO COMPLETO DO PROBLEMA DE LOGIN
==========================================

✅ O QUE ESTÁ FUNCIONANDO:
1. Login funciona corretamente
2. Profile existe no banco de dados
3. Profile tem role 'admin'
4. Service_role consegue ler o profile

❌ O QUE ESTÁ QUEBRADO:
1. A política RLS "Users can view their own profile" não está funcionando
2. O frontend (usando chave anon) retorna array vazio
3. O código usa .single() que falha com array vazio

🔧 SOLUÇÃO:

As políticas RLS precisam ser ajustadas. O problema pode ser:

1. A política está verificando auth.uid() = id, mas pode haver algum problema de casting
2. A política pode não estar aplicada corretamente
3. Pode haver múltiplas políticas conflitando

INSTRUÇÕES PARA CORREÇÃO MANUAL:

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em: SQL Editor
4. Execute o SQL abaixo para diagnosticar e corrigir:
*/

const sqlFix = `
-- DIAGNÓSTICO: Ver todas as políticas atuais
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- SOLUÇÃO 1: Recriar as políticas do zero
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "service_role full access profiles" ON profiles;
DROP POLICY IF EXISTS "Owner can promote themselves to admin" ON profiles;

-- Política para SELECT: usuário pode ver próprio profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text);

-- Política para INSERT: usuário pode inserir próprio profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Política para UPDATE: usuário pode atualizar próprio profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Política para service_role: acesso total
CREATE POLICY "service_role all access profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- SOLUÇÃO 2: Garantir que o profile existe e está correto
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '9504a579-bc88-48d0-bb71-d97c5fc1b9ba'::uuid,
  'soundsvibee@gmail.com',
  'Lucas',
  'admin'::user_role
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- TESTE: Verificar se o profile está correto
SELECT * FROM public.profiles WHERE id = '9504a579-bc88-48d0-bb71-d97c5fc1b9ba'::uuid;
`;

console.log(sqlFix);

/*
📋 RESUMO PARA O USUÁRIO:

O problema de login foi diagnosticado:

1. O login funciona perfeitamente
2. O profile existe com role admin
3. O problema é na política RLS que bloqueia a leitura

SOLUÇÃO: Execute o SQL acima no SQL Editor do Supabase

Após executar o SQL:
1. Limpe o cache do navegador
2. Faça logout e login novamente
3. O acesso admin deve funcionar

CREDENCIAIS DE TESTE:
- Email: soundsvibee@gmail.com
- Senha: Lucas145
- Role: admin (já configurado no banco)
*/
