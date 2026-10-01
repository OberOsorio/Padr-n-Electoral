import React, { useState, useMemo } from 'react';
import { X, UserPlus, Building, User, Mail, Lock, Shield, GitFork, Loader2, ChevronDown } from 'lucide-react';
import type { TenantTreeGroup, UserNode } from './useUsersTree';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: TenantTreeGroup[];
  allUsers: UserNode[];
  onCreateUser: (params: {
    fullName: string;
    email: string;
    password?: string;
    role: 'admin' | 'candidato' | 'coordinador' | 'lider';
    tenantId: string;
    parentId?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  tenants,
  allUsers,
  onCreateUser,
}) => {
  const [tenantId, setTenantId] = useState(tenants[0]?.tenantId || '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Campana2026*');
  const [role, setRole] = useState<'admin' | 'candidato' | 'coordinador' | 'lider'>('coordinador');
  const [parentId, setParentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lista de posibles supervisores en la campaña seleccionada
  const supervisoresDisponibles = useMemo(() => {
    if (!tenantId) return [];
    return allUsers.filter((u) => u.tenant_id === tenantId);
  }, [allUsers, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setErrorMsg('Selecciona una campaña para vincular al usuario.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await onCreateUser({
      fullName,
      email,
      password,
      role,
      tenantId,
      parentId: parentId ? parentId : null,
    });

    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al crear el usuario.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#090f1d] border border-[#162342] rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-[#141e36] flex items-center justify-between bg-[#070b16]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/25">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Nuevo Usuario en Jerarquía</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Asignar rol y posición en el árbol operativo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Selector de Campaña / Tenant */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Campaña / Organización
            </label>
            <div className="relative flex items-center bg-[#060a14] border border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
              <Building className="w-4 h-4 text-purple-400 mr-2.5 shrink-0" />
              <select
                value={tenantId}
                onChange={(e) => {
                  setTenantId(e.target.value);
                  setParentId(''); // reset parent upon campaign switch
                }}
                required
                className="w-full bg-transparent text-sm text-white focus:outline-none font-semibold cursor-pointer appearance-none pr-6"
              >
                {tenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId} className="bg-[#090f1d] text-white">
                    {t.tenantName} ({t.municipio})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Nombre y Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Nombre Completo
              </label>
              <div className="flex items-center bg-[#060a14] border border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="flex items-center bg-[#060a14] border border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@ejemplo.com"
                  className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Rol y Superior en Jerarquía */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selector de Rol */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Rol Operativo
              </label>
              <div className="relative flex items-center bg-[#060a14] border border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <Shield className="w-4 h-4 text-blue-400 mr-2.5 shrink-0" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none font-semibold cursor-pointer appearance-none pr-6"
                >
                  <option value="coordinador" className="bg-[#090f1d] text-white">Coordinador Territorial</option>
                  <option value="lider" className="bg-[#090f1d] text-white">Líder de Puesto / Barrio</option>
                  <option value="admin" className="bg-[#090f1d] text-white">Director General / Admin</option>
                  <option value="candidato" className="bg-[#090f1d] text-white">Candidato</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* A quién reporta (Parent Node) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                A Quién Reporta (Superior)
              </label>
              <div className="relative flex items-center bg-[#060a14] border border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <GitFork className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0" />
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none font-semibold cursor-pointer appearance-none pr-6 truncate"
                >
                  <option value="" className="bg-[#090f1d] text-white">
                    -- Sin superior (Nodo Raíz / Director) --
                  </option>
                  {supervisoresDisponibles.map((sup) => (
                    <option key={sup.id} value={sup.id} className="bg-[#090f1d] text-white">
                      [{sup.role.toUpperCase()}] {sup.full_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Contraseña Inicial */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Contraseña Temporal de Acceso
            </label>
            <div className="flex items-center bg-[#060a14] border border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
              <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#141e36]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Creando...' : 'Asignar a Estructura'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
