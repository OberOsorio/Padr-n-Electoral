import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  if (!forceRefresh && isolateSession && now - isolateSession.timestamp < 10 * 60 * 1000) {
    return isolateSession;
  }
  const fresh = await fetchFreshSession();
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

export interface DnpCitizenResult {
  encontrado: boolean;
  nombres?: string;
  apellidos?: string;
  edad?: string | number | null;
  municipio?: string | null;
  departamento?: string | null;
  raw?: any;
  error?: string;
}

export async function fetchDnpCitizen(
  cedula: string,
  tipoDoc = '3',
  timeoutMs = 2500
): Promise<DnpCitizenResult> {
  try {
    let session = await getCachedOrFreshSession();
    if (!session || !session.nonce) {
      session = await getCachedOrFreshSession(true);
    }
    if (!session || !session.nonce) {
      return { encontrado: false, error: 'No se pudo conectar con el servicio DNP' };
    }

    const payloadCC = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=${encodeURIComponent(tipoDoc)}`;

    let [rui, sisben] = await Promise.all([
      queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session, timeoutMs),
      queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session, timeoutMs),
    ]);

    if (rui.status === 401 || rui.status === 403 || sisben.status === 401 || sisben.status === 403) {
      session = await getCachedOrFreshSession(true);
      if (session && session.nonce) {
        [rui, sisben] = await Promise.all([
          queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session, timeoutMs),
          queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session, timeoutMs),
        ]);
      }
    }

    if (rui.data && rui.data.ok && rui.data.nombre) {
      const { nombres, apellidos } = parseFullName(rui.data.nombre);
      const edadVal =
        rui.data.edad ??
        rui.data.anios ??
        rui.data.edadCalculada ??
        rui.data.fechaNacimiento ??
        rui.data.fecNac ??
        null;

      return {
        encontrado: true,
        nombres,
        apellidos,
        edad: edadVal,
        municipio: rui.data.municipio || null,
        departamento: rui.data.departamento || null,
        raw: rui.data,
      };
    }

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

        return {
          encontrado: true,
          nombres,
          apellidos,
          edad: edadVal,
          municipio: sisben.data.municipio || null,
          departamento: sisben.data.departamento || null,
          raw: sisben.data,
        };
      }
    }

    return { encontrado: false };
  } catch (err: any) {
    return { encontrado: false, error: err?.message || 'Error en consulta DNP' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ encontrado: false, error: 'Método no permitido' });
  }

  try {
    const { cedula: rawCedula, tipoDoc } = req.body || {};
    const cedula = String(rawCedula || '').trim().replace(/\D/g, '');
    const tipDoc = tipoDoc || '3';

    if (!cedula || cedula.length < 5) {
      return res.status(400).json({ encontrado: false, error: 'Documento inválido' });
    }

    const result = await fetchDnpCitizen(cedula, tipDoc);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ encontrado: false, error: err?.message || 'Error en consulta' });
  }
}
