import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import type { ElectorWithRegistrant } from '../types';

export interface ExportFilterParams {
  tenantId?: string | null;
  registradoPorId?: string; // Si se omite, exporta todo el padrón
  liderNombre?: string;
  nombreCampana?: string;
}

export interface ElectorExportRow {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  puesto_votacion?: string;
  mesa?: string | number;
  created_at?: string;
  [key: string]: any;
}

/**
 * Genera y descarga el reporte individual en Excel (.xlsx) para un líder específico
 * con membrete institucional, pestaña personalizada y nombre de archivo dinámico.
 */
export function exportarReporteIndividualLider(
  nombreLider: string,
  electores: ElectorExportRow[],
  nombreCampana: string = 'TODO POR COTORRA'
): { count: number; fileName: string } {
  if (!electores || electores.length === 0) {
    throw new Error(`El líder ${nombreLider} no tiene electores registrados para exportar.`);
  }

  // 1. Sanitizar nombre del archivo
  const anio = new Date().getFullYear();
  const nombreLiderSanitizado = nombreLider
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const fileName = `Reporte_Lider_${nombreLiderSanitizado}_${anio}.xlsx`;

  // 2. Nombre de la pestaña: Primer nombre y apellido (máximo 31 caracteres)
  const partes = nombreLider.trim().split(/\s+/);
  const primerNombreYApellido = partes.length > 1 ? `${partes[0]} ${partes[1]}` : partes[0] || 'Líder';
  const sheetName = primerNombreYApellido
    .replace(/[:\\\/\?\*\[\]]/g, '')
    .trim()
    .slice(0, 31) || 'Reporte Líder';

  // 3. Fecha y hora de generación
  const fechaGeneracion = new Date().toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // 4. Membrete institucional y encabezados (AOA)
  const tituloInstitucional = nombreCampana
    ? `CAMPAÑA ELECTORAL - INFORME INDIVIDUAL DE GESTIÓN (${nombreCampana.toUpperCase()})`
    : `CAMPAÑA ELECTORAL - INFORME INDIVIDUAL DE GESTIÓN`;

  const aoaData: any[][] = [
    [tituloInstitucional],
    [`RESPONSABLE / LÍDER: ${nombreLider.toUpperCase()}`],
    [`TOTAL ELECTORES REPORTADOS: ${electores.length}`],
    [`FECHA DE GENERACIÓN: ${fechaGeneracion}`],
    [], // Fila 5 en blanco
    [
      'N°',
      'DOCUMENTO',
      'NOMBRE COMPLETO',
      'TELÉFONO',
      'PUESTO DE VOTACIÓN',
      'MESA',
      'FECHA REGISTRO',
    ], // Fila 6
  ];

  // 5. Filas de electores
  electores.forEach((e, idx) => {
    const nombreCompleto = `${e.nombres || ''} ${e.apellidos || ''}`.trim().toUpperCase() || 'SIN NOMBRE';
    
    let fechaRegistro = '';
    if (e.created_at) {
      try {
        fechaRegistro = new Date(e.created_at).toLocaleDateString('es-CO');
      } catch {
        fechaRegistro = String(e.created_at);
      }
    }

    const mesaStr = e.mesa !== undefined && e.mesa !== null && String(e.mesa).trim() !== ''
      ? (String(e.mesa).toUpperCase().startsWith('M') ? String(e.mesa) : `M-${e.mesa}`)
      : 'M-0';

    aoaData.push([
      idx + 1,
      e.cedula || '',
      nombreCompleto,
      e.telefono || 'Sin registrar',
      (e.puesto_votacion || 'Sin asignar').toUpperCase(),
      mesaStr,
      fechaRegistro,
    ]);
  });

  // 6. Construir hoja y libro
  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 7. Configurar anchos de columnas
  worksheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 18 }, // DOCUMENTO
    { wch: 38 }, // NOMBRE COMPLETO
    { wch: 18 }, // TELÉFONO
    { wch: 34 }, // PUESTO DE VOTACIÓN
    { wch: 12 }, // MESA
    { wch: 18 }, // FECHA REGISTRO
  ];

  // 8. Combinar celdas del membrete (A1:G1, A2:G2, etc.)
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
  ];

  // 9. Descargar archivo
  XLSX.writeFile(workbook, fileName);
  return { count: electores.length, fileName };
}

export async function exportarElectoresExcel({
  tenantId,
  registradoPorId,
  liderNombre,
  nombreCampana,
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
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
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

  // Si se solicitó exportación individual por líder, delegar al formato institucional
  if (registradoPorId && liderNombre) {
    return exportarReporteIndividualLider(liderNombre, rowsToExport, nombreCampana);
  }

  // Mapear columnas claras en español para el consolidado general
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

  // Crear hoja de cálculo y libro consolidado
  const worksheet = XLSX.utils.json_to_sheet(filasExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Padrón Consolidado');

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
  const fileName = `padron_electoral_consolidado_${fechaHoy}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return { count: filasExcel.length, fileName };
}
