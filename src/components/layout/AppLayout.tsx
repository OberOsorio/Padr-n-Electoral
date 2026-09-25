import { useState, useEffect } from 'react';
import { Sidebar, type SidebarTabId } from './Sidebar';
import { DirectorDashboardView } from '../../modules/dashboard/DirectorDashboardView';
import { RegisterElectorView } from '../../modules/electors/RegisterElectorView';
import { ElectorsListView } from '../../modules/electors/ElectorsListView';
import { BulkUploadView } from '../../modules/electors/BulkUploadView';
import { TeamManagementView } from '../../modules/team/TeamManagementView';
import { ExportReportsView } from '../../modules/reports/ExportReportsView';
import { TenantSwitcher } from './TenantSwitcher';
import { Construction, ArrowLeft, Shield, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSidebar } from '../../context/SidebarContext';

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
    title: 'Equipo y Coordinadores',
    subtitle: 'Gestión de coordinadores y asignación de zonas',
    phase: 'Fase 5',
  },
  reports: {
    title: 'Exportar Reportes',
    subtitle: 'Generación de informes consolidados en Excel y PDF',
    phase: 'Fase 6',
  },
};

export const AppLayout = ({
  userEmail = 'admin@electoral.gov',
  userName = 'Administrador General',
  userRole = 'Admin',
  onSignOut,
  isSuperAdminInspection = false,
  onBackToMasterPlatform,
  onOpenGateway,
}: AppLayoutProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTabId>('dashboard');
  const { isOpen: isMobileMenuOpen, setSidebarOpen: setIsMobileMenuOpen } = useSidebar();

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
    <div className="h-[100dvh] w-full bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-200 relative">
      {/* 1. Sidebar de Escritorio (Visible en md+) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userEmail={userEmail}
        userName={userName}
        userRole={userRole}
        onSignOut={onSignOut}
        className="hidden md:flex"
      />

      {/* 2. Drawer Lateral Móvil (Off-canvas) con AnimatePresence */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
            {/* Backdrop oscuro con desenfoque suave */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Panel Lateral Deslizante */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#161F30] border-r border-slate-200 dark:border-slate-700/60 shadow-2xl flex flex-col z-10 overflow-hidden"
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
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                className="flex w-full h-full static border-r-0"
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Área de Contenido Principal Scrolleable */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden w-full max-w-full bg-slate-50 dark:bg-[#0F172A] transition-colors duration-200 flex flex-col">
        {/* Banner Superior Modo Inspección SuperAdmin (Zero-Knowledge) */}
        {isSuperAdminInspection && (
          <div className="w-full max-w-full shrink-0 sticky top-0 z-40 bg-gradient-to-r from-purple-950/95 via-slate-900/95 to-purple-950/95 text-purple-200 border-b border-purple-500/40 px-3 py-1.5 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-3 text-xs backdrop-blur-md shadow-lg shadow-purple-950/20 overflow-x-hidden">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold tracking-wider uppercase border border-purple-500/40 text-[9px] sm:text-[10px] flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                <Sparkles className="w-3 h-3 text-purple-400" />
                SuperAdmin Sandbox
              </span>
              <span className="font-medium text-slate-200 hidden sm:inline">
                Modo Inspección de Interfaz y Funciones (Zero-Knowledge Sandbox)
              </span>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
              {onOpenGateway && (
                <button
                  type="button"
                  onClick={onOpenGateway}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors font-medium text-[10px] sm:text-[11px] cursor-pointer"
                >
                  Cambiar Entorno
                </button>
              )}
              {onBackToMasterPlatform && (
                <button
                  type="button"
                  onClick={onBackToMasterPlatform}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs transition-colors flex items-center gap-1 text-[10px] sm:text-[11px] cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Volver al Master
                </button>
              )}
            </div>
          </div>
        )}
        {/* Header Móvil Superior Fijo (Visible únicamente en < md) */}
        <header className="md:hidden sticky top-0 z-30 w-full shrink-0 bg-white/95 dark:bg-[#161F30]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60 px-4 py-3 flex items-center justify-between transition-colors shadow-xs">
          {/* Logo e Isotipo */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs relative shrink-0">
              <Shield className="w-4 h-4" strokeWidth={2} />
            </div>
            <TenantSwitcher userRole={userRole} />
          </div>

          {/* Selector de Tema y Botón Hamburguesa Animado */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle size="sm" />

            <motion.button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.92 }}
              className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/60"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <div className="w-4 h-3 flex flex-col justify-between items-center relative">
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-0.5 bg-current rounded-full origin-center"
                />
                <motion.span
                  animate={isMobileMenuOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="w-4 h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-0.5 bg-current rounded-full origin-center"
                />
              </div>
            </motion.button>
          </div>
        </header>

        {/* Contenido Dinámico con Ancho Centrado para Pantallas Ultra-Wide */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto">
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
              {activeTab === 'dashboard' ? (
                <DirectorDashboardView
                  onNavigateToElectors={() => setActiveTab('electors')}
                  userName={userName}
                />
              ) : activeTab === 'register' ? (
                <RegisterElectorView
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
              ) : activeTab === 'electors' ? (
                <ElectorsListView
                  onNavigateToRegister={() => setActiveTab('register')}
                  onNavigateToBulkUpload={() => setActiveTab('bulk-upload')}
                  isAdmin={isAdmin}
                />
              ) : activeTab === 'bulk-upload' ? (
                <BulkUploadView
                  onNavigateToElectors={() => setActiveTab('electors')}
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
              ) : activeTab === 'coordinators' ? (
                <TeamManagementView
                  isAdmin={isAdmin}
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
              ) : activeTab === 'reports' ? (
                <ExportReportsView
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
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
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 4. Botón Flotante (FAB) para "+ REGISTRAR ELECTOR" en Móviles (< md) */}
      <AnimatePresence>
        {activeTab !== 'register' && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('register')}
            className="md:hidden fixed bottom-5 right-5 z-40 px-4 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-xl shadow-blue-500/40 flex items-center gap-2 cursor-pointer border border-blue-400/30 backdrop-blur-xs"
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
