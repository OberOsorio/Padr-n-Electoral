const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Archivo .env no encontrado');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        env[key] = val;
      }
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function createInitialAdmin() {
  const email = process.argv[2] || 'director@campana2026.gov';
  const password = process.argv[3] || 'Campana2026*Segura';
  const fullName = process.argv[4] || 'Director de Campaña';

  console.log('====================================================');
  console.log('👤 CREACIÓN DE USUARIO ADMINISTRADOR EN SUPABASE AUTH');
  console.log('====================================================');
  console.log(`Email: ${email}`);
  console.log(`Nombre: ${fullName}`);
  console.log('----------------------------------------------------');

  try {
    // 1. Obtener tenant por defecto
    const { data: tenants, error: tErr } = await adminClient
      .from('tenants')
      .select('id')
      .limit(1);

    const defaultTenantId = tenants && tenants.length > 0 ? tenants[0].id : null;

    // 2. Crear o verificar usuario en auth.users
    const { data: userRes, error: uErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin',
        tenant_id: defaultTenantId
      }
    });

    if (uErr) {
      if (uErr.message.includes('already been registered') || uErr.message.includes('already exists')) {
        console.log(`ℹ El usuario ${email} ya existe en Auth. Actualizando contraseña y metadata...`);
        const { data: usersList } = await adminClient.auth.admin.listUsers();
        const existing = usersList?.users?.find(u => u.email === email);
        if (existing) {
          await adminClient.auth.admin.updateUserById(existing.id, {
            password,
            user_metadata: {
              full_name: fullName,
              role: 'admin',
              tenant_id: defaultTenantId
            }
          });
          console.log(`✅ Contraseña y perfil de ${email} actualizados con éxito.`);
        }
      } else {
        console.error(`❌ Error al crear usuario en Auth: ${uErr.message}`);
        return;
      }
    } else {
      console.log(`✅ Usuario creado exitosamente en Supabase Auth:`);
      console.log(`   ID: ${userRes.user.id}`);
    }

    // 3. Asegurar registro en public.profiles
    const { data: usersList } = await adminClient.auth.admin.listUsers();
    const targetUser = usersList?.users?.find(u => u.email === email);

    if (targetUser) {
      const { error: pErr } = await adminClient
        .from('profiles')
        .upsert({
          id: targetUser.id,
          full_name: fullName,
          role: 'admin',
          tenant_id: defaultTenantId,
          is_active: true
        });

      if (pErr) {
        console.warn(`⚠ Aviso al vincular profile: ${pErr.message}`);
      } else {
        console.log(`✅ Perfil administrativo sincronizado en tabla "profiles" con rol "admin".`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('🔑 CREDENCIALES DE ACCESO:');
    console.log(`   Usuario:  ${email}`);
    console.log(`   Password: ${password}`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Excepción durante la creación del usuario:', err.message);
  }
}

createInitialAdmin();
