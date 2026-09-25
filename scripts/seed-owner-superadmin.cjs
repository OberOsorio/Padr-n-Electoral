const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
      }
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function provisionOwner() {
  const email = 'oberosorio1@gmail.com';
  const password = '8Ext2026#';
  const fullName = 'Ober Osorio';
  const role = 'superadmin';

  console.log('====================================================');
  console.log('👑 REGISTRO DE DUEÑO DE PLATAFORMA (SUPERADMIN)');
  console.log('====================================================');
  console.log(`Email: ${email}`);
  console.log(`Rol:   ${role}`);
  console.log(`URL:   ${supabaseUrl}`);
  console.log('----------------------------------------------------');

  try {
    // 1. Obtener tenant central si existe
    const { data: tenants } = await adminClient
      .from('tenants')
      .select('id')
      .limit(1);

    const defaultTenantId = tenants && tenants.length > 0 ? tenants[0].id : null;

    // 2. Comprobar si el usuario ya existe en auth.users
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let existingUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let userId = null;

    if (existingUser) {
      console.log(`ℹ El usuario ${email} ya existía en Auth. Actualizando credenciales y rol...`);
      const { data: updatedUser, error: updateErr } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: role,
            tenant_id: defaultTenantId
          }
        }
      );

      if (updateErr) {
        console.error('❌ Error actualizando usuario:', updateErr.message);
        return;
      }
      userId = existingUser.id;
      console.log(`✅ Contraseña y metadata actualizadas para ID: ${userId}`);
    } else {
      console.log(`Creando nuevo usuario ${email} en Supabase Auth...`);
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role,
          tenant_id: defaultTenantId
        }
      });

      if (createErr) {
        console.error('❌ Error creando usuario en Auth:', createErr.message);
        return;
      }
      userId = newUser.user.id;
      console.log(`✅ Usuario creado en Auth con ID: ${userId}`);
    }

    // 3. Crear / Actualizar perfil en public.profiles con rol superadmin
    const { error: profileErr } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: role,
        tenant_id: defaultTenantId,
        is_active: true
      });

    if (profileErr) {
      console.error('❌ Error actualizando tabla profiles:', profileErr.message);
      return;
    }
    console.log(`✅ Perfil sincronizado en public.profiles con rol "${role}".`);

    // 4. Test real de inicio de sesión frontend (Anon Key)
    console.log('\n[Validación en tiempo real] Probando autenticación con Anon Key...');
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: authData, error: loginErr } = await anonClient.auth.signInWithPassword({
      email,
      password
    });

    if (loginErr) {
      console.error('❌ Falló la autenticación con las credenciales creadas:', loginErr.message);
      return;
    }

    console.log('✅ Inicio de sesión exitoso. JWT generado.');

    // 5. Test de consulta de perfil respetando RLS
    const { data: profileData, error: pError } = await anonClient
      .from('profiles')
      .select('id, full_name, role, is_active, tenant:tenants(name, slug, plan)')
      .eq('id', authData.user.id)
      .single();

    if (pError) {
      console.error('❌ Error al consultar perfil autenticado:', pError.message);
      return;
    }

    console.log('✅ Perfil recuperado mediante RLS:');
    console.dir(profileData, { depth: null });

    console.log('\n====================================================');
    console.log('🎉 DUEÑO DE LA PLATAFORMA CONFIGURADO CON ÉXITO');
    console.log(`   Usuario:    ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   Rol:        ${profileData.role} (Acceso Total a la Plataforma)`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Excepción:', err.message);
  }
}

provisionOwner();
