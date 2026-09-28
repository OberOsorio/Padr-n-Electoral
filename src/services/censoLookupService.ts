import { supabase } from '../lib/supabase';

export interface CensoLookupResult {
  encontrado: boolean;
  cedula: string;
  nombres?: string;
  apellidos?: string;
  departamento?: string;
  municipio?: string;
  puesto?: string;
  mesa?: number;
  direccion?: string;
}

/**
 * Consulta operativa directa del censo y lugar de votación por cédula
 */
export const consultarLugarVotacion = async (cedulaInput: string): Promise<CensoLookupResult> => {
  const cleanCedula = cedulaInput.trim().replace(/\D/g, '');
  if (!cleanCedula || cleanCedula.length < 4) {
    return { encontrado: false, cedula: cleanCedula };
  }

  try {
    const { data, error } = await (supabase.rpc as any)('consultar_censo_directo', {
      p_cedula: cleanCedula,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0];
      if (row.encontrado) {
        return {
          encontrado: true,
          cedula: row.cedula,
          nombres: row.nombres,
          apellidos: row.apellidos,
          departamento: row.departamento,
          municipio: row.municipio,
          puesto: row.puesto,
          mesa: row.mesa,
          direccion: row.direccion,
        };
      }
    }
  } catch (err) {
    console.warn('Aviso RPC consultar_censo_directo:', err);
  }

  // Fallback a electores locales
  try {
    const storedElectores = localStorage.getItem('electoral_electores_db');
    if (storedElectores) {
      const electores = JSON.parse(storedElectores);
      const match = electores.find((e: any) => e.cedula === cleanCedula);
      if (match) {
        return {
          encontrado: true,
          cedula: match.cedula,
          nombres: match.nombres,
          apellidos: match.apellidos,
          departamento: match.departamento || 'Córdoba',
          municipio: match.municipio || 'Montería',
          puesto: match.puesto_votacion || 'Colegio Asignado',
          mesa: match.mesa || 1,
          direccion: match.direccion || '',
        };
      }
    }
  } catch {}

  return { encontrado: false, cedula: cleanCedula };
};
