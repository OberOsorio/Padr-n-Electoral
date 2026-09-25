import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseIdleTimeoutProps {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  enabled?: boolean;
}

export const useIdleTimeout = ({
  timeoutMinutes = 60,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutProps = {}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('electoral_demo_auth');
      sessionStorage.clear();

      // Notificar o redirigir
      if (onTimeout) {
        onTimeout();
      } else {
        window.location.href = '/login?reason=session_timeout';
      }
    } catch (error) {
      console.error('Error cerrando sesión por inactividad:', error);
      if (onTimeout) {
        onTimeout();
      } else {
        window.location.href = '/login';
      }
    }
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (enabled) {
      timerRef.current = setTimeout(handleLogout, timeoutMs);
    }
  }, [enabled, handleLogout, timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // Eventos de interacción del usuario que reinician el temporizador
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Iniciar temporizador al montar
    resetTimer();

    // Throttle o debounced event listener para evitar saturar el hilo principal
    let lastActivity = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Solo resetear si han pasado más de 1000ms desde el último evento
      if (now - lastActivity > 1000) {
        lastActivity = now;
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, resetTimer, timeoutMs]);
};
