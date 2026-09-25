import type {
  RawParsedRow,
  NormalizedElectorRow,
  RowValidationError,
  PreflightSummary,
} from './types';

// Normaliza un encabezado para comparación (sin tildes, minúsculas, sin espacios ni caracteres especiales)
const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
    'dni',
    'numero_documento',
    'cedula_elector',
    'num_documento',
    'no_documento',
    'id',
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
  ],
  mesa: [
    'mesa',
    'numero_mesa',
    'mesa_votacion',
    'num_mesa',
    'no_mesa',
    'table',
    'mesa_asignada',
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

    // Manejo inteligente si solo existe columna 'nombre_completo'
    if (nombres && !apellidos && (!mapping.apellidos || !row[mapping.apellidos])) {
      const parts = nombres.split(/\s+/);
      if (parts.length >= 2) {
        nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
        apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');
      }
    }

    if (!nombres || nombres.length < 2) {
      invalidRows.push({
        rowNumber,
        cedula: cleanCedula,
        field: 'Nombres',
        reason: 'El campo de nombres es obligatorio y debe tener al menos 2 caracteres.',
        rawData: row,
      });
      return;
    }

    if (!apellidos || apellidos.length < 2) {
      // Fallback si no tiene apellidos separados
      apellidos = 'Sin Registrar';
    }

    // 3. Extraer Teléfono
    const rawTel = mapping.telefono ? String(row[mapping.telefono] ?? '').trim() : '';
    const cleanTel = rawTel ? rawTel.replace(/[^\d\+\s]/g, '').trim() : null;

    // 4. Extraer Puesto de Votación
    const puesto = mapping.puesto_votacion
      ? String(row[mapping.puesto_votacion] ?? '').trim()
      : '';
    const puestoFinal = puesto || 'Sede Principal (Por Asignar)';

    // 5. Extraer Mesa
    let mesaFinal = 1;
    if (mapping.mesa && row[mapping.mesa] !== undefined && row[mapping.mesa] !== '') {
      const parsedMesa = parseInt(String(row[mapping.mesa]).replace(/\D/g, ''), 10);
      if (!isNaN(parsedMesa) && parsedMesa > 0) {
        mesaFinal = parsedMesa;
      }
    }

    // 6. Extraer Notas
    const notas = mapping.notas ? String(row[mapping.notas] ?? '').trim() : null;

    validRows.push({
      _rowNumber: rowNumber,
      cedula: cleanCedula,
      nombres,
      apellidos,
      telefono: cleanTel || null,
      puesto_votacion: puestoFinal,
      mesa: mesaFinal,
      notas: notas || null,
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
  };
};
