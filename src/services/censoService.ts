import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CensoLookupResult, ConsultarDocumentoExternoResult } from '../types';

// Banco de datos local precargado para pruebas de alta velocidad (<50ms) en modo demo
const LOCAL_DEMO_CENSO: Record<string, { nombres: string; apellidos: string; puesto_sugerido?: string; mesa_sugerida?: number }> = {
  '1047892341': { nombres: 'Carlos Eduardo', apellidos: 'Mendoza Ospina', puesto_sugerido: 'I.E. Santander Central', mesa_sugerida: 4 },
  '1098341902': { nombres: 'Laura Sofía', apellidos: 'Herrera Morales', puesto_sugerido: 'Coliseo Municipal de Deportes', mesa_sugerida: 2 },
  '73542189': { nombres: 'Miguel Ángel', apellidos: 'Morales Torres', puesto_sugerido: 'Colegio Mayor Departamental', mesa_sugerida: 7 },
  '1143670554': { nombres: 'Valentina', apellidos: 'Restrepo Castro', puesto_sugerido: 'I.E. Técnico San Juan Bautista', mesa_sugerida: 1 },
  '1052884112': { nombres: 'Andrés Felipe', apellidos: 'Gómez Ortiz', puesto_sugerido: 'Escuela Mixta El Prado', mesa_sugerida: 3 },
  '1085294019': { nombres: 'Esteban Camilo', apellidos: 'Torres Valderrama', puesto_sugerido: 'I.E. Santander Central', mesa_sugerida: 4 },
  '528391145': { nombres: 'María Lucía', apellidos: 'Pérez Domínguez', puesto_sugerido: 'Coliseo Municipal de Deportes', mesa_sugerida: 2 },
  '1098456432': { nombres: 'Andrés Felipe', apellidos: 'Ramírez Gómez', puesto_sugerido: 'I.E. Santander Central', mesa_sugerida: 4 },
  '43987123': { nombres: 'Carmen Rosa', apellidos: 'Vargas Silva', puesto_sugerido: 'Colegio Mayor Departamental', mesa_sugerida: 6 },
  '1047892903': { nombres: 'Jhonatan David', apellidos: 'Montoya Restrepo', puesto_sugerido: 'I.E. Técnico San Juan Bautista', mesa_sugerida: 1 },
  '1020304050': { nombres: 'Juliana Patricia', apellidos: 'Salazar Cardona', puesto_sugerido: 'I.E. Santander Central', mesa_sugerida: 3 },
  '1030405060': { nombres: 'Diego Fernando', apellidos: 'Castro Muñoz', puesto_sugerido: 'Coliseo Municipal de Deportes', mesa_sugerida: 5 },
};

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
        // Cachear en censo_maestro en segundo plano
        if (isSupabaseConfigured) {
          (supabase.from('censo_maestro') as any)
            .upsert(
              {
                cedula: cleanCedula,
                nombres: data.nombres,
                apellidos: data.apellidos || '',
              },
              { onConflict: 'cedula' }
            )
            .then(() => {})
            .catch(() => {});
        }

        return {
          encontrado: true,
          nombres: data.nombres,
          apellidos: data.apellidos || '',
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
        return {
          found: true,
          nombres: record.nombres,
          apellidos: record.apellidos,
          puesto_sugerido: record.puesto || record.puesto_sugerido || null,
          mesa_sugerida: record.mesa || record.mesa_sugerida || null,
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
        return {
          found: true,
          nombres: record.nombres,
          apellidos: record.apellidos,
          puesto_sugerido: record.puesto_sugerido || record.puesto || null,
          mesa_sugerida: record.mesa_sugerida || record.mesa || null,
        };
      }
    }

    // Fallback directo a la tabla censo_maestro
    const { data: tableData, error: tableError } = await (supabase.from('censo_maestro') as any)
      .select('nombres, apellidos, puesto_sugerido, mesa_sugerida')
      .eq('cedula', cleanCedula)
      .maybeSingle();

    if (!tableError && tableData) {
      return {
        found: true,
        nombres: tableData.nombres,
        apellidos: tableData.apellidos,
        puesto_sugerido: tableData.puesto_sugerido ?? null,
        mesa_sugerida: tableData.mesa_sugerida ?? null,
      };
    }

    // 3. Cascada a Consulta Externa vía HTTP Nativo en PostgreSQL
    const extResult = await consultarDocumentoExterno(cleanCedula);
    if (extResult.encontrado && extResult.nombres) {
      return {
        found: true,
        nombres: extResult.nombres,
        apellidos: extResult.apellidos ?? null,
        puesto_sugerido: null,
        mesa_sugerida: null,
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
