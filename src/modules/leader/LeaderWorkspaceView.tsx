import React, { useState, useRef } from 'react';
import {
  Target,
  UserPlus,
  Users,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderWorkspace } from './useLeaderWorkspace';
import { PREDEFINED_POLLING_PLACES } from '../electors/constants';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import type { CollisionCheckResult, ElectorWithRegistrant } from '../../types';
import { LeaderDashboardView } from './LeaderDashboardView';
import { LeaderRegisterView } from './LeaderRegisterView';
import { LeaderMyElectorsView } from './LeaderMyElectorsView';
import { EditElectorModal } from '../electors/components/EditElectorModal';
import { DeleteConfirmModal } from '../electors/components/DeleteConfirmModal';
import { buscarCiudadanoEnCenso } from '../../services/censoService';

interface LeaderWorkspaceViewProps {
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string | null;
  tenantName?: string;
  onSignOut: () => void;
}

export const LeaderWorkspaceView: React.FC<LeaderWorkspaceViewProps> = ({
  userId,
  userName,
  userEmail: _userEmail,
  tenantId,
  tenantName = 'Campaña Electoral',
  onSignOut,
}) => {
  const {
    electors,
    loading,
    personalGoal,
    saveGoal,
    registerElector,
    deleteElector,
    updateElector,
    checkCollision,
    markWhatsAppSent,
    stats,
  } = useLeaderWorkspace(userId, tenantId);

  // Active navigation tab for leader
  const [activeTab, setActiveTab] = useState<'goal' | 'register' | 'list'>('goal');

  // Estados para modales de edición y eliminación de electores
  const [editingElector, setEditingElector] = useState<ElectorWithRegistrant | null>(null);
  const [deletingElector, setDeletingElector] = useState<ElectorWithRegistrant | null>(null);

  // Form states for voter registration
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [puestoVotacion, setPuestoVotacion] = useState(PREDEFINED_POLLING_PLACES[0].name);
  const [mesa, setMesa] = useState<number>(1);
  const [notas, setNotas] = useState('');

  // Collision and Censo check state
  const [isCheckingCedula, setIsCheckingCedula] = useState(false);
  const [isAutofilledFromCenso, setIsAutofilledFromCenso] = useState(false);
  const [collisionResult, setCollisionResult] = useState<CollisionCheckResult | null>(null);

  // Form submit state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastRegistered, setLastRegistered] = useState<{
    nombres: string;
    telefono?: string;
    puesto: string;
    mesa: number;
  } | null>(null);

  // List search query
  const [searchQuery, setSearchQuery] = useState('');

  // Goal modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(personalGoal);

  // Debounce ref for cédula verification
  const debounceTimerRef = useRef<any>(null);

  // Formato de fecha de registro
  const formatRegistrationDate = (isoString?: string) => {
    if (!isoString) return 'Fecha no disponible';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Badge de rol
  const getRoleBadge = (role?: string) => {
    const r = (role || 'admin').toLowerCase();
    if (r === 'lider') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
          Líder
        </span>
      );
    }
    if (r === 'coordinador') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
          Coordinador
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
        Admin
      </span>
    );
  };

  // Cedula change with real-time verification and 400ms debounce
  const handleCedulaChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setCedula(clean);
    setFormError(null);

    // Si los nombres previos provinieron de autocompletado, limpiarlos al cambiar la cédula
    if (isAutofilledFromCenso) {
      setNombres('');
      setApellidos('');
      setIsAutofilledFromCenso(false);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (clean.length < 5) {
      setCollisionResult(null);
      setIsCheckingCedula(false);
      return;
    }

    setIsCheckingCedula(true);
    debounceTimerRef.current = setTimeout(async () => {
      // Iniciar búsqueda de censo y colisión en paralelo
      const censoPromise = buscarCiudadanoEnCenso(clean).catch((e) => {
        console.error('Error al autocompletar desde censo maestro:', e);
        return { found: false } as const;
      });

      const res = await checkCollision(clean);
      setCollisionResult(res);

      if (!res.exists) {
        const censo = await censoPromise;
        if (censo.found && censo.nombres) {
          setNombres(censo.nombres);
          if (censo.apellidos) setApellidos(censo.apellidos);
          if (censo.puesto_sugerido && PREDEFINED_POLLING_PLACES.some((p) => p.name === censo.puesto_sugerido)) {
            setPuestoVotacion(censo.puesto_sugerido);
          }
          if (censo.mesa_sugerida) {
            setMesa(censo.mesa_sugerida);
          }
          setIsAutofilledFromCenso(true);
        } else {
          setNombres('');
          setApellidos('');
          setIsAutofilledFromCenso(false);
        }
      } else {
        setIsAutofilledFromCenso(false);
      }
      setIsCheckingCedula(false);
    }, 200);
  };

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!cedula.trim() || !nombres.trim() || !apellidos.trim()) {
      setFormError('Por favor complete Cédula, Nombres y Apellidos.');
      return;
    }

    if (collisionResult?.exists) {
      setFormError('No se puede registrar este elector porque ya existe en el censo.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await registerElector({
        cedula,
        nombres,
        apellidos,
        telefono: telefono.trim() || undefined,
        puesto_votacion: puestoVotacion,
        mesa: Number(mesa),
        notas: notas.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Error al guardar elector.');
      } else {
        setLastRegistered({
          nombres: `${nombres} ${apellidos}`,
          telefono: telefono.trim(),
          puesto: puestoVotacion,
          mesa: Number(mesa),
        });

        // Reset form
        setCedula('');
        setNombres('');
        setApellidos('');
        setTelefono('');
        setNotas('');
        setCollisionResult(null);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error inesperado al registrar elector.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter electors in list tab
  const filteredElectors = electors.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.nombres.toLowerCase().includes(q) ||
      e.apellidos.toLowerCase().includes(q) ||
      e.cedula.includes(q) ||
      e.puesto_votacion.toLowerCase().includes(q)
    );
  });

  // Helper to open WhatsApp with custom voter message
  const handleOpenWhatsApp = (elector: {
    id: string;
    nombres: string;
    telefono?: string | null;
    puesto_votacion: string;
    mesa: number;
  }) => {
    if (!elector.telefono) return;
    const cleanPhone = elector.telefono.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const message = encodeURIComponent(
      `¡Hola ${elector.nombres}! Te saluda ${userName}, tu líder de confianza en ${tenantName}. Te confirmamos que tu puesto de votación asignado es ${elector.puesto_votacion}, Mesa ${elector.mesa}. ¡Contamos con tu valioso respaldo este día electoral! 🗳️🇨🇴`
    );

    markWhatsAppSent(elector.id);
    window.open(`https://wa.me/${phoneWithCode}?text=${message}`, '_blank');
  };

  // Navigation tab definitions
  const tabs = [
    { id: 'goal' as const, label: 'Mi Meta', icon: Target },
    { id: 'register' as const, label: 'Registrar', icon: UserPlus },
    { id: 'list' as const, label: 'Mis Votos', icon: Users, badge: stats.total },
  ];

  // Ancho responsivo del contenedor: expandido para la tabla de alta densidad
  const containerMaxWidth = activeTab === 'list' ? 'max-w-7xl' : 'max-w-2xl';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors">
      {/* 1. Mobile-First Executive Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 transition-colors">
        <div className={`${containerMaxWidth} mx-auto flex items-center justify-between gap-3 transition-all duration-300`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-600/25 ring-1 ring-blue-400/30 shrink-0">
              LÍD
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  Líder
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{tenantName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle size="sm" />
            <button
              onClick={onSignOut}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Segmented Control Navigation (iOS / Linear style) */}
        <div className={`${containerMaxWidth} mx-auto mt-2.5 grid grid-cols-3 gap-1 bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md transition-all duration-300`}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative py-2.5 px-2 rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="leader-tab"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-sm shadow-blue-600/30 border border-blue-500/40"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${containerMaxWidth} w-full mx-auto p-4 sm:p-6 pb-20 transition-all duration-300`}>
        <AnimatePresence mode="wait">
          {/* TAB 1: MI META PERSONAL */}
          {activeTab === 'goal' && (
            <LeaderDashboardView
              stats={stats}
              personalGoal={personalGoal}
              onOpenGoalModal={() => {
                setTempGoal(personalGoal);
                setIsGoalModalOpen(true);
              }}
              onNavigateToRegister={() => setActiveTab('register')}
              onNavigateToList={() => setActiveTab('list')}
            />
          )}

          {/* TAB 2: REGISTRAR ELECTOR */}
          {activeTab === 'register' && (
            <LeaderRegisterView
              cedula={cedula}
              nombres={nombres}
              apellidos={apellidos}
              telefono={telefono}
              puestoVotacion={puestoVotacion}
              mesa={mesa}
              notas={notas}
              isCheckingCedula={isCheckingCedula}
              isAutofilledFromCenso={isAutofilledFromCenso}
              collisionResult={collisionResult}
              submitting={submitting}
              formError={formError}
              lastRegistered={lastRegistered}
              onCedulaChange={handleCedulaChange}
              onCedulaBlur={() => {
                if (cedula.length >= 5) {
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  handleCedulaChange(cedula);
                }
              }}
              setNombres={setNombres}
              setApellidos={setApellidos}
              setTelefono={setTelefono}
              setPuestoVotacion={setPuestoVotacion}
              setMesa={setMesa}
              setNotas={setNotas}
              onDismissLastRegistered={() => setLastRegistered(null)}
              onSubmit={handleSubmit}
              formatRegistrationDate={formatRegistrationDate}
              getRoleBadge={getRoleBadge}
            />
          )}

          {/* TAB 3: MIS ELECTORES REGISTRADOS (TABLA DE ALTA DENSIDAD) */}
          {activeTab === 'list' && (
            <LeaderMyElectorsView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredElectors={filteredElectors}
              loading={loading}
              onNavigateToRegister={() => setActiveTab('register')}
              onOpenWhatsApp={handleOpenWhatsApp}
              onEdit={(el) => setEditingElector(el)}
              onDelete={(el) => setDeletingElector(el)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Modal: Ajustar Meta Personal (Executive Slate) */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Definir Meta Personal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Establece el número de electores comprometidos para tu censo territorial.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-mono font-medium uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Número de Electores Meta
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                step="5"
                value={tempGoal}
                onChange={(e) => setTempGoal(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />

              <div className="grid grid-cols-4 gap-2 mt-3">
                {[25, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTempGoal(preset)}
                    className="py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveGoal(tempGoal);
                  setIsGoalModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/25 cursor-pointer active:scale-95"
              >
                Guardar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Edición y Eliminación para el Líder */}
      <EditElectorModal
        elector={editingElector}
        isOpen={Boolean(editingElector)}
        onClose={() => setEditingElector(null)}
        onSave={updateElector}
      />

      <DeleteConfirmModal
        elector={deletingElector}
        isOpen={Boolean(deletingElector)}
        onClose={() => setDeletingElector(null)}
        onConfirm={deleteElector}
      />
    </div>
  );
};
