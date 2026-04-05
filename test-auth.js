// Script para testar autenticação Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL Supabase:', supabaseUrl);
console.log('Key existe:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('\n=== Testando Login ===');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'soundsvibee@gmail.com',
    password: 'Lucas145'
  });

  if (error) {
    console.error('❌ Erro no login:', error.message);
    return;
  }

  console.log('✅ Login bem-sucedido!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  console.log('Session existe:', !!data.session);

  // Testar buscar profile
  console.log('\n=== Testando Buscar Profile ===');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('❌ Erro ao buscar profile:', profileError.message, 'Código:', profileError.code);

    // Se profile não existe, tentar criar
    if (profileError.code === 'PGRST116') {
      console.log('\n=== Profile não encontrado, tentando criar ===');
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          role: 'admin'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar profile:', insertError.message, 'Detalhes:', insertError);
      } else {
        console.log('✅ Profile criado com sucesso:', newProfile);
      }
    }
  } else {
    console.log('✅ Profile encontrado:', profile);
    console.log('Role:', profile.role);
  }
}

testLogin().catch(console.error);
