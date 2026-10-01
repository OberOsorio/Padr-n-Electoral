import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Sidebar, type SidebarTabId } from './Sidebar';
import { TenantSwitcher } from './TenantSwitcher';
import { Construction, ArrowLeft, Shield, UserPlus, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSidebar } from '../../context/SidebarContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

const DirectorDashboardView = React.lazy(() =>
  import('../../modules/dashboard/DirectorDashboardView').then((m) => ({
    default: m.DirectorDashboardView,
  }))
);
const RegisterElectorView = React.lazy(() =>
  import('../../modules/electors/RegisterElectorView').then((m) => ({
    default: m.RegisterElectorView,
  }))
);
const ElectorsListView = React.lazy(() =>
  import('../../modules/electors/ElectorsListView').then((m) => ({
    default: m.ElectorsListView,
  }))
);
const BulkUploadView = React.lazy(() =>
  import('../../modules/electors/BulkUploadView').then((m) => ({
    default: m.BulkUploadView,
  }))
);
const TeamManagementView = React.lazy(() =>
  import('../../modules/team/TeamManagementView').then((m) => ({
    default: m.TeamManagementView,
  }))
);
const ExportReportsView = React.lazy(() =>
  import('../../modules/reports/ExportReportsView').then((m) => ({
    default: m.ExportReportsView,
  }))
);

interface AppLayoutProps {
  userEmail?: string;
  userName?: string;
  userRole?: string;
  onSignOut: () => void;
  isSuperAdminInspection?: boolean;
  onBackToMasterPlatform?: () => void;
  onOpenGateway?: () => void;
}

const TAB_TITLES: Record<SidebarTabId, { title: string; subtitle: string; phase: string }> = {
  dashboard: {
    title: 'Dashboard General',
    subtitle: 'Métricas e indicadores en tiempo real',
    phase: 'Fase 2',
  },
  register: {
    title: 'Registrar Elector',
    subtitle: 'Formulario de enrolamiento y verificación de mesa',
    phase: 'Fase 3',
  },
  electors: {
    title: 'Padrón de Electores',
    subtitle: 'Base de datos consolidada con filtros avanzados y búsqueda',
    phase: 'Fase 4',
  },
  'bulk-upload': {
    title: 'Carga Masiva de Electores',
    subtitle: 'Alimentación del padrón por lotes desde archivos Excel o CSV',
    phase: 'Módulo Operativo',
  },
  coordinators: {
    title: 'Equipo y Accesos',
    subtitle: 'Gestión de coordinadores, líderes y credenciales de campaña',
    phase: 'Módulo Activo',
  },
  reports: {
    title: 'Exportar Reportes',
    subtitle: 'Generación de informes consolidados en Excel y PDF',
    phase: 'Fase 6',
  },
};

const ViewLoadingSpinner: React.FC = () => (
  <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
    <Loader2 className="w-7 h-7 animate-spin text-blue-500 mb-2.5" />
    <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
      Cargando vista...
    </span>
  </div>
);

export const AppLayout = ({
  userEmail = 'admin@electoral.gov',
  userName = 'Administrador General',
  userRole = 'Admin',
  onSignOut,
  isSuperAdminInspection: _isSuperAdminInspection = false,
  onBackToMasterPlatform,
  onOpenGateway,
}: AppLayoutProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTabId>('dashboard');
  const { isOpen: isMobileMenuOpen, setSidebarOpen: setIsMobileMenuOpen } = useSidebar();
  const isOnline = useOnlineStatus();
  const [electorInitialFilter, setElectorInitialFilter] = useState<string>('all');

  // Callbacks de navegación estables para evitar re-renderizados en cascada (React.memo)
  const navigateToDashboard = useCallback(() => setActiveTab('dashboard'), []);
  const navigateToRegister = useCallback(() => setActiveTab('register'), []);
  const navigateToElectors = useCallback((puestoFilter?: string) => {
    if (puestoFilter) {
      setElectorInitialFilter(puestoFilter);
    } else {
      setElectorInitialFilter('all');
    }
    setActiveTab('electors');
  }, []);
  const navigateToBulkUpload = useCallback(() => setActiveTab('bulk-upload'), []);
  const navigateToTeam = useCallback(() => setActiveTab('coordinators'), []);

  // Si se pierde la conexión y está en reportes, volver al dashboard
  useEffect(() => {
    if (!isOnline && activeTab === 'reports') {
      setActiveTab('dashboard');
    }
  }, [isOnline, activeTab]);

  // Cerrar menú móvil al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsMobileMenuOpen]);

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;
  const isAdmin = userRole?.toLowerCase().includes('admin') ?? true;

  return (
    <div className="h-[100dvh] w-full max-w-full bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-200 relative">
      {/* 1. Sidebar de Escritorio (Visible en lg+) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userEmail={userEmail}
        userName={userName}
        userRole={userRole}
        onSignOut={onSignOut}
        onBackToMasterPlatform={onBackToMasterPlatform}
        onOpenGateway={onOpenGateway}
        className="hidden lg:flex"
      />

      {/* 2. Drawer Lateral Móvil / Tablet (< 1024px lg) con Backdrop-Blur */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 cursor-pointer"
          aria-hidden="true"
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-xs h-[100dvh] max-h-[100dvh] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden transform transition-transform duration-200 ease-out will-change-transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            transform: isMobileMenuOpen ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
            willChange: 'transform',
          }}
        >
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setIsMobileMenuOpen(false);
            }}
            userEmail={userEmail}
            userName={userName}
            userRole={userRole}
            onSignOut={onSignOut}
            onBackToMasterPlatform={onBackToMasterPlatform}
            onOpenGateway={onOpenGateway}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            className="flex w-full h-full static border-r-0"
          />
        </aside>
      </div>

      {/* 3. Área de Contenido Principal */}
      <div
        className={`flex-1 h-full ${
          isMobileMenuOpen ? 'overflow-hidden' : 'overflow-y-auto'
        } overflow-x-hidden w-full max-w-full bg-slate-50 dark:bg-[#0F172A] transition-colors duration-200 flex flex-col`}
      >
        {/* Header Móvil / Tablet Superior Fijo (< 1024px lg) */}
        <header className="lg:hidden sticky top-0 z-40 w-full shrink-0 pt-safe bg-white/95 dark:bg-[#161F30]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60 px-4 py-3 flex items-center justify-between transition-colors shadow-xs">
          {/* Logo e Isotipo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs relative shrink-0">
              <Shield className="w-4 h-4" strokeWidth={2} />
            </div>
            <TenantSwitcher userRole={userRole} />
          </div>

          {/* Selector de Tema y Botón Hamburguesa */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle size="sm" />

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 touch-manipulation transition-transform duration-100 cursor-pointer border border-slate-200 dark:border-slate-700/60"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <div className="w-5 h-4 flex flex-col justify-between items-center relative" aria-hidden="true">
                <span
                  className={`w-4 h-0.5 bg-current rounded-full transition-transform duration-200 ease-out origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`w-4 h-0.5 bg-current rounded-full transition-opacity duration-150 ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`w-4 h-0.5 bg-current rounded-full transition-transform duration-200 ease-out origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </header>

        {/* Contenido Dinámico con Ancho Centrado para Pantallas Ultra-Wide */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full min-h-full"
              style={{ willChange: 'opacity, transform' }}
            >
              <Suspense fallback={<ViewLoadingSpinner />}>
                {activeTab === 'dashboard' ? (
                  <DirectorDashboardView
                    onNavigateToElectors={navigateToElectors}
                    onNavigateToRegister={navigateToRegister}
                    onNavigateToBulkUpload={navigateToBulkUpload}
                    onNavigateToTeam={navigateToTeam}
                    userName={userName}
                  />
                ) : activeTab === 'register' ? (
                  <RegisterElectorView
                    onNavigateToDashboard={navigateToDashboard}
                  />
                ) : activeTab === 'electors' ? (
                  <ElectorsListView
                    onNavigateToRegister={navigateToRegister}
                    onNavigateToBulkUpload={navigateToBulkUpload}
                    isAdmin={isAdmin}
                    initialPuestoFilter={electorInitialFilter}
                  />
                ) : activeTab === 'bulk-upload' ? (
                  <BulkUploadView
                    onNavigateToElectors={navigateToElectors}
                    onNavigateToDashboard={navigateToDashboard}
                  />
                ) : activeTab === 'coordinators' ? (
                  <TeamManagementView
                    isAdmin={isAdmin}
                    onNavigateToDashboard={navigateToDashboard}
                  />
                ) : activeTab === 'reports' ? (
                  <ExportReportsView
                    onNavigateToDashboard={navigateToDashboard}
                    userName={userName}
                    userEmail={userEmail}
                    userRole={userRole}
                  />
                ) : (
                  <div className="p-4 sm:p-6 lg:p-12 max-w-4xl mx-auto flex flex-col justify-center min-h-[85vh] animate-in fade-in duration-200">
                    <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden">
                      <div 
                        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E5B869]/40 to-transparent" 
                        aria-hidden="true" 
                      />

                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-[#E5B869]/30 flex items-center justify-center text-[#E5B869] shadow-inner">
                          <Construction className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-amber-700 dark:text-[#E5B869] uppercase font-semibold">
                            <span>Programado para {currentTabInfo.phase}</span>
                          </div>
                          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                            {currentTabInfo.title}
                          </h2>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700/60 pt-6 leading-relaxed">
                        <p>
                          El módulo <span className="font-semibold text-slate-900 dark:text-white">{currentTabInfo.title}</span> ({currentTabInfo.subtitle.toLowerCase()}) se encuentra reservado para la siguiente iteración de acuerdo al cronograma de desarrollo modular.
                        </p>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                            Módulos Operativos
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Actualmente están activos el <span className="text-blue-600 dark:text-blue-400 font-medium">Dashboard General</span> en tiempo real, el módulo <span className="text-blue-600 dark:text-blue-400 font-medium">Registrar Elector</span> y la <span className="text-blue-600 dark:text-blue-400 font-medium">Lista de Electores</span> con paginación server-side y contacto WhatsApp.
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-start">
                        <button
                          type="button"
                          onClick={() => setActiveTab('dashboard')}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Volver al Dashboard General</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 4. Botón Flotante (FAB) para "+ REGISTRAR" en Móviles (solo en Dashboard para no tapar tablas ni barras flotantes) */}
      <AnimatePresence>
        {activeTab === 'dashboard' && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('register')}
            className="lg:hidden fixed bottom-5 right-5 z-30 px-4 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-xl shadow-blue-500/40 flex items-center gap-2 cursor-pointer border border-blue-400/30 backdrop-blur-xs"
            aria-label="Registrar Elector Rápido"
          >
            <UserPlus className="w-4.5 h-4.5" />
            <span className="font-semibold">+ Registrar</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
