import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, KeyRound, Loader2, CheckCircle2, Power } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { UserNode } from './useUsersTree';
import { enviarSolicitudRecuperacion } from './authRecoveryService';
import { ConfirmActionModal } from './ConfirmActionModal';

const ROLE_BADGES: Record<string, { label: string; bg: string }> = {
  admin: { label: 'DIRECTOR / ADMIN', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  candidato: { label: 'CANDIDATO', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  coordinador: { label: 'COORDINADOR', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  lider: { label: 'LÍDER', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  superadmin: { label: 'MASTER', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

interface UserTreeNodeProps {
  node: UserNode;
  level?: number;
  onToggleStatus: (userId: string, currentStatus: boolean) => void | Promise<void>;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
  searchMatchIds?: Set<string>;
  searchTerm?: string;
}

interface UserStatusToggleProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  onStatusChange?: (userId: string, currentStatus: boolean) => void | Promise<void>;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export const UserStatusToggle: React.FC<UserStatusToggleProps> = ({
  user,
  onStatusChange,
  onNotify,
}) => {
  const [isActive, setIsActive] = useState(user.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setIsActive(user.is_active ?? true);
  }, [user.is_active]);

  const handleOpenConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    const nuevoEstado = !isActive;

    try {
      setLoading(true);

      const { error } = await (supabase.from('profiles') as any)
        .update({
          is_active: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsActive(nuevoEstado);
      setIsConfirmOpen(false);

      if (onStatusChange) {
        await onStatusChange(user.id, isActive);
      }
    } catch (err: any) {
      console.error('Error al cambiar estado del usuario:', err);
      onNotify?.(
        `No se pudo actualizar el estado: ${err.message || 'Error del servidor'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenConfirm}
        disabled={loading}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 ${
          isActive
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400 hover:bg-rose-950/30 hover:border-rose-800/50 hover:text-rose-300'
            : 'bg-rose-950/30 border-rose-800/40 text-rose-400 hover:bg-emerald-950/30 hover:border-emerald-800/50 hover:text-emerald-300'
        }`}
        title={isActive ? 'Clic para suspender usuario' : 'Clic para reactivar usuario'}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isActive
                ? 'bg-emerald-400 group-hover:bg-rose-400'
                : 'bg-rose-500 group-hover:bg-emerald-400'
            }`}
          />
        )}

        <span>
          {loading ? 'Guardando...' : isActive ? 'Activo' : 'Suspendido'}
        </span>

        <Power className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
      </button>

      <ConfirmActionModal
        isOpen={isConfirmOpen}
        onClose={() => !loading && setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        loading={loading}
        isDestructive={isActive}
        title={
          isActive
            ? '¿Suspender acceso de usuario?'
            : '¿Reactivar acceso de usuario?'
        }
        description={
          isActive
            ? 'El usuario perderá de inmediato el acceso a la plataforma y sus sesiones activas serán invalidadas.'
            : 'Se restablecerán de inmediato los privilegios de acceso para este usuario.'
        }
        userName={user.full_name}
        userEmail={user.email}
        confirmText={
          isActive ? 'Sí, Suspender Cuenta' : 'Sí, Reactivar Acceso'
        }
        cancelText="Cancelar"
      />
    </>
  );
};

export const UserTreeNodeActions: React.FC<{
  node: UserNode;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}> = ({ node, onNotify }) => {
  const [enviando, setEnviando] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleOpenConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleConfirmRecuperacion = async () => {
    try {
      setEnviando(true);
      await enviarSolicitudRecuperacion(node.email, node.full_name);

      setIsConfirmOpen(false);
      setEnviadoExito(true);
      setTimeout(() => setEnviadoExito(false), 4000);

      onNotify?.(
        `Solicitud enviada: Se enviaron las instrucciones de acceso directamente al correo de ${node.full_name} (${node.email}).`,
        'success'
      );
    } catch (err: any) {
      onNotify?.(
        `No se pudo enviar el correo de recuperación: ${err.message || 'Error del servidor'}`,
        'error'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botón Restaurar Contraseña Asistida */}
      <button
        type="button"
        disabled={enviando || !node.is_active}
        onClick={handleOpenConfirm}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
          enviadoExito
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : 'bg-[#0b1427] border-[#1c2e56] text-slate-300 hover:text-white hover:border-sky-500/50 hover:bg-[#101e3d] active:scale-95'
        } disabled:opacity-50`}
        title={`Enviar correo de recuperación a ${node.email}`}
      >
        {enviando ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
        ) : enviadoExito ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <KeyRound className="w-3.5 h-3.5 text-sky-400" />
        )}

        <span className="hidden md:inline">
          {enviando
            ? 'Enviando...'
            : enviadoExito
            ? 'Enlace Enviado'
            : 'Recuperar Contraseña'}
        </span>
      </button>

      <ConfirmActionModal
        isOpen={isConfirmOpen}
        onClose={() => !enviando && setIsConfirmOpen(false)}
        onConfirm={handleConfirmRecuperacion}
        loading={enviando}
        isDestructive={false}
        variant="info"
        title="¿Enviar enlace de recuperación?"
        description="Se enviará un correo oficial con un enlace único y seguro para que el usuario restablezca su propia contraseña."
        userName={node.full_name}
        userEmail={node.email}
        confirmText="Enviar Instrucciones"
        cancelText="Cancelar"
      />
    </div>
  );
};

export const UserTreeNode: React.FC<UserTreeNodeProps> = ({
  node,
  level = 0,
  onToggleStatus,
  onNotify,
  searchMatchIds,
  searchTerm = '',
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const roleConfig = ROLE_BADGES[node.role] || ROLE_BADGES.lider;

  // Auto-expandir si algún descendiente o el nodo mismo coincide con la búsqueda
  useEffect(() => {
    if (searchTerm && searchMatchIds) {
      const hasMatchInSubtree = (n: UserNode): boolean => {
        if (searchMatchIds.has(n.id)) return true;
        return (n.children || []).some(hasMatchInSubtree);
      };
      if (hasMatchInSubtree(node)) {
        setExpanded(true);
      }
    }
  }, [searchTerm, searchMatchIds, node]);

  const isMatched = searchMatchIds?.has(node.id);

  return (
    <div className="relative">
      {/* Contenedor del Usuario */}
      <div
        className={`flex items-center justify-between p-3 my-1.5 rounded-2xl bg-[#090f1e] border transition-all ${
          isMatched
            ? 'border-blue-500/60 bg-blue-950/20 shadow-md shadow-blue-500/10'
            : 'border-[#162342] hover:border-slate-700'
        } ${level > 0 ? 'ml-4 sm:ml-6' : ''}`}
      >
        {/* Lado Izquierdo: Botón Toggle + Avatar + Info */}
        <div className="flex items-center gap-3 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={expanded ? 'Colapsar subordinados' : 'Desplegar subordinados'}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center text-slate-600 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          )}

          {/* Avatar con Iniciales */}
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
            {node.full_name ? node.full_name.substring(0, 2).toUpperCase() : 'US'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-100 truncate">
                {node.full_name}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${roleConfig.bg}`}>
                {roleConfig.label}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block truncate font-mono">
              {node.email}
            </span>
          </div>
        </div>

        {/* Lado Derecho: Subordinados + Acciones + Estado */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {hasChildren && (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
              <strong className="text-slate-200">{node.children?.length}</strong> a cargo
            </span>
          )}

          <UserTreeNodeActions node={node} onNotify={onNotify} />

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <UserStatusToggle user={node} onStatusChange={onToggleStatus} onNotify={onNotify} />
        </div>
      </div>

      {/* Renderizado recursivo de Subordinados con línea guía de árbol */}
      {hasChildren && expanded && (
        <div className="border-l-2 border-slate-800/80 ml-4 sm:ml-6 pl-2 space-y-1">
          {node.children!.map((child) => (
            <UserTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggleStatus={onToggleStatus}
              onNotify={onNotify}
              searchMatchIds={searchMatchIds}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};
