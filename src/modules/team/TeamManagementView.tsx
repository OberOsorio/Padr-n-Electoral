import { useState } from 'react';
import { useTeamManagement } from './useTeamManagement';
import { CreateMemberModal } from './components/CreateMemberModal';
import { EditMemberModal } from './components/EditMemberModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { AccessDeniedView } from './components/AccessDeniedView';
import type { AppRole, TeamMember } from '../../types';
import {
  Users,
  UserPlus,
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  Shield,
  ShieldAlert,
  Lock,
  UserX,
  Key,
  UserCheck,
  Award,
  Pencil,
} from 'lucide-react';

interface TeamManagementViewProps {
  isAdmin?: boolean;
  onNavigateToDashboard?: () => void;
}

export const TeamManagementView = ({
  isAdmin = true,
  onNavigateToDashboard,
}: TeamManagementViewProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedResetMember, setSelectedResetMember] = useState<TeamMember | null>(null);
  const [selectedEditMember, setSelectedEditMember] = useState<TeamMember | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Hook de gestión de equipo con aislamiento de tenant y reseteo
  const {
    team,
    loading,
    error,
    toggleMemberStatus,
    changeMemberRole,
    updateMember,
    createMember,
    resetMemberPassword,
    refetch,
  } = useTeamManagement();

  // Validación de seguridad estricta para rol admin
  if (!isAdmin) {
    return <AccessDeniedView onBackToDashboard={onNavigateToDashboard} />;
  }

  // Filtrado de la tabla de miembros
  const filteredTeam = team.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      member.email.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Métricas rápidas de cabecera
  const totalMiembros = team.length;
  const coordinadoresActivos = team.filter(
    (m) => m.role === 'coordinador' && m.is_active
  ).length;
  const lideresActivos = team.filter(
    (m) => m.role === 'lider' && m.is_active
  ).length;
  const totalElectoresReportados = team.reduce(
    (acc, m) => acc + (m.totalElectores || 0),
    0
  );

  const handleToggle = async (id: string, currentStatus: boolean, name: string) => {
    const targetMember = team.find((m) => m.id === id);
    if (targetMember?.role === 'admin') {
      setActionMessage('Las credenciales y estado del Titular de Campaña son inmutables desde este panel.');
      setTimeout(() => setActionMessage(null), 3500);
      return;
    }

    try {
      const ok = await toggleMemberStatus(id, currentStatus);
      if (ok) {
        setActionMessage(
          currentStatus
            ? `Acceso revocado para ${name}.`
            : `Cuenta activada exitosamente para ${name}.`
        );
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch {
      setActionMessage('Error al actualizar el estado del usuario.');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleRoleChange = async (id: string, newRole: AppRole, name: string) => {
    const targetMember = team.find((m) => m.id === id);
    if (targetMember?.role === 'admin') {
      setActionMessage('El rol del Titular de Campaña no puede ser alterado.');
      setTimeout(() => setActionMessage(null), 3500);
      return;
    }

    try {
      const ok = await changeMemberRole(id, newRole);
      if (ok) {
        setActionMessage(
          `Rol de ${name} actualizado a ${
            newRole === 'admin'
              ? 'Administrador'
              : newRole === 'coordinador'
              ? 'Coordinador'
              : 'Líder'
          }.`
        );
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch {
      setActionMessage('Error al actualizar el rol.');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const formatActivity = (isoString?: string | null) => {
    if (!isoString) return 'Sin actividad reciente';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return `Hace ${diffDays} d`;
    } catch {
      return 'Reciente';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-10 animate-in fade-in duration-300">
      {/* 1. Header de Vista Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Equipo y Accesos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de coordinadores, líderes y credenciales de acceso de la campaña.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shadow-xs dark:shadow-none shrink-0"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Miembro</span>
          </button>
        </div>
      </div>

      {/* Alerta de notificación de estado */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
          <span>{error}</span>
        </div>
      )}

      {/* 2. Métricas del Equipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Equipo
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-slate-900 dark:text-white font-mono">
              {totalMiembros}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Cuentas registradas
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Coordinadores Activos
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-blue-600 dark:text-blue-400 font-mono">
              {coordinadoresActivos}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Supervisión territorial
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Líderes Activos
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {lideresActivos}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Enrolamiento en terreno
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Votos Reportados
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-[#E5B869]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-amber-600 dark:text-[#E5B869] font-mono">
              {totalElectoresReportados}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Por el equipo en campaña
          </p>
        </div>
      </div>

      {/* 3. Tabla Principal de Miembros de Equipo */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 shadow-xs dark:shadow-xl overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full h-9.5 pl-10 pr-3.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-9.5 px-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">Todos los Roles</option>
              <option value="coordinador" className="bg-white dark:bg-slate-900">Solo Coordinadores</option>
              <option value="lider" className="bg-white dark:bg-slate-900">Solo Líderes</option>
              <option value="admin" className="bg-white dark:bg-slate-900">Solo Administradores</option>
            </select>
          </div>
        </div>

        {/* Tabla de Miembros */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-100/70 dark:bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Miembro</th>
                <th className="py-3 px-4">Correo Registrado</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center min-w-[160px]">Electores y Meta</th>
                <th className="py-3 px-4">Última Actividad</th>
                <th className="py-3 px-4 text-right">Acciones de Acceso</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserX className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-white">
                        No se encontraron miembros de equipo
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ajuste el criterio de búsqueda o cree un nuevo coordinador o líder.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => {
                  const initials = member.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const isAdminMember = member.role === 'admin';

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
                    >
                      {/* Miembro / Nombre */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${
                              isAdminMember
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : member.role === 'lider'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {member.full_name}
                            </p>
                            {isAdminMember && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono block">
                                Titular de Campaña
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{member.email || 'Sin correo registrado'}</span>
                        </span>
                      </td>

                      {/* Selector / Badge de Rol */}
                      <td className="py-3 px-4">
                        {isAdminMember ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ADMIN / CANDIDATO
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.id,
                                e.target.value as AppRole,
                                member.full_name
                              )
                            }
                            className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors ${
                              member.role === 'lider'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-300'
                            }`}
                          >
                            <option value="coordinador" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300">
                              Coordinador
                            </option>
                            <option value="lider" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400">
                              Líder
                            </option>
                          </select>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                            member.is_active
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.is_active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'
                            }`}
                          />
                          {member.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>

                      {/* Total Electores Reportados y Meta */}
                      <td className="py-3 px-4">
                        {isAdminMember ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                              {member.totalElectores.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              General (Sin cuota)
                            </span>
                          </div>
                        ) : (
                          (() => {
                            const targetMeta = member.meta_electores && member.meta_electores > 0 ? member.meta_electores : 100;
                            const count = member.totalElectores || 0;
                            const pct = Math.round((count / targetMeta) * 100);
                            const isReached = count >= targetMeta;
                            const progressWidth = Math.min(100, pct);

                            return (
                              <div className="flex flex-col items-center justify-center min-w-[130px] max-w-[170px] mx-auto space-y-1.5">
                                <div className="flex items-center justify-between w-full font-mono text-xs px-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {count.toLocaleString()}
                                    <span className="font-normal text-slate-400 dark:text-slate-500"> / {targetMeta.toLocaleString()}</span>
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold ${
                                      isReached
                                        ? 'text-emerald-600 dark:text-emerald-400 font-mono'
                                        : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </div>

                                {/* Barra de progreso */}
                                <div className="w-full h-1.5 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isReached
                                        ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                                        : pct > 50
                                        ? 'bg-blue-600'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${progressWidth}%` }}
                                  />
                                </div>

                                {/* Micro-badge cuando alcanza o supera la meta */}
                                {isReached && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>Meta Alcanzada</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </td>

                      {/* Última Actividad */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatActivity(member.lastActivity)}
                      </td>

                      {/* Acciones de Acceso: Switch y Botón Resetear Clave */}
                      <td className="py-3 px-4 text-right">
                        {isAdminMember ? (
                          <div
                            className="flex items-center justify-end gap-2 text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                            title="Las credenciales del titular de campaña no pueden ser modificadas desde este panel"
                          >
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span className="text-[11px] text-slate-500">Inmutable</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2.5">
                            {/* 1. Botón de Editar Información y Meta */}
                            <button
                              type="button"
                              onClick={() => setSelectedEditMember(member)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                              title="Editar colaborador y meta"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* 2. Botón de Cambiar Contraseña */}
                            <button
                              type="button"
                              onClick={() => setSelectedResetMember(member)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                              title="Cambiar contraseña de acceso"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            {/* 3. Switch Activo / Suspendido */}
                            <label
                              className="relative inline-flex items-center cursor-pointer select-none"
                              title={member.is_active ? "Suspender acceso" : "Activar acceso"}
                            >
                              <input
                                type="checkbox"
                                checked={member.is_active}
                                onChange={() =>
                                  handleToggle(member.id, member.is_active, member.full_name)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600 transition-colors" />
                            </label>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Invitación */}
      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
        onCreate={async (data) => {
          const ok = await createMember(data);
          if (ok) {
            await refetch();
            setActionMessage(`Miembro ${data.full_name} creado y asignado exitosamente.`);
            setTimeout(() => setActionMessage(null), 3500);
          }
          return ok;
        }}
      />

      {/* Modal de Edición de Colaborador y Meta */}
      <EditMemberModal
        isOpen={!!selectedEditMember}
        member={selectedEditMember}
        onClose={() => setSelectedEditMember(null)}
        onUpdate={async (id, data) => {
          const ok = await updateMember(id, data);
          if (ok) {
            await refetch();
            setActionMessage(`Información de ${data.full_name} actualizada exitosamente.`);
            setTimeout(() => setActionMessage(null), 3500);
          }
          return ok;
        }}
      />

      {/* Modal de Reseteo de Contraseña */}
      <ResetPasswordModal
        isOpen={!!selectedResetMember}
        member={selectedResetMember}
        onClose={() => setSelectedResetMember(null)}
        onResetPassword={resetMemberPassword}
      />
    </div>
  );
};

