import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { fetchDnpCitizen } from './dnp-lookup.js';

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

    console.log(`[Lookup] Cédula solicitada: ${docLimpio}${tenantId ? ` (tenant: ${tenantId})` : ''}`);

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
        console.log(`[Lookup] Duplicado detectado en campaña ${tenantId}: ${existente.nombres} ${existente.apellidos}`);
        const dupData = {
          nombres: existente.nombres,
          apellidos: existente.apellidos,
          puesto_votacion: existente.puesto_votacion || 'Principal',
        };
        return res.status(200).json({
          ok: true,
          origen: 'campana_activa',
          duplicado: true,
          encontrado: false,
          mensaje: `Este documento ya está registrado en la campaña actual (${existente.nombres} ${existente.apellidos}).`,
          data: dupData,
          ...dupData,
        });
      }
    }

    // 2. Consulta en censo_electoral local
    const { data: censoData, error: censoErr } = await supabase
      .from('censo_electoral')
      .select('nombres, apellidos, edad, anio_nacimiento, puesto_votacion, mesa, municipio, departamento')
      .eq('cedula', docLimpio)
      .maybeSingle();

    if (censoErr) {
      console.warn('[QA-Warn Supabase censo_electoral]:', censoErr.message);
    }

    if (censoData) {
      console.log(`[Lookup] Encontrado en censo_electoral local: ${censoData.nombres} ${censoData.apellidos}`);
      let edadCalculada = censoData.edad ? String(censoData.edad) : '';
      if (!edadCalculada && censoData.anio_nacimiento) {
        const anio = parseInt(String(censoData.anio_nacimiento), 10);
        if (!isNaN(anio) && anio > 1900) {
          edadCalculada = String(new Date().getFullYear() - anio);
        }
      }

      const dataObj = {
        nombres: censoData.nombres || '',
        apellidos: censoData.apellidos || '',
        edad: edadCalculada,
        puesto_votacion: censoData.puesto_votacion || '',
        mesa: censoData.mesa ? String(censoData.mesa) : '',
        municipio: censoData.municipio || '',
        departamento: censoData.departamento || '',
      };

      return res.status(200).json({
        ok: true,
        origen: 'base_de_datos_local',
        duplicado: false,
        encontrado: true,
        data: dataObj,
        ...dataObj,
      });
    }

    // 3. Fallback en censo_maestro
    const { data: maestroData, error: maestroErr } = await supabase
      .from('censo_maestro')
      .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
      .eq('cedula', docLimpio)
      .maybeSingle();

    if (maestroErr) {
      console.warn('[QA-Warn Supabase censo_maestro]:', maestroErr.message);
    }

    if (maestroData) {
      console.log(`[Lookup] Encontrado en censo_maestro: ${maestroData.nombres} ${maestroData.apellidos}`);
      const dataObj = {
        nombres: maestroData.nombres || '',
        apellidos: maestroData.apellidos || '',
        edad: maestroData.edad ? String(maestroData.edad) : '',
        puesto_votacion: maestroData.puesto_sugerido || '',
        mesa: maestroData.mesa_sugerida ? String(maestroData.mesa_sugerida) : '',
        municipio: maestroData.municipio || '',
        departamento: maestroData.departamento || '',
      };

      return res.status(200).json({
        ok: true,
        origen: 'censo_maestro',
        duplicado: false,
        encontrado: true,
        data: dataObj,
        ...dataObj,
      });
    }

    // 4. Fallback externo en vivo (Ventanilla Social DNP)
    console.log(`[Lookup] Intentando consulta externa DNP para cédula: ${docLimpio}...`);
    try {
      const dnpResult = await fetchDnpCitizen(docLimpio, '3', 2500);
      if (dnpResult && dnpResult.encontrado && dnpResult.nombres) {
        console.log(`[Lookup] Encontrado en servicio externo DNP: ${dnpResult.nombres} ${dnpResult.apellidos}`);

        // Auto-persistir en censo_electoral de Supabase para futuras consultas instantáneas
        try {
          await supabase
            .from('censo_electoral')
            .upsert({
              cedula: docLimpio,
              nombres: dnpResult.nombres,
              apellidos: dnpResult.apellidos || '',
              edad: dnpResult.edad ? parseInt(String(dnpResult.edad), 10) : null,
              municipio: dnpResult.municipio || '',
              departamento: dnpResult.departamento || '',
            });
          console.log(`[Lookup] Auto-guardado en censo_electoral para cédula: ${docLimpio}`);
        } catch (saveErr: any) {
          console.warn('[Lookup Warn] Error al auto-guardar en censo_electoral:', saveErr?.message || saveErr);
        }

        const dataObj = {
          nombres: dnpResult.nombres,
          apellidos: dnpResult.apellidos || '',
          edad: dnpResult.edad !== undefined && dnpResult.edad !== null ? String(dnpResult.edad) : '',
          puesto_votacion: '',
          mesa: '',
          municipio: dnpResult.municipio || '',
          departamento: dnpResult.departamento || '',
        };

        return res.status(200).json({
          ok: true,
          origen: 'servicio_externo',
          duplicado: false,
          encontrado: true,
          data: dataObj,
          ...dataObj,
        });
      } else {
        console.log(`[Lookup] Servicio externo DNP no arrojó resultados para cédula: ${docLimpio}${dnpResult?.error ? ` (${dnpResult.error})` : ''}`);
      }
    } catch (errExterno: any) {
      console.error('[Lookup Error Externo DNP]:', errExterno?.message || errExterno);
    }

    // 5. No encontrado en ninguna fuente
    console.log(`[Lookup] No encontrado en base local ni servicio externo para cédula: ${docLimpio}`);
    return res.status(200).json({
      ok: true,
      origen: 'no_registrado',
      duplicado: false,
      encontrado: false,
      mensaje: 'Documento no registrado en la base de datos.',
      data: null,
    });
  } catch (err: any) {
    console.error('[QA-Exception Vercel]:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error interno al procesar la consulta en Vercel.',
    });
  }
}
