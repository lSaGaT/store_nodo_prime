// Script alternativo para corrigir profile usando RPC
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function fixWithRPC() {
  const email = 'soundsvibee@gmail.com';
  const password = 'Lucas145';

  console.log('=== Tentando criar profile via SQL direto ===');

  // Vamos tentar usar uma query SQL raw via RPC
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('exec_sql', {
    sql: `
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (
        '9504a579-bc88-48d0-bb71-d97c5fc1b9ba'::uuid,
        'soundsvibee@gmail.com',
        'Lucas',
        'admin'::user_role
      )
      ON CONFLICT (id) DO UPDATE SET
        role = 'admin'::user_role;
    `
  });

  if (rpcError) {
    console.log('⚠️ RPC não disponível:', rpcError.message);
  } else {
    console.log('✅ Profile criado via RPC:', rpcData);
    return;
  }

  // Tentar criar profile diretamente com service_role
  console.log('\n=== Tentando criar profile com service_role ===');
  const userId = '9504a579-bc88-48d0-bb71-d97c5fc1b9ba';

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: userId,
      email: email,
      full_name: 'Lucas',
      role: 'admin'
    }])
    .select();

  console.log('Resultado:', profileData);
  console.log('Erro:', profileError);

  if (profileError) {
    console.log('\n❌ Erro persiste. As políticas RLS estão muito restritivas.');
    console.log('\n🔧 SOLUÇÃO MANUAL:');
    console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
    console.log('2. Selecione o projeto');
    console.log('3. Vá em SQL Editor');
    console.log('4. Execute o seguinte SQL:');
    console.log(`
-- Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Inserir o profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '9504a579-bc88-48d0-bb71-d97c5fc1b9ba'::uuid,
  'soundsvibee@gmail.com',
  'Lucas',
  'admin'::user_role
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role;

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `);
  } else {
    console.log('✅ Profile criado com sucesso!');
  }
}

fixWithRPC().catch(console.error);
