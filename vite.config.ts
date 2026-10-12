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

    let cookies: string[] = [];
    if (homeRes.headers.getSetCookie) {
      cookies = homeRes.headers.getSetCookie().map((c) => c.split(';')[0].trim());
    } else {
      const raw = homeRes.headers.get('set-cookie') || '';
      const regex = /([a-zA-Z0-9_\-\.]+)=([^;,\s]+)/g;
      let match;
      while ((match = regex.exec(raw)) !== null) {
        const key = match[1];
        const val = match[2];
        if (!['path', 'domain', 'expires', 'samesite', 'httponly', 'secure', 'max-age'].includes(key.toLowerCase())) {
          cookies.push(`${key}=${val}`);
        }
      }
    }

    sessionCache = {
      nonce,
      cookie: [...new Set(cookies)].join('; '),
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

async function queryDevEndpoint(
  url: string,
  payload: string,
  session: { cookie: string; nonce: string },
  timeoutMs = 2500
): Promise<{ ok: boolean; status: number; data?: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'es-CO,es-ES;q=0.9,es;q=0.8,en;q=0.7',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': session.cookie,
        'Origin': 'https://ventanillasocial.dnp.gov.co',
        'Referer': 'https://ventanillasocial.dnp.gov.co/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Rui-Nonce': session.nonce,
      },
      body: payload,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    clearTimeout(timer);
    return { ok: false, status: 0, data: null };
  }
}

function dnpLookupDevPlugin(): Plugin {
  return {
    name: 'dnp-lookup-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isLookup = 
          req.url === '/api/search-elector' || 
          req.url?.startsWith('/api/search-elector?') ||
          req.url === '/api/dnp-lookup' || 
          req.url?.startsWith('/api/dnp-lookup?') || 
          req.url === '/api/consulta-identidad' || 
          req.url?.startsWith('/api/consulta-identidad?');
        if (isLookup && req.method === 'POST') {
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
              if (!session || !session.nonce) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ encontrado: false, error: 'No se pudo conectar con DNP' }));
                return;
              }

              const payloadCC = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=${encodeURIComponent(tipDoc)}`;

              // 1. Ejecutar en paralelo RUI y Sisbén
              let [rui, sisben] = await Promise.all([
                queryDevEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
                queryDevEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
              ]);

              // 2. Si la sesión fue rechazada (HTTP 401, 403), reintentar una única vez con sesión fresca
              if (rui.status === 401 || rui.status === 403 || sisben.status === 401 || sisben.status === 403) {
                const refreshed = await getSession(true);
                if (refreshed && refreshed.nonce) {
                  session = refreshed;
                  [rui, sisben] = await Promise.all([
                    queryDevEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
                    queryDevEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
                  ]);
                }
              }

              // 3. Evaluar RUI
              if (rui.data && rui.data.ok && rui.data.nombre) {
                const { nombres, apellidos } = parseNombreCompleto(rui.data.nombre);
                const edadVal =
                  rui.data.edad ??
                  rui.data.anios ??
                  rui.data.edadCalculada ??
                  rui.data.fechaNacimiento ??
                  rui.data.fecNac ??
                  null;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  encontrado: true,
                  nombres,
                  apellidos,
                  edad: edadVal,
                  municipio: rui.data.municipio || null,
                  departamento: rui.data.departamento || null,
                  raw: rui.data,
                }));
                return;
              }

              // 4. Evaluar Sisbén
              if (sisben.data && sisben.data.ok) {
                const rawNombre =
                  sisben.data.nombre ||
                  `${sisben.data.primerNombre || ''} ${sisben.data.segundoNombre || ''} ${sisben.data.primerApellido || ''} ${sisben.data.segundoApellido || ''}`.trim();
                if (rawNombre) {
                  const { nombres, apellidos } = parseNombreCompleto(rawNombre);
                  const edadVal =
                    sisben.data.edad ??
                    sisben.data.anios ??
                    sisben.data.edadCalculada ??
                    sisben.data.fechaNacimiento ??
                    sisben.data.fecNac ??
                    null;

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    encontrado: true,
                    nombres,
                    apellidos,
                    edad: edadVal,
                    municipio: sisben.data.municipio || null,
                    departamento: sisben.data.departamento || null,
                    raw: sisben.data,
                  }));
                  return;
                }
              }

              // 5. Fallback paralelo para Tarjeta de Identidad
              if (tipDoc === '3' && cedula.length <= 11 && session) {
                const payloadTI = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=2`;
                const [ruiTI, sisbenTI] = await Promise.all([
                  queryDevEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadTI, session, 1800),
                  queryDevEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadTI, session, 1800),
                ]);

                if (ruiTI.data && ruiTI.data.ok && ruiTI.data.nombre) {
                  const { nombres, apellidos } = parseNombreCompleto(ruiTI.data.nombre);
                  const edadVal =
                    ruiTI.data.edad ??
                    ruiTI.data.anios ??
                    ruiTI.data.edadCalculada ??
                    ruiTI.data.fechaNacimiento ??
                    ruiTI.data.fecNac ??
                    null;

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    encontrado: true,
                    nombres,
                    apellidos,
                    edad: edadVal,
                    municipio: ruiTI.data.municipio || null,
                    departamento: ruiTI.data.departamento || null,
                    raw: ruiTI.data,
                  }));
                  return;
                }

                if (sisbenTI.data && sisbenTI.data.ok) {
                  const rawNombre =
                    sisbenTI.data.nombre ||
                    `${sisbenTI.data.primerNombre || ''} ${sisbenTI.data.segundoNombre || ''} ${sisbenTI.data.primerApellido || ''} ${sisbenTI.data.segundoApellido || ''}`.trim();
                  if (rawNombre) {
                    const { nombres, apellidos } = parseNombreCompleto(rawNombre);
                    const edadVal =
                      sisbenTI.data.edad ??
                      sisbenTI.data.anios ??
                      sisbenTI.data.edadCalculada ??
                      sisbenTI.data.fechaNacimiento ??
                      sisbenTI.data.fecNac ??
                      null;

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      encontrado: true,
                      nombres,
                      apellidos,
                      edad: edadVal,
                      municipio: sisbenTI.data.municipio || null,
                      departamento: sisbenTI.data.departamento || null,
                      raw: sisbenTI.data,
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


