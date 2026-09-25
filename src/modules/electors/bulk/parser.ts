import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { RawParsedRow, RowValidationError } from './types';

/**
 * Parsea un archivo local CSV o Excel (.xlsx, .xls) a una lista de objetos sin procesar
 */
export const parseFileToRawRows = async (file: File): Promise<RawParsedRow[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<RawParsedRow>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          resolve(results.data);
        },
        error: (err) => {
          reject(new Error(`Error al leer archivo CSV: ${err.message}`));
        },
      });
    });
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];

          if (!firstSheetName) {
            resolve([]);
            return;
          }

          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<RawParsedRow>(worksheet, {
            defval: '',
            raw: false, // Convierte números de cédula largos en texto sin notación científica
          });

          resolve(json);
        } catch (err: any) {
          reject(new Error(`Error al procesar hoja de Excel: ${err?.message || err}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('No se pudo leer el archivo de Excel seleccionado.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error('Formato de archivo no admitido. Utiliza .csv o .xlsx.');
};

/**
 * Genera y descarga la Plantilla Oficial de Carga Masiva con columnas predefinidas y ejemplos
 */
export const downloadOfficialTemplate = (format: 'csv' | 'xlsx'): void => {
  const sampleData = [
    {
      cedula: '1098765432',
      nombres: 'Carlos Andrés',
      apellidos: 'Restrepo Montoya',
      telefono: '3157894512',
      puesto_votacion: 'I.E. Santander Central',
      mesa: '3',
      notas: 'Líder comunal del barrio central',
    },
    {
      cedula: '1012345678',
      nombres: 'Mariana Sofia',
      apellidos: 'Gómez Henao',
      telefono: '3009876543',
      puesto_votacion: 'Colegio Mayor Departamental',
      mesa: '1',
      notas: 'Verificado telefónicamente',
    },
    {
      cedula: '52489632',
      nombres: 'Alonso Javier',
      apellidos: 'Duque Roldán',
      telefono: '3104561234',
      puesto_votacion: 'Coliseo Municipal de Deportes',
      mesa: '7',
      notas: 'Requiere transporte de acceso',
    },
  ];

  const fileName = `plantilla_carga_masiva_electores.${format}`;

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 18 }, // cedula
      { wch: 22 }, // nombres
      { wch: 22 }, // apellidos
      { wch: 18 }, // telefono
      { wch: 32 }, // puesto_votacion
      { wch: 8 },  // mesa
      { wch: 35 }, // notas
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Electores');
    XLSX.writeFile(workbook, fileName);
  } else {
    // CSV con UTF-8 BOM
    const headers = ['cedula', 'nombres', 'apellidos', 'telefono', 'puesto_votacion', 'mesa', 'notas'];
    const csvContent = [
      headers.join(';'),
      ...sampleData.map((row) =>
        [
          `"${row.cedula}"`,
          `"${row.nombres}"`,
          `"${row.apellidos}"`,
          `"${row.telefono}"`,
          `"${row.puesto_votacion}"`,
          `"${row.mesa}"`,
          `"${row.notas}"`,
        ].join(';')
      ),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Descarga reporte de filas con errores o rechazos de validación
 */
export const downloadValidationErrorsReport = (
  errors: RowValidationError[],
  fileNameBase: string
): void => {
  if (errors.length === 0) return;

  const rows = errors.map((err) => ({
    'Fila en Archivo': err.rowNumber,
    'Cédula / Documento': err.cedula || 'Vacía / No detectada',
    'Campo del Error': err.field,
    'Motivo del Rechazo': err.reason,
    'Datos Crudos de la Fila': JSON.stringify(err.rawData),
  }));

  const fileName = `errores_${fileNameBase.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 22 },
    { wch: 18 },
    { wch: 35 },
    { wch: 50 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Filas Rechazadas');
  XLSX.writeFile(workbook, fileName);
};
