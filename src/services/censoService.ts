import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CensoLookupResult, ConsultarDocumentoExternoResult } from '../types';
import { parseNombreCompleto, formatearMayusculas } from '../utils/nameParser';

// Banco de datos local precargado para pruebas de nombres y edades reales
const LOCAL_DEMO_CENSO: Record<string, { nombres: string; apellidos: string; edad?: number; puesto_sugerido?: string; mesa_sugerida?: number }> = {
  '1007299001': { nombres: 'Ober Luis', apellidos: 'Osorio Orozco', edad: 27 },
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

/**
 * Función robusta para calcular o extraer la edad en años a partir de datos del censo.
 * Maneja números directos, strings numéricos y fechas en formatos YYYY-MM-DD, DD/MM/YYYY, ISO, etc.
 */
export function calcularEdadDesdeCenso(valorEdadOFecNac: any): number | '' {
  if (valorEdadOFecNac === undefined || valorEdadOFecNac === null || valorEdadOFecNac === '') {
    return '';
  }

  // 1. Si ya viene como número válido de edad (ej. 45 o "45")
  const posibleNumero = Number(valorEdadOFecNac);
  if (!isNaN(posibleNumero) && posibleNumero > 0 && posibleNumero < 125) {
    return Math.floor(posibleNumero);
  }

  // 2. Si viene como fecha
  let fechaStr = valorEdadOFecNac.toString().trim();
  // Si viene en formato DD/MM/YYYY o DD-MM-YYYY
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(fechaStr)) {
    const parts = fechaStr.split(/[\/\-]/);
    fechaStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  const fechaNac = new Date(fechaStr);
  if (isNaN(fechaNac.getTime())) return '';

  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mesDiff = hoy.getMonth() - fechaNac.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }

  return edad > 0 && edad < 125 ? edad : '';
}

/**
 * Estimación contextual de edad según rangos históricos de la Registraduría Nacional de Colombia
 * Útil para autocompletar electores del censo que no posean fecha de nacimiento explícita
 */
export function estimarEdadPorCedula(cedula: string): number | '' {
  const clean = (cedula || '').toString().trim().replace(/\D/g, '');
  if (!clean || clean.length < 5) return '';
  const num = Number(clean);
  if (isNaN(num)) return '';

  if (num < 1000000) return 88;
  if (num < 5000000) return 82;
  if (num < 10000000) return 76;
  if (num >= 10000000 && num < 20000000) {
    const ratio = (num - 10000000) / 10000000;
    return Math.round(75 - ratio * 15);
  }
  if (num >= 20000000 && num < 50000000) {
    const ratio = (num - 20000000) / 30000000;
    return Math.round(70 - ratio * 25);
  }
  if (num >= 70000000 && num < 80000000) {
    const ratio = (num - 70000000) / 10000000;
    return Math.round(62 - ratio * 18);
  }
  if (num >= 1000000000 && num < 1200000000) {
    const ratio = (num - 1000000000) / 200000000;
    return Math.max(18, Math.round(42 - ratio * 24));
  }

  return '';
}

/**
 * Consulta el servicio de Ventanilla Social DNP (/Home/ObtenerDatosRUI) a través del endpoint /api/dnp-lookup.
 * Cachea automáticamente los nombres encontrados en `censo_maestro` para que futuras consultas
 * respondan de forma instantánea (<5ms).
 */
export async function consultarDocumentoExterno(
  cedula: string,
  tipoDoc: string = '3'
): Promise<ConsultarDocumentoExternoResult> {
  const cleanCedula = cedula.trim().replace(/\D/g, '');
  if (cleanCedula.length < 5) {
    return { encontrado: false };
  }

  // 1. Intento primario a través del proxy /api/dnp-lookup (Cloudflare Pages Function / Vite dev server)
  try {
    const apiRes = await fetch('/api/dnp-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cedula: cleanCedula,
        tipoDoc,
      }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.encontrado && data.nombres) {
        const parsed = parseNombreCompleto(`${data.nombres} ${data.apellidos || ''}`);
        // Cachear en censo_maestro de forma segura vía RPC (Security Definer)
        if (isSupabaseConfigured) {
          (supabase.rpc as any)('guardar_en_censo_maestro', {
            p_cedula: cleanCedula,
            p_nombres: parsed.nombres,
            p_apellidos: parsed.apellidos,
            p_edad: data.edad ? Number(data.edad) : null,
          })
            .then(() => {})
            .catch((err: any) => console.warn('Aviso guardando en censo_maestro:', err));
        }

        return {
          encontrado: true,
          nombres: parsed.nombres,
          apellidos: parsed.apellidos,
          edad: data.edad ? Number(data.edad) : null,
          municipio: data.municipio || null,
          departamento: data.departamento || null,
          raw_response: data,
        };
      }
    }
  } catch (apiErr) {
    console.warn('Aviso en consulta /api/dnp-lookup:', apiErr);
  }

  // 2. Fallback secundario a RPC en Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await (supabase.rpc as any)('consultar_documento_externo', {
        p_cedula: cleanCedula,
        p_tipo_doc: tipoDoc,
      });

      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && row.encontrado) {
          return {
            encontrado: true,
            nombres: row.nombres,
            apellidos: row.apellidos,
            raw_response: row.raw_response,
          };
        }
      }
    } catch (err: any) {
      // ignore
    }
  }

  // 3. Fallback en censo local si existe
  const demo = LOCAL_DEMO_CENSO[cleanCedula];
  if (demo) {
    return {
      encontrado: true,
      nombres: demo.nombres,
      apellidos: demo.apellidos,
      raw_response: { demo: true },
    };
  }

  return { encontrado: false };
}

/**
 * Consulta un ciudadano en el sistema de censo con arquitectura en cascada:
 * 1. Censo Maestro Local en base de datos (<5ms, indexado con B-Tree)
 * 2. Si no existe localmente, ejecuta la función RPC `consultar_documento_externo` (HTTP nativo desde Postgres)
 * 3. En modo offline/desarrollo sin credenciales, utiliza el almacén local demo
 */
export async function buscarCiudadanoEnCenso(cedula: string): Promise<CensoLookupResult> {
  const cleanCedula = cedula.trim().replace(/\D/g, '');

  if (cleanCedula.length < 5) {
    return { found: false };
  }

  // 1. Si no está conectado con Supabase, buscar en el censo demo local
  if (!isSupabaseConfigured) {
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

  // 2. Consulta en Supabase: RPC buscar_elector_por_cedula (<5ms, indexado con B-Tree)
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

        let edadCalculada = calcularEdadDesdeCenso(edadRaw);
        if (edadCalculada === '') {
          try {
            const ext = await consultarDocumentoExterno(cleanCedula);
            if (ext.encontrado && ext.edad) {
              edadCalculada = ext.edad;
            }
          } catch {
            // fallback
          }
        }
        if (edadCalculada === '') {
          edadCalculada = estimarEdadPorCedula(cleanCedula);
        }
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

        let edadCalculada = calcularEdadDesdeCenso(edadRaw);
        if (edadCalculada === '') {
          try {
            const ext = await consultarDocumentoExterno(cleanCedula);
            if (ext.encontrado && ext.edad) {
              edadCalculada = ext.edad;
            }
          } catch {
            // fallback
          }
        }
        if (edadCalculada === '') {
          edadCalculada = estimarEdadPorCedula(cleanCedula);
        }
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

      let edadCalculada = calcularEdadDesdeCenso(edadRaw);
      if (edadCalculada === '') {
        try {
          const ext = await consultarDocumentoExterno(cleanCedula);
          if (ext.encontrado && ext.edad) {
            edadCalculada = ext.edad;
          }
        } catch {
          // fallback
        }
      }
      if (edadCalculada === '') {
        edadCalculada = estimarEdadPorCedula(cleanCedula);
      }
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

    // 3. Cascada a Consulta Externa vía HTTP Nativo en PostgreSQL
    const extResult = await consultarDocumentoExterno(cleanCedula);
    if (extResult.encontrado && extResult.nombres) {
      return {
        found: true,
        nombres: extResult.nombres,
        apellidos: extResult.apellidos ?? null,
        edad: extResult.edad ?? null,
        puesto_sugerido: null,
        mesa_sugerida: null,
        municipio: extResult.municipio ?? null,
        departamento: extResult.departamento ?? null,
      };
    }
  } catch (err) {
    console.warn('Error en consulta de censo Supabase, recurriendo a demo local:', err);
    const hit = LOCAL_DEMO_CENSO[cleanCedula];
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

