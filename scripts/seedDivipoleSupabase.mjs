import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env', 'utf-8');
const tokenMatch = env.match(/SUPABASE_ACCESS_TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

if (!token) {
  console.error('No token found');
  process.exit(1);
}

const puestos = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'divipole2026.json'), 'utf-8')
);

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function run() {
  console.log(`Starting upload of ${puestos.length} Divipole 2026 puestos to Supabase...`);
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < puestos.length; i += batchSize) {
    const chunk = puestos.slice(i, i + batchSize);
    const values = chunk.map((p) => {
      return `(${escapeSql(p.id)}, ${escapeSql(p.dd)}, ${escapeSql(p.mm)}, ${escapeSql(p.zz)}, ${escapeSql(p.pp)}, ${escapeSql(p.departamento)}, ${escapeSql(p.municipio)}, ${escapeSql(p.name)}, ${escapeSql(p.zone)}, ${p.totalMesas || 1}, ${escapeSql(p.address || '')}, ${p.censo || 0}, ${p.lat !== undefined ? p.lat : 'NULL'}, ${p.lng !== undefined ? p.lng : 'NULL'}, ${escapeSql(p.citrep || null)})`;
    }).join(',\n');

    const sql = `
      insert into public.divipole_puestos_2026 (id, dd, mm, zz, pp, departamento, municipio, name, zone, total_mesas, address, censo, lat, lng, citrep)
      values ${values}
      on conflict (id) do update set
        name = excluded.name,
        zone = excluded.zone,
        total_mesas = excluded.total_mesas,
        address = excluded.address,
        censo = excluded.censo,
        lat = excluded.lat,
        lng = excluded.lng,
        citrep = excluded.citrep;
    `;

    const res = await fetch('https://api.supabase.com/v1/projects/gwerezjurmxuwcqousqg/database/query', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    const data = await res.json();
    if (data.message) {
      console.error(`Error in batch ${i}-${i + chunk.length}:`, data.message);
      break;
    }

    inserted += chunk.length;
    if (inserted % 2000 === 0 || inserted === puestos.length) {
      console.log(`Uploaded ${inserted} / ${puestos.length} puestos...`);
    }
  }

  console.log(`Finished! Successfully uploaded ${inserted} puestos to Supabase divipole_puestos_2026.`);
}

run().catch(console.error);
