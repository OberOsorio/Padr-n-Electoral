import { useRealtimeElectores } from './useRealtimeElectores';

export interface UseElectorsRealtimeOptions {
  tenantId?: string | null;
  enabled?: boolean;
  onElectorInserted?: (payload: any) => void;
  onElectorDeleted?: (payload: any) => void;
  onElectorUpdated?: (payload: any) => void;
  onRefreshTotal?: () => void;
}

/**
 * Hook para gestionar la suscripción en tiempo real (Supabase Realtime WebSocket)
 * a los eventos INSERT, UPDATE y DELETE de la tabla 'public.electores'.
 */
export function useElectorsRealtime({
  tenantId,
  enabled = true,
  onElectorInserted,
  onElectorDeleted,
  onElectorUpdated,
  onRefreshTotal,
}: UseElectorsRealtimeOptions) {
  return useRealtimeElectores({
    tenantId,
    enabled,
    onInsert: (nuevoElector) => {
      onElectorInserted?.(nuevoElector);
      onRefreshTotal?.();
    },
    onUpdate: (electorActualizado) => {
      onElectorUpdated?.(electorActualizado);
    },
    onDelete: (idEliminado, oldRow) => {
      onElectorDeleted?.(oldRow || { id: idEliminado });
      onRefreshTotal?.();
    },
  });
}
