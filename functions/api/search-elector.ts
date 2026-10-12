// Cloudflare Pages Function: /api/search-elector
// Endpoint universal de alta velocidad para consulta de identidad y validación anti-colisión
// Compatible con Cloudflare Pages (Workers), Node local, Supabase y Ventanilla Social DNP

interface Env {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const DEFAULT_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDgwNTEsImV4cCI6MjEwNTkyNDA1MX0.gUwS5uerHQq9OEq82wYwQdx81lYnh8-Ez9lK0GSwe1o';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function formatCase(str: string): string {
  if (!str) return '';
  const palabrasMenores = ['del', 'de', 'la', 'los', 'las', 'el', 'y'];
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      if (idx !== 0 && palabrasMenores.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

function extractApellido(tokens: string[]): string {
  if (tokens.length === 0) return '';
  let part = tokens.pop()!;
  const len = tokens.length;
  if (len >= 2) {
    const p1 = tokens[len - 2].toLowerCase();
    const p2 = tokens[len - 1].toLowerCase();
    if (p1 === 'de' && (p2 === 'la' || p2 === 'los' || p2 === 'las')) {
      const art = tokens.pop()!;
      const prep = tokens.pop()!;
      return `${prep} ${art} ${part}`;
    }
  }
  if (tokens.length >= 1) {
    const p = tokens[tokens.length - 1].toLowerCase();
    if (['de', 'del', 'san', 'santa'].includes(p)) {
      const prep = tokens.pop()!;
      return `${prep} ${part}`;
    }
  }
  return part;
}

function parseFullName(fullName: string): { nombres: string; apellidos: string } {
  if (!fullName || typeof fullName !== 'string') {
    return { nombres: '', apellidos: '' };
  }
  const textoLimpio = fullName.trim().replace(/\s+/g, ' ');
  if (!textoLimpio) return { nombres: '', apellidos: '' };

  const NOMBRES_COMPUESTOS = [
    'del carmen', 'de la cruz', 'de jesus', 'de dios', 'de los angeles',
    'de las nieves', 'del rosario', 'del pilar', 'maria del carmen',
    'ana del carmen', 'luz del carmen', 'juan de dios', 'maria jose',
    'juan carlos', 'juan pablo', 'juan manuel'
  ];

  for (const compuesto of NOMBRES_COMPUESTOS) {
    const regexPrefijo = new RegExp(`^([a-záéíóúñA-ZÁÉÍÓÚÑ]+)\\s+(${compuesto})(?:\\s+|$)`, 'i');
    const matchPrefijo = textoLimpio.match(regexPrefijo);
    if (matchPrefijo) {
      const nombresExtraidos = `${matchPrefijo[1]} ${matchPrefijo[2]}`;
      const apellidosRestantes = textoLimpio.substring(nombresExtraidos.length).trim();
      return {
        nombres: formatCase(nombresExtraidos),
        apellidos: formatCase(apellidosRestantes),
      };
    }

    const regexDirecto = new RegExp(`^(${compuesto})(?:\\s+|$)`, 'i');
    const matchDirecto = textoLimpio.match(regexDirecto);
    if (matchDirecto && textoLimpio.length > matchDirecto[1].length) {
      const nombresExtraidos = matchDirecto[1];
      const apellidosRestantes = textoLimpio.substring(nombresExtraidos.length).trim();
      return {
        nombres: formatCase(nombresExtraidos),
        apellidos: formatCase(apellidosRestantes),
      };
    }
  }

  const palabras = textoLimpio.split(/\s+/).filter(Boolean);
  if (palabras.length <= 1) return { nombres: formatCase(palabras[0] || ''), apellidos: '' };
  if (palabras.length === 2) return { nombres: formatCase(palabras[0]), apellidos: formatCase(palabras[1]) };

  const tokens = [...palabras];
  const segundoApellido = extractApellido(tokens);
  const primerApellido = extractApellido(tokens);
  const nombresRestantes = tokens.join(' ');

  if (!nombresRestantes) {
    return { nombres: formatCase(primerApellido), apellidos: formatCase(segundoApellido) };
  }

  return {
    nombres: formatCase(nombresRestantes),
    apellidos: formatCase(`${primerApellido} ${segundoApellido}`),
  };
}

function trimNames(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).map((p) => String(p).trim()).join(' ');
}

// Extracción de cookies multi-cabecera para DNP
function extractCookies(res: Response): string[] {
  const cookies: string[] = [];
  if (typeof (res.headers as any).getSetCookie === 'function') {
    const list = (res.headers as any).getSetCookie();
    if (Array.isArray(list) && list.length > 0) {
      for (const item of list) {
        if (item) cookies.push(item.split(';')[0].trim());
      }
      return cookies;
    }
  }

  const raw = res.headers.get('set-cookie') || '';
  const regex = /([a-zA-Z0-9_\-\.]+)=([^;,\s]+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1];
    const val = match[2];
    if (!['path', 'domain', 'expires', 'samesite', 'httponly', 'secure', 'max-age'].includes(key.toLowerCase())) {
      cookies.push(`${key}=${val}`);
    }
  }
  return [...new Set(cookies)];
}

interface DnpSession {
  nonce: string;
  cookie: string;
  timestamp: number;
}

let isolateSession: DnpSession | null = null;
const CACHE_KEY_URL = 'https://ventanillasocial-session.cache/active';

async function getDnpSession(): Promise<DnpSession | null> {
  const now = Date.now();
  if (isolateSession && now - isolateSession.timestamp < 10 * 60 * 1000) {
    return isolateSession;
  }

  try {
    const cache = (caches as any)?.default;
    if (cache) {
      const match = await cache.match(new Request(CACHE_KEY_URL, { method: 'GET' }));
      if (match) {
        const cached = (await match.json()) as DnpSession;
        if (cached && cached.nonce && cached.cookie) {
          isolateSession = { ...cached, timestamp: now };
          return isolateSession;
        }
      }
    }
  } catch {
    // Continuar si la Cache API no está disponible
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://ventanillasocial.dnp.gov.co/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const html = await res.text();
    const nonceMatch = html.match(/var\s+_ruiPubNonce\s*=\s*['"]([a-f0-9]+)['"]/i);
    const nonce = nonceMatch ? nonceMatch[1] : '';
    const cookies = extractCookies(res);

    if (!nonce || cookies.length === 0) return null;

    const fresh: DnpSession = {
      nonce,
      cookie: cookies.join('; '),
      timestamp: Date.now(),
    };

    isolateSession = fresh;

    try {
      const cache = (caches as any)?.default;
      if (cache) {
        const cacheRes = new Response(JSON.stringify(fresh), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600',
          },
        });
        await cache.put(new Request(CACHE_KEY_URL, { method: 'GET' }), cacheRes);
      }
    } catch {
      // Ignorar fallas de cache
    }

    return fresh;
  } catch {
    return null;
  }
}

async function queryDnpEndpoint(
  url: string,
  payload: string,
  session: DnpSession,
  timeoutMs = 2200
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
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { cedula, tenantId } = body || {};
    const docLimpio = String(cedula || '').replace(/\D/g, '').trim();

    if (!docLimpio || docLimpio.length < 5) {
      return new Response(JSON.stringify({ ok: false, error: 'Documento no válido' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Resolver credenciales de Supabase con compatibilidad universal (Cloudflare Pages + Node)
    const supabaseUrl =
      env?.SUPABASE_URL ||
      env?.VITE_SUPABASE_URL ||
      (typeof process !== 'undefined' ? process.env?.SUPABASE_URL || process.env?.VITE_SUPABASE_URL : null) ||
      DEFAULT_SUPABASE_URL;

    const supabaseKey =
      env?.SUPABASE_SERVICE_ROLE_KEY ||
      env?.SUPABASE_ANON_KEY ||
      env?.VITE_SUPABASE_ANON_KEY ||
      (typeof process !== 'undefined'
        ? process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY
        : null) ||
      DEFAULT_SUPABASE_KEY;

    // 1. Validar duplicado en la campaña activa (Supabase - electores)
    if (tenantId) {
      try {
        const dupRes = await fetch(
          `${supabaseUrl}/rest/v1/electores?tenant_id=eq.${tenantId}&cedula=eq.${docLimpio}&select=id,nombres,apellidos,puesto_votacion`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (dupRes.ok) {
          const existentes = (await dupRes.json().catch(() => [])) as any[];
          if (existentes && existentes.length > 0) {
            const primero = existentes[0];
            return new Response(
              JSON.stringify({
                ok: true,
                duplicado: true,
                data: {
                  nombres: primero.nombres,
                  apellidos: primero.apellidos,
                  puesto_votacion: primero.puesto_votacion || 'Principal',
                },
                mensaje: 'Elector ya registrado en esta campaña.',
              }),
              { status: 200, headers: corsHeaders }
            );
          }
        }
      } catch (dupErr) {
        console.warn('Aviso comprobando duplicados en Supabase:', dupErr);
      }
    }

    // 2. Consulta en base de datos oficial censo_maestro en Supabase (< 40ms)
    try {
      const censoRes = await fetch(
        `${supabaseUrl}/rest/v1/censo_maestro?cedula=eq.${docLimpio}&select=nombres,apellidos,edad,puesto_sugerido,mesa_sugerida,municipio,departamento`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (censoRes.ok) {
        const censoRows = (await censoRes.json().catch(() => [])) as any[];
        if (censoRows && censoRows.length > 0) {
          const row = censoRows[0];
          const edadFinal = row.edad ? String(row.edad) : '';

          return new Response(
            JSON.stringify({
              ok: true,
              encontrado: true,
              data: {
                nombres: formatCase(row.nombres || ''),
                apellidos: formatCase(row.apellidos || ''),
                edad: edadFinal,
                municipio: row.municipio || '',
                departamento: row.departamento || '',
                puesto_votacion: row.puesto_sugerido || '',
                mesa: row.mesa_sugerida ? String(row.mesa_sugerida) : '',
              },
            }),
            { status: 200, headers: corsHeaders }
          );
        }
      }
    } catch (censoErr) {
      console.warn('Aviso consultando censo_maestro en Supabase:', censoErr);
    }

    // 3. Consulta concurrente en tiempo real a Ventanilla Social DNP oficial (sin guardar en BD)
    const session = await getDnpSession();
    if (session) {
      const payloadCC = `pNumDoc=${encodeURIComponent(docLimpio)}&pTipDoc=3`;

      const [rui, sisben] = await Promise.all([
        queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
        queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
      ]);

      if (rui.data && rui.data.ok && rui.data.nombre) {
        const { nombres, apellidos } = parseFullName(rui.data.nombre);
        const rawEdad =
          rui.data.edad ??
          rui.data.anios ??
          rui.data.edadCalculada ??
          rui.data.fechaNacimiento ??
          rui.data.fecNac ??
          null;

        return new Response(
          JSON.stringify({
            ok: true,
            encontrado: true,
            data: {
              nombres,
              apellidos,
              edad: rawEdad ? String(rawEdad) : '',
              municipio: rui.data.municipio || '',
              departamento: rui.data.departamento || '',
              puesto_votacion: '',
              mesa: '',
            },
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      if (sisben.data && sisben.data.ok) {
        const rawNombre =
          sisben.data.nombre ||
          trimNames(
            sisben.data.primerNombre,
            sisben.data.segundoNombre,
            sisben.data.primerApellido,
            sisben.data.segundoApellido
          );

        if (rawNombre) {
          const { nombres, apellidos } = parseFullName(rawNombre);
          const rawEdad =
            sisben.data.edad ??
            sisben.data.anios ??
            sisben.data.edadCalculada ??
            sisben.data.fechaNacimiento ??
            sisben.data.fecNac ??
            null;

          return new Response(
            JSON.stringify({
              ok: true,
              encontrado: true,
              data: {
                nombres,
                apellidos,
                edad: rawEdad ? String(rawEdad) : '',
                municipio: sisben.data.municipio || '',
                departamento: sisben.data.departamento || '',
                puesto_votacion: '',
                mesa: '',
              },
            }),
            { status: 200, headers: corsHeaders }
          );
        }
      }
    }

    // 4. Documento no registrado en ninguna fuente: respuesta limpia sin datos fantasma
    return new Response(
      JSON.stringify({
        ok: true,
        encontrado: false,
        data: null,
        mensaje: 'No se encontraron registros previos para este documento.',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error.message || 'Error en consulta' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
