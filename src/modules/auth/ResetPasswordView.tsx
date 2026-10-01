import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check } from 'lucide-react';

export const ResetPasswordView: React.FC = () => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword,
      });

      if (error) throw error;
      setCompletado(true);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
      <div className="bg-[#0b1326] border border-[#16223e] p-8 rounded-3xl max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Restablecer Contraseña</h2>
        <p className="text-xs text-slate-400 mb-6">Ingresa tu nueva contraseña para acceder a la plataforma.</p>

        {completado ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6"/>
            </div>
            <p className="text-sm font-bold text-white">¡Contraseña actualizada con éxito!</p>
            <a href="/login" className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all">
              Ir a Iniciar Sesión
            </a>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">{error}</div>}
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="w-full bg-[#060a14] border border-[#16223e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full bg-[#060a14] border border-[#16223e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              {cargando ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
