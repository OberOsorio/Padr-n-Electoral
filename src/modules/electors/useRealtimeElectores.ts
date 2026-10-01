import { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface UseRealtimeElectoresProps {
  tenantId?: string | null;
  enabled?: boolean;
  onInsert?: (nuevoElector: any) => void;
  onUpdate?: (electorActualizado: any) => void;
  onDelete?: (electorEliminadoId: string, oldRow?: any) => void;
}

export function useRealtimeElectores({
  tenantId,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeElectoresProps) {
  const [isConnected, setIsConnected] = useState(false);

  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete };
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled || !tenantId) {
      setIsConnected(false);
      return;
    }

    // Crear canal de suscripción WebSocket con filtro por tenant y REPLICA IDENTITY FULL
    const canal = supabase
      .channel(`realtime-electores-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'electores',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime DB] Nuevo elector registrado en vivo:', payload.new);
          callbacksRef.current.onInsert?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'electores',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime DB] Elector actualizado en vivo:', payload.new);
          callbacksRef.current.onUpdate?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'electores',
        },
        (payload) => {
          const oldRow = payload.old as any;
          if (oldRow?.tenant_id && oldRow.tenant_id !== tenantId) {
            return;
          }
          console.log('[Realtime DB] Elector eliminado en vivo:', oldRow);
          if (oldRow?.id) {
            callbacksRef.current.onDelete?.(oldRow.id, oldRow);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log(`[Realtime DB] Conectado exitosamente al canal de electores de la campaña: ${tenantId}`);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
        }
      });

    return () => {
      setIsConnected(false);
      supabase.removeChannel(canal);
    };
  }, [tenantId, enabled]);

  return { isConnected };
}
