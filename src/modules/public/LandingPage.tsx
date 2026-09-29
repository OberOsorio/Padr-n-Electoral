import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  Lock,
  ShieldCheck,
  Database,
  ChevronRight,
  Layers,
  CheckCircle2,
  Activity,
  Vote,
  Sparkles,
  ChevronDown,
  FileCheck,
  Server,
  Check,
  HelpCircle,
  AlertTriangle,
  Smartphone,
  Zap,
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

// Datos estructurados del Studio de Capacidades Electorales
const capabilitiesData = [
  {
    id: 'anti-colision',
    number: '01',
    navTitle: 'Anti-Colisión',
    tag: 'INTEGRIDAD TERRITORIAL',
    title: 'Blindaje Anti-Colisión y Bloqueo de Duplicados en Tiempo Real',
    subtitle: 'Protege a tu comando de campaña contra la doble militancia y listados inflados.',
    description:
      'En contiendas políticas decisivas, múltiples líderes y coordinadores intentan adjudicarse a los mismos electores. El motor anti-colisión valida cada documento de identidad en milisegundos. Si una cédula ya fue ingresada en la campaña, el sistema bloquea inmediatamente el registro y revela con total transparencia qué líder la inscribió primero, en qué fecha y en qué mesa de votación.',
    highlights: [
      'Detección instantánea a nivel de base de datos indexada por tenant_id',
      'Trazabilidad inmutable: preserva el mérito y fecha del primer líder que registró al elector',
      'Eliminación total de votantes ficticios en el cálculo estratégico del umbral de victoria',
    ],
    badgeText: '0 Duplicados Garantizados',
    accentColor: 'emerald',
  },
  {
    id: 'censo',
    number: '02',
    navTitle: 'Censo & Edad',
    tag: 'ENRIQUECIMIENTO OFICIAL',
    title: 'Autocorrección Oficial de Censo y Cálculo Instantáneo de Edad',
    subtitle: 'Convierte datos incompletos en información oficial y depurada sin esfuerzo.',
    description:
      'Al registrar una cédula o procesar listados masivos, el servicio en background se comunica en tiempo real con la base oficial del censo nacional (DNP / Registraduría). Normaliza automáticamente los nombres y apellidos oficiales, calcula la edad exacta y descarta de forma preventiva cédulas canceladas o no aptas para votar.',
    highlights: [
      'Cálculo exacto de edad al instante sin exigir fecha de nacimiento manual al digitador',
      'Autocorrección ortográfica de nombres cruzados con el registro nacional electoral',
      'Sugerencia automática de puesto y mesa oficial según el censo histórico del votante',
    ],
    badgeText: 'Censo Oficial Enriquecido',
    accentColor: 'blue',
  },
  {
    id: 'divipole',
    number: '03',
    navTitle: 'Zonificación DIVIPOLE',
    tag: 'ESTRUCTURA GEOGRÁFICA',
    title: 'Catálogo Territorial DIVIPOLE: Puestos y Mesas Exactas',
    subtitle: 'La División Político-Administrativa de Colombia precargada y organizada.',
    description:
      'Control absoluto de la geografía electoral: Departamento, Municipio, Comuna/Zona, Puestos de Votación y número de Mesas habilitadas. Permite auditar la capacidad y saturación de cada recinto electoral, identificar zonas con bajo rendimiento y fijar metas de votos proporcionales al potencial de cada puesto.',
    highlights: [
      'Jerarquía oficial: Departamento > Municipio > Comuna/Zona > Puesto > Mesa',
      'Monitoreo de saturación y cálculo de capacidad electoral por recinto',
      'Fijación de metas cuantitativas por puesto para garantizar el umbral de victoria',
    ],
    badgeText: 'DIVIPOLE Colombia',
    accentColor: 'amber',
  },
  {
    id: 'carga-masiva',
    number: '04',
    navTitle: 'Carga Masiva Batch',
    tag: 'PROCESAMIENTO POR LOTES',
    title: 'Carga Masiva Inteligente Multi-Hilo (Excel & CSV)',
    subtitle: 'Importa y enriquece miles de registros en segundos sin congelar la interfaz.',
    description:
      'Olvídate de digitar planilla por planilla. Sube archivos de Excel o CSV de cualquier formato; el mapeador inteligente detecta las columnas, limpia números telefónicos, elimina espacios en blanco y ejecuta una pre-auditoría reactiva con concurrencia controlada para procesar miles de electores sin saturar la red.',
    highlights: [
      'Pool de trabajadores concurrentes: velocidad extrema sin saturar el servidor ni el navegador',
      'Pre-auditoría con informe exportable de cédulas duplicadas, inconsistentes o erróneas',
      'Normalización automática de prefijos telefónicos para la logística del Día D',
    ],
    badgeText: 'Pool Concurrente Activo',
    accentColor: 'indigo',
  },
  {
    id: 'lider-movil',
    number: '05',
    navTitle: 'Terminal del Líder',
    tag: 'ENROLAMIENTO TERRITORIAL',
    title: 'Espacio Móvil del Líder con Memoria de Lote Inteligente',
    subtitle: 'Enrolamiento ágil desde el teléfono inteligente en barrios, veredas y comunas.',
    description:
      'Una interfaz limpia, intuitiva y ultrarrápida diseñada para el líder que recorre el territorio. Cuenta con memoria de lote que recuerda automáticamente el último puesto y mesa seleccionados, permitiendo registrar decenas de votantes en minutos sin tener que volver a buscar el puesto.',
    highlights: [
      'Memoria de sesión inteligente: ahorra hasta un 70% del tiempo de digitación en campo',
      'Medidor visual de cumplimiento hacia la meta asignada por el comando central',
      'Privacidad estricta: cada líder solo visualiza y administra a sus propios electores',
    ],
    badgeText: 'Mobile First · Memoria de Lote',
    accentColor: 'purple',
  },
  {
    id: 'seguridad-rls',
    number: '06',
    navTitle: 'Seguridad RLS',
    tag: 'GOBERNANZA CRIPTOGRÁFICA',
    title: 'Aislamiento Criptográfico PostgreSQL Row-Level Security',
    subtitle: 'Seguridad a nivel de fila y confidencialidad absoluta para tu información política.',
    description:
      'El padrón electoral es el activo más estratégico de tu campaña. Implementamos políticas de Row-Level Security en el motor de base de datos PostgreSQL: cada campaña (tenant) está completamente aislada, los coordinadores auditan su zona y los administradores tienen bitácora forense de cada exportación.',
    highlights: [
      'Seguridad a Nivel de Fila (RLS): imposibilidad de filtraciones entre campañas o líderes',
      'Cifrado en reposo AES-256 y en tránsito TLS 1.3 de grado bancario',
      'Exportaciones seguras en Excel con codificación oficial UTF-8 con BOM',
    ],
    badgeText: 'PostgreSQL RLS · AES-256',
    accentColor: 'sky',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  // Pestaña activa en el Studio de Capacidades (reemplaza los recuadros estáticos)
  const [activeCapIndex, setActiveCapIndex] = useState<number>(0);
  const activeCap = capabilitiesData[activeCapIndex];

  // Acordeón de preguntas frecuentes
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
            <a href="#capacidades-studio" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Capacidades Clave
            </a>
            <a href="#flujo" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Flujo Operativo
            </a>
            <a href="#comparativa" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Padrón vs. Excel
            </a>
            <a href="#roles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Gobernanza
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
              <span>Acceso al Comando</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10">
        {/* =========================================================================
            2. HERO SECTION: TITULAR DE IMPACTO & MOCKUP DEL DASHBOARD
            ========================================================================= */}
        <section className="relative pt-14 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Centro de Operaciones Electorales & Censo Propio</span>
          </motion.div>

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

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance"
          >
            Sustituye la incertidumbre de las planillas de Excel por precisión territorial: cruce automático con el censo oficial, detección instantánea de doble registro entre líderes, metas en tiempo real y trazabilidad puesto a puesto.
          </motion.p>

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
              href="#capacidades-studio"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Explorar Capacidades en Vivo</span>
            </a>
          </motion.div>

          {/* Métricas Principales */}
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

          {/* Showcase del Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-14 max-w-5xl mx-auto"
          >
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden text-left relative">
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

              <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-[#0B1120]">
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
            3. SECCIÓN REESTRUCTURADA: STUDIO INTERACTIVO DE CAPACIDADES CLAVE
               (SE ELIMINARON LOS 6 RECUADROS ESTÁTICOS Y SE REEMPLAZARON POR UN
                ESCENARIO INTERACTIVO DINÁMICO CON SELECTOR Y SIMULACIÓN EN VIVO)
            ========================================================================= */}
        <section
          id="capacidades-studio"
          className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
        >
          {/* Encabezado Editorial */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-12 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Studio Interactivo de Capacidades</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tecnología Diseñada para Operar en Territorio
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Selecciona una capacidad para explorar cómo opera el motor electoral en tiempo real durante la campaña.
            </p>
          </motion.div>

          {/* Barra Selectora de Pestañas (Pills Horizontales) */}
          <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none px-2">
            {capabilitiesData.map((cap, idx) => {
              const isSelected = activeCapIndex === idx;
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => setActiveCapIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                      : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cap.number}
                  </span>
                  <span>{cap.navTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Escenario de Exhibición Split-View Dinámico */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCap.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                {/* Columna Izquierda: Información Estratégica y Garantías */}
                <div className="lg:col-span-6 space-y-5 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-blue-600 dark:text-blue-400">
                      {activeCap.number}
                    </span>
                    <div className="h-6 w-px bg-slate-200 dark:border-slate-800" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {activeCap.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {activeCap.title}
                  </h3>

                  <p className="text-sm sm:text-base font-medium text-blue-600 dark:text-blue-400">
                    {activeCap.subtitle}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeCap.description}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {activeCap.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      {activeCap.badgeText}
                    </span>
                  </div>
                </div>

                {/* Columna Derecha: Simulación Viva y Específica de Cada Módulo */}
                <div className="lg:col-span-6 w-full">
                  {/* Vista 1: Anti-Colisión (Alerta de duplicado en vivo) */}
                  {activeCap.id === 'anti-colision' && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          VERIFICADOR DE REGISTRO EN TIEMPO REAL
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold">
                          CONFLICTO BLOQUEADO
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase">Cédula Ingresada por Líder 2:</span>
                        <p className="text-base font-bold text-slate-900 dark:text-white">1.098.742.110</p>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>¡Cédula Ya Existente en la Campaña!</span>
                        </div>
                        <p className="text-[11px] text-amber-900/80 dark:text-amber-300/90 leading-relaxed">
                          Este elector ya fue registrado previamente por <strong>Líder Andrés Castro (Zona Norte)</strong> para la <strong>Mesa 04 (Normal Superior)</strong> hace 2 días.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          Garantía: Se preserva la titularidad del primer líder
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0 FUGAS</span>
                      </div>
                    </div>
                  )}

                  {/* Vista 2: Censo & Edad (Cruce con Registraduría / DNP) */}
                  {activeCap.id === 'censo' && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          PIPELINE CENSO NACIONAL (DNP)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">
                          LATENCIA 0.04s
                        </span>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-slate-500">Documento Consultado:</span>
                          <span className="font-bold text-slate-900 dark:text-white">1.053.819.245</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-slate-500">Nombre Oficial Registraduría:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-sans">Martha Lucía Restrepo Gómez</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-slate-500">Edad Calculada Oficial:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">36 años (Habilitada)</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-slate-500">Puesto Oficial Sugerido:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">Coliseo Municipal (Mesa 12)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                        ✓ Autocorrección aplicada en cliente sin intervención del digitador.
                      </div>
                    </div>
                  )}

                  {/* Vista 3: DIVIPOLE (Zonificación y Metas) */}
                  {activeCap.id === 'divipole' && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          ÁRBOL DIVIPOLE COLOMBIA
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                          68001 · BUCARAMANGA
                        </span>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase">Recinto Seleccionado:</span>
                          <p className="font-sans font-bold text-slate-900 dark:text-white">I.E. Normal Superior (Zona Norte)</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-sans">
                            <span>18 Mesas de Votación</span>
                            <span className="font-mono font-bold text-blue-600">Capacidad: 6.300 sufragios</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-300 font-sans">Meta de Campaña Asignada:</span>
                            <span className="font-bold text-emerald-600 font-mono">4.850 / 6.000 votos (80.8%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full w-[80.8%]" />
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        ✓ Asignación balanceada de electores para evitar colapsos logísticos.
                      </div>
                    </div>
                  )}

                  {/* Vista 4: Carga Masiva (Monitor de Lotes) */}
                  {activeCap.id === 'carga-masiva' && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          POOL MULTI-HILO (WORKERS)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">
                          CONCURRENCIA: 4
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs flex justify-between items-center">
                        <span className="text-slate-500">Archivo:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">electores_comuna_4.xlsx</span>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-600 dark:text-slate-300">Progreso de Enriquecimiento:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">1.450 / 1.450 (100%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full w-full" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600">
                          <span className="block font-bold">1.436</span>
                          <span className="text-[10px]">Válidos</span>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600">
                          <span className="block font-bold">14</span>
                          <span className="text-[10px]">Colisiones</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600">
                          <span className="block font-bold">0</span>
                          <span className="text-[10px]">Errores</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vista 5: Espacio del Líder Móvil */}
                  {activeCap.id === 'lider-movil' && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                          TERMINAL MÓVIL DEL LÍDER
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold">
                          MEMORIA ACTIVA
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-purple-900 dark:text-purple-200 block">Líder Andrés Castro</span>
                          <span className="text-[10px] text-purple-700 dark:text-purple-400 font-mono">Meta: 120 / 150 electores (80%)</span>
                        </div>
                        <span className="font-mono font-bold text-sm text-purple-600">80%</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                          Puesto Fijo Recordado: <strong className="text-slate-900 dark:text-white font-sans">Normal Superior (Mesa 04)</strong>
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                          Próximo Registro: <strong className="text-blue-500">Listo para digitar Cédula</strong>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                        ✓ No requiere volver a buscar el puesto en cada registro de la jornada.
                      </div>
                    </div>
                  )}

                  {/* Vista 6: Seguridad RLS (Aislamiento Multi-Tenant) */}
                  {activeCap.id === 'seguridad-rls' && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          POLÍTICA POSTGRESQL RLS
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-mono text-[10px] font-bold">
                          ESTRICTO
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 text-sky-400 font-mono text-[11px] space-y-1.5 overflow-x-auto">
                        <span className="text-slate-400 block">// Regla nativa en base de datos:</span>
                        <p className="text-emerald-400 font-bold">CREATE POLICY tenant_isolation_policy</p>
                        <p className="text-slate-300">ON public.electores FOR ALL</p>
                        <p className="text-sky-300">USING (tenant_id = auth.current_tenant());</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Aislamiento de Campaña:</span>
                          <span className="font-mono font-bold text-emerald-600">HERMÉTICO</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Visibilidad de Líderes:</span>
                          <span className="font-mono font-bold text-blue-600">SOLO SUS ELECTORES</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                        ✓ Ningún usuario puede hackear ni ver electores de otra campaña u otro líder.
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* =========================================================================
            4. SECCIÓN: FLUJO OPERATIVO CONECTADO (SIN CAJAS REPETITIVAS)
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
              Línea de Tiempo Operativa: De la Inscripción al Escrutinio
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Un ciclo de gestión continuo que sincroniza a todo el equipo electoral con precisión matemática.
            </p>
          </motion.div>

          {/* Stepper Horizontal Continuo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative text-left">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                01
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Zonificación DIVIPOLE
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                El comando define municipio, carga los puestos oficiales y distribuye las metas cuantitativas por comuna y mesa.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative text-left">
              <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20">
                02
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Enrolamiento con Censo
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Los líderes registran en territorio; la plataforma enriquece edad y nombres en tiempo real, bloqueando duplicados al instante.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative text-left">
              <span className="w-9 h-9 rounded-xl bg-purple-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-purple-500/20">
                03
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Supervisión en Realtime
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                El tablero central se sincroniza vía WebSockets: detecta puestos desatendidos y audita el rendimiento individual de cada líder.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative text-left">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20">
                04
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Defensa del Voto (Día D)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Listados organizados mesa a mesa con teléfonos y direcciones validadas para movilizar el voto efectivo con precisión militar.
              </p>
            </div>
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
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left">
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
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left">
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
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left">
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
            </div>
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
