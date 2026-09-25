import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import type {
  PreflightSummary,
  BatchProgress,
  CollisionMode,
  PostUploadSummary,
} from './types';
import {
  parseFileToRawRows,
  downloadOfficialTemplate,
  downloadValidationErrorsReport,
} from './parser';
import { validateAndNormalizeRows } from './validator';
import type { ElectorWithRegistrant } from '../../../types';
import { useTenant } from '../../../context/TenantContext';

const CHUNK_SIZE = 1000;

export const useBulkUpload = () => {
  const { currentTenantId, refetchTenants } = useTenant();
  const [file, setFile] = useState<File | null>(null);
  const [preflight, setPreflight] = useState<PreflightSummary | null>(null);
  const [collisionMode, setCollisionMode] = useState<CollisionMode>('skip');
  const [progress, setProgress] = useState<BatchProgress>({
    status: 'idle',
    totalToUpload: 0,
    processed: 0,
    successful: 0,
    skipped: 0,
    failedChunks: 0,
    currentChunk: 0,
    totalChunks: 0,
    percentage: 0,
    currentChunkMessage: '',
  });
  const [postSummary, setPostSummary] = useState<PostUploadSummary | null>(null);

  const isMountedRef = useRef(true);

  // 1. Procesar archivo seleccionado (Parsing y Validación Previa)
  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setPostSummary(null);
    setProgress({
      status: 'parsing',
      totalToUpload: 0,
      processed: 0,
      successful: 0,
      skipped: 0,
      failedChunks: 0,
      currentChunk: 0,
      totalChunks: 0,
      percentage: 0,
      currentChunkMessage: 'Extrayendo y decodificando registros del archivo...',
    });

    try {
      const rawRows = await parseFileToRawRows(selectedFile);

      if (!isMountedRef.current) return;

      setProgress((prev) => ({
        ...prev,
        status: 'validating',
        currentChunkMessage: 'Auditando integridad de documentos, nombres y puestos...',
      }));

      // Validación previa
      const summary = validateAndNormalizeRows(
        rawRows,
        selectedFile.name,
        selectedFile.size
      );

      if (!isMountedRef.current) return;

      setPreflight(summary);
      setProgress((prev) => ({
        ...prev,
        status: 'ready',
        totalToUpload: summary.validRows.length,
        currentChunkMessage: `${summary.validRows.length} registros listos para inserción por lotes.`,
      }));
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('Error durante la validación previa:', err);
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Error al procesar el archivo seleccionado.',
      }));
    }
  }, []);

  // 2. Motor de Inserción por Lotes (Chunking Engine de 500 registros)
  const startBatchImport = useCallback(async () => {
    if (!preflight || preflight.validRows.length === 0) return;

    const startTime = performance.now();
    const rowsToProcess = preflight.validRows;
    const totalRecords = rowsToProcess.length;
    const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

    setProgress({
      status: 'uploading',
      totalToUpload: totalRecords,
      processed: 0,
      successful: 0,
      skipped: 0,
      failedChunks: 0,
      currentChunk: 0,
      totalChunks,
      percentage: 0,
      currentChunkMessage: `Iniciando inserción por lotes (${CHUNK_SIZE} registros por bloque)...`,
    });

    let cumulativeProcessed = 0;
    let cumulativeSuccessful = 0;
    let cumulativeSkipped = 0;
    let cumulativeFailedChunks = 0;

    // Obtener ID de usuario en sesión
    let currentUserId: string | null = null;
    let currentUserName = 'Personal Autorizado';

    if (isSupabaseConfigured) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        currentUserId = sessionData.session?.user?.id || null;
      } catch {
        currentUserId = null;
      }
    } else {
      const demoAuth = localStorage.getItem('electoral_demo_auth');
      if (demoAuth) {
        try {
          const parsed = JSON.parse(demoAuth);
          currentUserId = parsed.id || 'demo-admin-id';
          currentUserName = parsed.full_name || 'Administrador General';
        } catch {
          currentUserId = 'demo-admin-id';
        }
      }
    }

    // Procesar cada chunk de 500 registros
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startIdx = chunkIndex * CHUNK_SIZE;
      const endIdx = Math.min(startIdx + CHUNK_SIZE, totalRecords);
      const chunk = rowsToProcess.slice(startIdx, endIdx);

      const chunkNumber = chunkIndex + 1;

      if (!isMountedRef.current) break;

      setProgress((prev) => ({
        ...prev,
        currentChunk: chunkNumber,
        currentChunkMessage: `Procesando lote ${chunkNumber} de ${totalChunks} (${chunk.length} registros)...`,
      }));

      if (!isSupabaseConfigured) {
        // MODO DEMO / LOCALSTORAGE CON CONTROL DE COLISIONES
        try {
          const stored = localStorage.getItem('electoral_local_electors');
          const currentList: ElectorWithRegistrant[] = stored ? JSON.parse(stored) : [];
          const existingMap = new Map(currentList.map((e) => [e.cedula, e]));

          let chunkSuccess = 0;
          let chunkSkipped = 0;

          chunk.forEach((row) => {
            const exists = existingMap.has(row.cedula);

            if (exists && collisionMode === 'skip') {
              chunkSkipped++;
            } else {
              const electorRecord: ElectorWithRegistrant = {
                id: exists ? existingMap.get(row.cedula)!.id : `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                cedula: row.cedula,
                nombres: row.nombres,
                apellidos: row.apellidos,
                telefono: row.telefono,
                puesto_votacion: row.puesto_votacion,
                mesa: row.mesa,
                notas: row.notas,
                registrado_por: currentUserId,
                tenant_id: currentTenantId || 'ten_alcaldia_2027',
                created_at: exists ? existingMap.get(row.cedula)!.created_at : new Date().toISOString(),
                registrador: {
                  full_name: currentUserName,
                  role: 'admin',
                },
              };

              existingMap.set(row.cedula, electorRecord);
              chunkSuccess++;
            }
          });

          localStorage.setItem(
            'electoral_local_electors',
            JSON.stringify(Array.from(existingMap.values()))
          );

          cumulativeProcessed += chunk.length;
          cumulativeSuccessful += chunkSuccess;
          cumulativeSkipped += chunkSkipped;

          // Pequeña pausa simulada para suavidad de UI (40ms)
          await new Promise((res) => setTimeout(res, 40));
        } catch (err) {
          console.error(`Error en chunk local ${chunkNumber}:`, err);
          cumulativeFailedChunks++;
        }
      } else {
        // MODO PRODUCCIÓN: SUPABASE CON BATCH UPSERT
        try {
          const payload = chunk.map((r) => ({
            cedula: r.cedula,
            nombres: r.nombres,
            apellidos: r.apellidos,
            telefono: r.telefono,
            puesto_votacion: r.puesto_votacion,
            mesa: r.mesa,
            notas: r.notas,
            registrado_por: currentUserId,
            ...(currentTenantId ? { tenant_id: currentTenantId } : {}),
          }));

          const { error } = await (supabase.from('electores') as any).upsert(
            payload,
            {
              onConflict: 'cedula',
              ignoreDuplicates: collisionMode === 'skip',
            }
          );

          if (error) throw error;

          cumulativeProcessed += chunk.length;
          cumulativeSuccessful += chunk.length;
        } catch (err) {
          console.error(`Error al insertar lote ${chunkNumber} en Supabase:`, err);
          cumulativeFailedChunks++;
        }
      }

      if (isMountedRef.current) {
        const pct = Math.round((cumulativeProcessed / totalRecords) * 100);
        setProgress((prev) => ({
          ...prev,
          processed: cumulativeProcessed,
          successful: cumulativeSuccessful,
          skipped: cumulativeSkipped,
          failedChunks: cumulativeFailedChunks,
          percentage: pct,
          currentChunkMessage: `Progreso: ${cumulativeProcessed.toLocaleString('es-CO')} / ${totalRecords.toLocaleString('es-CO')} registros procesados (${pct}%)`,
        }));
      }
    }

    const durationMs = Math.round(performance.now() - startTime);

    if (isMountedRef.current) {
      setProgress((prev) => ({
        ...prev,
        status: 'completed',
        percentage: 100,
        currentChunkMessage: `Importación completada con éxito. ${cumulativeSuccessful} registros incorporados al padrón.`,
      }));

      setPostSummary({
        fileName: preflight.fileName,
        totalProcessed: cumulativeProcessed,
        successful: cumulativeSuccessful,
        skipped: cumulativeSkipped + preflight.invalidRows.length,
        errors: preflight.invalidRows.length,
        durationMs,
      });

      refetchTenants?.();
    }
  }, [preflight, collisionMode, currentTenantId, refetchTenants]);

  // 3. Resetear flujo
  const resetUpload = useCallback(() => {
    setFile(null);
    setPreflight(null);
    setPostSummary(null);
    setProgress({
      status: 'idle',
      totalToUpload: 0,
      processed: 0,
      successful: 0,
      skipped: 0,
      failedChunks: 0,
      currentChunk: 0,
      totalChunks: 0,
      percentage: 0,
      currentChunkMessage: '',
    });
  }, []);

  return {
    file,
    preflight,
    progress,
    postSummary,
    collisionMode,
    setCollisionMode,
    processFile,
    startBatchImport,
    resetUpload,
    downloadOfficialTemplate,
    downloadErrorsReport: () => {
      if (preflight && preflight.invalidRows.length > 0) {
        downloadValidationErrorsReport(preflight.invalidRows, preflight.fileName);
      }
    },
  };
};
