import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM0ODA1MSwiZXhwIjoyMTA1OTI0MDUxfQ.Z4bqbeoCOZPoBRtw1uFENwXuLPHO5lU89MOQqYnBL1Y';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido. Utilice POST.' });
  }

  try {
    const { cedula, documento, tenantId } = req.body || {};
    const docLimpio = String(cedula || documento || '').replace(/\D/g, '').trim();

    if (!docLimpio || docLimpio.length < 5) {
      return res.status(400).json({ ok: false, error: 'Número de documento inválido o menor a 5 dígitos.' });
    }

    // Resolver credenciales de Supabase
    let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    let supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl.includes('gwerezjurmxuwcqousqg')) {
      supabaseUrl = DEFAULT_SUPABASE_URL;
      supabaseKey = DEFAULT_SUPABASE_SERVICE_ROLE_KEY;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. Verificación de duplicados en la campaña activa si se proporciona tenantId
    if (tenantId) {
      const { data: existente, error: dupErr } = await supabase
        .from('electores')
        .select('id, nombres, apellidos, puesto_votacion')
        .eq('tenant_id', tenantId)
        .eq('cedula', docLimpio)
        .maybeSingle();

      if (dupErr) {
        console.warn('[QA-Warn Supabase electores]:', dupErr.message);
      }

      if (existente) {
        return res.status(200).json({
          ok: true,
          duplicado: true,
          encontrado: false,
          mensaje: `Este documento ya está registrado en la campaña actual (${existente.nombres} ${existente.apellidos}).`,
          data: {
            nombres: existente.nombres,
            apellidos: existente.apellidos,
            puesto_votacion: existente.puesto_votacion || 'Principal',
          },
        });
      }
    }

    // 2. Consulta en censo_electoral
    const { data: censoData, error: censoErr } = await supabase
      .from('censo_electoral')
      .select('nombres, apellidos, edad, anio_nacimiento, puesto_votacion, mesa, municipio, departamento')
      .eq('cedula', docLimpio)
      .maybeSingle();

    if (censoErr) {
      console.warn('[QA-Warn Supabase censo_electoral]:', censoErr.message);
    }

    // 3. Fallback en censo_maestro si censo_electoral no tiene el registro
    let resultadoFinal = censoData;
    if (!resultadoFinal) {
      const { data: maestroData, error: maestroErr } = await supabase
        .from('censo_maestro')
        .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
        .eq('cedula', docLimpio)
        .maybeSingle();

      if (maestroErr) {
        console.warn('[QA-Warn Supabase censo_maestro]:', maestroErr.message);
      }

      if (maestroData) {
        resultadoFinal = {
          nombres: maestroData.nombres,
          apellidos: maestroData.apellidos,
          edad: maestroData.edad,
          anio_nacimiento: null,
          puesto_votacion: maestroData.puesto_sugerido,
          mesa: maestroData.mesa_sugerida,
          municipio: maestroData.municipio,
          departamento: maestroData.departamento,
        };
      }
    }

    if (!resultadoFinal) {
      return res.status(200).json({
        ok: true,
        duplicado: false,
        encontrado: false,
        mensaje: 'Documento no registrado previamente. Diligenciamiento manual disponible.',
        data: null,
      });
    }

    // 4. Normalización estricta de la edad
    let edadCalculada = resultadoFinal.edad ? String(resultadoFinal.edad) : '';
    if (!edadCalculada && resultadoFinal.anio_nacimiento) {
      const anio = parseInt(String(resultadoFinal.anio_nacimiento), 10);
      if (!isNaN(anio) && anio > 1900) {
        edadCalculada = String(new Date().getFullYear() - anio);
      }
    }

    const dataObj = {
      nombres: resultadoFinal.nombres || '',
      apellidos: resultadoFinal.apellidos || '',
      edad: edadCalculada,
      puesto_votacion: resultadoFinal.puesto_votacion || '',
      mesa: resultadoFinal.mesa ? String(resultadoFinal.mesa) : '',
      municipio: resultadoFinal.municipio || '',
      departamento: resultadoFinal.departamento || '',
    };

    return res.status(200).json({
      ok: true,
      duplicado: false,
      encontrado: true,
      ...dataObj,
      data: dataObj,
    });
  } catch (err: any) {
    console.error('[QA-Exception Vercel]:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error interno al procesar la consulta en Vercel.',
    });
  }
}
