import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CensoLookupResult } from '../types';

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
 * Consulta un ciudadano en el Censo Maestro Local mediante función RPC en Supabase (<50ms).
 * Si Supabase no está conectado o el RPC no está disponible, utiliza el almacenamiento de demostración local.
 */
export async function buscarCiudadanoEnCenso(cedula: string): Promise<CensoLookupResult> {
  const cleanCedula = cedula.trim().replace(/\D/g, '');

  if (cleanCedula.length < 5) {
    return { found: false };
  }

  // 1. Si no está conectado con Supabase, buscar en el censo demo local
  if (!isSupabaseConfigured) {
    // Revisar si hay un censo personalizado en localStorage
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

  // 2. Consulta en Supabase a través de la función RPC optimizada
  try {
    const { data, error } = await (supabase.rpc as any)('buscar_ciudadano_censo', {
      p_cedula: cleanCedula,
    });

    if (!error && data) {
      const record = Array.isArray(data) ? data[0] : data;
      if (record && record.found) {
        return {
          found: true,
          nombres: record.nombres,
          apellidos: record.apellidos,
          puesto_sugerido: record.puesto_sugerido ?? null,
          mesa_sugerida: record.mesa_sugerida ?? null,
        };
      }
    }

    // 3. Fallback directo a la tabla censo_maestro si la RPC falla o está pendiente de migración
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
  } catch (err) {
    console.warn('Error al consultar censo_maestro en Supabase, recurriendo a demo local:', err);
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
