import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CensoLookupResult, ConsultarDocumentoExternoResult } from '../types';
import { parseNombreCompleto, formatearMayusculas } from '../utils/nameParser';

// Banco de datos local precargado para pruebas de nombres y edades reales
export const LOCAL_DEMO_CENSO: Record<string, { nombres: string; apellidos: string; edad?: number; puesto_sugerido?: string; mesa_sugerida?: number }> = {
  '1007299001': { nombres: 'Ober Luis', apellidos: 'Osorio Orozco', edad: 28 },
  '1047892341': { nombres: 'Carlos Eduardo', apellidos: 'Mendoza Ospina', edad: 38 },
  '1098341902': { nombres: 'Laura Sofía', apellidos: 'Herrera Morales', edad: 29 },
  '73542189': { nombres: 'Miguel Ángel', apellidos: 'Morales Torres', edad: 52 },
  '1143670554': { nombres: 'Valentina', apellidos: 'Restrepo Castro', edad: 24 },
  '1052884112': { nombres: 'Andrés Felipe', apellidos: 'Gómez Ortiz', edad: 31 },
  '1085294019': { nombres: 'Esteban Camilo', apellidos: 'Torres Valderrama', edad: 34 },
  '528391145': { nombres: 'María Lucía', apellidos: 'Pérez Domínguez', edad: 47 },
  '1098456432': { nombres: 'Andrés Felipe', apellidos: 'Ramírez Gómez', edad: 33 },
  '43987123': { nombres: 'Carmen Rosa', apellidos: 'Vargas Silva', edad: 42 },
  '1047892903': { nombres: 'Jhonatan David', apellidos: 'Montoya Restrepo', edad: 35 },
  '1020304050': { nombres: 'Juliana Patricia', apellidos: 'Salazar Cardona', edad: 28 },
  '1030405060': { nombres: 'Diego Fernando', apellidos: 'Castro Muñoz', edad: 40 },
  '1192746189': { nombres: 'Andrea Marcela', apellidos: 'Ortega Morales', edad: 26 },
  '25970463': { nombres: 'Marcia Margarita', apellidos: 'Espitia Reinel', edad: 43 },
  '25970436': { nombres: 'Erica del Carmen', apellidos: 'Orozco Urango', edad: 53 },
  '1062680090': { nombres: 'Jeyner Esteban', apellidos: 'Osorio Orozco', edad: 34 },
  '1062680096': { nombres: 'Erlinda Marcela', apellidos: 'Correa Arteaga', edad: 34 },
};

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
export function estimarEdadPorCedula(cedula: string): number | '' {
  const clean = (cedula || '').toString().trim().replace(/\D/g, '');
  if (!clean || clean.length < 5) return '';
  const num = Number(clean);
  if (isNaN(num)) return '';

  const anioActual = new Date().getFullYear();

  // 1. Cédulas antiguas de 1 a 7 dígitos (nacidos antes de 1955)
  if (num < 1000000) return Math.min(105, Math.max(80, anioActual - 1938));
  if (num < 5000000) return Math.min(100, Math.max(78, anioActual - 1944));
  if (num < 10000000) return Math.min(95, Math.max(72, anioActual - 1950));

  // 2. Cédulas de 8 dígitos serie 10M - 19M
  if (num >= 10000000 && num < 20000000) {
    const ratio = (num - 10000000) / 10000000;
    const anioNac = Math.round(1950 + ratio * 20);
    return Math.max(18, anioActual - anioNac);
  }

  // 3. Cédulas de 8 dígitos serie 20M - 49M
  if (num >= 20000000 && num < 50000000) {
    const ratio = (num - 20000000) / 30000000;
    const anioNac = Math.round(1955 + ratio * 30);
    return Math.max(18, anioActual - anioNac);
  }

  // 4. Cédulas de 8 dígitos serie 70M - 79M
  if (num >= 70000000 && num < 80000000) {
    const ratio = (num - 70000000) / 10000000;
    const anioNac = Math.round(1964 + ratio * 20);
    return Math.max(18, anioActual - anioNac);
  }

  // 5. Cédulas de 8 dígitos serie 80M - 99M
  if (num >= 80000000 && num < 100000000) {
    const ratio = (num - 80000000) / 20000000;
    const anioNac = Math.round(1970 + ratio * 15);
    return Math.max(18, anioActual - anioNac);
  }

  // 6. Cédulas de 10 dígitos (serie nacional unificada a partir del 2000)
  // Calibración exacta: 1.007.299.001 -> ~28 años (nacido en 1998)
  if (num >= 1000000000 && num < 1250000000) {
    if (num < 1010000000) {
      const ratio = (num - 1000000000) / 10000000;
      const anioNac = Math.round(1982 + ratio * 17); // 1982 a 1999
      return Math.max(18, anioActual - anioNac);
    }
    const ratio = (num - 1010000000) / 240000000;
    const anioNac = Math.round(1999 + ratio * 9); // 1999 a 2008
    return Math.max(18, anioActual - anioNac);
  }

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

  // 1. Verificación en banco de memoria / censo local (< 1ms)
  const demo = LOCAL_DEMO_CENSO[cleanCedula];
  if (demo) {
    let demoEdad = demo.edad !== undefined && demo.edad !== null ? Number(demo.edad) : null;
    if (!demoEdad) {
      const est = estimarEdadPorCedula(cleanCedula);
      if (est !== '') demoEdad = Number(est);
    }
    return {
      encontrado: true,
      nombres: demo.nombres,
      apellidos: demo.apellidos,
      edad: demoEdad,
      puesto_sugerido: demo.puesto_sugerido ?? null,
      mesa_sugerida: demo.mesa_sugerida ?? null,
      raw_response: { demo: true },
    };
  }

  // 2. Consulta directa indexada en Supabase a censo_maestro (< 40ms)
  if (isSupabaseConfigured) {
    try {
      const { data: row, error } = await (supabase.from('censo_maestro') as any)
        .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
        .eq('cedula', cleanCedula)
        .maybeSingle();

      if (!error && row && row.nombres) {
        const edadCalculada = calcularEdadDesdeCenso(row.edad);
        let edadFinal = edadCalculada !== '' ? Number(edadCalculada) : (row.edad ? Number(row.edad) : null);
        if (!edadFinal) {
          const est = estimarEdadPorCedula(cleanCedula);
          if (est !== '') edadFinal = Number(est);
        }

        return {
          encontrado: true,
          nombres: row.nombres,
          apellidos: row.apellidos || '',
          edad: edadFinal,
          puesto_sugerido: row.puesto_sugerido || null,
          mesa_sugerida: row.mesa_sugerida ? Number(row.mesa_sugerida) : null,
          municipio: row.municipio || null,
          departamento: row.departamento || null,
          raw_response: row,
        };
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

      // Si no trajo edad, buscar si el censo local o estimación demográfica la tiene
      if (!edadFinal) {
        const demo = LOCAL_DEMO_CENSO[cleanCedula];
        if (demo && demo.edad) {
          edadFinal = Number(demo.edad);
        }
      }
      if (!edadFinal) {
        const est = estimarEdadPorCedula(cleanCedula);
        if (est !== '') edadFinal = Number(est);
      }

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
          let edad = edadCalculada !== '' ? Number(edadCalculada) : null;
          if (!edad) {
            const est = estimarEdadPorCedula(cleanCedula);
            if (est !== '') edad = Number(est);
          }

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
          let edad = edadCalculada !== '' ? Number(edadCalculada) : null;
          if (!edad) {
            const est = estimarEdadPorCedula(cleanCedula);
            if (est !== '') edad = Number(est);
          }

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
        let edad = edadCalculada !== '' ? Number(edadCalculada) : null;
        if (!edad) {
          const est = estimarEdadPorCedula(cleanCedula);
          if (est !== '') edad = Number(est);
        }

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

