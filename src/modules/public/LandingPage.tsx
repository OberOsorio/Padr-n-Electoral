import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  Lock,
  UploadCloud,
  ShieldCheck,
  Database,
  ChevronRight,
  Layers,
  CheckCircle2,
  MapPin,
  Activity,
  Vote,
  Sparkles,
  ChevronDown,
  FileCheck,
  Server,
  Check,
  HelpCircle,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

// Variantes fluidas y elegantes para animaciones de scroll
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: custom * 0.1,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between transition-colors duration-300">
      {/* Resplandores ambientales sutiles */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-blue-500/10 dark:from-blue-600/15 via-indigo-500/5 to-transparent blur-[140px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[850px] right-0 w-[550px] h-[480px] bg-indigo-500/5 dark:bg-indigo-600/10 blur-[130px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[1900px] left-0 w-[500px] h-[420px] bg-emerald-500/5 dark:bg-emerald-600/10 blur-[130px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 1. Header Sticky de Navegación */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Isotipo & Nombre */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/30 shrink-0">
              <Shield className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-none">
                Padrón <span className="text-blue-600 dark:text-blue-400">Electoral</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Electoral Command Center
              </span>
            </div>
          </div>

          {/* Menú Rápido */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#modulos" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Módulos del Sistema
            </a>
            <a href="#flujo" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Flujo Operativo
            </a>
            <a href="#comparativa" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Padrón vs. Excel
            </a>
            <a href="#roles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Gobernanza & Roles
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Preguntas Frecuentes
            </a>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso al Comando</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10">
        {/* =========================================================================
            2. HERO SECTION: PROPUESTA DE VALOR AUTÓNOMA Y CONTUNDENTE
            ========================================================================= */}
        <section className="relative pt-14 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Pill Badge Superior */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Centro de Operaciones Electorales & Censo Propio</span>
          </motion.div>

          {/* Titular Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12] max-w-4xl mx-auto text-balance"
          >
            El centro de mando para auditar, organizar y{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400 bg-clip-text text-transparent">
              blindar tu estructura electoral
            </span>
          </motion.h1>

          {/* Subtítulo Descriptivo del Sistema */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance"
          >
            Sustituye la incertidumbre de las planillas de Excel por precisión territorial: cruce automático con el censo oficial, detección instantánea de doble registro entre líderes, metas en tiempo real y trazabilidad puesto a puesto.
          </motion.p>

          {/* Botones de Acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
            >
              <span>Ingresar al Comando de Campaña</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <a
              href="#modulos"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Ver Módulos del Sistema</span>
            </a>
          </motion.div>

          {/* Cuatro Pilares Fundamentales de la Plataforma */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm text-center"
          >
            <div className="p-3">
              <span className="block text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                100% Blindado
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Motor Anti-Colisión
              </span>
            </div>

            <div className="p-3 border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="block text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                Censo Oficial
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Enriquecimiento en Vivo
              </span>
            </div>

            <div className="p-3 border-t sm:border-t-0 sm:border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="block text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                DIVIPOLE
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Puestos & Mesas Exactas
              </span>
            </div>

            <div className="p-3 border-t sm:border-t-0 sm:border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="block text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                Realtime
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Sincronización WebSocket
              </span>
            </div>
          </motion.div>

          {/* =========================================================================
              SHOWCASE INTERACTIVO: VISTA REAL DE LA APLICACIÓN
              ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-14 max-w-5xl mx-auto"
          >
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden text-left relative">
              {/* Barra Superior de la Aplicación */}
              <div className="px-4 py-3 bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500/80 inline-block" />
                  <span className="ml-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                    padron.centrodemando.electoral/dashboard-territorial
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Realtime: Conectado
                  </span>
                </div>
              </div>

              {/* Contenido Interior del Mockup */}
              <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-[#0B1120]">
                {/* Métricas Reales del Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Padrón Consolidado
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                      142.850
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Meta: 180.000 (79.3%)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Puestos DIVIPOLE
                    </span>
                    <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                      28 / 28
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      100% Cobertura Municipal
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Estructura Territorial
                    </span>
                    <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      4 Coord · 38 Líderes
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Control RLS por Usuario
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Censo & Auto-corrección
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      100% Validados
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      0 Cédulas en Colisión
                    </span>
                  </div>
                </div>

                {/* Tabla de Demostración del Padrón Electoral */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/90 shadow-xs">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      Listado en Vivo del Padrón Electoral
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Enriquecimiento DNP / Censo activo
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                          <th className="py-2.5 px-3">Cédula</th>
                          <th className="py-2.5 px-3">Elector Oficial</th>
                          <th className="py-2.5 px-3">Edad Calculada</th>
                          <th className="py-2.5 px-3">Puesto & Mesa (DIVIPOLE)</th>
                          <th className="py-2.5 px-3">Registrado Por</th>
                          <th className="py-2.5 px-3 text-right">Auditoría</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">1.098.742.***</td>
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                            Carlos Mario Benítez Ramos
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">48 años</td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                            Normal Superior <span className="text-blue-500 font-mono font-bold">(Mesa 04)</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500">Líder Andrés Castro (Zona Norte)</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Censo Verificado
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">1.053.819.***</td>
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                            Martha Lucía Restrepo Gómez
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">36 años</td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                            Coliseo Municipal <span className="text-blue-500 font-mono font-bold">(Mesa 12)</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500">Líder Paola Morales (Zona Centro)</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" /> Sin Colisión
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">1.088.420.***</td>
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                            Javier Eduardo Ospina Quintero
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">52 años</td>
                          <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                            I.E. Santander Central <span className="text-blue-500 font-mono font-bold">(Mesa 01)</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500">Líder Fernando Ruiz (Zona Sur)</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Censo Verificado
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* =========================================================================
            3. SECCIÓN: MÓDULOS DEL SISTEMA (BENTO GRID CON ANIMACIONES EN SCROLL)
            ========================================================================= */}
        <section id="modulos" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Módulos Nativos de la Plataforma</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Arquitectura Integral para el Comando de Campaña
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Cada módulo resuelve un cuello de botella crítico en la operación electoral: desde la ingesta de bases de datos hasta el escrutinio de votos.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Módulo 1: Motor Anti-Colisión */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Motor Anti-Colisión Territorial
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Evita que dos o más líderes registren al mismo votante en sus listas de apoyo. El sistema valida la cédula en milisegundos; si ya existe, bloquea la duplicación y muestra exactamente quién la registró primero, en qué fecha y en qué mesa.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40">
                  Cero Duplicados
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Trazabilidad Inmutable
                </span>
              </div>
            </motion.div>

            {/* Módulo 2: Enriquecimiento Oficial de Censo */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Enriquecimiento Automático de Censo
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Al digitar la cédula o cargar lotes, el servicio en background consulta el censo oficial. Resuelve nombres completos, corrige errores ortográficos, calcula la edad exacta y sugiere automáticamente el puesto y mesa de votación oficial.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40">
                  Pool Concurrente
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Cálculo de Edad en Vivo
                </span>
              </div>
            </motion.div>

            {/* Módulo 3: DIVIPOLE Integrado */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  División Político-Administrativa (DIVIPOLE)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Catálogo oficial de Departamentos, Municipios, Zonas, Puestos de Votación y Mesas. Monitorea la saturación por recinto electoral, identifica mesas desatendidas y asigna metas territoriales con base en el potencial electoral real.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40">
                  Puestos & Mesas
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Control de Saturación
                </span>
              </div>
            </motion.div>

            {/* Módulo 4: Carga Masiva Inteligente */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Carga Masiva Inteligente por Lotes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Importa archivos Excel (.xlsx) y CSV de miles de electores. Mapea columnas automáticamente, normaliza formatos de teléfono, depura espacios en blanco y ejecuta pre-auditoría con enriquecimiento reactivo antes de consolidar en base de datos.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/40">
                  Excel & CSV
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Pre-flight Audit
                </span>
              </div>
            </motion.div>

            {/* Módulo 5: Espacio de Trabajo del Líder */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                  <Vote className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Espacio del Líder Móvil (Enrolamiento)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Interfaz móvil optimizada para líderes en territorio. Permite enrolar votantes en segundos, visualizar el porcentaje de cumplimiento hacia su meta personal y cuenta con memoria de lote que recuerda el último puesto y mesa para registro ágil en campo.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40">
                  Mobile-First
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Memoria de Lote
                </span>
              </div>
            </motion.div>

            {/* Módulo 6: Seguridad RLS & Auditoría */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Seguridad RLS & Auditoría Forense
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aislamiento criptográfico estricto por campaña mediante Row-Level Security en PostgreSQL. Los líderes solo ven sus votantes; los coordinadores auditan su zona; bitácora inalterable de accesos y exportaciones en Excel con codificación UTF-8 BOM.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/40">
                  PostgreSQL RLS
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  UTF-8 BOM Excel
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* =========================================================================
            4. SECCIÓN: FLUJO OPERATIVO DE CAMPAÑA (PASO A PASO)
            ========================================================================= */}
        <section id="flujo" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>Metodología de Campaña</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Flujo Operativo de la Campaña Electoral
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Un ciclo de gestión estructurado para llevar la campaña desde el censo inicial hasta la defensa del voto en el escrutinio.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative"
            >
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                01
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Configuración DIVIPOLE
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                El comando de campaña define municipio, puestos de votación y asigna metas numéricas a coordinadores y líderes barriales.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative"
            >
              <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20">
                02
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Enrolamiento & Censo
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Los líderes registran votantes desde su celular o cargan archivos Excel. El censo oficial valida edad y nombres en tiempo real.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative"
            >
              <span className="w-9 h-9 rounded-xl bg-purple-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-purple-500/20">
                03
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Auditoría en Realtime
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                El tablero central se actualiza vía WebSockets: detecta puestos con déficit de electores y audita el cumplimiento por líder.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative"
            >
              <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20">
                04
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Movilización Día D
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Listados organizados mesa a mesa con teléfonos y direcciones validadas para movilizar el voto efectivo con precisión militar.
              </p>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            5. SECCIÓN: MATRIZ COMPARATIVA (PADRÓN ELECTORAL VS EXCEL)
            ========================================================================= */}
        <section id="comparativa" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Diferenciador Tecnológico</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Padrón Electoral vs. Planillas en Excel / Drive
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              ¿Por qué las campañas electorales que buscan la victoria abandonan las hojas de cálculo tradicionales?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65 }}
            className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 font-semibold">
                    <th className="py-4 px-4 sm:px-6 w-1/3">Capacidad Crítica</th>
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                      Padrón Electoral (SaaS)
                    </th>
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-slate-400 dark:text-slate-500">
                      Planillas en Excel / Google Sheets
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Doble Registro entre Líderes
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Bloqueo anti-colisión en milisegundos
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Inexistente (listados inflados con duplicados)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Validación de Censo y Edad
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Autocorrección y cálculo automático
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Manual, lenta y plagada de erratas
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Privacidad y Roles (RLS)
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Cada líder solo ve sus propios electores
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Riesgo de robo de bases o borrado accidental
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Actualización en Tiempo Real
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Suscripción WebSocket instantánea
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Conflictos de versiones desincronizadas
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Georreferenciación DIVIPOLE
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Puestos y mesas oficiales precargadas
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Nombres de puestos escritos de 10 formas distintas
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* =========================================================================
            6. SECCIÓN: GOBERNANZA & ESTRUCTURA DE ROLES DE CAMPAÑA
            ========================================================================= */}
        <section id="roles" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gobernanza Electoral</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Jerarquía de Permisos y Control de Acceso
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Cada integrante de la campaña tiene acceso estricto únicamente a la información requerida para su nivel de responsabilidad.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="p-3 w-fit rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Administrador de Campaña
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Candidato y Gerente General. Visión total del padrón, fijación de metas electorales por puesto, asignación de coordinadores y descarga de reportes consolidados.
              </p>
              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                Control Total · Gestión de Campaña
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="p-3 w-fit rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Coordinador de Zona
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Supervisa los puestos asignados a su comuna o sector, ejecuta cargas masivas de listados territoriales y audita el avance de sus líderes subordinados.
              </p>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                Carga Masiva · Auditoría Territorial
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="p-3 w-fit rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-4">
                <Vote className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Líder Territorial
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Enrola votantes en territorio desde su smartphone, monitorea su porcentaje de meta personal y solo tiene visibilidad de sus propios electores registrados.
              </p>
              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                Enrolamiento Móvil · Cero Fugas
              </span>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            7. SECCIÓN: PREGUNTAS FRECUENTES (FAQ ACORDEÓN INTERACTIVO)
            ========================================================================= */}
        <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-2xl mx-auto mb-14 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Resolución de Dudas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Preguntas Frecuentes
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Todo lo que directores de campaña, candidatos y coordinadores necesitan saber sobre la plataforma.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cómo evita el motor anti-colisión que dos líderes registren al mismo elector?',
                a: 'El sistema mantiene un índice único por documento de identidad dentro del tenant de la campaña en PostgreSQL. Si un segundo líder intenta registrar una cédula ya existente, el sistema bloquea la inserción y le indica de forma transparente qué líder la inscribió primero, en qué fecha y en qué mesa.',
              },
              {
                q: '¿Cómo funciona la consulta y enriquecimiento con el censo oficial?',
                a: 'Al ingresar una cédula o cargar un archivo masivo en Excel, un servicio en background consulta el censo oficial (DNP / Registraduría). De forma instantánea calcula la edad precisa del ciudadano, normaliza sus nombres oficiales y sugiere el puesto y mesa de votación asignados.',
              },
              {
                q: '¿Los líderes de barrio pueden ver los electores registrados por otros líderes?',
                a: 'No. Mediante políticas de Seguridad a Nivel de Fila (PostgreSQL Row Level Security), cada líder tiene una vista hermética y aislada donde solo puede ver y gestionar sus propios simpatizantes. Solo los coordinadores y el administrador general poseen visibilidad ampliada.',
              },
              {
                q: '¿Qué formato deben tener los archivos para la Carga Masiva?',
                a: 'La plataforma acepta archivos Excel (.xlsx) y CSV. No requiere una plantilla rígida: el sistema mapea de forma inteligente las columnas (Cédula, Nombres, Teléfono, Puesto, Mesa) y ejecuta una pre-auditoría reactiva antes de confirmar la importación.',
              },
              {
                q: '¿La plataforma soporta miles de conexiones simultáneas el Día D?',
                a: 'Sí. La infraestructura está montada sobre una arquitectura serverless distribuida en Edge (Cloudflare Workers y Supabase PostgreSQL) con alta resiliencia y réplicas de lectura preparadas para absorber el pico masivo de consultas de la jornada electoral.',
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            8. BANNER DE LLAMADO A LA ACCIÓN FINAL
            ========================================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-blue-600/10 via-white to-white dark:from-blue-900/20 dark:via-slate-900 dark:to-slate-900 border border-blue-200 dark:border-blue-800/60 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                Acceso Exclusivo para Comités de Campaña Autorizados
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Toma el Control Estratégico de tu Campaña Electoral
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresa con tus credenciales seguras para administrar tu padrón, asignar metas territoriales y monitorear el censo electoral en tiempo real.
              </p>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/45 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#080D1A] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-300">Padrón Electoral</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-[11px] font-mono">Electoral Command Center 2026</span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-500 dark:text-slate-400">
            Plataforma reservada para comités electorales y personal debidamente acreditado. Todos los derechos reservados © {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
    </div>
  );
};
