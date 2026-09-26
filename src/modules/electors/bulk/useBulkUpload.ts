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
import { validateAndNormalizeRows, enrichRowsWithCensus } from './validator';
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

      // Enriquecimiento y autocompletado con Censo Maestro
      const candidateCedulas = summary.validRows.length;
      setProgress((prev) => ({
        ...prev,
        status: 'enriching',
        totalToUpload: candidateCedulas,
        processed: 0,
        percentage: 0,
        currentChunkMessage: `Consultando Censo Maestro para ${candidateCedulas.toLocaleString('es-CO')} documentos...`,
      }));

      const enrichedSummary = await enrichRowsWithCensus(
        summary,
        (processed, total) => {
          if (!isMountedRef.current) return;
          const pct = total > 0 ? Math.round((processed / total) * 100) : 100;
          setProgress((prev) => ({
            ...prev,
            processed,
            percentage: pct,
            currentChunkMessage: `Verificando con Censo Maestro: ${processed.toLocaleString('es-CO')} / ${total.toLocaleString('es-CO')} documentos (${pct}%)...`,
          }));
        }
      );

      if (!isMountedRef.current) return;

      setPreflight(enrichedSummary);
      setProgress((prev) => ({
        ...prev,
        status: 'ready',
        totalToUpload: enrichedSummary.validRows.length,
        processed: 0,
        percentage: 0,
        currentChunkMessage: `${enrichedSummary.validRows.length.toLocaleString('es-CO')} registros listos para inserción por lotes (${enrichedSummary.enrichedCount || 0} enriquecidos desde el Censo).`,
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
    let cumulativeUpdated = 0;
    let cumulativeSkipped = 0;
    let cumulativeFailedChunks = 0;
    let lastErrorMessage: string | null = null;

    // Obtener ID de usuario y campaña activa en sesión
    let currentUserId: string | null = null;
    let currentUserName = 'Personal Autorizado';
    let activeTenantId = currentTenantId;

    if (isSupabaseConfigured) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id || null;
        if (uid) {
          // Verificar existencia en profiles para evitar violación de llave foránea
          const { data: profileCheck } = await (supabase.from('profiles') as any)
            .select('id, full_name, tenant_id')
            .eq('id', uid)
            .maybeSingle();

          const profile = profileCheck as { id: string; full_name?: string; tenant_id?: string } | null;

          if (profile?.id) {
            currentUserId = profile.id;
            currentUserName = profile.full_name || 'Personal Autorizado';
            if (!activeTenantId && profile.tenant_id) {
              activeTenantId = profile.tenant_id;
            }
          }
        }

        // Si aún no tenemos tenantId, consultar el primer tenant activo
        if (!activeTenantId) {
          const { data: tenantData } = await (supabase.from('tenants') as any)
            .select('id')
            .eq('is_active', true)
            .limit(1);
          if (tenantData && tenantData.length > 0) {
            activeTenantId = tenantData[0].id;
          }
        }
      } catch (authErr) {
        console.warn('Error resolviendo credenciales para bulk upload:', authErr);
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

    // Procesar cada chunk de registros
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
                edad: row.edad,
                telefono: row.telefono,
                puesto_votacion: row.puesto_votacion,
                mesa: row.mesa,
                notas: row.notas,
                registrado_por: currentUserId,
                tenant_id: activeTenantId || 'ten_alcaldia_2027',
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
        } catch (err: any) {
          console.error(`Error en chunk local ${chunkNumber}:`, err);
          cumulativeFailedChunks++;
          lastErrorMessage = err?.message || 'Error local';
        }
      } else {
        // MODO PRODUCCIÓN: SUPABASE CON RPC SEGURA DE ALTO RENDIMIENTO
        try {
          const payload = chunk.map((r) => ({
            cedula: r.cedula,
            nombres: r.nombres,
            apellidos: r.apellidos,
            edad: r.edad,
            telefono: r.telefono,
            puesto_votacion: r.puesto_votacion,
            mesa: r.mesa,
            notas: r.notas,
            registrado_por: currentUserId,
            tenant_id: activeTenantId,
          }));

          // Estrategia 1: Función RPC importar_electores_lote (Security Definer con edad y sincronización)
          const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)('importar_electores_lote', {
            p_electores: payload,
            p_tenant_id: activeTenantId,
            p_registrado_por: currentUserId,
            p_collision_mode: collisionMode,
          });

          if (!rpcErr && rpcRes && rpcRes.success) {
            cumulativeProcessed += rpcRes.processed || chunk.length;
            cumulativeSuccessful += rpcRes.inserted || 0;
            cumulativeUpdated += rpcRes.updated || 0;
            cumulativeSkipped += rpcRes.skipped || 0;
          } else {
            console.warn(`Lote ${chunkNumber}: RPC falló (${rpcErr?.message || rpcRes?.error}), aplicando inserción directa...`);
            // Estrategia 2: Fallback a upsert directo en tabla electores
            const { error: upsertError } = await (supabase.from('electores') as any).upsert(
              payload,
              {
                onConflict: 'cedula',
                ignoreDuplicates: collisionMode === 'skip',
              }
            );

            if (upsertError) {
              // Estrategia 3: Inserción directa
              const { error: insertError } = await (supabase.from('electores') as any).insert(payload);
              if (insertError) {
                lastErrorMessage = insertError.message || upsertError.message;
                throw insertError;
              }
            }

            cumulativeProcessed += chunk.length;
            cumulativeSuccessful += chunk.length;
          }
        } catch (err: any) {
          console.error(`Error al insertar lote ${chunkNumber} en Supabase:`, err);
          cumulativeFailedChunks++;
          lastErrorMessage = err?.message || 'Error de conexión o permisos en base de datos.';
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
      if (cumulativeSuccessful === 0 && cumulativeUpdated === 0 && cumulativeFailedChunks > 0) {
        // Fallaron todos los lotes
        setProgress((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: lastErrorMessage || 'No se pudieron guardar los registros. Verifique los datos o su conexión.',
        }));
      } else {
        const msg = cumulativeUpdated > 0
          ? `Importación completada: ${cumulativeSuccessful} nuevos y ${cumulativeUpdated} actualizados.`
          : `Importación completada con éxito: ${cumulativeSuccessful} registros incorporados al padrón.`;

        setProgress((prev) => ({
          ...prev,
          status: 'completed',
          percentage: 100,
          currentChunkMessage: msg,
        }));

        setPostSummary({
          fileName: preflight.fileName,
          totalProcessed: cumulativeProcessed,
          successful: cumulativeSuccessful,
          updated: cumulativeUpdated,
          skipped: cumulativeSkipped + preflight.invalidRows.length,
          errors: preflight.invalidRows.length + (cumulativeFailedChunks > 0 ? (totalRecords - cumulativeProcessed) : 0),
          durationMs,
        });

        // Notificar al contexto de tenants y recargar vistas
        try {
          refetchTenants?.();
          window.dispatchEvent(new CustomEvent('electoral_records_updated'));
        } catch {
          // ignore
        }
      }
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
