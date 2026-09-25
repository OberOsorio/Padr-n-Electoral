// Cloudflare Pages Function: /api/dnp-lookup
// Consulta el endpoint gubernamental de Ventanilla Social DNP para obtener datos de identidad

interface Env {}

function parseFullName(fullName: string): { nombres: string; apellidos: string } {
  if (!fullName || typeof fullName !== 'string') {
    return { nombres: '', apellidos: '' };
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { nombres: '', apellidos: '' };
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const cleanParts = parts.map(capitalize);

  if (cleanParts.length === 1) {
    return { nombres: cleanParts[0], apellidos: '' };
  }
  if (cleanParts.length === 2) {
    return { nombres: cleanParts[0], apellidos: cleanParts[1] };
  }
  if (cleanParts.length === 3) {
    return { nombres: cleanParts[0], apellidos: `${cleanParts[1]} ${cleanParts[2]}` };
  }
  
  // 4 o más palabras (2 nombres, 2 apellidos)
  const nombres = cleanParts.slice(0, 2).join(' ');
  const apellidos = cleanParts.slice(2).join(' ');
  return { nombres, apellidos };
}

let cachedSessionCookie: string | null = '__CsrfToken=2351a61a39744da9a76107a723acfb55; KEMP_STICKY=4064890549.1.0.200321338';

async function getCookies(): Promise<string> {
  if (cachedSessionCookie) return cachedSessionCookie;
  try {
    const res = await fetch('https://ventanillasocial.dnp.gov.co/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      },
    });
    const cookies: string[] = [];
    res.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        cookies.push(val.split(';')[0]);
      }
    });
    if (cookies.length > 0) {
      cachedSessionCookie = cookies.join('; ');
      return cachedSessionCookie;
    }
  } catch {
    // fallback to provided cookie
  }
  return '__CsrfToken=2351a61a39744da9a76107a723acfb55; KEMP_STICKY=4064890549.1.0.200321338';
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

    const cookie = await getCookies();
    const commonHeaders: Record<string, string> = {
      'Accept': '*/*',
      'Accept-Language': 'es-CO,es-ES;q=0.9,es;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5,es-MX;q=0.4',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
      'Origin': 'https://ventanillasocial.dnp.gov.co',
      'Priority': 'u=1, i',
      'Referer': 'https://ventanillasocial.dnp.gov.co/',
      'Sec-Ch-Ua': '"Not=A?Brand";v="99", "Microsoft Edge";v="151", "Chromium";v="151"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    };

    const payload = `pNumDoc=${encodeURIComponent(cedula)}&pTipDoc=${encodeURIComponent(tipDoc)}`;

    // 1. Petición a ObtenerDatosRUI
    const ruiRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
      method: 'POST',
      headers: commonHeaders,
      body: payload,
    });

    if (ruiRes.ok) {
      try {
        const ruiData = (await ruiRes.json()) as any;
        if (ruiData && ruiData.ok && ruiData.nombre) {
          const { nombres, apellidos } = parseFullName(ruiData.nombre);
          return new Response(
            JSON.stringify({
              encontrado: true,
              nombres,
              apellidos,
              municipio: ruiData.municipio || null,
              departamento: ruiData.departamento || null,
              raw: ruiData,
            }),
            { status: 200, headers: corsHeaders }
          );
        }
      } catch {
        // Continue to Sisben fallback
      }
    }

    // 2. Fallback complementario a ConsultarGrupoSisben
    const sisbenRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', {
      method: 'POST',
      headers: commonHeaders,
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
            return new Response(
              JSON.stringify({
                encontrado: true,
                nombres,
                apellidos,
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
