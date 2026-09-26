import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ElectorWithRegistrant } from '../types';

export interface ExportFilterParams {
  tenantId?: string | null;
  registradoPorId?: string; // Si se omite, exporta todo el padrón
  liderNombre?: string;
}

export async function exportarElectoresExcel({
  tenantId,
  registradoPorId,
  liderNombre,
}: ExportFilterParams) {
  let rowsToExport: any[] = [];

  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem('electoral_local_electors');
    const localElectors: ElectorWithRegistrant[] = stored ? JSON.parse(stored) : [];

    let filtered = localElectors;
    if (tenantId) {
      filtered = filtered.filter((e) => !e.tenant_id || e.tenant_id === tenantId);
    }
    if (registradoPorId) {
      filtered = filtered.filter((e) => e.registrado_por === registradoPorId);
    }

    rowsToExport = filtered.map((e) => ({
      cedula: e.cedula,
      nombres: e.nombres,
      apellidos: e.apellidos,
      edad: e.edad,
      telefono: e.telefono,
      puesto_votacion: e.puesto_votacion,
      mesa: e.mesa,
      notas: e.notas,
      created_at: e.created_at,
      profiles: { full_name: e.registrador?.full_name || 'Personal Autorizado' },
    }));
  } else {
    let query = supabase
      .from('electores')
      .select(`
        cedula,
        nombres,
        apellidos,
        edad,
        telefono,
        puesto_votacion,
        mesa,
        notas,
        created_at,
        profiles:registrado_por (full_name)
      `)
      .order('apellidos', { ascending: true });

    if (tenantId) {
      query = (query as any).eq('tenant_id', tenantId);
    }

    if (registradoPorId) {
      query = query.eq('registrado_por', registradoPorId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || 'No hay electores para exportar con los criterios seleccionados.');
    }

    rowsToExport = data;
  }

  if (rowsToExport.length === 0) {
    throw new Error('No hay electores registrados para exportar.');
  }

  // Mapear columnas claras en español para el archivo Excel oficial
  const filasExcel = rowsToExport.map((e, index) => {
    let fechaStr = '';
    try {
      fechaStr = new Date(e.created_at).toLocaleDateString('es-CO');
    } catch {
      fechaStr = String(e.created_at || '');
    }

    return {
      '#': index + 1,
      'CÉDULA': e.cedula,
      'NOMBRES': e.nombres,
      'APELLIDOS': e.apellidos,
      'EDAD': e.edad !== null && e.edad !== undefined ? e.edad : '',
      'TELÉFONO': e.telefono || 'Sin teléfono',
      'PUESTO DE VOTACIÓN': e.puesto_votacion,
      'MESA': e.mesa,
      'REGISTRADO POR': (e.profiles as any)?.full_name || 'Sin asignar',
      'FECHA DE REGISTRO': fechaStr,
      'OBSERVACIONES': e.notas || '',
    };
  });

  // Crear hoja de cálculo y libro
  const worksheet = XLSX.utils.json_to_sheet(filasExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Electores');

  // Ajustar anchos automáticos de columna
  worksheet['!cols'] = [
    { wch: 5 },  // #
    { wch: 14 }, // Cédula
    { wch: 22 }, // Nombres
    { wch: 22 }, // Apellidos
    { wch: 8 },  // Edad
    { wch: 15 }, // Teléfono
    { wch: 32 }, // Puesto
    { wch: 8 },  // Mesa
    { wch: 24 }, // Registrado por
    { wch: 18 }, // Fecha
    { wch: 28 }, // Observaciones
  ];

  // Generar nombre de archivo intuitivo
  const fechaHoy = new Date().toISOString().split('T')[0];
  const nombreLimpio = liderNombre
    ? `_lider_${liderNombre.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}`
    : '_consolidado';
  const fileName = `padron_electoral${nombreLimpio}_${fechaHoy}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return { count: filasExcel.length, fileName };
}
