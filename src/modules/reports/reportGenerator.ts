import * as XLSX from 'xlsx';
import type { ElectorWithRegistrant } from '../../types';

export interface ReportFilters {
  puesto: string; // 'all' or specific
  mesa: string; // 'all' or number
  startDate: string; // YYYY-MM-DD or ''
  endDate: string; // YYYY-MM-DD or ''
  coordinador: string; // 'all' or id
  format: 'xlsx' | 'csv';
}

export interface FormattedReportRow {
  'Cédula / Documento': string;
  'Nombres': string;
  'Apellidos': string;
  'Nombre Completo': string;
  'Teléfono': string;
  'Puesto de Votación': string;
  'Mesa': number | string;
  'Observaciones': string;
  'Registrado Por': string;
  'Fecha y Hora de Registro': string;
}

// Generar nombre de archivo estandarizado
export const generateReportFileName = (
  puesto: string,
  mesa: string,
  extension: 'xlsx' | 'csv'
): string => {
  const dateStr = new Date().toISOString().slice(0, 10);
  let slug = 'consolidado';

  if (puesto && puesto !== 'all') {
    slug = puesto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (mesa && mesa !== 'all') {
      slug += `_mesa_${mesa}`;
    }
  }

  return `padron_electoral_${slug}_${dateStr}.${extension}`;
};

// Generar resumen legible de los filtros aplicados para auditoría
export const buildFiltersSummary = (
  filters: ReportFilters,
  coordinatorName?: string
): string => {
  const parts: string[] = [];

  if (filters.puesto !== 'all') {
    parts.push(`Puesto: ${filters.puesto}`);
    if (filters.mesa !== 'all') {
      parts.push(`Mesa: ${filters.mesa}`);
    }
  } else {
    parts.push('Territorio consolidado');
  }

  if (filters.coordinador !== 'all') {
    parts.push(`Registrador: ${coordinatorName || filters.coordinador}`);
  }

  if (filters.startDate && filters.endDate) {
    parts.push(`Periodo: ${filters.startDate} a ${filters.endDate}`);
  } else if (filters.startDate) {
    parts.push(`Desde: ${filters.startDate}`);
  } else if (filters.endDate) {
    parts.push(`Hasta: ${filters.endDate}`);
  }

  return parts.join(' • ');
};

// Formatear electores en filas para exportación estructurada
export const formatElectorsForExport = (
  electors: ElectorWithRegistrant[]
): FormattedReportRow[] => {
  return electors.map((e) => {
    let formattedDate = e.created_at;
    try {
      const d = new Date(e.created_at);
      formattedDate = d.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      formattedDate = e.created_at;
    }

    return {
      'Cédula / Documento': e.cedula,
      'Nombres': e.nombres,
      'Apellidos': e.apellidos,
      'Nombre Completo': `${e.nombres} ${e.apellidos}`.trim(),
      'Teléfono': e.telefono || 'Sin registrar',
      'Puesto de Votación': e.puesto_votacion,
      'Mesa': e.mesa || 1,
      'Observaciones': e.notas || '',
      'Registrado Por': e.registrador?.full_name || 'Personal Autorizado',
      'Fecha y Hora de Registro': formattedDate,
    };
  });
};

// Descargar archivo Excel (.xlsx)
export const exportToExcel = (
  rows: FormattedReportRow[],
  fileName: string
): void => {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-ajustar ancho de columnas
  const colWidths = [
    { wch: 18 }, // Cédula
    { wch: 20 }, // Nombres
    { wch: 22 }, // Apellidos
    { wch: 30 }, // Nombre Completo
    { wch: 16 }, // Teléfono
    { wch: 35 }, // Puesto
    { wch: 8 },  // Mesa
    { wch: 30 }, // Observaciones
    { wch: 25 }, // Registrado Por
    { wch: 22 }, // Fecha
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Padrón Electoral');

  XLSX.writeFile(workbook, fileName);
};

// Descargar archivo CSV con UTF-8 BOM para soporte de tildes y caracteres especiales
export const exportToCSV = (
  rows: FormattedReportRow[],
  fileName: string
): void => {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]) as (keyof FormattedReportRow)[];

  // Separador de punto y coma ';' ideal para Excel en español / internacional
  const csvRows = [
    headers.map((h) => `"${h}"`).join(';'),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = String(row[header] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(';')
    ),
  ];

  // \uFEFF es el Byte Order Mark (BOM) que le indica a Excel abrir en UTF-8 sin dañar acentos
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
