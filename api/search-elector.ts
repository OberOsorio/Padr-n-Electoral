import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM0ODA1MSwiZXhwIjoyMTA1OTI0MDUxfQ.Z4bqbeoCOZPoBRtw1uFENwXuLPHO5lU89MOQqYnBL1Y';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Manejo de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { cedula, documento, tenantId } = req.body || {};
    const docLimpio = String(cedula || documento || '').replace(/\D/g, '').trim();

    if (!docLimpio || docLimpio.length < 5) {
      return res.status(400).json({ ok: false, error: 'Número de documento inválido o muy corto' });
    }

    // En Vercel las variables se leen directamente desde process.env
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        ok: false,
        error: 'Variables de entorno de Supabase no configuradas en Vercel',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. Validar duplicado en la campaña activa si se proporciona tenantId
    if (tenantId) {
      const { data: existente } = await supabase
        .from('electores')
        .select('id, nombres, apellidos, puesto_votacion')
        .eq('tenant_id', tenantId)
        .eq('cedula', docLimpio)
        .maybeSingle();

      if (existente) {
        return res.status(200).json({
          ok: true,
          duplicado: true,
          encontrado: false,
          mensaje: `Este documento ya está registrado en esta campaña (${existente.nombres} ${existente.apellidos}).`,
          data: {
            nombres: existente.nombres,
            apellidos: existente.apellidos,
            puesto_votacion: existente.puesto_votacion || 'Principal',
          },
        });
      }
    }

    // 2. Consulta en censo_electoral
    const { data: persona, error: censoErr } = await supabase
      .from('censo_electoral')
      .select('nombres, apellidos, edad, anio_nacimiento, puesto_votacion, mesa, municipio, departamento')
      .eq('cedula', docLimpio)
      .maybeSingle();

    if (censoErr) {
      console.warn('[Vercel Censo Warning]:', censoErr.message);
    }

    if (persona) {
      let edadFinal = persona.edad ? String(persona.edad) : '';
      if (!edadFinal && persona.anio_nacimiento) {
        const anio = parseInt(String(persona.anio_nacimiento), 10);
        if (!isNaN(anio) && anio > 1900) {
          edadFinal = String(new Date().getFullYear() - anio);
        }
      }

      const dataObj = {
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        edad: edadFinal,
        puesto_votacion: persona.puesto_votacion || '',
        mesa: persona.mesa ? String(persona.mesa) : '',
        municipio: persona.municipio || '',
        departamento: persona.departamento || '',
      };

      return res.status(200).json({
        ok: true,
        duplicado: false,
        encontrado: true,
        ...dataObj,
        data: dataObj,
      });
    }

    // 3. Fallback secundario: censo_maestro
    const { data: maestro } = await supabase
      .from('censo_maestro')
      .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
      .eq('cedula', docLimpio)
      .maybeSingle();

    if (maestro) {
      const dataObj = {
        nombres: maestro.nombres || '',
        apellidos: maestro.apellidos || '',
        edad: maestro.edad ? String(maestro.edad) : '',
        puesto_votacion: maestro.puesto_sugerido || '',
        mesa: maestro.mesa_sugerida ? String(maestro.mesa_sugerida) : '',
        municipio: maestro.municipio || '',
        departamento: maestro.departamento || '',
      };

      return res.status(200).json({
        ok: true,
        duplicado: false,
        encontrado: true,
        ...dataObj,
        data: dataObj,
      });
    }

    // 4. Disponible sin registro previo en censo
    return res.status(200).json({
      ok: true,
      duplicado: false,
      encontrado: false,
      data: null,
    });
  } catch (err: any) {
    console.error('[Vercel API Error]:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error interno del servidor' });
  }
}
