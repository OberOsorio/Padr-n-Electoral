/**
 * Cloudflare Worker router for Padron Electoral
 * Handles API routes like /api/dnp-lookup and delegates static assets to env.ASSETS
 */

let cachedCookies = '';
let cookieExpiry = 0;

async function getDnpCookies() {
  const now = Date.now();
  if (cachedCookies && now < cookieExpiry) {
    return cachedCookies;
  }
  try {
    const res = await fetch('https://ventanillasocial.dnp.gov.co/', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    let cookies = '';
    if (res.headers.getSetCookie) {
      cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    } else {
      cookies = res.headers.get('set-cookie') || '';
    }
    if (cookies) {
      cachedCookies = cookies;
      cookieExpiry = now + 5 * 60 * 1000;
      return cookies;
    }
  } catch (e) {
    // fallback
  }
  return '__CsrfToken=2351a61a39744da9a76107a723acfb55; KEMP_STICKY=4064890549.1.0.200321338';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Manejo de CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Ruta de consulta externa DNP Ventanilla Social
    if (url.pathname === '/api/dnp-lookup') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const cedula = (body.cedula || '').toString().trim().replace(/\D/g, '');
        const tipoDoc = (body.tipoDoc || '3').toString().trim();

        if (!cedula || cedula.length < 5) {
          return new Response(
            JSON.stringify({ encontrado: false, error: 'Documento inválido (mínimo 5 dígitos)' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        const formData = new URLSearchParams();
        formData.append('pNumDoc', cedula);
        formData.append('pTipDoc', tipoDoc);

        const cookies = await getDnpCookies();

        const dnpRes = await fetch('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'accept-language': 'es-CO,es-ES;q=0.9,es;q=0.8,en;q=0.7',
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://ventanillasocial.dnp.gov.co',
            'referer': 'https://ventanillasocial.dnp.gov.co/',
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'cookie': cookies,
          },
          body: formData.toString(),
        });

        if (!dnpRes.ok) {
          return new Response(
            JSON.stringify({
              encontrado: false,
              error: `Error servidor DNP (HTTP ${dnpRes.status})`,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        const rawText = await dnpRes.text();
        let json;
        try {
          json = JSON.parse(rawText);
        } catch {
          return new Response(
            JSON.stringify({
              encontrado: false,
              error: 'Respuesta de DNP no es formato JSON válido',
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        const rawNombre = (json?.nombre || json?.Nombre || json?.nombreCompleto || '').trim();
        if (!rawNombre) {
          return new Response(
            JSON.stringify({
              encontrado: false,
              raw: json,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        const parts = rawNombre.split(/\s+/).filter(Boolean);
        let nombres = '';
        let apellidos = '';

        if (parts.length === 1) {
          nombres = parts[0];
        } else if (parts.length === 2) {
          nombres = parts[0];
          apellidos = parts[1];
        } else if (parts.length === 3) {
          nombres = parts[0];
          apellidos = `${parts[1]} ${parts[2]}`;
        } else {
          nombres = parts.slice(0, parts.length - 2).join(' ');
          apellidos = parts.slice(parts.length - 2).join(' ');
        }

        const toTitleCase = (str) =>
          str
            .toLowerCase()
            .split(' ')
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
            .join(' ');

        return new Response(
          JSON.stringify({
            encontrado: true,
            nombres: toTitleCase(nombres),
            apellidos: toTitleCase(apellidos),
            edad: json?.edad ? Number(json.edad) : null,
            nombre_completo: rawNombre,
            departamento: json?.departamento || json?.Departamento || null,
            municipio: json?.municipio || json?.Municipio || null,
            raw: json,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({
            encontrado: false,
            error: err?.message || 'Error en proxy de consulta',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Servir assets estáticos (Single Page Application fallback)
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Padron Electoral - Static Worker', { status: 200 });
  },
};
