import type {
  RawParsedRow,
  NormalizedElectorRow,
  RowValidationError,
  PreflightSummary,
} from './types';
import { parseNombreCompleto } from '../../../utils/nameParser';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type { CensoLookupResult } from '../../../types';

// Normaliza un encabezado para comparación (sin tildes, minúsculas, sin espacios ni caracteres especiales)
const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[°º]/g, 'o')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '');
};

// Diccionario de sinónimos y alias por columna
const COLUMN_ALIASES: Record<string, string[]> = {
  cedula: [
    'cedula',
    'cédula',
    'documento',
    'doc',
    'identificacion',
    'identificación',
    'cc',
    'c_c',
    'dni',
    'numero_documento',
    'cedula_elector',
    'num_documento',
    'no_documento',
    'id',
    'cedula_ciudadania',
    'cedula_de_ciudadania',
    'nro_documento',
    'nro_doc',
    'documento_identidad',
    'documento_de_identidad',
    'num_doc',
  ],
  nombres: [
    'nombres',
    'nombre',
    'primer_nombre',
    'names',
    'first_name',
    'nombres_elector',
    'nombre_completo',
    'full_name',
    'nombres_y_apellidos',
    'nombre_y_apellido',
    'elector',
  ],
  apellidos: [
    'apellidos',
    'apellido',
    'primer_apellido',
    'segundo_apellido',
    'surnames',
    'last_name',
    'apellidos_elector',
  ],
  edad: [
    'edad',
    'anos',
    'años',
    'age',
    'edad_elector',
    'anhos',
    'edades',
  ],
  telefono: [
    'telefono',
    'teléfono',
    'celular',
    'movil',
    'móvil',
    'phone',
    'tel',
    'whatsapp',
    'contacto',
    'numero_contacto',
    'cel',
  ],
  puesto_votacion: [
    'puesto_votacion',
    'puesto_de_votacion',
    'puesto',
    'lugar_votacion',
    'lugar_de_votacion',
    'lugar',
    'polling_station',
    'recinto',
    'colegio',
    'institucion',
    'sede',
    'puesto_asignado',
  ],
  mesa: [
    'mesa',
    'numero_mesa',
    'mesa_votacion',
    'num_mesa',
    'no_mesa',
    'table',
    'mesa_asignada',
    'nro_mesa',
  ],
  notas: [
    'notas',
    'observaciones',
    'observacion',
    'nota',
    'comentario',
    'comentarios',
    'notes',
    'detalle',
    'descripcion',
  ],
};

/**
 * Detecta qué columna del archivo corresponde a cada campo requerido
 */
export const detectColumnMapping = (
  rawHeaders: string[]
): {
  mapping: Record<string, string>; // campoInterno -> encabezadoOriginal
  detectedList: { original: string; mappedTo: string }[];
} => {
  const mapping: Record<string, string> = {};
  const detectedList: { original: string; mappedTo: string }[] = [];

  for (const rawHeader of rawHeaders) {
    const normalized = normalizeHeader(rawHeader);

    for (const [targetField, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (mapping[targetField]) continue; // Ya mapeado

      const matched = aliases.some((alias) => {
        const normAlias = normalizeHeader(alias);
        return normalized === normAlias || normalized.includes(normAlias);
      });

      if (matched) {
        mapping[targetField] = rawHeader;
        detectedList.push({ original: rawHeader, mappedTo: targetField });
        break;
      }
    }
  }

  return { mapping, detectedList };
};

/**
 * Valida y normaliza todas las filas del archivo (Pre-flight validation)
 */
export const validateAndNormalizeRows = (
  rawRows: RawParsedRow[],
  fileName: string,
  fileSize: number
): PreflightSummary => {
  if (rawRows.length === 0) {
    return {
      fileName,
      fileSize,
      totalRawRows: 0,
      validRows: [],
      invalidRows: [],
      duplicateCedulasInFile: 0,
      detectedColumns: [],
    };
  }

  const rawHeaders = Object.keys(rawRows[0] || {});
  const { mapping, detectedList } = detectColumnMapping(rawHeaders);

  const validRows: NormalizedElectorRow[] = [];
  const invalidRows: RowValidationError[] = [];
  const seenCedulas = new Set<string>();
  let duplicateCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Fila 1 es el encabezado

    // 1. Extraer y limpiar cédula
    const rawCedula = mapping.cedula ? String(row[mapping.cedula] ?? '').trim() : '';
    // Limpiar puntos, comas, espacios y guiones
    const cleanCedula = rawCedula.replace(/[\.\,\s\-]/g, '');

    if (!cleanCedula) {
      invalidRows.push({
        rowNumber,
        cedula: '',
        field: 'Cédula / Documento',
        reason: 'El documento de identidad está vacío o no se detectó la columna.',
        rawData: row,
      });
      return;
    }

    if (!/^\d{4,20}$/.test(cleanCedula)) {
      invalidRows.push({
        rowNumber,
        cedula: cleanCedula,
        field: 'Cédula / Documento',
        reason: 'Formato inválido. Debe contener entre 4 y 20 dígitos numéricos.',
        rawData: row,
      });
      return;
    }

    // Verificar duplicado interno en el archivo
    if (seenCedulas.has(cleanCedula)) {
      duplicateCount++;
      invalidRows.push({
        rowNumber,
        cedula: cleanCedula,
        field: 'Cédula Duplicada',
        reason: 'Esta cédula ya aparece en una fila anterior dentro del mismo archivo.',
        rawData: row,
      });
      return;
    }
    seenCedulas.add(cleanCedula);

    // 2. Extraer Nombres y Apellidos
    let nombres = mapping.nombres ? String(row[mapping.nombres] ?? '').trim() : '';
    let apellidos = mapping.apellidos ? String(row[mapping.apellidos] ?? '').trim() : '';

    // Manejo inteligente si solo existe columna 'nombre_completo' o si nombres y apellidos apuntan a la misma columna
    if (nombres && (!apellidos || mapping.nombres === mapping.apellidos)) {
      const parsed = parseNombreCompleto(nombres);
      if (parsed.nombres && parsed.apellidos) {
        nombres = parsed.nombres;
        apellidos = parsed.apellidos;
      }
    }

    // Si no tiene nombres o están incompletos en el archivo, se preservan vacíos para enriquecer con el Censo
    if (!nombres || nombres.length < 2) {
      nombres = '';
      apellidos = '';
    } else if (!apellidos || apellidos.length < 2) {
      // Fallback si no tiene apellidos separados
      apellidos = 'Sin Registrar';
    }

    // 3. Extraer Edad
    let cleanEdad: number | null = null;
    if (mapping.edad && row[mapping.edad] !== undefined && row[mapping.edad] !== '') {
      const parsedEdad = parseInt(String(row[mapping.edad]).replace(/\D/g, ''), 10);
      if (!isNaN(parsedEdad) && parsedEdad >= 10 && parsedEdad <= 120) {
        cleanEdad = parsedEdad;
      }
    }

    // 4. Extraer Teléfono
    const rawTel = mapping.telefono ? String(row[mapping.telefono] ?? '').trim() : '';
    const cleanTel = rawTel ? rawTel.replace(/[^\d\+\s]/g, '').trim() : null;

    // 5. Extraer Puesto de Votación
    const puesto = mapping.puesto_votacion
      ? String(row[mapping.puesto_votacion] ?? '').trim()
      : '';
    const puestoFinal = puesto || 'Sede Principal (Por Asignar)';

    // 6. Extraer Mesa
    let mesaFinal = 1;
    if (mapping.mesa && row[mapping.mesa] !== undefined && row[mapping.mesa] !== '') {
      const parsedMesa = parseInt(String(row[mapping.mesa]).replace(/\D/g, ''), 10);
      if (!isNaN(parsedMesa) && parsedMesa > 0) {
        mesaFinal = parsedMesa;
      }
    }

    // 7. Extraer Notas
    const notas = mapping.notas ? String(row[mapping.notas] ?? '').trim() : null;

    const origFullName = `${nombres} ${apellidos}`.trim();

    validRows.push({
      _rowNumber: rowNumber,
      cedula: cleanCedula,
      nombres,
      apellidos,
      edad: cleanEdad,
      telefono: cleanTel || null,
      puesto_votacion: puestoFinal,
      mesa: mesaFinal,
      notas: notas || null,
      nombre_original_archivo: origFullName || undefined,
      nombre_fue_corregido: false,
      verificado_censo: false,
      isEnriching: true,
    });
  });

  return {
    fileName,
    fileSize,
    totalRawRows: rawRows.length,
    validRows,
    invalidRows,
    duplicateCedulasInFile: duplicateCount,
    detectedColumns: detectedList,
    enrichedCount: 0,
    correctedCount: 0,
    isEnrichingInProgress: true,
    enrichmentProgress: {
      processed: 0,
      total: validRows.length,
    },
  };
};

/**
 * Normaliza cadenas de nombres para comparación libre de acentos y caracteres especiales
 */
export const normalizeForComparison = (str?: string | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Calcula la edad precisa en años a partir de una fecha de nacimiento (ISO / DD/MM/YYYY)
 */
export const calcularEdad = (fechaNacimientoStr?: string | null): number | null => {
  if (!fechaNacimientoStr) return null;
  const fecha = new Date(fechaNacimientoStr);
  if (isNaN(fecha.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
    edad--;
  }
  return edad >= 0 && edad <= 125 ? edad : null;
};

/**
 * Aplica el resultado del censo electoral a una fila de elector, realizando autocorrección
 * de nombre si difiere, asignando edad y preservando el puesto/mesa del archivo.
 */
export const aplicarResultadoCenso = (
  row: NormalizedElectorRow,
  censo: CensoLookupResult & { raw_response?: any }
): NormalizedElectorRow => {
  if (!censo.found) {
    return {
      ...row,
      isEnriching: false,
      verificado_censo: false,
      nombre_fue_corregido: false,
    };
  }

  const updated: NormalizedElectorRow = {
    ...row,
    isEnriching: false,
    verificado_censo: true,
  };

  const censoNombres = censo.nombres ? censo.nombres.trim() : '';
  const censoApellidos = censo.apellidos ? censo.apellidos.trim() : '';
  const censoFullName = `${censoNombres} ${censoApellidos}`.trim();

  const fileFullName = row.nombre_original_archivo || `${row.nombres || ''} ${row.apellidos || ''}`.trim();
  const fileNorm = normalizeForComparison(fileFullName);
  const censoNorm = normalizeForComparison(censoFullName);

  // 1. Verificación y autocorrección de nombre completo
  if (censoFullName && (!fileFullName || fileNorm !== censoNorm)) {
    updated.nombres = censoNombres || updated.nombres;
    updated.apellidos = censoApellidos || updated.apellidos;
    updated.nombre_fue_corregido = true;
    updated.isAutofilled = true;
    updated.autofillSource = 'censo_maestro';
  } else {
    updated.nombre_fue_corregido = false;
  }

  // 2. Cálculo y asignación de edad (reemplaza N/A por edad real)
  let finalEdad: number | null =
    censo.edad !== undefined && censo.edad !== null ? Number(censo.edad) : null;
  if (!finalEdad && censo.raw_response) {
    const rawFecha = censo.raw_response.fechaNacimiento || censo.raw_response.fecha_nacimiento;
    if (rawFecha) {
      finalEdad = calcularEdad(rawFecha);
    }
  }

  if (finalEdad !== null && finalEdad > 0) {
    updated.edad = finalEdad;
    updated.isAutofilled = true;
  }

  // 3. Preservación de datos: Puesto y mesa asignados del archivo se mantienen intactos.
  // Únicamente si el archivo no traía puesto (es el valor por defecto) se complementa con la sugerencia.
  if (
    (!updated.puesto_votacion || updated.puesto_votacion === 'Sede Principal (Por Asignar)') &&
    censo.puesto_sugerido
  ) {
    updated.puesto_votacion = censo.puesto_sugerido;
  }

  return updated;
};

export const enrichRowsWithCensus = async (
  preflightSummary: PreflightSummary,
  onProgress?: (processed: number, total: number) => void
): Promise<PreflightSummary> => {
  const { validRows: initialRows, invalidRows } = preflightSummary;

  if (!isSupabaseConfigured || initialRows.length === 0) {
    const valid = initialRows.filter((r) => r.nombres && r.nombres.length >= 2);
    const newInvalid: RowValidationError[] = [
      ...invalidRows,
      ...initialRows
        .filter((r) => !r.nombres || r.nombres.length < 2)
        .map((r) => ({
          rowNumber: r._rowNumber,
          cedula: r.cedula,
          field: 'Nombres',
          reason: 'El documento no tiene nombres en el archivo.',
          rawData: {},
        })),
    ];
    return {
      ...preflightSummary,
      validRows: valid,
      invalidRows: newInvalid,
      enrichedCount: 0,
    };
  }

  const allCedulas = Array.from(new Set(initialRows.map((r) => r.cedula)));
  const total = allCedulas.length;
  const CHUNK_SIZE = 500;
  const censoMap = new Map<string, any>();

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = allCedulas.slice(i, i + CHUNK_SIZE);
    try {
      const { data, error } = await (supabase.rpc as any)('buscar_censo_lote', {
        p_cedulas: chunk,
      });

      if (!error && Array.isArray(data)) {
        data.forEach((c) => {
          if (c && c.cedula) {
            censoMap.set(String(c.cedula).trim(), c);
          }
        });
      }
    } catch (e) {
      console.warn('Error consultando lote del Censo:', e);
    }
    onProgress?.(Math.min(i + chunk.length, total), total);
  }

  const finalizedValid: NormalizedElectorRow[] = [];
  const finalizedInvalid: RowValidationError[] = [...invalidRows];
  let enrichedCount = 0;

  for (const row of initialRows) {
    const censoInfo = censoMap.get(row.cedula);

    if (censoInfo) {
      let wasEnriched = false;

      // 1. Si no tenía nombres en el archivo o estaban incompletos
      if (!row.nombres || row.nombres.length < 2) {
        const fullCensoName = `${censoInfo.nombres || ''} ${censoInfo.apellidos || ''}`.trim();
        const parsed = parseNombreCompleto(fullCensoName || censoInfo.nombres || '');
        row.nombres = parsed.nombres || censoInfo.nombres || 'Sin Registrar';
        row.apellidos = parsed.apellidos || censoInfo.apellidos || 'Sin Registrar';
        wasEnriched = true;
      }

      // 2. Si no tenía edad en el archivo, asignar la edad del censo
      if ((row.edad === null || row.edad === undefined) && censoInfo.edad) {
        row.edad = Number(censoInfo.edad);
        wasEnriched = true;
      }

      // 3. Si no tenía puesto de votación asignado, asignar sugerido del censo
      if (
        censoInfo.puesto_sugerido &&
        (row.puesto_votacion === 'Sede Principal (Por Asignar)' || !row.puesto_votacion)
      ) {
        row.puesto_votacion = censoInfo.puesto_sugerido;
        wasEnriched = true;
      }

      // 4. Si la mesa era la default y el censo tiene mesa sugerida
      if (censoInfo.mesa_sugerida && row.mesa === 1) {
        row.mesa = Number(censoInfo.mesa_sugerida);
      }

      if (wasEnriched) {
        row.isAutofilled = true;
        row.autofillSource = 'censo_maestro';
        enrichedCount++;
      }
    }

    // Validación definitiva de nombres
    if (!row.nombres || row.nombres.length < 2) {
      finalizedInvalid.push({
        rowNumber: row._rowNumber,
        cedula: row.cedula,
        field: 'Nombres / Censo',
        reason: 'El documento no tiene nombres en el archivo y no fue encontrado en el Censo Electoral.',
        rawData: {},
      });
    } else {
      finalizedValid.push(row);
    }
  }

  return {
    ...preflightSummary,
    validRows: finalizedValid,
    invalidRows: finalizedInvalid,
    enrichedCount,
  };
};
