/**
 * Cloudflare Worker router for Padron Electoral
 * Universal high-speed API router and static asset server for Cloudflare Workers
 * Handles /api/search-elector, /api/dnp-lookup, /api/consulta-identidad, /api/admin/reset-password
 * and delegates all web UI routes to env.ASSETS.
 */

const DEFAULT_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDgwNTEsImV4cCI6MjEwNTkyNDA1MX0.gUwS5uerHQq9OEq82wYwQdx81lYnh8-Ez9lK0GSwe1o';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM0ODA1MSwiZXhwIjoyMTA1OTI0MDUxfQ.Z4bqbeoCOZPoBRtw1uFENwXuLPHO5lU89MOQqYnBL1Y';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

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

function calcularDiferenciaAnios(fechaNacimiento) {
  const hoy = new Date();
  if (fechaNacimiento > hoy || fechaNacimiento.getFullYear() < 1900) {
    return null;
  }
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNac = fechaNacimiento.getMonth();
  if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad >= 0 && edad <= 125 ? edad : null;
}

function calcularEdadUniversal(input) {
  if (input === null || input === undefined || input === '') {
    return null;
  }
  const anioActual = new Date().getFullYear();

  // Caso 1: Número directo
  if (typeof input === 'number') {
    if (input > 0 && input < 125) {
      return Math.floor(input);
    }
    if (input >= 1900 && input <= anioActual) {
      return anioActual - Math.floor(input);
    }
    return null;
  }

  // Caso 2: Cadena de texto
  if (typeof input === 'string') {
    const str = input.trim();
    if (!str) return null;

    // A. Edad en texto (ej. "28")
    const numDirecto = Number(str);
    if (!isNaN(numDirecto) && /^\d{1,3}$/.test(str)) {
      if (numDirecto > 0 && numDirecto < 125) {
        return Math.floor(numDirecto);
      }
    }

    // B. Año de 4 dígitos (ej. "1998")
    if (/^\d{4}$/.test(str)) {
      const anio = parseInt(str, 10);
      if (anio >= 1900 && anio <= anioActual) {
        return anioActual - anio;
      }
      return null;
    }

    // C. Formato latino DD/MM/YYYY o DD-MM-YYYY
    const matchLatino = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (matchLatino) {
      const dia = parseInt(matchLatino[1], 10);
      const mes = parseInt(matchLatino[2], 10) - 1;
      const anio = parseInt(matchLatino[3], 10);
      return calcularDiferenciaAnios(new Date(anio, mes, dia));
    }

    // D. Formato ISO YYYY-MM-DD o YYYY/MM/DD
    const matchIso = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (matchIso) {
      const anio = parseInt(matchIso[1], 10);
      const mes = parseInt(matchIso[2], 10) - 1;
      const dia = parseInt(matchIso[3], 10);
      return calcularDiferenciaAnios(new Date(anio, mes, dia));
    }

    // E. Intento con parser nativo
    const fechaParsed = new Date(str);
    if (!isNaN(fechaParsed.getTime()) && fechaParsed.getFullYear() >= 1900) {
      return calcularDiferenciaAnios(fechaParsed);
    }
  }

  // Caso 3: Date
  if (input instanceof Date && !isNaN(input.getTime())) {
    return calcularDiferenciaAnios(input);
  }

  return null;
}

function extractCookies(res) {
  const cookies = [];
  if (typeof res.headers.getSetCookie === 'function') {
    const list = res.headers.getSetCookie();
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

let isolateSession = null;
const CACHE_KEY_URL = 'https://ventanillasocial-session.cache/active';

async function getDnpSession(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && isolateSession && now - isolateSession.timestamp < 10 * 60 * 1000) {
    return isolateSession;
  }

  // Intentar leer de Cache API si no es forzado
  if (!forceRefresh) {
    try {
      const cache = caches?.default;
      if (cache) {
        const match = await cache.match(new Request(CACHE_KEY_URL, { method: 'GET' }));
        if (match) {
          const cached = await match.json();
          if (cached && cached.nonce && cached.cookie) {
            isolateSession = { ...cached, timestamp: now };
            return isolateSession;
          }
        }
      }
    } catch {
      // Ignorar fallback de cache
    }
  }

  // Obtener sesión fresca de Ventanilla Social DNP
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

    const fresh = {
      nonce,
      cookie: cookies.join('; '),
      timestamp: Date.now(),
    };

    isolateSession = fresh;

    try {
      const cache = caches?.default;
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
      // Ignorar errores de cache
    }

    return fresh;
  } catch (err) {
    console.error('Error al conectar con Ventanilla Social DNP:', err);
    return null;
  }
}

async function queryDnpEndpoint(url, payload, session, timeoutMs = 2200) {
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

async function handleSearchElector(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cedula, documento, tenantId, tipoDoc } = body || {};
    const docLimpio = String(cedula || documento || '').replace(/\D/g, '').trim();
    const tipDoc = String(tipoDoc || '3').trim();

    if (!docLimpio || docLimpio.length < 5) {
      return new Response(JSON.stringify({ ok: false, error: 'Documento no válido (mínimo 5 dígitos)' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl =
      env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey =
      env?.SUPABASE_SERVICE_ROLE_KEY ||
      env?.SUPABASE_ANON_KEY ||
      env?.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_ANON_KEY;

    // 1. Anti-colisión en campaña activa (Supabase - electores)
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
          const existentes = await dupRes.json().catch(() => []);
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

    // 2. Consulta de censo_maestro en Supabase
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
        const censoRows = await censoRes.json().catch(() => []);
        if (censoRows && censoRows.length > 0) {
          const row = censoRows[0];
          const edadFinal = row.edad ? String(row.edad) : '';
          const nombresFormatted = formatCase(row.nombres || '');
          const apellidosFormatted = formatCase(row.apellidos || '');

          return new Response(
            JSON.stringify({
              ok: true,
              encontrado: true,
              nombres: nombresFormatted,
              apellidos: apellidosFormatted,
              edad: edadFinal,
              municipio: row.municipio || '',
              departamento: row.departamento || '',
              puesto_votacion: row.puesto_sugerido || '',
              mesa: row.mesa_sugerida ? String(row.mesa_sugerida) : '',
              data: {
                nombres: nombresFormatted,
                apellidos: apellidosFormatted,
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

    // 3. Consulta vía Colombia Gateway Bridge (Bypass ultra-rápido de geobloqueo/WAF DNP)
    const gatewayUrl =
      env?.COLOMBIA_GATEWAY_URL ||
      'https://cut-tracked-thereafter-fundamentals.trycloudflare.com';

    if (gatewayUrl) {
      try {
        const bridgeCtrl = new AbortController();
        const bridgeTimer = setTimeout(() => bridgeCtrl.abort(), 3500);
        const bridgeRes = await fetch(`${gatewayUrl.replace(/\/$/, '')}/api/search-elector`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cedula: docLimpio,
            documento: docLimpio,
            tipoDoc: tipDoc,
            tenantId: tenantId || null,
          }),
          signal: bridgeCtrl.signal,
        });
        clearTimeout(bridgeTimer);

        if (bridgeRes.ok) {
          const bridgeData = await bridgeRes.json().catch(() => null);
          if (bridgeData && (bridgeData.encontrado || bridgeData.ok) && (bridgeData.nombres || bridgeData.data?.nombres)) {
            const raw = bridgeData.data || bridgeData;
            const nombres = raw.nombres || bridgeData.nombres;
            const apellidos = raw.apellidos || bridgeData.apellidos;
            const rawEdad = raw.edad ?? bridgeData.edad;
            const edadCalculada = calcularEdadUniversal(rawEdad);
            const edadFinal = edadCalculada !== null ? String(edadCalculada) : '';

            return new Response(
              JSON.stringify({
                ok: true,
                encontrado: true,
                nombres,
                apellidos,
                edad: edadFinal,
                municipio: raw.municipio || '',
                departamento: raw.departamento || '',
                puesto_votacion: raw.puesto_votacion || '',
                mesa: raw.mesa || '',
                data: {
                  nombres,
                  apellidos,
                  edad: edadFinal,
                  municipio: raw.municipio || '',
                  departamento: raw.departamento || '',
                  puesto_votacion: raw.puesto_votacion || '',
                  mesa: raw.mesa || '',
                },
                raw: bridgeData.raw || bridgeData,
              }),
              { status: 200, headers: corsHeaders }
            );
          }
        }
      } catch (bridgeErr) {
        console.warn('Aviso: Gateway bridge en Colombia no respondió:', bridgeErr?.message);
      }
    }

    // 4. Consulta directa a Ventanilla Social DNP oficial (con timeout estricto de 2.2s)
    let session = await getDnpSession();
    if (!session || !session.nonce) {
      session = await getDnpSession(true);
    }

    if (session && session.nonce) {
      const payloadCC = `pNumDoc=${encodeURIComponent(docLimpio)}&pTipDoc=${encodeURIComponent(tipDoc)}`;

      let [rui, sisben] = await Promise.all([
        queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
        queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
      ]);

      // Si la sesión expiró (401, 403), reintentar una vez con sesión fresca
      if (rui.status === 401 || rui.status === 403 || sisben.status === 401 || sisben.status === 403) {
        const refreshed = await getDnpSession(true);
        if (refreshed && refreshed.nonce) {
          session = refreshed;
          [rui, sisben] = await Promise.all([
            queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadCC, session),
            queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadCC, session),
          ]);
        }
      }

      // Evaluar respuesta de RUI
      if (rui.data && rui.data.ok && rui.data.nombre) {
        const { nombres, apellidos } = parseNombreCompleto(rui.data.nombre);
        const rawEdad =
          rui.data.edad ??
          rui.data.anios ??
          rui.data.edadCalculada ??
          rui.data.fechaNacimiento ??
          rui.data.fecNac ??
          null;
        const edadCalculada = calcularEdadUniversal(rawEdad);
        const edadFinal = edadCalculada !== null ? String(edadCalculada) : '';

        return new Response(
          JSON.stringify({
            ok: true,
            encontrado: true,
            nombres,
            apellidos,
            edad: edadFinal,
            municipio: rui.data.municipio || '',
            departamento: rui.data.departamento || '',
            puesto_votacion: '',
            mesa: '',
            data: {
              nombres,
              apellidos,
              edad: edadFinal,
              municipio: rui.data.municipio || '',
              departamento: rui.data.departamento || '',
              puesto_votacion: '',
              mesa: '',
            },
            raw: rui.data,
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Evaluar respuesta de Sisbén
      if (sisben.data && sisben.data.ok) {
        const rawNombre =
          sisben.data.nombre ||
          [
            sisben.data.primerNombre,
            sisben.data.segundoNombre,
            sisben.data.primerApellido,
            sisben.data.segundoApellido,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

        if (rawNombre) {
          const { nombres, apellidos } = parseNombreCompleto(rawNombre);
          const rawEdad =
            sisben.data.edad ??
            sisben.data.anios ??
            sisben.data.edadCalculada ??
            sisben.data.fechaNacimiento ??
            sisben.data.fecNac ??
            null;
          const edadCalculada = calcularEdadUniversal(rawEdad);
          const edadFinal = edadCalculada !== null ? String(edadCalculada) : '';

          return new Response(
            JSON.stringify({
              ok: true,
              encontrado: true,
              nombres,
              apellidos,
              edad: edadFinal,
              municipio: sisben.data.municipio || '',
              departamento: sisben.data.departamento || '',
              puesto_votacion: '',
              mesa: '',
              data: {
                nombres,
                apellidos,
                edad: edadFinal,
                municipio: sisben.data.municipio || '',
                departamento: sisben.data.departamento || '',
                puesto_votacion: '',
                mesa: '',
              },
              raw: sisben.data,
            }),
            { status: 200, headers: corsHeaders }
          );
        }
      }

      // Fallback a Tarjeta de Identidad (tipoDoc = 2) si tiene 11 dígitos o menos
      if (tipDoc === '3' && docLimpio.length <= 11) {
        const payloadTI = `pNumDoc=${encodeURIComponent(docLimpio)}&pTipDoc=2`;
        const [ruiTI, sisbenTI] = await Promise.all([
          queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI', payloadTI, session, 1800),
          queryDnpEndpoint('https://ventanillasocial.dnp.gov.co/Home/ConsultarGrupoSisben', payloadTI, session, 1800),
        ]);

        if (ruiTI.data && ruiTI.data.ok && ruiTI.data.nombre) {
          const { nombres, apellidos } = parseNombreCompleto(ruiTI.data.nombre);
          const rawEdad =
            ruiTI.data.edad ??
            ruiTI.data.anios ??
            ruiTI.data.edadCalculada ??
            ruiTI.data.fechaNacimiento ??
            ruiTI.data.fecNac ??
            null;
          const edadCalculada = calcularEdadUniversal(rawEdad);
          const edadFinal = edadCalculada !== null ? String(edadCalculada) : '';

          return new Response(
            JSON.stringify({
              ok: true,
              encontrado: true,
              nombres,
              apellidos,
              edad: edadFinal,
              municipio: ruiTI.data.municipio || '',
              departamento: ruiTI.data.departamento || '',
              puesto_votacion: '',
              mesa: '',
              data: {
                nombres,
                apellidos,
                edad: edadFinal,
                municipio: ruiTI.data.municipio || '',
                departamento: ruiTI.data.departamento || '',
                puesto_votacion: '',
                mesa: '',
              },
              raw: ruiTI.data,
            }),
            { status: 200, headers: corsHeaders }
          );
        }

        if (sisbenTI.data && sisbenTI.data.ok) {
          const rawNombreTI =
            sisbenTI.data.nombre ||
            [
              sisbenTI.data.primerNombre,
              sisbenTI.data.segundoNombre,
              sisbenTI.data.primerApellido,
              sisbenTI.data.segundoApellido,
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

          if (rawNombreTI) {
            const { nombres, apellidos } = parseNombreCompleto(rawNombreTI);
            const rawEdad =
              sisbenTI.data.edad ??
              sisbenTI.data.anios ??
              sisbenTI.data.edadCalculada ??
              sisbenTI.data.fechaNacimiento ??
              sisbenTI.data.fecNac ??
              null;
            const edadCalculada = calcularEdadUniversal(rawEdad);
            const edadFinal = edadCalculada !== null ? String(edadCalculada) : '';

            return new Response(
              JSON.stringify({
                ok: true,
                encontrado: true,
                nombres,
                apellidos,
                edad: edadFinal,
                municipio: sisbenTI.data.municipio || '',
                departamento: sisbenTI.data.departamento || '',
                puesto_votacion: '',
                mesa: '',
                data: {
                  nombres,
                  apellidos,
                  edad: edadFinal,
                  municipio: sisbenTI.data.municipio || '',
                  departamento: sisbenTI.data.departamento || '',
                  puesto_votacion: '',
                  mesa: '',
                },
                raw: sisbenTI.data,
              }),
              { status: 200, headers: corsHeaders }
            );
          }
        }
      }
    }

    // 4. No encontrado en ninguna fuente
    return new Response(
      JSON.stringify({
        ok: true,
        encontrado: false,
        data: null,
        mensaje: 'No se encontraron registros previos para este documento.',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || 'Error en consulta de identidad' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

async function handleResetPassword(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, newPassword, adminRequesterId, userEmail, userName } = body || {};

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos (userId, newPassword).' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      env?.SUPABASE_SERVICE_ROLE_KEY ||
      env?.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurado en el servidor.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Actualización de contraseña vía Auth Admin API
    const authAdminUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}`;
    const updateRes = await fetch(authAdminUrl, {
      method: 'PUT',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword,
        email_confirm: true,
      }),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error:
            errData.msg ||
            errData.message ||
            'Error al actualizar credencial en Supabase Auth.',
        }),
        { status: updateRes.status, headers: corsHeaders }
      );
    }

    // Auditoría
    try {
      await fetch(`${supabaseUrl}/rest/v1/security_audit_logs`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail || 'usuario@sistema.gov',
          user_name: userName || 'Usuario',
          event_type: 'PASSWORD_RESET_PROVISIONAL',
          severity: 'WARNING',
          action_detail: `Contraseña provisional asignada por el administrador ID: ${adminRequesterId || 'admin'}`,
        }),
      });
    } catch {
      // Ignorar fallas de log no crítico
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contraseña actualizada y habilitada para login.',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Error interno del servidor.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Manejo de CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 2. Rutas de consulta de identidad y elector
    if (
      url.pathname === '/api/search-elector' ||
      url.pathname === '/api/dnp-lookup' ||
      url.pathname === '/api/consulta-identidad'
    ) {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      return handleSearchElector(request, env);
    }

    // 3. Ruta de reseteo administrativo de contraseñas
    if (url.pathname === '/api/admin/reset-password') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }
      return handleResetPassword(request, env);
    }

    // 4. Servir assets estáticos (Single Page Application fallback en Cloudflare Workers)
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Padron Electoral - Static Worker', { status: 200 });
  },
};
