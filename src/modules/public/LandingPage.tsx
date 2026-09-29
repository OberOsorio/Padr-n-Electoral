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

// Variantes reutilizables para animaciones de scroll fluidas y premium
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: custom * 0.12,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  // Estado para acordeón de preguntas frecuentes
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between transition-colors duration-300">
      {/* Luces de fondo ambientales sutiles (Gradients CSS ultraligeros) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-blue-500/10 dark:from-blue-600/15 via-indigo-500/5 to-transparent blur-[140px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[800px] right-0 w-[600px] h-[500px] bg-indigo-500/5 dark:bg-indigo-600/10 blur-[130px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[1800px] left-0 w-[550px] h-[450px] bg-emerald-500/5 dark:bg-emerald-600/10 blur-[130px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 1. Header / Navbar Superior Sticky */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo y Marca */}
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

          {/* Menú de Navegación Rápida (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#capacidades" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Capacidades
            </a>
            <a href="#flujo-operativo" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Flujo Operativo
            </a>
            <a href="#comparativa" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Por Qué Nosotros
            </a>
            <a href="#seguridad" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Seguridad & RLS
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Preguntas
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
              <span>Acceso al Sistema</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10">
        {/* =========================================================================
            2. HERO SECTION: TITULAR DE IMPACTO, PROPUESTA DE VALOR Y PREVIEW DE APP
            ========================================================================= */}
        <section className="relative pt-14 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Pill Badge Superior Animado */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Inteligencia Electoral y Censo Auditado 2026</span>
          </motion.div>

          {/* Titular Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12] max-w-4xl mx-auto text-balance"
          >
            Control territorial absoluto, blindaje de votos y{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400 bg-clip-text text-transparent">
              auditoría en tiempo real
            </span>
          </motion.h1>

          {/* Subtítulo Descriptivo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance"
          >
            La infraestructura tecnológica definitiva para directores de campaña, candidatos y coordinadores. Enriquecimiento automático de censo, detección inmediata de duplicados territoriales y control de testigos electorales para el Día D.
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
              <span>Ingresar a la Plataforma</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <a
              href="#capacidades"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Explorar Capacidades</span>
            </a>
          </motion.div>

          {/* Métricas de Alto Impacto (Key Performance Strip) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-sm"
          >
            <div className="p-3 text-center">
              <span className="block text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                +500K
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Cédulas Auditadas
              </span>
            </div>
            <div className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="block text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                100%
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Blindaje Anti-Colisión
              </span>
            </div>
            <div className="p-3 text-center border-t sm:border-t-0 sm:border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="block text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                &lt; 0.1s
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Cruce en Censo
              </span>
            </div>
            <div className="p-3 text-center border-t sm:border-t-0 sm:border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="block text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                99.99%
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                SLA en el Día D
              </span>
            </div>
          </motion.div>

          {/* =========================================================================
              SHOWCASE INTERACTIVO DE LA PLATAFORMA (PREVIEW ESTILO APPLE / STRIPE)
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
                    padron.centrodemando.electoral/censo-live
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sincronización WebSocket Activa
                  </span>
                </div>
              </div>

              {/* Contenido Interior del Mockup */}
              <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-[#0B1120]">
                {/* Métricas Rápidas de la Vista */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Electores Registrados
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                      142.850
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      +14.8% sobre meta
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Puestos Georreferenciados
                    </span>
                    <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                      24 / 24
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      100% Cobertura
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Coordinadores en Terreno
                    </span>
                    <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      38 Activos
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Trazabilidad RLS
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Testigos Electorales
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      194 Mesas
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Listos para Día D
                    </span>
                  </div>
                </div>

                {/* Tabla de Demostración de Censo Enriquecido */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/90 shadow-xs">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-500" />
                      Muestra en Vivo de Electores Auditados
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Auto-corrección DNP activa
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                          <th className="py-2.5 px-3">Cédula</th>
                          <th className="py-2.5 px-3">Elector Oficial</th>
                          <th className="py-2.5 px-3">Edad Calculada</th>
                          <th className="py-2.5 px-3">Puesto & Mesa</th>
                          <th className="py-2.5 px-3">Asignación</th>
                          <th className="py-2.5 px-3 text-right">Estado Censo</th>
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
                          <td className="py-2.5 px-3 font-sans text-slate-500">Coord. Zona Norte</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Verificado DNP
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
                          <td className="py-2.5 px-3 font-sans text-slate-500">Coord. Zona Centro</td>
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
                          <td className="py-2.5 px-3 font-sans text-slate-500">Coord. Zona Sur</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Verificado DNP
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
            3. SECCIÓN: ARQUITECTURA DE CAPACIDADES (BENTO GRID MODERNO CON ANIMACIONES)
            ========================================================================= */}
        <section id="capacidades" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Tecnología Especializada</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Seis Módulos Diseñados para Ganar Elecciones
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Cada funcionalidad ha sido concebida bajo las exigencias reales de las contiendas electorales: velocidad extrema, cero duplicados y certeza total de cada voto.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Tarjeta 1: Enriquecimiento Automático */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Enriquecimiento Automático en Censo
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Al ingresar una cédula o cargar un archivo masivo, el sistema consulta en segundo plano la base de censo oficial (DNP / Registraduría). Calcula la edad exacta, auto-corrige nombres mal escritos y descarta automáticamente menores de edad o cédulas canceladas.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40">
                  Pool Concurrente
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Auto-corrección Realtime
                </span>
              </div>
            </motion.div>

            {/* Tarjeta 2: Motor Anti-Colisión */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Blindaje Anti-Colisión Territorial
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Evita que dos o más coordinadores registren al mismo elector como propio. Si una cédula ya fue ingresada previamente en la campaña, el sistema genera una alerta instantánea preservando la trazabilidad del primer registro y eliminando los votos ficticios.
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

            {/* Tarjeta 3: Carga Masiva Inteligente */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Carga Masiva de Electores por Lotes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Importa archivos Excel (.xlsx) y CSV de hasta miles de registros en pocos segundos. Cuenta con mapeo automático de columnas, normalización de formatos de teléfono, limpieza de espacios y previsualización con enriquecimiento reactivo antes de confirmar.
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

            {/* Tarjeta 4: Gestión Territorial, Puestos y Mesas */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Zonificación y Puestos de Votación
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Estructuración jerárquica por Departamento, Municipio, Comuna/Corregimiento, Puesto y Mesa. Permite visualizar la distribución porcentual de electores por puesto y calcular la meta de sufragios requerida para alcanzar el umbral de victoria.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40">
                  Puestos & Mesas
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Metas Electorales
                </span>
              </div>
            </motion.div>

            {/* Tarjeta 5: Centro de Mando del Día D */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                  <Vote className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Testigos Electorales & Día D
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Asignación y acreditación digital de testigos electorales mesa por mesa. Durante la jornada, reporta en vivo la instalación de mesas, la afluencia de votantes por franja horaria y la transmisión fotográfica de actas E-14 para escrutinio anti-fraude.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40">
                  Actas E-14
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Escrutinio en Vivo
                </span>
              </div>
            </motion.div>

            {/* Tarjeta 6: Seguridad RLS & Auditoría Forense */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Aislamiento Multi-Tenant & RLS
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Políticas criptográficas de Seguridad a Nivel de Fila (PostgreSQL Row Level Security). Cada campaña política opera en su propio espacio estanco aislado. Registro forense inalterable de cada consulta, edición o exportación de datos.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                <span className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/40">
                  PostgreSQL RLS
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Logs Forenses
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* =========================================================================
            4. SECCIÓN: FLUJO OPERATIVO DE CAMPAÑA (PASO A PASO ANIMADO)
            ========================================================================= */}
        <section id="flujo-operativo" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>Metodología Probada</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Cómo se Estructura la Campaña Paso a Paso
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Un ciclo de gestión claro que lleva a la organización política desde la consolidación inicial de simpatizantes hasta la victoria certificada en las urnas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Paso 1 */}
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
                Ingesta & Cruce
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Carga masiva de listas territoriales con resolución automática de cédulas, verificación de edad y asignación al censo oficial.
              </p>
            </motion.div>

            {/* Paso 2 */}
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
                Estructura Territorial
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Asignación de coordinadores de zona, capitanes de puesto y metas numéricas por mesa con control estricto anti-duplicados.
              </p>
            </motion.div>

            {/* Paso 3 */}
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
                Auditoría en Tiempo Real
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tableros ejecutivos en vivo con suscripción WebSocket. El candidato y su comité conocen exactamente el avance hacia la meta cada segundo.
              </p>
            </motion.div>

            {/* Paso 4 */}
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
                Defensa del Voto (Día D)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Movilización coordinada hacia los puestos de votación y cotejo fotográfico de actas E-14 para asegurar que ningún voto sea alterado.
              </p>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            5. SECCIÓN: MATRIZ COMPARATIVA (PADRÓN ELECTORAL VS EXCEL TRADICIONAL)
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
              <span>Diferenciador Estratégico</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Padrón Electoral vs. Hojas de Cálculo Tradicionales
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              ¿Por qué las campañas modernas ya no confían sus elecciones a archivos compartidos de Excel o Drive?
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
                    <th className="py-4 px-4 sm:px-6 w-1/3">Capacidad Operativa</th>
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                      Padrón Electoral
                    </th>
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-slate-400 dark:text-slate-500">
                      Hojas de Cálculo / Excel
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Detección de Electores Duplicados
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Instantánea en milisegundos
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Inexistente entre múltiples archivos
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Validación de Censo y Edad Oficial
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Automática vía API de Censo
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Manual, lenta y propensa a error
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Seguridad y Control de Acceso (RLS)
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Cada coordinador ve solo sus votantes
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Acceso total o filtraciones accidentales
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Sincronización en Tiempo Real
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      WebSockets & Realtime Reactivo
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Conflictos de sobrescritura de archivo
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                      Monitoreo de Testigos el Día D
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Módulo integrado con actas E-14
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Llamadas telefónicas y caos de WhatsApp
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* =========================================================================
            6. SECCIÓN: SEGURIDAD, DISPONIBILIDAD Y CUMPLIMIENTO CRIPTOGRÁFICO
            ========================================================================= */}
        <section id="seguridad" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Infraestructura Blindada</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Seguridad de Grado Gubernamental
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              La confidencialidad de tu padrón electoral es el activo más valioso de tu campaña política.
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
              <div className="p-3 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4">
                <Server className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Disponibilidad Edge 99.99%
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Despliegue distribuido de alto rendimiento en Cloudflare Workers y Edge Networks. Resistencia absoluta contra caídas de red durante el pico masivo de consultas del Día D.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="p-3 w-fit rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Cifrado AES-256 & TLS 1.3
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cifrado criptográfico tanto en reposo como en tránsito. Ningún dato sensible de electores viaja sin protección criptográfica avanzada de extremo a extremo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="p-3 w-fit rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Aislamiento RLS en PostgreSQL
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cada registro está protegido por Row-Level Security en el motor de base de datos. Ningún usuario puede acceder a datos ajenos a su nivel de autorización.
              </p>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            7. SECCIÓN: PREGUNTAS FRECUENTES (FAQ ACORDEÓN INTERACTIVO FLUIDO)
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
              Respuestas a las consultas habituales de gerentes de campaña, candidatos y auditores electorales.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cómo evita la plataforma que dos coordinadores registren al mismo elector?',
                a: 'El sistema incorpora un motor anti-colisión a nivel de base de datos con índice único por cédula dentro de la campaña activa. Si un segundo coordinador intenta ingresar una cédula existente, la plataforma bloquea la inserción y muestra exactamente qué coordinador la registró primero y en qué fecha.',
              },
              {
                q: '¿Cómo funciona la consulta automática en segundo plano del censo oficial?',
                a: 'Al subir un archivo masivo en Excel o registrar un votante de forma manual, un servicio en background consulta la cédula contra la base oficial de censo (DNP / Registraduría). De forma instantánea calcula la edad precisa, corrige errores ortográficos en los nombres y confirma si la persona está habilitada para sufragar.',
              },
              {
                q: '¿Los coordinadores de zona pueden ver los datos de los demás líderes?',
                a: 'No. Gracias a las directivas de Seguridad a Nivel de Fila (RLS) en PostgreSQL, cada usuario coordinador solo tiene permisos de lectura y escritura sobre los electores y mesas asignadas a su estructura territorial. Solo el Administrador Central tiene visibilidad global de toda la campaña.',
              },
              {
                q: '¿Qué sucede si se cae el internet en un puesto de votación el Día D?',
                a: 'La plataforma cuenta con almacenamiento local en caché de sesión en el navegador (Local Storage & Service Workers). Los testigos pueden continuar verificando electores de su mesa y, en cuanto el dispositivo recupera señal móvil o Wi-Fi, los registros se sincronizan automáticamente con el servidor central.',
              },
              {
                q: '¿Cómo se transmiten y verifican las actas E-14 de escrutinio?',
                a: 'A través del módulo móvil para testigos electorales, el testigo captura una fotografía del acta E-14 física al cierre de las urnas y digita los votos obtenidos. La central electoral compara los datos reportados contra los boletines oficiales para detectar discrepancias en tiempo récord.',
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
            8. BANNER DE LLAMADO A LA ACCIÓN FINAL (ESTILO SAAS EJECUTIVO)
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
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Acceso Exclusivo para Campañas Registradas
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Protege tu Elección con Tecnología Certificada
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresa al sistema con tus credenciales de Administrador o Coordinador de Zona y consolida tu estructura electoral con certeza milimétrica.
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

      {/* 9. Footer Minimalista y Corporativo */}
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
