// Script para corrigir profile de usuário usando service_role
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  process.exit(1);
}

// Usar service_role key que ignora RLS
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function fixUserProfile() {
  const email = 'soundsvibee@gmail.com';

  console.log('=== Buscando usuário no Auth ===');
  // Primeiro, precisamos buscar o user ID pelo email
  // Infelizmente, não temos acesso direto à tabela auth.users via client
  // Vamos usar o método de login para obter o ID

  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: email,
    password: 'Lucas145'
  });

  if (authError) {
    console.error('❌ Erro ao fazer login:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('✅ User ID encontrado:', userId);

  console.log('\n=== Verificando se profile existe ===');
  const { data: existingProfile, error: checkError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Erro ao verificar profile:', checkError);
    return;
  }

  if (existingProfile) {
    console.log('✅ Profile já existe:', existingProfile);

    if (existingProfile.role !== 'admin') {
      console.log('\n=== Atualizando role para admin ===');
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar profile:', updateError);
      } else {
        console.log('✅ Role atualizada para admin:', updatedProfile);
      }
    }
  } else {
    console.log('⚠️ Profile não encontrado, criando...');
    console.log('\n=== Criando profile ===');
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: userId,
        email: email,
        full_name: 'Lucas',
        role: 'admin'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar profile:', insertError);
    } else {
      console.log('✅ Profile criado com sucesso:', newProfile);
    }
  }

  console.log('\n=== Testando login novamente ===');
  await supabaseAdmin.auth.signOut();

  const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
    email: email,
    password: 'Lucas145'
  });

  if (loginError) {
    console.error('❌ Erro no login:', loginError.message);
    return;
  }

  console.log('✅ Login bem-sucedido!');
  console.log('User ID:', loginData.user.id);

  const { data: finalProfile, error: finalError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', loginData.user.id)
    .single();

  if (finalError) {
    console.error('❌ Erro ao buscar profile final:', finalError);
  } else {
    console.log('✅ Profile final:', finalProfile);
    console.log('✅ Role:', finalProfile.role);
  }
}

fixUserProfile().catch(console.error);
