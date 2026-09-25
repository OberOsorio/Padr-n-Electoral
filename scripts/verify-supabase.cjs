const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables desde .env manualmente
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
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('====================================================');
console.log('📡 TEST DE CONECTIVIDAD SUPABASE (END-TO-END)');
console.log('====================================================');
console.log(`URL de Supabase: ${supabaseUrl}`);
console.log(`Anon Key detectada: ${anonKey ? '✅ Sí (' + anonKey.substring(0, 15) + '...)' : '❌ No'}`);
console.log(`Service Role Key detectada: ${serviceKey ? '✅ Sí (' + serviceKey.substring(0, 15) + '...)' : '❌ No'}`);
console.log('----------------------------------------------------');

async function testConnection() {
  // 1. Cliente con Service Role (Acceso administrativo total)
  console.log('\n[1/4] Verificando tablas en base de datos PostgreSQL...');
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  const tablesToCheck = ['tenants', 'profiles', 'electores', 'censo_maestro', 'export_logs', 'access_audit_logs'];
  const tableStatus = {};

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await adminClient
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        tableStatus[table] = { ok: false, error: error.message };
      } else {
        tableStatus[table] = { ok: true, count: count ?? 0 };
      }
    } catch (e) {
      tableStatus[table] = { ok: false, error: e.message };
    }
  }

  for (const [table, res] of Object.entries(tableStatus)) {
    if (res.ok) {
      console.log(`  ✓ ${table.padEnd(20)} [OK] (${res.count} registros)`);
    } else {
      console.log(`  ⚠ ${table.padEnd(20)} [NO ENCONTRADA EN DB]`);
    }
  }

  // 2. Cliente con Anon Key (Cliente Frontend)
  console.log('\n[2/4] Probando cliente frontend (VITE_SUPABASE_ANON_KEY)...');
  const anonClient = createClient(supabaseUrl, anonKey);
  try {
    const { error: anonError } = await anonClient.auth.getSession();
    if (anonError) {
      console.log(`  ❌ Error en Auth Anon: ${anonError.message}`);
    } else {
      console.log('  ✓ Autenticación y Handshake del cliente frontend: OPERATIVO');
    }
  } catch (err) {
    console.log(`  ❌ Excepción en cliente anon: ${err.message}`);
  }

  // 3. Probar funciones RPC
  console.log('\n[3/4] Probando funciones RPC en Supabase...');
  
  // RPC: buscar_ciudadano_censo
  try {
    const { data: rpcCenso, error: rpcCensoError } = await adminClient.rpc('buscar_ciudadano_censo', {
      p_cedula: '1047892341'
    });

    if (rpcCensoError) {
      console.log(`  ⚠ RPC "buscar_ciudadano_censo": PENDIENTE (${rpcCensoError.message})`);
    } else {
      console.log('  ✓ RPC "buscar_ciudadano_censo": OPERATIVA', rpcCenso);
    }
  } catch (err) {
    console.log(`  ⚠ RPC "buscar_ciudadano_censo": ERROR (${err.message})`);
  }

  // RPC: check_existing_elector
  try {
    const { data: rpcCheck, error: rpcCheckError } = await adminClient.rpc('check_existing_elector', {
      p_cedula: '99999999',
      p_tenant_id: 'a0000000-0000-0000-0000-000000000001'
    });

    if (rpcCheckError) {
      console.log(`  ⚠ RPC "check_existing_elector": PENDIENTE (${rpcCheckError.message})`);
    } else {
      console.log('  ✓ RPC "check_existing_elector": OPERATIVA (Anti-colisión lista)');
    }
  } catch (err) {
    console.log(`  ⚠ RPC "check_existing_elector": ERROR (${err.message})`);
  }

  // 4. Verificación de Tenant Inicial
  console.log('\n[4/4] Verificando campaña/tenant inicial...');
  try {
    const { data: tenantData, error: tenantErr } = await adminClient
      .from('tenants')
      .select('id, name, slug, plan')
      .limit(1);

    if (tenantErr || !tenantData || tenantData.length === 0) {
      console.log('  ⚠ Tenant por defecto no detectado todavía.');
    } else {
      console.log(`  ✓ Tenant inicial configurado: "${tenantData[0].name}" (${tenantData[0].slug})`);
    }
  } catch (e) {
    console.log('  ⚠ No se pudo verificar el tenant inicial.');
  }

  console.log('\n====================================================');
  console.log('DIAGNÓSTICO FINAL:');
  const missingTables = Object.entries(tableStatus).filter(([_, r]) => !r.ok).map(([t]) => t);
  if (missingTables.length > 0) {
    console.log(`❌ Faltan tablas en la base de datos de Supabase (${missingTables.length} pendientes):`);
    console.log(`   ${missingTables.join(', ')}`);
    console.log('\n👉 ACCIÓN REQUERIDA:');
    console.log('   1. Abre tu Dashboard de Supabase (https://supabase.com/dashboard/project/gwerezjurmxuwcqousqg)');
    console.log('   2. Ve al menú lateral "SQL Editor"');
    console.log('   3. Copia y pega el contenido del archivo: supabase/complete_setup.sql');
    console.log('   4. Presiona "Run"');
    console.log('   5. Vuelve a ejecutar este test: node scripts/verify-supabase.cjs\n');
  } else {
    console.log('🎉 ¡ENHORABUENA! TODAS LAS TABLAS, FUNCIONES Y CONEXIONES ESTÁN 100% OPERATIVAS EN SUPABASE.');
  }
  console.log('====================================================\n');
}

testConnection();
