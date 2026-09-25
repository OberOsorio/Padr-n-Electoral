export interface RawParsedRow {
  [key: string]: any;
}

export interface NormalizedElectorRow {
  _rowNumber: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  puesto_votacion: string;
  mesa: number;
  notas: string | null;
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
  detectedColumns: {
    original: string;
    mappedTo: string;
  }[];
}

export type CollisionMode = 'skip' | 'upsert';

export interface BatchProgress {
  status: 'idle' | 'parsing' | 'validating' | 'ready' | 'uploading' | 'completed' | 'error';
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
  skipped: number;
  errors: number;
  durationMs: number;
}
