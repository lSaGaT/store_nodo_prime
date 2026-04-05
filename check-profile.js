// Script para verificar o status atual do profile
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function checkProfile() {
  const email = 'soundsvibee@gmail.com';
  const password = 'Lucas145';

  console.log('=== Login ===');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Erro no login:', authError.message);
    return;
  }

  console.log('✅ Login bem-sucedido!');
  console.log('User ID:', authData.user.id);
  console.log('Email:', authData.user.email);

  const userId = authData.user.id;

  console.log('\n=== Buscar profile com service_role (deve funcionar) ===');
  const { data: adminProfile, error: adminError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (adminError) {
    console.error('❌ Erro ao buscar com admin:', adminError);
  } else {
    console.log('✅ Profile encontrado:', adminProfile);
    console.log('Role:', adminProfile.role);
  }

  console.log('\n=== Buscar profile com anon (chave do frontend) ===');
  const { data: userProfiles, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  console.log('Resultado:', userProfiles);
  console.log('Erro:', userError);

  if (userError) {
    console.error('❌ Erro code:', userError.code);
    console.error('❌ Erro message:', userError.message);
  }

  // Testar se o problema é o .single()
  console.log('\n=== Tentar sem .single() ===');
  const { data: userProfiles2, error: userError2 } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  console.log('Resultado (sem single):', userProfiles2);
  console.log('Erro (sem single):', userError2);

  // Verificar as políticas RLS atuais
  console.log('\n=== Testar diferentes políticas ===');
  console.log('auth.uid():', authData.user.id);
  console.log('userId:', userId);
  console.log('São iguais?', authData.user.id === userId);
}

checkProfile().catch(console.error);
