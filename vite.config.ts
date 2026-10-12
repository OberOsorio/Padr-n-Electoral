import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { parseNombreCompleto } from './src/utils/nameParser.ts'

let sessionCache: { nonce: string; cookie: string; timestamp: number } | null = null;

async function fetchFreshSession() {
  try {
    const homeRes = await fetch('https://ventanillasocial.dnp.gov.co/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    const html = await homeRes.text();
    const nonceMatch = html.match(/var\s+_ruiPubNonce\s*=\s*['"]([a-f0-9]+)['"]/i);
    const nonce = nonceMatch ? nonceMatch[1] : '';

    let cookie = '';
    if (homeRes.headers.getSetCookie) {
      cookie = homeRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    } else if (homeRes.headers.get('set-cookie')) {
      cookie = homeRes.headers.get('set-cookie')!;
    }

    sessionCache = {
      nonce,
      cookie,
      timestamp: Date.now(),
    };
    return sessionCache;
  } catch (err) {
    console.error('[dnp-dev-plugin] Error al obtener sesión fresca:', err);
    return null;
  }
}

async function getSession(forceRefresh = false) {
  if (!forceRefresh && sessionCache && Date.now() - sessionCache.timestamp < 10 * 60 * 1000) {
    return sessionCache;
  }
  return await fetchFreshSession();
}

function dnpLookupDevPlugin(): Plugin {
  return {
    name: 'dnp-lookup-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url === '/api/dnp-lookup' || req.url?.startsWith('/api/dnp-lookup?')) && req.method === 'POST') {
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

              let session = await getSession();
              if (!session || !session.nonce) {
                session = await getSession(true);
              }

              const makeHeaders = (s: { cookie: string; nonce: string }): Record<string, string> => ({
                'Accept': '*/*',
                'Accept-Language': 'es-CO,es-ES;q=0.9,es;q=0.8,en;q=0.7',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie': s.cookie,
                'Origin': 'https://ventanillasocial.dnp.gov.co',
                'Referer': 'https://ventanillasocial.dnp.gov.co/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Rui-Nonce': s.nonce,
              });

              const payload = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=${encodeURIComponent(tipDoc)}`;

              // 1. ObtenerDatosRUI
              let headers = session ? makeHeaders(session) : {};
              let ruiRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
                method: 'POST',
                headers,
                body: payload,
              });
              let ruiData = ((await ruiRes.json().catch(() => null)) || {}) as any;

              // Si falla, reintentar refrescando el token de sesión
              if ((!ruiData || !ruiData.ok) && (!ruiRes.ok || ruiRes.status === 200)) {
                session = await getSession(true);
                if (session && session.nonce) {
                  headers = makeHeaders(session);
                  ruiRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
                    method: 'POST',
                    headers,
                    body: payload,
                  });
                  ruiData = ((await ruiRes.json().catch(() => null)) || {}) as any;
                }
              }

              if (ruiData && ruiData.ok && ruiData.nombre) {
                const { nombres, apellidos } = parseNombreCompleto(ruiData.nombre);
                const edadVal = ruiData.edad || ruiData.anios || ruiData.fechaNacimiento || ruiData.fecNac || null;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  encontrado: true,
                  nombres,
                  apellidos,
                  edad: edadVal,
                  municipio: ruiData.municipio || null,
                  departamento: ruiData.departamento || null,
                  raw: ruiData,
                }));
                return;
              }

              // 2. Sisbén fallback
              const sisbenRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', {
                method: 'POST',
                headers,
                body: payload,
              });

              if (sisbenRes.ok) {
                const sisbenData = ((await sisbenRes.json().catch(() => null)) || {}) as any;
                if (sisbenData && sisbenData.ok) {
                  const rawNombre =
                    sisbenData.nombre ||
                    `${sisbenData.primerNombre || ''} ${sisbenData.segundoNombre || ''} ${sisbenData.primerApellido || ''} ${sisbenData.segundoApellido || ''}`.trim();
                  if (rawNombre) {
                    const { nombres, apellidos } = parseNombreCompleto(rawNombre);
                    const edadVal = sisbenData.edad || sisbenData.fechaNacimiento || sisbenData.fecNac || null;

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      encontrado: true,
                      nombres,
                      apellidos,
                      edad: edadVal,
                      municipio: sisbenData.municipio || null,
                      departamento: sisbenData.departamento || null,
                      raw: sisbenData,
                    }));
                    return;
                  }
                }
              }

              // 3. Fallback a Tarjeta de Identidad (tipoDoc=2) si se consultó como Cédula (tipoDoc=3)
              if (tipDoc === '3') {
                const payloadTI = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=2`;
                const ruiTIRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
                  method: 'POST',
                  headers,
                  body: payloadTI,
                });
                const ruiTIData = ((await ruiTIRes.json().catch(() => null)) || {}) as any;
                if (ruiTIData && ruiTIData.ok && ruiTIData.nombre) {
                  const { nombres, apellidos } = parseNombreCompleto(ruiTIData.nombre);
                  const edadVal = ruiTIData.edad || ruiTIData.anios || ruiTIData.fechaNacimiento || ruiTIData.fecNac || null;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    encontrado: true,
                    nombres,
                    apellidos,
                    edad: edadVal,
                    municipio: ruiTIData.municipio || null,
                    departamento: ruiTIData.departamento || null,
                    raw: ruiTIData,
                  }));
                  return;
                }

                const sisbenTIRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', {
                  method: 'POST',
                  headers,
                  body: payloadTI,
                });
                if (sisbenTIRes.ok) {
                  const sisbenTIData = ((await sisbenTIRes.json().catch(() => null)) || {}) as any;
                  if (sisbenTIData && sisbenTIData.ok) {
                    const rawNombre =
                      sisbenTIData.nombre ||
                      `${sisbenTIData.primerNombre || ''} ${sisbenTIData.segundoNombre || ''} ${sisbenTIData.primerApellido || ''} ${sisbenTIData.segundoApellido || ''}`.trim();
                    if (rawNombre) {
                      const { nombres, apellidos } = parseNombreCompleto(rawNombre);
                      const edadVal = sisbenTIData.edad || sisbenTIData.fechaNacimiento || sisbenTIData.fecNac || null;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({
                        encontrado: true,
                        nombres,
                        apellidos,
                        edad: edadVal,
                        municipio: sisbenTIData.municipio || null,
                        departamento: sisbenTIData.departamento || null,
                        raw: sisbenTIData,
                      }));
                      return;
                    }
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

function adminResetPasswordDevPlugin(): Plugin {
  return {
    name: 'admin-reset-password-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          (req.url === '/api/admin/reset-password' || req.url?.startsWith('/api/admin/reset-password?')) &&
          req.method === 'POST'
        ) {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { userId, newPassword, adminRequesterId, userEmail, userName } = body || {};

              if (!userId || !newPassword) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Faltan parámetros requeridos (userId, newPassword).' }));
                return;
              }

              const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gwerezjurmxuwcqousqg.supabase.co';
              let serviceRoleKey =
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

              if (!serviceRoleKey) {
                try {
                  const fs = await import('node:fs');
                  const path = await import('node:path');
                  const envPath = path.resolve(process.cwd(), '.env');
                  if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf-8');
                    const match =
                      envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/) ||
                      envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
                    if (match) serviceRoleKey = match[1].trim();
                  }
                } catch {
                  // ignore
                }
              }

              if (!serviceRoleKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurado en entorno.' }));
                return;
              }

              const { createClient } = await import('@supabase/supabase-js');
              const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              });

              // 1. Validar que el solicitante sea admin o superadmin si se envió adminRequesterId
              if (adminRequesterId) {
                const { data: requesterProfile } = await supabaseAdmin
                  .from('profiles')
                  .select('role')
                  .eq('id', adminRequesterId)
                  .single();

                if (requesterProfile && !['superadmin', 'admin'].includes(requesterProfile.role)) {
                  res.statusCode = 403;
                  res.end(JSON.stringify({ error: 'No autorizado para resetear credenciales.' }));
                  return;
                }
              }

              // 2. Actualizar contraseña efectiva en auth.users
              const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                {
                  password: newPassword,
                  email_confirm: true,
                }
              );

              if (updateErr) {
                res.statusCode = 400;
                res.end(
                  JSON.stringify({
                    error: updateErr.message || 'Error al actualizar credencial en Supabase Auth.',
                  })
                );
                return;
              }

              // 3. Auditoría inmutable
              try {
                await supabaseAdmin.from('security_audit_logs').insert({
                  user_id: userId,
                  user_email: userEmail || updatedUser?.user?.email || 'usuario@sistema.gov',
                  user_name: userName || 'Usuario',
                  event_type: 'PASSWORD_RESET_PROVISIONAL',
                  severity: 'WARNING',
                  action_detail: `Contraseña provisional asignada por el administrador ID: ${adminRequesterId || 'admin'}`,
                });
              } catch (auditErr) {
                console.warn('[vite-admin-reset] Aviso auditoría:', auditErr);
              }

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'Contraseña actualizada y habilitada para login.' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Error interno del servidor.' }));
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
    adminResetPasswordDevPlugin(),
  ],
  server: {
    host: true, // Permite escuchar en la red local
    port: 5173,
    allowedHosts: true, // Permite el acceso desde cualquier túnel como trycloudflare.com
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'excel';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor';
          }
        },
      },
    },
  },
})


