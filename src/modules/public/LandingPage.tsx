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
  MapPin,
  Activity,
  ChevronDown,
  FileCheck,
  Server,
  Check,
  HelpCircle,
  Smartphone,
  Radio,
  Cpu,
  Fingerprint,
  KeyRound,
  Terminal,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

// ============================================================================
// ANIMACIONES BIDIRECCIONALES FLUIDAS Y PREMIUM (SCROLL DOWN & SCROLL UP)
// ============================================================================
const textFluidReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
    filter: 'blur(8px)',
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.75,
      delay: custom * 0.08,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const cardStagger: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 24,
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: custom * 0.1,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

// ============================================================================
// DATOS ESTRATÉGICOS REALES DE LA PLATAFORMA ELECTORAL
// ============================================================================
const pillarsData = [
  {
    code: 'MOD-01',
    icon: ShieldCheck,
    title: 'Algoritmo Anti-Colisión Territorial',
    category: 'INTEGRIDAD DE DATOS',
    lead: 'Matemáticamente imposible duplicar simpatizantes entre líderes de campaña.',
    description:
      'En cada contienda, múltiples coordinadores inflan sus cifras adjudicándose los mismos votantes. El motor anti-colisión ejecuta un bloqueo determinista indexado por campaña: si una cédula ya fue ingresada, la rechaza en 0.04s, adjudicando el elector con sello inmutable de fecha, hora y líder original.',
    metrics: ['0 Duplicados', 'Trazabilidad Inmutable', 'Auditoría Forense'],
    accent: 'emerald',
  },
  {
    code: 'MOD-02',
    icon: Database,
    title: 'Pipeline de Censo Nacional & DNP',
    category: 'ENRIQUECIMIENTO EN VIVO',
    lead: 'Consulta oficial que normaliza nombres, calcula edad y valida el sufragio.',
    description:
      'Al registrar un documento o cargar archivos masivos, el servicio en background cruza la información contra la base oficial del censo nacional. Calcula la edad exacta sin pedir fecha de nacimiento manual, corrige erratas ortográficas y determina si la persona está habilitada para votar.',
    metrics: ['Autocorrección DNP', 'Cálculo de Edad', 'Filtro de Inhabilidades'],
    accent: 'blue',
  },
  {
    code: 'MOD-03',
    icon: MapPin,
    title: 'Matriz Geoespacial DIVIPOLE Oficial',
    category: 'ESTRUCTURA TERRITORIAL',
    lead: 'Catálogo de la División Político-Administrativa con puestos y mesas exactas.',
    description:
      'Toda la cartografía electoral precargada: Departamentos, Municipios, Comunas, Zonas Urbanas/Rurales, Puestos de Votación y número de Mesas habilitadas. Permite auditar la saturación de cada mesa y distribuir metas cuantitativas proporcionales al potencial electoral.',
    metrics: ['DIVIPOLE Colombia', 'Control de Saturación', 'Metas por Puesto'],
    accent: 'amber',
  },
  {
    code: 'MOD-04',
    icon: Cpu,
    title: 'Motor Multi-Hilo de Carga Masiva',
    category: 'PROCESAMIENTO POR LOTES',
    lead: 'Procesamiento reactivo de miles de electores en Excel o CSV sin latencia.',
    description:
      'Importación paralela con pool concurrente de trabajadores. Mapea columnas automáticamente, depura caracteres corruptos, normaliza teléfonos celulares y ejecuta pre-auditoría con enriquecimiento automático antes de persistir en base de datos.',
    metrics: ['Excel (.xlsx) & CSV', 'Pool Multi-Hilo', 'Pre-flight Audit'],
    accent: 'indigo',
  },
  {
    code: 'MOD-05',
    icon: Smartphone,
    title: 'Terminal de Enrolamiento para Líderes',
    category: 'MOVILIDAD EN CAMPO',
    lead: 'Memoria de lote inteligente para registro ultra-rápido en territorio.',
    description:
      'Diseñado para el líder barrial que recorre comunas y veredas desde su smartphone. La memoria de sesión recuerda automáticamente el último puesto y mesa seleccionados, permitiendo enrolar decenas de simpatizantes en minutos con mínimo consumo de datos.',
    metrics: ['Mobile-First', 'Memoria de Lote', '70% Más Rápido'],
    accent: 'purple',
  },
  {
    code: 'MOD-06',
    icon: KeyRound,
    title: 'Aislamiento Criptográfico PostgreSQL RLS',
    category: 'SEGURIDAD BANCARIA',
    lead: 'Row-Level Security nativo: cada campaña es una fortaleza hermética.',
    description:
      'Aislamiento multi-tenant por directiva criptográfica en el motor de base de datos. Cada líder visualiza exclusivamente su padrón; los coordinadores auditan su zona; los administradores tienen trazabilidad inmutable y exportación segura en Excel UTF-8 con BOM.',
    metrics: ['PostgreSQL RLS', 'Cifrado AES-256', 'UTF-8 BOM Export'],
    accent: 'sky',
  },
];

const timelineSteps = [
  {
    num: '01',
    phase: 'ESTRUCTURACIÓN',
    title: 'Zonificación DIVIPOLE & Metas de Victoria',
    desc: 'El comité electoral configura el municipio, activa los puestos de votación y define metas numéricas asignadas por comuna, puesto y mesa.',
  },
  {
    num: '02',
    phase: 'ENROLAMIENTO',
    title: 'Captura Territorial & Validación en Censo',
    desc: 'Los líderes despliegan el registro en territorio. Cada cédula es verificada en milisegundos contra el censo nacional DNP con edad oficial calculada.',
  },
  {
    num: '03',
    phase: 'TELEMETRÍA',
    title: 'Auditoría en Realtime & Supervisión WebSocket',
    desc: 'El comando central monitorea segundo a segundo la consolidación de metas, detecta puestos desatendidos y audita el rendimiento individual.',
  },
  {
    num: '04',
    phase: 'DEFENSA',
    title: 'Operación del Día D & Escrutinio',
    desc: 'Listados organizados mesa a mesa para movilización de votantes y transmisión rápida de actas E-14 para blindar el escrutinio oficial contra fraudes.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070C18] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between transition-colors duration-300">
      {/* =========================================================================
          ATMÓSFERA Y RESPLANDORES FUTURISTAS (PINTURA AMBIENTAL CSS)
          ========================================================================= */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-blue-600/15 dark:from-blue-600/20 via-indigo-600/10 to-transparent blur-[150px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[900px] right-0 w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/15 blur-[160px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-[2000px] left-0 w-[550px] h-[550px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[150px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* =========================================================================
          1. HEADER FUTURISTA STICKY CON ESTADO DE RED TELEMÉTRICA
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0A101F]/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Holográfico */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/40 shrink-0 relative group">
              <Shield className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={2.3} />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A101F]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none font-sans">
                PADRÓN <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">ELECTORAL</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                COMMAND CENTER · 2026
              </span>
            </div>
          </div>

          {/* Navegación Estratégica */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 font-mono">
            <a href="#arquitectura" className="hover:text-blue-500 transition-colors">
              // Arquitectura
            </a>
            <a href="#pilares" className="hover:text-blue-500 transition-colors">
              // Blindaje
            </a>
            <a href="#timeline" className="hover:text-blue-500 transition-colors">
              // Operación
            </a>
            <a href="#comparativa" className="hover:text-blue-500 transition-colors">
              // Diferencial
            </a>
            <a href="#faq" className="hover:text-blue-500 transition-colors">
              // FAQ
            </a>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer border border-blue-400/30"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso Seguro</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10">
        {/* =========================================================================
            2. HERO SECTION: COMUNICADO ESTRATÉGICO Y FILOSOFÍA FUTURISTA
            ========================================================================= */}
        <section className="relative pt-16 pb-20 sm:pt-28 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Tagline de Misión */}
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            custom={0}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold tracking-wider uppercase shadow-xs mb-8 backdrop-blur-xl"
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Infraestructura de Inteligencia Electoral · Ciclo 2026</span>
          </motion.div>

          {/* Titular Monumental */}
          <motion.h1
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            custom={1}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] max-w-5xl mx-auto text-balance"
          >
            La certeza de cada voto antes, durante y después de{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
              las urnas.
            </span>
          </motion.h1>

          {/* Bajada Editorial */}
          <motion.p
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            custom={2}
            className="mt-8 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed text-balance font-normal"
          >
            La plataforma SaaS de alta precisión que sustituye las planillas manuales por rigor territorial: enriquecimiento en tiempo real con el censo oficial, detección matemática de doble registro entre líderes y trazabilidad inviolable hasta la última mesa.
          </motion.p>

          {/* Botones de Acción Futuristas */}
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-9 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-bold tracking-wider uppercase transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 cursor-pointer flex items-center justify-center gap-3 border border-blue-400/40"
            >
              <span>Ingresar al Comando Central</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <a
              href="#pilares"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 shadow-sm"
            >
              <Terminal className="w-4 h-4 text-blue-500" />
              <span>Conocer el Blindaje</span>
            </a>
          </motion.div>

          {/* Matriz Telemetría Futurista */}
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            custom={4}
            className="mt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl shadow-lg"
          >
            <div className="p-4 text-center">
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block tracking-wider">
                Anti-Colisión
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                0 Duplicados
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Índice único por Campaña
              </span>
            </div>

            <div className="p-4 text-center border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block tracking-wider">
                Censo Nacional
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                &lt; 0.04s
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Cruce y cálculo de edad
              </span>
            </div>

            <div className="p-4 text-center border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block tracking-wider">
                Cartografía
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
                DIVIPOLE
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Puestos y mesas oficiales
              </span>
            </div>

            <div className="p-4 text-center border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold block tracking-wider">
                Seguridad
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                PostgreSQL RLS
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Aislamiento estanco
              </span>
            </div>
          </motion.div>
        </section>

        {/* =========================================================================
            3. SECCIÓN: EL MANIFIESTO ESTRATÉGICO (POR QUÉ FALLAN LAS CAMPAÑAS)
            ========================================================================= */}
        <section id="arquitectura" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Declaración de Alto Impacto */}
            <motion.div
              variants={textFluidReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-5 text-left space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold tracking-wider">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>DOCTRINA ELECTORAL 2026</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                El candidato que no audita su territorio, ya perdió la elección.
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Durante décadas, las campañas han confiado sus victorias a planillas dispersas de Excel que cualquier persona puede alterar, duplicar o filtrar. El resultado: metas falsas de votación, líderes cobrando por los mismos electores y descalabro logístico en las mesas el Día D.
              </p>

              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border-l-4 border-blue-600 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  "Padrón Electoral transforma la intuición política en una ciencia de datos territoriales inviolable."
                </div>
              </div>
            </motion.div>

            {/* Visualización de las 3 Brechas Críticas Resueltas */}
            <motion.div
              variants={cardStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-7 space-y-4"
            >
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 border border-red-200 dark:border-red-800/60 flex items-center justify-center shrink-0 font-mono font-bold">
                  01
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    La Trampa de los Votos Duplicados
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Un simpatizante prometido a tres líderes diferentes representa dos votos ficticios. Nuestro motor bloquea la cédula desde el primer intento y le adjudica el mérito exclusivamente al primer enrolador.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0 font-mono font-bold">
                  02
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    El Desconocimiento del Censo y la Mesa Real
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Movilizar votantes hacia puestos equivocados arruina la elección. La plataforma cruza los datos con la Registraduría y el DNP para ubicar al elector en su mesa oficial con edad calculada.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0 font-mono font-bold">
                  03
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    La Filtración y Robo de Bases de Datos
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Con PostgreSQL RLS, los líderes territoriales únicamente ven su propio listado. Es técnicamente imposible que un líder renuncie y se lleve la base completa de la campaña.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            4. SECCIÓN: LOS SEIS PILARES DEL BLINDAJE ELECTORAL (FUTURISTA, SIN CAPTURAS)
            ========================================================================= */}
        <section id="pilares" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>CAPACIDADES DEL NÚCLEO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Seis Motores Diseñados para la Certeza Electoral
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Cada componente ha sido concebido para operar bajo las condiciones más exigentes del terreno político.
            </p>
          </motion.div>

          {/* Grilla Asimétrica y Futurista de Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillarsData.map((p, idx) => {
              const IconComponent = p.icon;
              return (
                <motion.div
                  key={p.code}
                  variants={cardStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.15 }}
                  custom={idx}
                  className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 p-7 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-left"
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500">
                        {p.code}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      {p.category}
                    </span>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                      {p.title}
                    </h3>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      {p.lead}
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Tags de telemetría */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 font-mono text-[10px]">
                    {p.metrics.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            5. SECCIÓN: TIMELINE OPERATIVO DE CAMPAÑA (INTERCONECTADO Y FLUIDO)
            ========================================================================= */}
        <section id="timeline" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>DESPLIEGUE TÁCTICO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              De la Cartografía Inicial a la Victoria en Urnas
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Un ciclo de cuatro fases diseñado para otorgar ventaja estratégica absoluta frente a los rivales electorales.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {timelineSteps.map((step, idx) => (
              <motion.div
                key={step.num}
                variants={cardStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                custom={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-lg shadow-blue-500/25">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 font-bold uppercase">
                      {step.phase}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  <span>Paso Verificado</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            6. SECCIÓN: MATRIZ ESTRATÉGICA (PADRÓN ELECTORAL VS EXCEL TRADICIONAL)
            ========================================================================= */}
        <section id="comparativa" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold tracking-wider">
              <FileCheck className="w-3.5 h-3.5" />
              <span>DIFERENCIAL DE PODER</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Padrón Electoral vs. Planillas en Excel y Drive
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              La diferencia técnica entre una campaña con control militar del territorio y una expuesta a la improvisación.
            </p>
          </motion.div>

          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-xs uppercase tracking-wider">Dimensión Operativa</th>
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 text-xs uppercase tracking-wider">
                      Padrón Electoral (SaaS Central)
                    </th>
                    <th className="py-4 px-4 sm:px-6 w-1/3 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider">
                      Planillas Compartidas (Excel / Sheets)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      Anti-Colisión entre Líderes
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Bloqueo automático en 0.04 segundos
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Inexistente: hasta 40% de electores duplicados
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      Cruce y Validación de Censo
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Autocorrección de nombres y edad en vivo
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Digitación a ciegas propensa a errores fatales
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      Confidencialidad y Fuga de Bases
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      PostgreSQL RLS: cada líder solo ve sus electores
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Cualquiera con el enlace descarga la base entera
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      Sincronización en Tiempo Real
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Suscripción WebSocket en móviles y comando central
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Conflictos de archivo desincronizado y pérdida de datos
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      Estructura Territorial DIVIPOLE
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      Puestos y mesas oficiales de Colombia integradas
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 dark:text-slate-400">
                      Nombres de puestos escritos con decenas de variantes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* =========================================================================
            7. SECCIÓN: GOBERNANZA & ESTRUCTURA DE ROLES DE CAMPAÑA
            ========================================================================= */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GOBERNANZA DE SEGURIDAD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Jerarquía de Roles y Privilegios Estancos
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Cada actor de la campaña opera con permisos blindados directamente en el motor de base de datos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              variants={cardStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              custom={0}
              className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-blue-500 tracking-wider block mb-2">
                  NIVEL ESTRATÉGICO
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Administrador General
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Candidato y Gerente de Campaña. Visión 360° del padrón, fijación de metas cuantitativas, balance de saturación de puestos y descarga de reportes oficiales.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                Control Total · Gestión de Campaña
              </div>
            </motion.div>

            <motion.div
              variants={cardStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              custom={1}
              className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-500 tracking-wider block mb-2">
                  NIVEL TÁCTICO
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Coordinador Territorial
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Supervisa comunas o municipios asignados. Ejecuta importaciones masivas por lotes, audita a sus líderes subordinados y supervisa metas territoriales.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                Carga Masiva · Auditoría Zonal
              </div>
            </motion.div>

            <motion.div
              variants={cardStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              custom={2}
              className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-purple-500 tracking-wider block mb-2">
                  NIVEL OPERATIVO
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Líder de Terreno
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enrola votantes en campo desde su smartphone con memoria de lote. Solo puede ver sus propios registros; blindado contra fugas de información.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                Mobile-First · Memoria de Lote
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            8. SECCIÓN: PREGUNTAS FRECUENTES (FAQ ACORDEÓN FLUIDO BIDIRECCIONAL)
            ========================================================================= */}
        <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="text-center max-w-2xl mx-auto mb-14 space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>CONSULTAS CLAVE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Preguntas Frecuentes
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Respuestas directas a las dudas tácticas de gerentes de campaña y comités electorales.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cómo garantiza el motor anti-colisión que no existan votos inflados?',
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
                  variants={cardStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.15 }}
                  custom={index}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-blue-500' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
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
            9. BANNER FINAL FUTURISTA: ACCESO AL COMANDO CENTRAL
            ========================================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            variants={textFluidReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="p-8 sm:p-16 rounded-3xl bg-gradient-to-b from-blue-600/15 via-white to-white dark:from-blue-900/25 dark:via-[#0A101F] dark:to-[#0A101F] border border-blue-200 dark:border-blue-800/80 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
          >
            <div className="max-w-2xl mx-auto space-y-5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold tracking-wider">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                ACCESO EXCLUSIVO PARA CAMPAÑAS AUTORIZADAS
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Toma el control absoluto de tu elección hoy.
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                Ingresa con tus credenciales asignadas por el comité electoral para administrar tu padrón, asignar metas territoriales y monitorear el censo en tiempo real.
              </p>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="px-9 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-bold tracking-wider uppercase transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 cursor-pointer flex items-center gap-3 border border-blue-400/40"
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

      {/* =========================================================================
          10. FOOTER CORPORATIVO Y METADATOS TÉCNICOS
          ========================================================================= */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#050811] py-10 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-slate-200">PADRÓN ELECTORAL</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-[11px] font-mono">ELECTORAL COMMAND CENTER 2026</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SLA 99.99% Edge
            </span>
            <span>·</span>
            <span>PostgreSQL RLS</span>
            <span>·</span>
            <span>Cifrado AES-256</span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-500 dark:text-slate-400">
            Plataforma reservada para comités electorales acreditados. © {new Date().getFullYear()}.
          </p>
        </div>
      </footer>
    </div>
  );
};
