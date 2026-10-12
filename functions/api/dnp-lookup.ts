// Cloudflare Pages Function: /api/dnp-lookup
// Consulta de alta velocidad al endpoint gubernamental de Ventanilla Social DNP para datos de identidad
// Optimizaciones: Cookie parsing multi-cabecera, Cache API perimetral y ejecución paralela RUI + Sisbén (< 500ms)

interface Env {}

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
        apellidos: formatCase(apellidosRestantes)
      };
    }

    const regexDirecto = new RegExp(`^(${compuesto})(?:\\s+|$)`, 'i');
    const matchDirecto = textoLimpio.match(regexDirecto);
    if (matchDirecto && textoLimpio.length > matchDirecto[1].length) {
      const nombresExtraidos = matchDirecto[1];
      const apellidosRestantes = textoLimpio.substring(nombresExtraidos.length).trim();
      return {
        nombres: formatCase(nombresExtraidos),
        apellidos: formatCase(apellidosRestantes)
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
    apellidos: formatCase(`${primerApellido} ${segundoApellido}`)
  };
}

function trimNames(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).map((p) => String(p).trim()).join(' ');
}

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

interface SessionData {
  nonce: string;
  cookie: string;
  timestamp: number;
}

let isolateSession: SessionData | null = null;
const CACHE_KEY_URL = 'https://ventanillasocial-session.cache/active';

async function fetchFreshSession(): Promise<SessionData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const res = await fetch('https://ventanillasocial.dnp.gov.co/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const html = await res.text();
    const nonceMatch = html.match(/var\s+_ruiPubNonce\s*=\s*['"]([a-f0-9]+)['"]/i);
    const nonce = nonceMatch ? nonceMatch[1] : '';
    const cookies = extractCookies(res);

    if (!nonce || cookies.length === 0) return null;

    const fresh: SessionData = {
      nonce,
      cookie: cookies.join('; '),
      timestamp: Date.now(),
    };

    isolateSession = fresh;
    return fresh;
  } catch {
    return null;
  }
}

async function getCachedOrFreshSession(forceRefresh = false): Promise<SessionData | null> {
  const now = Date.now();
  // 1. Memoria rápida del isolate (< 10 minutos)
  if (!forceRefresh && isolateSession && now - isolateSession.timestamp < 10 * 60 * 1000) {
    return isolateSession;
  }

  // 2. Cloudflare Edge Cache API (compartido entre workers del mismo PoP)
  if (!forceRefresh) {
    try {
      const cache = (caches as any)?.default;
      if (cache) {
        const cacheReq = new Request(CACHE_KEY_URL, { method: 'GET' });
        const match = await cache.match(cacheReq);
        if (match) {
          const cached = (await match.json()) as SessionData;
          if (cached && cached.nonce && cached.cookie) {
            isolateSession = { ...cached, timestamp: now };
            return isolateSession;
          }
        }
      }
    } catch {
      // Ignorar fallo de cache API y avanzar
    }
  }

  // 3. Handshake fresco con DNP
  const fresh = await fetchFreshSession();
  if (fresh && fresh.nonce) {
    try {
      const cache = (caches as any)?.default;
      if (cache) {
        const cacheReq = new Request(CACHE_KEY_URL, { method: 'GET' });
        const cacheRes = new Response(JSON.stringify(fresh), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600',
          },
        });
        await cache.put(cacheReq, cacheRes);
      }
    } catch {
      // Ignorar fallo al persistir en cache
    }
  }

  return fresh;
}

async function queryDnpEndpoint(
  url: string,
  payload: string,
  session: SessionData,
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

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = (await context.request.json()) as { cedula?: string; tipoDoc?: string };
    const cedula = (body.cedula || '').trim().replace(/\D/g, '');
    const tipDoc = body.tipoDoc || '3'; // 3 = Cédula de Ciudadanía en Colombia

    if (!cedula || cedula.length < 5) {
      return new Response(JSON.stringify({ encontrado: false, error: 'Documento inválido' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const respond = (payload: any) => {
      const headers = {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
      return new Response(JSON.stringify(payload), { status: 200, headers });
    };

    let session = await getCachedOrFreshSession();
    if (!session || !session.nonce) {
      session = await getCachedOrFreshSession(true);
    }
    if (!session || !session.nonce) {
      return respond({ encontrado: false, error: 'No se pudo conectar con el servicio DNP' });
    }

    const payloadCC = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=${encodeURIComponent(tipDoc)}`;

    // 1. Ejecutar simultáneamente en paralelo RUI y Sisbén
    let [rui, sisben] = await Promise.all([
      queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
      queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
    ]);

    // 2. Si la sesión fue rechazada (HTTP 401, 403), refrescar sesión y reintentar una única vez
    if (rui.status === 401 || rui.status === 403 || sisben.status === 401 || sisben.status === 403) {
      session = await getCachedOrFreshSession(true);
      if (session && session.nonce) {
        [rui, sisben] = await Promise.all([
          queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
          queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
        ]);
      }
    }

    // 3. Evaluar resultado en ObtenerDatosRUI
    if (rui.data && rui.data.ok && rui.data.nombre) {
      const { nombres, apellidos } = parseFullName(rui.data.nombre);
      const edadVal =
        rui.data.edad ??
        rui.data.anios ??
        rui.data.edadCalculada ??
        rui.data.fechaNacimiento ??
        rui.data.fecNac ??
        null;

      return respond({
        encontrado: true,
        nombres,
        apellidos,
        edad: edadVal,
        municipio: rui.data.municipio || null,
        departamento: rui.data.departamento || null,
        raw: rui.data,
      });
    }

    // 4. Evaluar resultado en ConsultarGrupoSisben
    if (sisben.data && sisben.data.ok) {
      const rawNombre =
        sisben.data.nombre ||
        trimNames(sisben.data.primerNombre, sisben.data.segundoNombre, sisben.data.primerApellido, sisben.data.segundoApellido);

      if (rawNombre) {
        const { nombres, apellidos } = parseFullName(rawNombre);
        const edadVal =
          sisben.data.edad ??
          sisben.data.anios ??
          sisben.data.edadCalculada ??
          sisben.data.fechaNacimiento ??
          sisben.data.fecNac ??
          null;

        return respond({
          encontrado: true,
          nombres,
          apellidos,
          edad: edadVal,
          municipio: sisben.data.municipio || null,
          departamento: sisben.data.departamento || null,
          raw: sisben.data,
        });
      }
    }

    // 5. Fallback paralelo para Tarjeta de Identidad (jóvenes recién cedulados)
    if (tipDoc === '3' && cedula.length <= 11) {
      const payloadTI = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=2`;
      const [ruiTI, sisbenTI] = await Promise.all([
        queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadTI, session, 1800),
        queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadTI, session, 1800),
      ]);

      if (ruiTI.data && ruiTI.data.ok && ruiTI.data.nombre) {
        const { nombres, apellidos } = parseFullName(ruiTI.data.nombre);
        const edadVal =
          ruiTI.data.edad ??
          ruiTI.data.anios ??
          ruiTI.data.edadCalculada ??
          ruiTI.data.fechaNacimiento ??
          ruiTI.data.fecNac ??
          null;

        return respond({
          encontrado: true,
          nombres,
          apellidos,
          edad: edadVal,
          municipio: ruiTI.data.municipio || null,
          departamento: ruiTI.data.departamento || null,
          raw: ruiTI.data,
        });
      }

      if (sisbenTI.data && sisbenTI.data.ok) {
        const rawNombre =
          sisbenTI.data.nombre ||
          trimNames(sisbenTI.data.primerNombre, sisbenTI.data.segundoNombre, sisbenTI.data.primerApellido, sisbenTI.data.segundoApellido);

        if (rawNombre) {
          const { nombres, apellidos } = parseFullName(rawNombre);
          const edadVal =
            sisbenTI.data.edad ??
            sisbenTI.data.anios ??
            sisbenTI.data.edadCalculada ??
            sisbenTI.data.fechaNacimiento ??
            sisbenTI.data.fecNac ??
            null;

          return respond({
            encontrado: true,
            nombres,
            apellidos,
            edad: edadVal,
            municipio: sisbenTI.data.municipio || null,
            departamento: sisbenTI.data.departamento || null,
            raw: sisbenTI.data,
          });
        }
      }
    }

    return respond({ encontrado: false });
  } catch (err: any) {
    return new Response(JSON.stringify({ encontrado: false, error: err?.message || 'Error en consulta' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
