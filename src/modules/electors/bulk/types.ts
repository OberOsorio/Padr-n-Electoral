export interface RawParsedRow {
  [key: string]: any;
}

export interface NormalizedElectorRow {
  _rowNumber: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  edad: number | null;
  telefono: string | null;
  puesto_votacion: string;
  mesa: number;
  notas: string | null;
  isAutofilled?: boolean;
  autofillSource?: 'censo_maestro' | 'file';
  nombre_original_archivo?: string;
  nombre_original?: string;
  nombre_completo?: string;
  nombre_fue_corregido?: boolean;
  nombre_corregido?: boolean;
  verificado_censo?: boolean;
  isEnriching?: boolean;
}

export interface RowValidationError {
  rowNumber: number;
  cedula: string;
  field: string;
  reason: string;
  rawData: RawParsedRow;
}

export interface PreflightSummary {
  fileName: string;
  fileSize: number;
  totalRawRows: number;
  validRows: NormalizedElectorRow[];
  invalidRows: RowValidationError[];
  duplicateCedulasInFile: number;
  enrichedCount?: number;
  correctedCount?: number;
  isEnrichingInProgress?: boolean;
  enrichmentProgress?: {
    processed: number;
    total: number;
  };
  detectedColumns: {
    original: string;
    mappedTo: string;
  }[];
}

export type CollisionMode = 'skip' | 'upsert';

export interface BatchProgress {
  status: 'idle' | 'parsing' | 'validating' | 'enriching' | 'ready' | 'uploading' | 'completed' | 'error';
  totalToUpload: number;
  processed: number;
  successful: number;
  skipped: number;
  failedChunks: number;
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  currentChunkMessage: string;
  errorMessage?: string;
}

export interface PostUploadSummary {
  fileName: string;
  totalProcessed: number;
  successful: number;
  updated?: number;
  skipped: number;
  errors: number;
  durationMs: number;
}
