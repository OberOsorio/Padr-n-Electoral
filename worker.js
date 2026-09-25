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

        function formatCase(str) {
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

        function extractApellido(tokens) {
          if (tokens.length === 0) return '';
          let part = tokens.pop();
          const len = tokens.length;
          if (len >= 2) {
            const p1 = tokens[len - 2].toLowerCase();
            const p2 = tokens[len - 1].toLowerCase();
            if (p1 === 'de' && (p2 === 'la' || p2 === 'los' || p2 === 'las')) {
              const art = tokens.pop();
              const prep = tokens.pop();
              return prep + ' ' + art + ' ' + part;
            }
          }
          if (tokens.length >= 1) {
            const p = tokens[tokens.length - 1].toLowerCase();
            if (['de', 'del', 'san', 'santa'].includes(p)) {
              const prep = tokens.pop();
              return prep + ' ' + part;
            }
          }
          return part;
        }

        function parseNombreCompleto(fullName) {
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
            const regexPrefijo = new RegExp('^([a-záéíóúñA-ZÁÉÍÓÚÑ]+)\\s+(' + compuesto + ')(?:\\s+|$)', 'i');
            const matchPrefijo = textoLimpio.match(regexPrefijo);
            if (matchPrefijo) {
              const nombresExtraidos = matchPrefijo[1] + ' ' + matchPrefijo[2];
              const apellidosRestantes = textoLimpio.substring(nombresExtraidos.length).trim();
              return {
                nombres: formatCase(nombresExtraidos),
                apellidos: formatCase(apellidosRestantes)
              };
            }

            const regexDirecto = new RegExp('^(' + compuesto + ')(?:\\s+|$)', 'i');
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
            apellidos: formatCase(primerApellido + ' ' + segundoApellido)
          };
        }

        const { nombres, apellidos } = parseNombreCompleto(rawNombre);

        return new Response(
          JSON.stringify({
            encontrado: true,
            nombres,
            apellidos,
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
