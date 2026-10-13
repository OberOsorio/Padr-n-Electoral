import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface UseVotesCountOptions {
  currentUserId?: string;
  tenantId?: string | null;
  isOwnerMode?: boolean;
}

export function useLeaderVotesCount({
  currentUserId,
  tenantId,
  isOwnerMode = false,
}: UseVotesCountOptions) {
  const [votesCount, setVotesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchExactCount = useCallback(async () => {
    try {
      setLoading(true);

      // Consulta de conteo directo exacta (head: true evita transferir filas pesadas)
      let query = (supabase.from('electores') as any)
        .select('*', { count: 'exact', head: true });

      // 1. Filtrar por campaña si existe
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // 2. Si no es propietario global, filtrar estrictamente por el líder actual (registrado_por)
      if (!isOwnerMode && currentUserId) {
        query = query.eq('registrado_por', currentUserId);
      }

      const { count, error } = await query;

      if (error) throw error;
      setVotesCount(count || 0);
    } catch (err) {
      console.error('Error obteniendo conteo real de votos:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, tenantId, isOwnerMode]);

  useEffect(() => {
    fetchExactCount();

    // Suscripción en tiempo real para que el badge cambie apenas se registre o elimine un elector
    const channel = supabase
      .channel(`electores_count_sync_${currentUserId || 'global'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'electores' },
        () => {
          fetchExactCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExactCount, currentUserId]);

  return { votesCount, loading, refreshCount: fetchExactCount };
}
