// Cloudflare Pages Function: /api/dnp-lookup
// Consulta el endpoint gubernamental de Ventanilla Social DNP para obtener datos de identidad

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

let cachedSession: { nonce: string; cookie: string; timestamp: number } | null = null;

async function fetchFreshSession(): Promise<{ nonce: string; cookie: string; timestamp: number } | null> {
  try {
    const res = await fetch('https://ventanillasocial.dnp.gov.co/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    const nonceMatch = html.match(/var\s+_ruiPubNonce\s*=\s*['"]([a-f0-9]+)['"]/i);
    const nonce = nonceMatch ? nonceMatch[1] : '';

    const cookies: string[] = [];
    res.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        cookies.push(val.split(';')[0]);
      }
    });

    cachedSession = {
      nonce,
      cookie: cookies.join('; '),
      timestamp: Date.now(),
    };
    return cachedSession;
  } catch {
    return null;
  }
}

async function getSession(forceRefresh = false): Promise<{ nonce: string; cookie: string } | null> {
  if (!forceRefresh && cachedSession && Date.now() - cachedSession.timestamp < 10 * 60 * 1000) {
    return cachedSession;
  }
  return await fetchFreshSession();
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

    // 1. Petición a ObtenerDatosRUI
    let headers = session ? makeHeaders(session) : {};
    let ruiRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
      method: 'POST',
      headers,
      body: payload,
    });
    let ruiData = ((await ruiRes.json().catch(() => null)) || {}) as any;

    // Si falla, reintentar refrescando la sesión
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
      const { nombres, apellidos } = parseFullName(ruiData.nombre);
      const edadVal = ruiData.edad || ruiData.anios || ruiData.fechaNacimiento || ruiData.fecNac || null;
      return new Response(
        JSON.stringify({
          encontrado: true,
          nombres,
          apellidos,
          edad: edadVal,
          municipio: ruiData.municipio || null,
          departamento: ruiData.departamento || null,
          raw: ruiData,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 2. Fallback complementario a ConsultarGrupoSisben
    const sisbenRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', {
      method: 'POST',
      headers,
      body: payload,
    });

    if (sisbenRes.ok) {
      try {
        const sisbenData = (await sisbenRes.json()) as any;
        if (sisbenData && sisbenData.ok) {
          const rawNombre =
            sisbenData.nombre ||
            trimNames(sisbenData.primerNombre, sisbenData.segundoNombre, sisbenData.primerApellido, sisbenData.segundoApellido);

          if (rawNombre) {
            const { nombres, apellidos } = parseFullName(rawNombre);
            const edadVal = sisbenData.edad || sisbenData.fechaNacimiento || sisbenData.fecNac || null;
            return new Response(
              JSON.stringify({
                encontrado: true,
                nombres,
                apellidos,
                edad: edadVal,
                municipio: sisbenData.municipio || null,
                departamento: sisbenData.departamento || null,
                raw: sisbenData,
              }),
              { status: 200, headers: corsHeaders }
            );
          }
        }
      } catch {
        // Fall through
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
        const { nombres, apellidos } = parseFullName(ruiTIData.nombre);
        const edadVal = ruiTIData.edad || ruiTIData.anios || ruiTIData.fechaNacimiento || ruiTIData.fecNac || null;
        return new Response(
          JSON.stringify({
            encontrado: true,
            nombres,
            apellidos,
            edad: edadVal,
            municipio: ruiTIData.municipio || null,
            departamento: ruiTIData.departamento || null,
            raw: ruiTIData,
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      const sisbenTIRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', {
        method: 'POST',
        headers,
        body: payloadTI,
      });
      if (sisbenTIRes.ok) {
        try {
          const sisbenTIData = (await sisbenTIRes.json()) as any;
          if (sisbenTIData && sisbenTIData.ok) {
            const rawNombre =
              sisbenTIData.nombre ||
              trimNames(sisbenTIData.primerNombre, sisbenTIData.segundoNombre, sisbenTIData.primerApellido, sisbenTIData.segundoApellido);
            if (rawNombre) {
              const { nombres, apellidos } = parseFullName(rawNombre);
              const edadVal = sisbenTIData.edad || sisbenTIData.fechaNacimiento || sisbenTIData.fecNac || null;
              return new Response(
                JSON.stringify({
                  encontrado: true,
                  nombres,
                  apellidos,
                  edad: edadVal,
                  municipio: sisbenTIData.municipio || null,
                  departamento: sisbenTIData.departamento || null,
                  raw: sisbenTIData,
                }),
                { status: 200, headers: corsHeaders }
              );
            }
          }
        } catch {
          // Fall through
        }
      }
    }

    return new Response(JSON.stringify({ encontrado: false }), {
      status: 200,
      headers: corsHeaders,
    });
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

function trimNames(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).map((p) => String(p).trim()).join(' ');
}
