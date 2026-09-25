import {
  Shield,
  ArrowRight,
  Lock,
  UploadCloud,
  UserCheck,
  ShieldCheck,
  Database,
  BarChart3,
  Server,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export const LandingPage = ({ onNavigateToLogin }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between transition-colors duration-300">
      {/* Luces de fondo ambientales sutiles */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-500/10 dark:from-blue-600/15 via-indigo-500/5 to-transparent blur-[140px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-[600px] right-0 w-[500px] h-[400px] bg-emerald-500/5 dark:bg-emerald-600/10 blur-[120px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      {/* 1. Navbar Superior */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#161F30]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo / Isotipo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/30 shrink-0">
              <Shield className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              Padrón <span className="text-blue-600 dark:text-blue-400">Electoral</span>
            </span>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso al Sistema</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Sección Hero */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          {/* Título Principal */}
          <div className="max-w-4xl mx-auto space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.14] text-balance">
              Control territorial, auditoría y censo propio en una{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400 bg-clip-text text-transparent">
                sola plataforma
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance">
              Gestión integral para campañas y organizaciones políticas con registro anti-colisión, procesamiento masivo por lotes y trazabilidad territorial en tiempo real.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
            >
              <span>Ingresar a la Plataforma</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <a
              href="#pilares"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Conocer Capacidades</span>
            </a>
          </div>

          {/* 3. Mockup Esquemático del Dashboard */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 p-3 sm:p-5 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden text-left">
              {/* Barra superior de ventana */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ENLACE ACTIVO
                </div>
              </div>

              {/* Grid Interior Esquemático */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                {/* Mini Sidebar Esquemático */}
                <div className="hidden md:block md:col-span-3 space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-white flex items-center gap-2 font-medium">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Dashboard</span>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Registrar Elector</span>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />
                    <span>Padrón General</span>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Carga Masiva</span>
                  </div>
                </div>

                {/* Dashboard Metrics Mockup */}
                <div className="col-span-1 md:col-span-9 space-y-4">
                  {/* Tarjetas KPI */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Electores Padrón
                      </span>
                      <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC] tabular-nums mt-1 block">
                        142.850
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1 font-medium">
                        +14.8% cumplimiento
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Puestos Cubiertos
                      </span>
                      <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC] tabular-nums mt-1 block">
                        100%
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5 font-medium">
                        7 de 7 sedes activas
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Equipo en Terreno
                      </span>
                      <span className="text-lg sm:text-xl font-bold font-mono text-[#E5B869] tabular-nums mt-1 block">
                        28 Coordinadores
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Trazabilidad auditada
                      </span>
                    </div>
                  </div>

                  {/* Barras de Puestos y Feed de Verificación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 block font-medium">
                        Top Puestos Asignados
                      </span>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300">
                            <span>I.E. Santander Central</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">42%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-blue-500 rounded-full w-[42%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300">
                            <span>Coliseo Municipal de Deportes</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">28%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1">
                            <div className="h-full bg-indigo-500 rounded-full w-[28%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 block font-medium">
                        Últimos Registros Auditados
                      </span>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                        <span className="font-mono">CC ***.892</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Verificado</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between py-1">
                        <span className="font-mono">CC ***.415</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Verificado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Sección de Pilares Clave (3 Tarjetas Glassmorphism) */}
        <section id="pilares" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-700/60">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Arquitectura de Precisión Electoral
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Desarrollada para garantizar que cada elector quede debidamente geolocalizado, asignado a su mesa y respaldado con verificación anti-colisión.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pilar 1 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500/50 p-6 sm:p-7 shadow-sm dark:shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Captura Rápida & Anti-Colisión
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Detección instantánea de duplicados por documento de identidad. Incorpora memoria de sesión que recuerda automáticamente el último puesto y mesa seleccionados para enrolamiento ágil en territorio.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40">
                  Deduplicación en vivo
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                  Memoria de Lote
                </span>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/50 p-6 sm:p-7 shadow-sm dark:shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform shadow-xs">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Carga Masiva de Electores
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Importación por lotes de hasta 1.000 registros por llamada desde archivos Excel (.xlsx) o CSV. Mapeador inteligente de columnas, validación previa en cliente y exportación de reportes de inconsistencias.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40">
                  1.000 reg/chunk
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                  Pre-flight Audit
                </span>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-amber-500/50 p-6 sm:p-7 shadow-sm dark:shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-[#E5B869]/30 flex items-center justify-center text-[#E5B869] mb-5 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Auditoría por Coordinador
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Control estricto de roles (Admin y Coordinador) respaldado con políticas de Seguridad a Nivel de Fila (RLS). Métricas de rendimiento individual y exportación instantánea con codificación UTF-8 BOM.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-[10px] font-mono text-[#E5B869] font-medium">
                <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-[#E5B869]/30">
                  PostgreSQL RLS
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                  Roles RBAC
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Sección de Estadísticas Institucionales (Social Proof) */}
        <section className="py-14 bg-slate-100/60 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-700/60 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700/60">
              <div className="pt-4 sm:pt-0">
                <div className="flex items-center justify-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-5 h-5" />
                  <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">99.9%</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Disponibilidad Edge</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Infraestructura distribuida de respuesta rápida</p>
              </div>

              <div className="pt-6 sm:pt-0">
                <div className="flex items-center justify-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <UserCheck className="w-5 h-5" />
                  <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">Cero Duplicados</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Integridad de Censo</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Reglas anti-colisión a nivel de motor de datos</p>
              </div>

              <div className="pt-6 sm:pt-0">
                <div className="flex items-center justify-center gap-2 mb-2 text-[#E5B869]">
                  <Lock className="w-5 h-5" />
                  <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">Cifrado RLS</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Base de Datos Segura</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Aislamiento criptográfico y perfiles auditables</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Banner de Llamado a la Acción Final */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800/95 dark:to-[#0F172A] border border-blue-500/20 dark:border-blue-500/30 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Inicia la operación de tu padrón electoral hoy
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Acceso reservado para administradores y coordinadores de zona con credenciales emitidas por la central electoral.
              </p>
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/45 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Acceso Administrativo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer Minimalista */}
      <footer className="border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0B132B] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-300">Padrón Electoral</span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-500 dark:text-slate-400">
            Plataforma de uso exclusivo para personal autorizado. Todos los derechos reservados © {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
    </div>
  );
};
