import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function dnpLookupDevPlugin(): Plugin {
  return {
    name: 'dnp-lookup-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/dnp-lookup' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const cedula = (body.cedula || '').trim().replace(/\D/g, '');
              const tipDoc = body.tipoDoc || '3';

              if (!cedula || cedula.length < 5) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ encontrado: false, error: 'Documento inválido' }));
                return;
              }

              let cookie = '__CsrfToken=2351a61a39744da9a76107a723acfb55; KEMP_STICKY=4064890549.1.0.200321338';
              try {
                const homeRes = await fetch('https://ventanillasocial.dnp.gov.co/', {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });
                if (homeRes.headers.getSetCookie) {
                  cookie = homeRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
                } else if (homeRes.headers.get('set-cookie')) {
                  cookie = homeRes.headers.get('set-cookie')!;
                }
              } catch (e) {
                // use fallback
              }

              const commonHeaders: Record<string, string> = {
                'Accept': '*/*',
                'Accept-Language': 'es-CO,es-ES;q=0.9,es;q=0.8,en;q=0.7',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
                'Origin': 'https://ventanillasocial.dnp.gov.co',
                'Referer': 'https://ventanillasocial.dnp.gov.co/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              };

              const payload = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=${encodeURIComponent(tipDoc)}`;

              // 1. ObtenerDatosRUI
              const ruiRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
                method: 'POST',
                headers: commonHeaders,
                body: payload,
              });

              if (ruiRes.ok) {
                const ruiData = ((await ruiRes.json().catch(() => null)) || {}) as any;
                if (ruiData && ruiData.ok && ruiData.nombre) {
                  const parts = ruiData.nombre.trim().split(/\s+/).filter(Boolean);
                  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                  const cleanParts = parts.map(capitalize);
                  const nombres = cleanParts.length >= 4 ? cleanParts.slice(0, 2).join(' ') : cleanParts.slice(0, 1).join(' ');
                  const apellidos = cleanParts.length >= 4 ? cleanParts.slice(2).join(' ') : cleanParts.slice(1).join(' ');

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    encontrado: true,
                    nombres,
                    apellidos,
                    municipio: ruiData.municipio || null,
                    departamento: ruiData.departamento || null,
                    raw: ruiData
                  }));
                  return;
                }
              }

              // 2. Sisbén fallback
              const sisbenRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', {
                method: 'POST',
                headers: commonHeaders,
                body: payload,
              });

              if (sisbenRes.ok) {
                const sisbenData = ((await sisbenRes.json().catch(() => null)) || {}) as any;
                if (sisbenData && sisbenData.ok) {
                  const rawNombre =
                    sisbenData.nombre ||
                    `${sisbenData.primerNombre || ''} ${sisbenData.segundoNombre || ''} ${sisbenData.primerApellido || ''} ${sisbenData.segundoApellido || ''}`.trim();
                  if (rawNombre) {
                    const parts = rawNombre.trim().split(/\s+/).filter(Boolean);
                    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                    const cleanParts = parts.map(capitalize);
                    const nombres = cleanParts.length >= 4 ? cleanParts.slice(0, 2).join(' ') : cleanParts.slice(0, 1).join(' ');
                    const apellidos = cleanParts.length >= 4 ? cleanParts.slice(2).join(' ') : cleanParts.slice(1).join(' ');

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      encontrado: true,
                      nombres,
                      apellidos,
                      raw: sisbenData
                    }));
                    return;
                  }
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ encontrado: false }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ encontrado: false, error: err?.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dnpLookupDevPlugin(),
  ],
})

