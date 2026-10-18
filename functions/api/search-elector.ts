import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const DEFAULT_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM0ODA1MSwiZXhwIjoyMTA1OTI0MDUxfQ.Z4bqbeoCOZPoBRtw1uFENwXuLPHO5lU89MOQqYnBL1Y';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const { cedula, documento, tenantId } = await request.json().catch(() => ({}));
    const doc = String(cedula || documento || '').replace(/\D/g, '').trim();

    if (!doc || doc.length < 5) {
      return new Response(JSON.stringify({ ok: false, error: 'Documento inválido' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // 1. Obtención segura de variables en Cloudflare Pages / Workers
    const supabaseUrl = env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey =
      env?.SUPABASE_SERVICE_ROLE_KEY ||
      env?.SUPABASE_ANON_KEY ||
      env?.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Cloudflare Error]: Variables de Supabase no configuradas en Cloudflare Environment Variables.');
      return new Response(JSON.stringify({ ok: false, error: 'Configuración de servidor incompleta.' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 2. Verificar duplicado en la campaña (si se proporciona tenantId)
    if (tenantId) {
      const { data: existente } = await supabase
        .from('electores')
        .select('id, nombres, apellidos, puesto_votacion')
        .eq('tenant_id', tenantId)
        .eq('cedula', doc)
        .maybeSingle();

      if (existente) {
        return new Response(
          JSON.stringify({
            ok: true,
            duplicado: true,
            mensaje: `Este documento ya está registrado en esta campaña (${existente.nombres} ${existente.apellidos}).`,
            data: {
              nombres: existente.nombres,
              apellidos: existente.apellidos,
              puesto_votacion: existente.puesto_votacion || '',
            },
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }
    }

    // 3. Buscar datos reales de la persona en censo_electoral
    const { data: persona, error: censoErr } = await supabase
      .from('censo_electoral')
      .select('nombres, apellidos, edad, anio_nacimiento, puesto_votacion, mesa, municipio, departamento')
      .eq('cedula', doc)
      .maybeSingle();

    if (censoErr) {
      console.warn('[Censo Electoral Warning]:', censoErr.message);
    }

    if (persona) {
      let edadFinal = persona.edad ? String(persona.edad) : '';
      if (!edadFinal && persona.anio_nacimiento) {
        const anio = parseInt(String(persona.anio_nacimiento), 10);
        if (!isNaN(anio) && anio > 1900) {
          edadFinal = String(new Date().getFullYear() - anio);
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          duplicado: false,
          encontrado: true,
          data: {
            nombres: persona.nombres || '',
            apellidos: persona.apellidos || '',
            edad: edadFinal,
            puesto_votacion: persona.puesto_votacion || '',
            mesa: persona.mesa ? String(persona.mesa) : '',
            municipio: persona.municipio || '',
            departamento: persona.departamento || '',
          },
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Fallback secundario: censo_maestro
    const { data: maestro } = await supabase
      .from('censo_maestro')
      .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
      .eq('cedula', doc)
      .maybeSingle();

    if (maestro) {
      return new Response(
        JSON.stringify({
          ok: true,
          duplicado: false,
          encontrado: true,
          data: {
            nombres: maestro.nombres || '',
            apellidos: maestro.apellidos || '',
            edad: maestro.edad ? String(maestro.edad) : '',
            puesto_votacion: maestro.puesto_sugerido || '',
            mesa: maestro.mesa_sugerida ? String(maestro.mesa_sugerida) : '',
            municipio: maestro.municipio || '',
            departamento: maestro.departamento || '',
          },
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Disponible pero sin datos previos en base
    return new Response(
      JSON.stringify({
        ok: true,
        duplicado: false,
        encontrado: false,
        data: null,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[Error de consulta Cloudflare]:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
