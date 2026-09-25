import { useState } from 'react';
import { useTeamManagement } from './useTeamManagement';
import { CreateMemberModal } from './components/CreateMemberModal';
import { AccessDeniedView } from './components/AccessDeniedView';
import type { AppRole } from '../../types';
import {
  Users,
  UserPlus,
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  Shield,
  UserX,
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
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Hook de gestión de equipo
  const {
    team,
    loading,
    error,
    toggleMemberStatus,
    changeMemberRole,
    createMember,
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
  const adminsCount = team.filter((m) => m.role === 'admin' && m.is_active).length;

  const handleToggle = async (id: string, currentStatus: boolean, name: string) => {
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
    try {
      const ok = await changeMemberRole(id, newRole);
      if (ok) {
        setActionMessage(
          `Rol de ${name} actualizado a ${newRole === 'admin' ? 'Administrador' : 'Coordinador'}.`
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Equipo y Coordinadores
          </h1>
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

      {/* Alerta de notificación flotante o de estado */}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Personal
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-slate-900 dark:text-[#F8FAFC] font-mono">
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
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              {coordinadoresActivos}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Operando en territorio
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Administradores
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-[#E5B869]">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-amber-600 dark:text-[#E5B869] font-mono">
              {adminsCount}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Control y auditoría central
          </p>
        </div>
      </div>

      {/* 3. Tabla Principal de Miembros de Equipo */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 shadow-xs dark:shadow-xl overflow-hidden">
        
        {/* Barra de Filtros de la Tabla */}
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
              <option value="admin" className="bg-white dark:bg-slate-900">Solo Administradores</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-100/70 dark:bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Miembro</th>
                <th className="py-3 px-4">Correo Institucional</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4 text-center">Estado de Acceso</th>
                <th className="py-3 px-4 text-center">Electores Registrados</th>
                <th className="py-3 px-4">Última Actividad</th>
                <th className="py-3 px-4 text-right">Interruptor de Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-full ml-auto" /></td>
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
                        Ajuste el criterio de búsqueda o añada un nuevo coordinador.
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

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
                    >
                      {/* Miembro / Nombre con Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${
                              member.role === 'admin'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-[#E5B869]'
                                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {member.full_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Correo Electrónico */}
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {member.email}
                        </span>
                      </td>

                      {/* Selector de Rol */}
                      <td className="py-3 px-4">
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
                            member.role === 'admin'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-[#E5B869]'
                              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-300'
                          }`}
                        >
                          <option value="coordinador" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300">
                            Coordinador
                          </option>
                          <option value="admin" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-[#E5B869]">
                            Admin
                          </option>
                        </select>
                      </td>

                      {/* Estado: Activo / Inactivo */}
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
                          {member.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Total Electores Registrados */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {member.totalElectores.toLocaleString()}
                      </td>

                      {/* Última Actividad */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatActivity(member.lastActivity)}
                      </td>

                      {/* Switch interactivo de activación / revocación */}
                      <td className="py-3 px-4 text-right">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
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
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createMember}
      />
    </div>
  );
};
