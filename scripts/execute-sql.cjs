const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Client: PgClient } = require('pg');

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
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const dbPassword = env.SUPABASE_DB_PASSWORD || env.DATABASE_PASSWORD;
const databaseUrl = env.DATABASE_URL;

async function executeSql(sqlText) {
  // Estrategia 1: Supabase Management API con Personal Access Token
  if (accessToken) {
    console.log('⚡ Ejecutando vía Supabase Management API...');
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sqlText })
    });

    if (res.ok) {
      console.log('✅ SQL ejecutado con éxito vía Management API.');
      return { success: true, data: await res.json() };
    }
    const errText = await res.text();
    console.warn(`⚠ Falló Management API (${res.status}): ${errText}`);
  }

  // Estrategia 2: Conexión directa PostgreSQL (pg)
  if (databaseUrl || dbPassword) {
    console.log('⚡ Ejecutando vía conexión directa PostgreSQL (pg)...');
    const connString = databaseUrl || `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    const client = new PgClient({
      connectionString: connString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      const res = await client.query(sqlText);
      await client.end();
      console.log('✅ SQL ejecutado con éxito vía conexión directa PostgreSQL.');
      return { success: true, data: res };
    } catch (pgErr) {
      console.warn(`⚠ Falló conexión PostgreSQL directa: ${pgErr.message}`);
      try { await client.end(); } catch (e) {}
    }
  }

  // Estrategia 3: Función RPC de ejecución en PostgreSQL (si fue habilitada)
  if (serviceKey) {
    console.log('⚡ Intentando ejecución vía RPC gateway con Service Role Key...');
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: sqlText });
      if (!error && (data?.success || data === true)) {
        console.log('✅ SQL ejecutado con éxito vía RPC exec_sql.');
        return { success: true, data };
      }
      if (error) {
        console.warn(`⚠ RPC exec_sql no disponible: ${error.message}`);
      }
    } catch (rpcErr) {
      console.warn(`⚠ Excepción en RPC exec_sql: ${rpcErr.message}`);
    }
  }

  return {
    success: false,
    error: 'No se pudo ejecutar el SQL de forma desatendida. Requiere SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD o la función gateway exec_sql.'
  };
}

module.exports = { executeSql };

if (require.main === module) {
  const fileToRun = process.argv[2];
  if (!fileToRun) {
    console.error('Uso: node scripts/execute-sql.cjs <ruta-archivo.sql>');
    process.exit(1);
  }
  const fullPath = path.resolve(fileToRun);
  if (!fs.existsSync(fullPath)) {
    console.error(`Archivo no encontrado: ${fullPath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(fullPath, 'utf8');
  executeSql(sql).then(res => {
    if (!res.success) {
      console.error('❌ ' + res.error);
      process.exit(1);
    }
  });
}
