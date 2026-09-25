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
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testExternalLookup() {
  const cedula = process.argv[2] || '1047892341';
  const tipoDoc = process.argv[3] || '3';

  console.log('====================================================');
  console.log('🌐 TEST DE CONSULTA EXTERNA DIRECTAMENTE EN POSTGRESQL');
  console.log('====================================================');
  console.log(`Documento a consultar: ${cedula} (Tipo: ${tipoDoc})`);
  console.log(`Endpoint: https://gwerezjurmxuwcqousqg.supabase.co`);
  console.log('----------------------------------------------------');

  const startTime = Date.now();
  try {
    const { data, error } = await supabase.rpc('consultar_documento_externo', {
      p_cedula: cedula,
      p_tipo_doc: tipoDoc
    });

    const elapsedMs = Date.now() - startTime;

    if (error) {
      console.error(`❌ Error en ejecución RPC: ${error.message}`);
      console.error('Código:', error.code);
      return;
    }

    console.log(`⏱ Tiempo de respuesta en base de datos: ${elapsedMs}ms`);
    console.log('Resultado devuelto por PostgreSQL:');
    console.dir(data, { depth: null });

    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.encontrado) {
      console.log('\n✅ CIUDADANO ENCONTRADO:');
      console.log(`   Nombres:   ${result.nombres}`);
      console.log(`   Apellidos: ${result.apellidos}`);
    } else {
      console.log('\nℹ Documento no encontrado o sin datos devueltos por el servicio externo.');
    }
  } catch (err) {
    console.error('❌ Excepción:', err.message);
  }
  console.log('====================================================\n');
}

testExternalLookup();
