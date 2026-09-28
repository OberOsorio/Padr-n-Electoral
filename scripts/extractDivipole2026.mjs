import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

const DD_TO_DEPT = {
  '01': 'Antioquia',
  '03': 'Atlántico',
  '05': 'Bolívar',
  '07': 'Boyacá',
  '09': 'Caldas',
  '11': 'Cauca',
  '12': 'Cesar',
  '13': 'Córdoba',
  '15': 'Cundinamarca',
  '16': 'Bogotá D.C.',
  '17': 'Chocó',
  '19': 'Huila',
  '21': 'Magdalena',
  '23': 'Nariño',
  '24': 'Risaralda',
  '25': 'Norte de Santander',
  '26': 'Quindío',
  '27': 'Santander',
  '28': 'Sucre',
  '29': 'Tolima',
  '31': 'Valle del Cauca',
  '40': 'Arauca',
  '44': 'Caquetá',
  '46': 'Casanare',
  '48': 'La Guajira',
  '50': 'Guainía',
  '52': 'Meta',
  '54': 'Guaviare',
  '56': 'San Andrés',
  '60': 'Amazonas',
  '64': 'Putumayo',
  '68': 'Vaupés',
  '72': 'Vichada',
  '88': 'Consulados Exterior',
};

function normalizeText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function cleanZone(raw) {
  if (!raw) return 'Cabecera Municipal';
  let z = raw.replace(/^\d+/, '').trim();
  z = z.replace(/^COMUNA\s+/i, 'Comuna ');
  z = z.replace(/^CORREGIMIENTO\s+/i, 'Corregimiento ');
  z = z.replace(/^CORREG\s+/i, 'Corregimiento ');
  z = z.replace(/^INSP\s+/i, 'Inspección ');
  return z || 'Cabecera Municipal';
}

export async function run() {
  const pdfPath = path.join(process.cwd(), 'divipole_2026.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  await parser.load();
  console.log('Parsing all', parser.doc.numPages, 'pages of Divipole 2026...');

  const res = await parser.getText();
  console.log('Text extracted.');

  // Load COLOMBIA_GEO_DATA to help identify municipalities
  const geoDataRaw = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'colombiaGeoData.ts'), 'utf-8');
  // Extract all municipalities per department
  const munisByDept = {};
  for (const [dd, deptName] of Object.entries(DD_TO_DEPT)) {
    munisByDept[deptName] = [];
  }

  // Simple regex parser for colombiaGeoData.ts
  const deptBlocks = geoDataRaw.split(/nombre:\s*['"]([^'"]+)['"]/);
  for (let i = 1; i < deptBlocks.length; i += 2) {
    const dName = deptBlocks[i];
    const rest = deptBlocks[i + 1] || '';
    const munisArrayMatch = rest.match(/municipios:\s*\[([\s\S]*?)\]/);
    if (munisArrayMatch) {
      const munis = munisArrayMatch[1]
        .split(',')
        .map(s => s.replace(/['"\s\n\r]/g, ''))
        .filter(Boolean);
      munisByDept[dName] = munis;
    }
  }

  const allPuestos = [];
  let unmatchedPuestos = 0;

  for (const page of res.pages) {
    let text = page.text;
    text = text.replace(/VERSIÓN\s+0[\s\S]*?(?:EXTERIOR|LUNES\s+A\s+SABADO|DOMINGO|FECHA\s+DE\s+CORTE|CENSO\s+ELECTORAL)/gi, '');
    
    // Split by lines starting with \d{2} \d{3} \d{2} \d{2}
    const blocks = text.split(/(?=(?:^|\n)\d{2}\s+\d{3}\s+\d{2}\s+\d{2}\s+)/);
    for (const b of blocks) {
      const line = b.trim().replace(/\s+/g, ' ');
      const m = line.match(/^(\d{2})\s+(\d{3})\s+(\d{2})\s+(\d{2})\s+(.+)$/);
      if (!m) continue;

      const dd = m[1];
      const mm = m[2];
      const zz = m[3];
      const pp = m[4];
      const content = m[5].trim();

      const deptName = DD_TO_DEPT[dd] || 'Colombia';
      const knownMunis = (munisByDept[deptName] || []).slice().sort((a, b) => b.length - a.length);

      // Numbers at the end
      const endMatch = content.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([-\d.]+)\s+([-\d.]+)(.*)$/);
      let nameAndRest = content;
      let totalMesas = 1;
      let censo = 0;
      let lat = null;
      let lng = null;
      let citrep = '';

      if (endMatch) {
        censo = parseInt(endMatch[3], 10);
        totalMesas = parseInt(endMatch[4], 10);
        lat = parseFloat(endMatch[5]);
        lng = parseFloat(endMatch[6]);
        citrep = endMatch[7]?.trim() || '';
        nameAndRest = content.substring(0, content.length - endMatch[0].length).trim();
      }

      // Remove department name if repeated at start
      const normDept = normalizeText(deptName);
      let stripped = nameAndRest;
      if (normalizeText(stripped).startsWith(normDept)) {
        stripped = stripped.substring(normDept.length).trim();
      }

      // Find municipality
      let detectedMuni = '';
      const normStripped = normalizeText(stripped);
      for (const km of knownMunis) {
        const nkm = normalizeText(km);
        if (normStripped.startsWith(nkm)) {
          detectedMuni = km;
          stripped = stripped.substring(nkm.length).trim();
          break;
        }
      }

      // If not matched, grab first token(s)
      if (!detectedMuni) {
        const tokens = stripped.split(' ');
        detectedMuni = tokens[0] || 'Cabecera';
        stripped = tokens.slice(1).join(' ').trim();
      }

      // Find zone/comuna
      let zone = zz === '99' ? 'Zona Rural' : (zz === '00' ? 'Cabecera' : `Comuna ${parseInt(zz, 10)}`);
      let address = '';
      let name = stripped;

      const zoneMatch = stripped.match(/(\d{2}(?:COMUNA|CORREG|INSP|ZONA|CORREGIMIENTO)[^A-Z0-9]*[A-Z0-9\s]+?)(?=\s+(?:CLL|CL|CRA|KR|CR|K|DIAG|DG|AV|BARRIO|B\.|VEREDA|VRDA|KM|CALLE|CARRERA|\d+)|$)/i);
      if (zoneMatch) {
        zone = cleanZone(zoneMatch[1]);
        const namePart = stripped.substring(0, stripped.indexOf(zoneMatch[0])).trim();
        const addrPart = stripped.substring(stripped.indexOf(zoneMatch[0]) + zoneMatch[0].length).trim();
        name = namePart || `Puesto ${pp}`;
        address = addrPart;
      }

      const cleanName = name
        .replace(/^IE\s+/i, 'I.E. ')
        .replace(/^ESC\s+/i, 'Esc. ')
        .replace(/^COL\s+/i, 'Col. ')
        .replace(/\s+/g, ' ')
        .trim();

      allPuestos.push({
        id: `${dd}_${mm}_${zz}_${pp}`,
        dd, mm, zz, pp,
        departamento: deptName,
        municipio: detectedMuni,
        name: cleanName || `Puesto ${pp}`,
        zone: zone.trim(),
        totalMesas: totalMesas > 0 ? totalMesas : 1,
        address: address.trim(),
        censo,
        lat: !isNaN(lat) ? lat : undefined,
        lng: !isNaN(lng) ? lng : undefined,
        citrep: citrep || undefined,
      });
    }
  }

  console.log('Total puestos parsed:', allPuestos.length);
  
  // Inspect Monteria specifically
  const monteria = allPuestos.filter(p => p.departamento === 'Córdoba' && p.municipio === 'Montería');
  console.log('Montería puestos count:', monteria.length);
  console.log('First 5 Montería puestos:');
  monteria.slice(0, 5).forEach((p, i) => {
    console.log(`${i+1}. [${p.id}] ${p.name} | ${p.zone} | ${p.totalMesas} mesas | ${p.address}`);
  });

  // Write files
  const outDir = path.join(process.cwd(), 'src', 'data');
  fs.writeFileSync(path.join(outDir, 'divipole2026.json'), JSON.stringify(allPuestos, null, 2), 'utf-8');
  console.log('Wrote src/data/divipole2026.json');

  // Let's generate a lightweight, typed typescript module with helpers for the app
  // Group puestos by Department and Municipality
  const grouped = {};
  for (const p of allPuestos) {
    const dKey = normalizeText(p.departamento);
    const mKey = normalizeText(p.municipio);
    if (!grouped[dKey]) grouped[dKey] = {};
    if (!grouped[dKey][mKey]) grouped[dKey][mKey] = [];
    grouped[dKey][mKey].push({
      id: p.id,
      name: p.name,
      totalMesas: p.totalMesas,
      zone: p.zone,
      address: p.address,
      censo: p.censo,
      lat: p.lat,
      lng: p.lng,
      citrep: p.citrep,
    });
  }

  // Also extract Córdoba dataset for instant compile and fast bundle loading
  const cordobaOnly = allPuestos.filter(p => p.departamento === 'Córdoba');
  fs.writeFileSync(
    path.join(outDir, 'cordobaDivipole2026.json'),
    JSON.stringify(cordobaOnly, null, 2),
    'utf-8'
  );
  console.log('Wrote src/data/cordobaDivipole2026.json with', cordobaOnly.length, 'puestos');
}

run().catch(console.error);
