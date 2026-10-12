import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CensoLookupResult, ConsultarDocumentoExternoResult } from '../types';
import { parseNombreCompleto, formatearMayusculas } from '../utils/nameParser';

import { parseConsultaDinamica } from '../utils/electorResponseParser';

// Banco en memoria dinámico (inicialmente vacío, sin datos personales en código fuente)
export const LOCAL_DEMO_CENSO: Record<string, { nombres: string; apellidos: string; edad?: number; puesto_sugerido?: string; mesa_sugerida?: number }> = {};

export function toTitleCase(str?: string | null): string {
  if (!str) return '';
  return formatearMayusculas(str);
}

import { calcularEdadUniversal } from '../utils/calculateAge';
export { calcularEdadUniversal };

/**
 * Función robusta para calcular o extraer la edad en años a partir de datos del censo.
 * Utiliza el cálculo universal compatible con cualquier formato (número, año, fecha latina, ISO o Date).
 */
export function calcularEdadDesdeCenso(valorEdadOFecNac: any): number | '' {
  const edad = calcularEdadUniversal(valorEdadOFecNac);
  return edad !== null ? edad : '';
}

/**
 * Estimación contextual de edad según rangos históricos de la Registraduría Nacional de Colombia
 * Útil para autocompletar electores del censo que no posean fecha de nacimiento explícita en BD
 */
export function estimarEdadPorCedula(_cedula: string): '' {
  // No se calcula edad matemática a partir del número de cédula.
  // La edad debe provenir únicamente de registros oficiales y reales (DNP / Censo).
  return '';
}

/**
 * Consulta el servicio de censo local e indexado en Supabase a censo_maestro (< 40ms)
 */
export async function consultarDocumentoExterno(
  cedula: string,
  _tipoDoc: string = '3'
): Promise<ConsultarDocumentoExternoResult> {
  const cleanCedula = cedula.trim().replace(/\D/g, '');
  if (cleanCedula.length < 5) {
    return { encontrado: false };
  }

  // 1. CONSULTA PRIORITARIA DIRECTA AL SERVICIO DNP (https://ventanillasocial.dnp.gov.co/)
  try {
    const res = await fetch('/api/dnp-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula: cleanCedula, tipoDoc: _tipoDoc }),
    });

    if (res.ok) {
      const dnpData = await res.json();
      if (dnpData && dnpData.encontrado) {
        const elector = parseConsultaDinamica({
          ok: true,
          nombres: dnpData.nombres,
          apellidos: dnpData.apellidos,
          edad: dnpData.edad,
          municipio: dnpData.municipio,
          departamento: dnpData.departamento,
          ...(dnpData.raw || {}),
        });

        if (elector) {
          const edadFinal = elector.edad ? Number(elector.edad) : null;

          return {
            encontrado: true,
            nombres: elector.nombres,
            apellidos: elector.apellidos,
            edad: edadFinal,
            municipio: elector.municipio || dnpData.municipio || null,
            departamento: elector.departamento || dnpData.departamento || null,
            puesto_sugerido: null,
            mesa_sugerida: null,
            raw_response: dnpData,
          };
        }
      }
    }
  } catch (dnpErr) {
    console.warn('Aviso en consulta Ventanilla Social DNP:', dnpErr);
  }

  // 2. Consulta de respaldo en Supabase a censo_maestro (solo lectura, sin guardar nada)
  if (isSupabaseConfigured) {
    try {
      const { data: row, error } = await (supabase.from('censo_maestro') as any)
        .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
        .eq('cedula', cleanCedula)
        .maybeSingle();

      if (!error && row) {
        const parsed = parseConsultaDinamica(row);
        if (parsed) {
          const edadFinal = parsed.edad ? Number(parsed.edad) : null;

          return {
            encontrado: true,
            nombres: parsed.nombres,
            apellidos: parsed.apellidos,
            edad: edadFinal,
            puesto_sugerido: row.puesto_sugerido || null,
            mesa_sugerida: row.mesa_sugerida ? Number(row.mesa_sugerida) : null,
            municipio: parsed.municipio || row.municipio || null,
            departamento: parsed.departamento || row.departamento || null,
            raw_response: row,
          };
        }
      }
    } catch (err: any) {
      // ignore
    }
  }

  return { encontrado: false };
}

/**
 * Consulta un ciudadano en el sistema de censo:
 * 1. Prioridad: Consulta instantánea a censo_maestro y banco demo local (<40ms)
 * 2. Fallbacks a RPCs y fallbacks relacionales
 */
export async function buscarCiudadanoEnCenso(cedula: string): Promise<CensoLookupResult> {
  const cleanCedula = cedula.trim().replace(/\D/g, '');

  if (cleanCedula.length < 5) {
    return { found: false };
  }

  // 1. CONSULTA DIRECTA (Censo Maestro / Demo Local)
  try {
    const ext = await consultarDocumentoExterno(cleanCedula);
    if (ext && ext.encontrado && ext.nombres) {
      let edadFinal = ext.edad !== null && ext.edad !== undefined && !isNaN(Number(ext.edad)) ? Number(ext.edad) : null;

      let puestoSugerido: string | null = ext.puesto_sugerido || null;
      let mesaSugerida: number | null = ext.mesa_sugerida || null;

      if (!puestoSugerido && isSupabaseConfigured) {
        try {
          const { data: electoralData } = await (supabase.from('censo_maestro') as any)
            .select('puesto_sugerido, mesa_sugerida, edad')
            .eq('cedula', cleanCedula)
            .maybeSingle();

          if (electoralData) {
            puestoSugerido = electoralData.puesto_sugerido || null;
            mesaSugerida = electoralData.mesa_sugerida ? Number(electoralData.mesa_sugerida) : null;
            if (!edadFinal && electoralData.edad) {
              const edadMaestro = calcularEdadDesdeCenso(electoralData.edad);
              if (edadMaestro !== '') edadFinal = Number(edadMaestro);
            }
          }
        } catch {
          // Ignorar error al buscar puesto complementario
        }
      }

      return {
        found: true,
        nombres: ext.nombres,
        apellidos: ext.apellidos ?? null,
        edad: edadFinal,
        puesto_sugerido: puestoSugerido,
        mesa_sugerida: mesaSugerida,
        municipio: ext.municipio ?? null,
        departamento: ext.departamento ?? null,
      };
    }
  } catch (err) {
    console.warn('Aviso en consulta en censo:', err);
  }

  // 2. FALLBACK A BASE DE DATOS SUPABASE (por si DNP no tiene el registro o no hay conexión externa)
  if (isSupabaseConfigured) {
    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('buscar_elector_por_cedula', {
        p_cedula: cleanCedula,
      });

      if (!rpcError && rpcData) {
        const record = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (record && (record.encontrado === true || record.found === true)) {
          const edadRaw =
            record.edad ??
            record.anios ??
            record.fecha_nacimiento ??
            record.nacimiento ??
            record.fec_nac ??
            record.fechaNacimiento;

          const edadCalculada = calcularEdadDesdeCenso(edadRaw);
          const edad = edadCalculada !== '' ? Number(edadCalculada) : null;

          const parsed = parseNombreCompleto(`${record.nombres} ${record.apellidos || ''}`);
          return {
            found: true,
            nombres: parsed.nombres,
            apellidos: parsed.apellidos,
            edad,
            puesto_sugerido: record.puesto || record.puesto_sugerido || null,
            mesa_sugerida: record.mesa || record.mesa_sugerida || null,
            municipio: record.municipio || record.municipio_votacion || null,
            departamento: record.departamento || null,
          };
        }
      }

      // Fallback secundario a RPC buscar_ciudadano_censo
      const { data: legacyData, error: legacyError } = await (supabase.rpc as any)('buscar_ciudadano_censo', {
        p_cedula: cleanCedula,
      });

      if (!legacyError && legacyData) {
        const record = Array.isArray(legacyData) ? legacyData[0] : legacyData;
        if (record && (record.found === true || record.encontrado === true)) {
          const edadRaw =
            record.edad ??
            record.anios ??
            record.fecha_nacimiento ??
            record.nacimiento ??
            record.fec_nac ??
            record.fechaNacimiento;

          const edadCalculada = calcularEdadDesdeCenso(edadRaw);
          const edad = edadCalculada !== '' ? Number(edadCalculada) : null;

          const parsed = parseNombreCompleto(`${record.nombres} ${record.apellidos || ''}`);
          return {
            found: true,
            nombres: parsed.nombres,
            apellidos: parsed.apellidos,
            edad,
            puesto_sugerido: record.puesto_sugerido || record.puesto || null,
            mesa_sugerida: record.mesa_sugerida || record.mesa || null,
            municipio: record.municipio || record.municipio_votacion || null,
            departamento: record.departamento || null,
          };
        }
      }

      // Fallback directo a la tabla censo_maestro
      const { data: tableData, error: tableError } = await (supabase.from('censo_maestro') as any)
        .select('*')
        .eq('cedula', cleanCedula)
        .maybeSingle();

      if (!tableError && tableData) {
        const edadRaw =
          tableData.edad ??
          (tableData as any).anios ??
          (tableData as any).fecha_nacimiento ??
          (tableData as any).nacimiento ??
          (tableData as any).fec_nac ??
          (tableData as any).fechaNacimiento;

        const edadCalculada = calcularEdadDesdeCenso(edadRaw);
        const edad = edadCalculada !== '' ? Number(edadCalculada) : null;

        const parsed = parseNombreCompleto(`${tableData.nombres} ${tableData.apellidos || ''}`);
        return {
          found: true,
          nombres: parsed.nombres,
          apellidos: parsed.apellidos,
          edad,
          puesto_sugerido: tableData.puesto_sugerido ?? null,
          mesa_sugerida: tableData.mesa_sugerida ?? null,
          municipio: (tableData as any).municipio || (tableData as any).municipio_votacion || null,
          departamento: (tableData as any).departamento || null,
        };
      }
    } catch (err) {
      console.warn('Aviso en consulta de censo Supabase:', err);
    }
  }

  // 3. FALLBACK LOCAL DEMO
  let localCenso = LOCAL_DEMO_CENSO;
  const stored = localStorage.getItem('electoral_local_censo');
  if (stored) {
    try {
      localCenso = { ...LOCAL_DEMO_CENSO, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Error al leer censo local:', e);
    }
  }

  const hit = localCenso[cleanCedula];
  if (hit) {
    return {
      found: true,
      nombres: hit.nombres,
      apellidos: hit.apellidos,
      edad: hit.edad ?? null,
      puesto_sugerido: hit.puesto_sugerido ?? null,
      mesa_sugerida: hit.mesa_sugerida ?? null,
    };
  }

  return { found: false };
}

/**
 * Alias explícito para la función RPC buscar_elector_por_cedula
 */
export const buscarElectorPorCedula = buscarCiudadanoEnCenso;

/**
 * Consulta un documento en el censo con formato extendido (nombres, apellidos, nombre_completo, edad, fecha_nacimiento)
 */
export async function consultarPorCedula(cedula: string): Promise<{
  encontrado: boolean;
  found: boolean;
  nombres?: string | null;
  apellidos?: string | null;
  nombre_completo?: string | null;
  edad?: number | null;
  fecha_nacimiento?: string | null;
  puesto_votacion?: string | null;
  puesto_sugerido?: string | null;
  mesa?: number | null;
  mesa_sugerida?: number | null;
  raw_response?: any;
}> {
  const cleanCedula = (cedula || '').toString().trim().replace(/\D/g, '');
  const res = await buscarCiudadanoEnCenso(cleanCedula);
  const fullName = `${res.nombres || ''} ${res.apellidos || ''}`.trim();
  return {
    encontrado: res.found,
    found: res.found,
    nombres: res.nombres,
    apellidos: res.apellidos,
    nombre_completo: fullName || null,
    edad: res.edad,
    fecha_nacimiento: (res as any).fecha_nacimiento || null,
    puesto_votacion: res.puesto_sugerido,
    puesto_sugerido: res.puesto_sugerido,
    mesa: res.mesa_sugerida,
    mesa_sugerida: res.mesa_sugerida,
    raw_response: (res as any).raw_response,
  };
}

export const censoService = {
  consultarPorCedula,
  buscarCiudadanoEnCenso,
  consultarDocumentoExterno,
  toTitleCase,
  calcularEdadDesdeCenso,
  estimarEdadPorCedula,
};

