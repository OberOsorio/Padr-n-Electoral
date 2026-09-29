import { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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
 * Filtra automáticamente por el tenant_id de la campaña activa para garantizar
 * aislamiento multi-tenant y prevenir fugas de datos.
 */
export function useElectorsRealtime({
  tenantId,
  enabled = true,
  onElectorInserted,
  onElectorDeleted,
  onElectorUpdated,
  onRefreshTotal,
}: UseElectorsRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);

  // Mantener los callbacks en un ref para evitar que cambios de función provoquen
  // desconexión y reconexión constante del canal WebSocket
  const callbacksRef = useRef({
    onElectorInserted,
    onElectorDeleted,
    onElectorUpdated,
    onRefreshTotal,
  });

  useEffect(() => {
    callbacksRef.current = {
      onElectorInserted,
      onElectorDeleted,
      onElectorUpdated,
      onRefreshTotal,
    };
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled || !tenantId) {
      setIsConnected(false);
      return;
    }

    // Nombre de canal único por campaña para evitar colisiones
    const channelName = `realtime-electores-tenant-${tenantId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha INSERT, UPDATE y DELETE
          schema: 'public',
          table: 'electores',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // 1. Inserción de un nuevo elector (manual o importación por lotes)
          if (payload.eventType === 'INSERT') {
            callbacksRef.current.onElectorInserted?.(payload.new);
            callbacksRef.current.onRefreshTotal?.();
          }

          // 2. Eliminación de un elector
          if (payload.eventType === 'DELETE') {
            callbacksRef.current.onElectorDeleted?.(payload.old);
            callbacksRef.current.onRefreshTotal?.();
          }

          // 3. Modificación de datos de un elector
          if (payload.eventType === 'UPDATE') {
            callbacksRef.current.onElectorUpdated?.(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log(`[Realtime] Conectado en vivo al canal del padrón: ${channelName}`);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
        }
      });

    // Limpieza estricta para prevenir fugas de memoria y sockets huérfanos
    return () => {
      setIsConnected(false);
      supabase.removeChannel(channel);
    };
  }, [tenantId, enabled]);

  return { isConnected };
}
