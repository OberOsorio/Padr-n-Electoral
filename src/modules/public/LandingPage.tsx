import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  Check,
  Cloud,
  Headphones,
  Users,
  BarChart3,
  Building,
  Building2,
  Map,
  ShieldCheck,
  ChevronRight,
  Landmark,
  Radio,
  Vote,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

// ============================================================================
// ANIMACIONES BIDIRECCIONALES FLUIDAS (SCROLL DOWN & SCROLL UP)
// ============================================================================
const fluidFadeUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      delay: custom * 0.08,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

// ============================================================================
// COMPONENTE VECTORIAL: MAPA HOLOGRÁFICO DE COLOMBIA CON RED DE NODOS
// ============================================================================
const ColombiaHologramMap: React.FC<{ variant?: 'cyber' | 'light' }> = ({ variant = 'cyber' }) => {
  const isLight = variant === 'light';
  const strokeColor = isLight ? '#0284C7' : '#00D2FF';
  const fillColor = isLight ? 'rgba(14, 165, 233, 0.06)' : 'rgba(0, 210, 255, 0.08)';
  const nodeFill = isLight ? '#0284C7' : '#00D2FF';
  const lineStroke = isLight ? 'rgba(2, 132, 199, 0.35)' : 'rgba(0, 210, 255, 0.45)';

  // 30 Nodos de constelación geográfica precisa (Capitales y Departamentos)
  const constellationNodes = [
    { cx: 278, cy: 52, label: 'Riohacha' },
    { cx: 225, cy: 88, label: 'Santa Marta' },
    { cx: 198, cy: 104, label: 'Barranquilla' },
    { cx: 176, cy: 122, label: 'Cartagena' },
    { cx: 248, cy: 112, label: 'Valledupar' },
    { cx: 168, cy: 162, label: 'Montería' },
    { cx: 282, cy: 172, label: 'Cúcuta' },
    { cx: 242, cy: 198, label: 'Bucaramanga' },
    { cx: 178, cy: 232, label: 'Medellín' },
    { cx: 136, cy: 254, label: 'Quibdó' },
    { cx: 178, cy: 274, label: 'Manizales' },
    { cx: 172, cy: 288, label: 'Pereira' },
    { cx: 236, cy: 264, label: 'Tunja' },
    { cx: 218, cy: 298, label: 'Bogotá D.C.', isHub: true },
    { cx: 186, cy: 314, label: 'Ibagué' },
    { cx: 246, cy: 324, label: 'Villavicencio' },
    { cx: 150, cy: 338, label: 'Cali' },
    { cx: 196, cy: 364, label: 'Neiva' },
    { cx: 152, cy: 384, label: 'Popayán' },
    { cx: 212, cy: 408, label: 'Florencia' },
    { cx: 126, cy: 416, label: 'Pasto' },
    { cx: 170, cy: 434, label: 'Mocoa' },
    { cx: 312, cy: 218, label: 'Arauca' },
    { cx: 278, cy: 268, label: 'Yopal' },
    { cx: 352, cy: 258, label: 'Puerto Carreño' },
    { cx: 346, cy: 334, label: 'Inírida' },
    { cx: 252, cy: 378, label: 'San José del Guaviare' },
    { cx: 308, cy: 428, label: 'Mitú' },
    { cx: 182, cy: 448, label: 'Puerto Asís' },
    { cx: 246, cy: 568, label: 'Leticia', isHub: true },
  ];

  // Conexiones de red entre nodos
  const networkLines = [
    [278, 52, 248, 112], [248, 112, 225, 88], [225, 88, 198, 104], [198, 104, 176, 122],
    [176, 122, 168, 162], [168, 162, 178, 232], [248, 112, 282, 172],
    [282, 172, 242, 198], [242, 198, 236, 264], [236, 264, 218, 298],
    [178, 232, 136, 254], [178, 232, 178, 274], [178, 274, 172, 288], [172, 288, 186, 314],
    [186, 314, 218, 298], [178, 232, 242, 198],
    [282, 172, 312, 218], [312, 218, 278, 268], [278, 268, 218, 298],
    [218, 298, 246, 324], [278, 268, 352, 258], [246, 324, 346, 334],
    [246, 324, 252, 378], [252, 378, 308, 428], [346, 334, 308, 428],
    [172, 288, 150, 338], [150, 338, 152, 384], [152, 384, 126, 416],
    [150, 338, 196, 364], [196, 364, 218, 298], [196, 364, 212, 408],
    [126, 416, 170, 434], [170, 434, 182, 448], [212, 408, 182, 448],
    [212, 408, 252, 378], [182, 448, 246, 568], [252, 378, 246, 568],
    [308, 428, 246, 568],
  ];

  return (
    <svg
      viewBox="0 0 480 610"
      className="w-full h-full drop-shadow-[0_0_35px_rgba(0,210,255,0.45)] select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#155EEF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Contorno Geográfico Realista y Preciso de Colombia */}
      <path
        d="M 280 25
           C 265 40, 255 50, 240 68
           C 225 80, 210 88, 195 95
           C 185 102, 178 110, 175 115
           C 170 128, 168 135, 165 140
           C 158 150, 148 155, 140 160
           C 130 156, 122 154, 118 162
           C 112 172, 108 190, 105 210
           C 102 230, 106 245, 108 255
           C 110 275, 114 290, 115 305
           C 116 325, 110 340, 105 355
           C 100 375, 96 390, 95 400
           C 105 410, 118 418, 125 420
           C 142 425, 155 428, 165 430
           C 180 432, 195 434, 205 435
           C 218 450, 228 465, 235 475
           C 245 495, 252 510, 255 520
           C 258 540, 250 560, 246 575
           C 255 565, 268 545, 275 525
           C 285 500, 292 480, 295 465
           C 308 450, 320 438, 330 425
           C 342 405, 350 385, 355 370
           C 362 350, 368 330, 370 315
           C 366 290, 362 270, 355 250
           C 345 240, 330 235, 310 230
           C 295 225, 285 220, 275 215
           C 280 198, 288 185, 290 175
           C 285 160, 280 150, 275 140
           C 270 125, 265 110, 260 100
           C 268 85, 275 70, 280 60
           C 285 50, 286 35, 280 25 Z"
        stroke={strokeColor}
        strokeWidth={isLight ? '2.2' : '2.8'}
        fill={fillColor}
        filter={isLight ? undefined : 'url(#glow-cyan)'}
      />

      {/* Constelación de Líneas Luminosas Celestes Interconectadas */}
      <g stroke={lineStroke} strokeWidth="0.85" opacity={isLight ? 0.7 : 0.85}>
        {networkLines.map(([x1, y1, x2, y2], idx) => (
          <line key={`line-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>

      {/* Constelación de Nodos Luminosos (Puntos Neón) */}
      {constellationNodes.map((n) => (
        <g key={n.label}>
          <circle
            cx={n.cx}
            cy={n.cy}
            r={n.isHub ? '3.5' : '2.2'}
            fill={nodeFill}
            filter={isLight ? undefined : 'url(#node-glow)'}
          />
          {!isLight && n.isHub && (
            <circle
              cx={n.cx}
              cy={n.cy}
              r="8"
              fill={nodeFill}
              opacity="0.3"
              className="animate-ping"
              style={{ transformOrigin: `${n.cx}px ${n.cy}px`, animationDuration: '2.5s' }}
            />
          )}
        </g>
      ))}
    </svg>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL LANDING PAGE ELECTORAL
// ============================================================================
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-white selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden flex flex-col justify-between font-sans">
      {/* =========================================================================
          A. BARRA DE NAVEGACIÓN (STICKY GLASSMORPHISM HEADER)
          ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#070B19]/80 backdrop-blur-xl border-b border-slate-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Izquierda: Isotipo + Nombre Institucional */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-cyan-400/40 shrink-0">
              <Shield className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase leading-none font-bold">
                PLATAFORMA
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none mt-1">
                ELECTORAL
              </span>
            </div>
          </div>

          {/* Centro: Links de Navegación Minimalistas */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#inicio" className="text-white hover:text-cyan-400 transition-colors relative py-1">
              Inicio
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            </a>
            <a href="#caracteristicas" className="hover:text-cyan-400 transition-colors">
              Características
            </a>
            <a href="#cobertura" className="hover:text-cyan-400 transition-colors">
              Cobertura
            </a>
            <a href="#seguridad" className="hover:text-cyan-400 transition-colors">
              Seguridad
            </a>
            <a href="#contacto" className="hover:text-cyan-400 transition-colors">
              Contacto
            </a>
          </nav>

          {/* Derecha: Botón CTA Primario en Azul Eléctrico */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#155EEF] hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 cursor-pointer border border-blue-400/30"
            >
              <span>Acceder a la plataforma</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10" id="inicio">
        {/* =========================================================================
            B. HERO SECTION (DOBLE COLUMNA + HOLOGRAMA 3D MAPA COLOMBIA + PANEL FLOTANTE)
            ========================================================================= */}
        <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          {/* Luces Ambientales de Fondo */}
          <div
            className="absolute top-10 left-1/4 w-[600px] h-[400px] bg-blue-600/20 blur-[150px] pointer-events-none -z-10"
            aria-hidden="true"
          />
          <div
            className="absolute top-20 right-10 w-[500px] h-[500px] bg-cyan-500/15 blur-[160px] pointer-events-none -z-10"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Columna Izquierda: Información Principal */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-5 text-left space-y-6"
            >
              {/* Badge Píldora Superior */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                <span>TECNOLOGÍA PARA UNA DEMOCRACIA MÁS FUERTE</span>
              </div>

              {/* H1 de Gran Escala con acento cian */}
              <h1 className="text-4xl sm:text-5xl lg:text-5.5xl xl:text-6xl font-black tracking-tight text-white leading-[1.08] text-balance">
                Tu aliado en cada{' '}
                <span className="text-[#00D2FF] drop-shadow-[0_0_25px_rgba(0,210,255,0.4)]">
                  proceso electoral
                </span>
              </h1>

              {/* Párrafo descriptivo fiel */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                Plataforma tecnológica diseñada para gestionar, controlar y hacer seguimiento a todas las etapas del proceso electoral en Colombia. Transparencia, seguridad y eficiencia en un solo lugar.
              </p>

              {/* Fila de Botones */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all shadow-xl shadow-blue-600/40 hover:shadow-blue-500/60 cursor-pointer flex items-center justify-center gap-2 border border-blue-400/40"
                >
                  <span>Comenzar ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#caracteristicas"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#0E172E]/90 hover:bg-[#152345] border border-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <span>Conoce más</span>
                </a>
              </div>

              {/* Badges de Confianza Horizontales */}
              <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Seguro y confiable</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>100% en la nube</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <span>Soporte 24/7</span>
                </div>
              </div>
            </motion.div>

            {/* Columna Central: Holograma 3D Mapa de Colombia sobre Pedestal */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-4 relative flex flex-col items-center justify-center my-6 lg:my-0"
            >
              {/* Bandera de Colombia Ondulante en Fondo (Estilizada y Atmosférica) */}
              <div
                className="absolute top-14 -left-6 sm:-left-10 w-60 sm:w-68 h-40 rounded-2xl overflow-hidden pointer-events-none -z-10 transform -rotate-6 shadow-2xl transition-all"
                style={{
                  opacity: 0.68,
                  filter: 'blur(1px)',
                }}
              >
                {/* Franja Amarilla (50%) */}
                <div className="h-[50%] w-full bg-gradient-to-r from-[#FCD116] via-[#FFE259] to-[#FCD116]" />
                {/* Franja Azul (25%) */}
                <div className="h-[25%] w-full bg-gradient-to-r from-[#003893] via-[#0052cc] to-[#003893]" />
                {/* Franja Roja (25%) */}
                <div className="h-[25%] w-full bg-gradient-to-r from-[#CE1126] via-[#ea2b41] to-[#CE1126]" />
                {/* Ondeado y Sombra de Relieve */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/20 mix-blend-overlay pointer-events-none" />
              </div>

              {/* Mapa Holográfico Vectorial */}
              <div className="relative w-[300px] sm:w-[350px] lg:w-[380px] h-[380px] sm:h-[440px] flex items-center justify-center z-10">
                <ColombiaHologramMap variant="cyber" />
              </div>

              {/* Pedestal Tecnológico Elíptico en Perspectiva Isométrica con Luz Ascendente */}
              <div className="relative -mt-16 w-[320px] sm:w-[380px] h-[110px] flex flex-col items-center justify-center pointer-events-none">
                {/* Haz de Luz Láser Ascendente hacia el Trapecio Amazónico */}
                <div
                  className="absolute -top-12 w-44 h-24 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at bottom, rgba(0, 210, 255, 0.45) 0%, rgba(21, 94, 239, 0.15) 50%, transparent 80%)',
                    clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
                  }}
                />

                {/* Disco Base Oscuro (#0B152D) */}
                <div className="absolute w-[92%] h-[68px] rounded-[100%] bg-[#0B152D] border border-cyan-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.8)]" />

                {/* Aro Exterior Neón Brillante */}
                <div className="absolute w-[88%] h-[60px] rounded-[100%] border-2 border-[#00D2FF] shadow-[0_0_35px_rgba(0,210,255,0.7)]" />

                {/* Aro Medio Tecnológico */}
                <div className="absolute w-[70%] h-[44px] rounded-[100%] border border-[#38BDF8]/80 shadow-[0_0_20px_rgba(56,189,248,0.5)] border-dashed" />

                {/* Núcleo Interior Radiante */}
                <div className="absolute w-[45%] h-[26px] rounded-[100%] bg-gradient-to-b from-[#00D2FF]/40 to-transparent border border-cyan-300 shadow-[0_0_25px_rgba(0,210,255,0.9)]" />
              </div>
            </motion.div>

            {/* Columna Derecha: Panel Lateral Flotante de Métricas (4 Tarjetas Exactas) */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-3 flex flex-col gap-3.5 w-full max-w-[290px] mx-auto lg:mx-0"
            >
              {/* Tarjeta 1: Departamentos */}
              <div className="p-4 rounded-xl bg-[#0E172E]/85 backdrop-blur-md border border-sky-400/25 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all flex items-center gap-3.5 shadow-lg group">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    32
                  </span>
                  <span className="text-xs text-[#94A3B8] font-medium block mt-1">Departamentos</span>
                </div>
              </div>

              {/* Tarjeta 2: Municipios */}
              <div className="p-4 rounded-xl bg-[#0E172E]/85 backdrop-blur-md border border-sky-400/25 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all flex items-center gap-3.5 shadow-lg group">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    +1.102
                  </span>
                  <span className="text-xs text-[#94A3B8] font-medium block mt-1">Municipios</span>
                </div>
              </div>

              {/* Tarjeta 3: Puestos de votación */}
              <div className="p-4 rounded-xl bg-[#0E172E]/85 backdrop-blur-md border border-sky-400/25 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all flex items-center gap-3.5 shadow-lg group">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 shrink-0 group-hover:scale-105 transition-transform">
                  <Vote className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    +12.000
                  </span>
                  <span className="text-xs text-[#94A3B8] font-medium block mt-1">Puestos de votación</span>
                </div>
              </div>

              {/* Tarjeta 4: Ciudadanos habilitados */}
              <div className="p-4 rounded-xl bg-[#0E172E]/85 backdrop-blur-md border border-sky-400/25 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all flex items-center gap-3.5 shadow-lg group">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    +39.000.000
                  </span>
                  <span className="text-xs text-[#94A3B8] font-medium block mt-1">Ciudadanos habilitados</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            C. SECCIÓN DE CARACTERÍSTICAS (GRID DE 6 TARJETAS EXACTAS)
            ========================================================================= */}
        <section id="caracteristicas" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Encabezado Lateral */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-4 text-left space-y-4"
            >
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                CARACTERÍSTICAS PRINCIPALES
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Todo lo que necesitas en una sola plataforma
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Herramientas diseñadas para hacer más fácil, transparente y eficiente todo el proceso electoral, desde la creación de campañas hasta el seguimiento en tiempo real.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#155EEF] hover:bg-blue-500 text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <span>Ver todas las funciones</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Grid de 6 Tarjetas Tecnológicas (2 Filas x 3 Columnas) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
              {/* Tarjeta 1 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0E172E] border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,210,255,0.15)] shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Gestión de campañas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Crea, administra y monitorea tus campañas electorales de forma sencilla y segura.
                </p>
              </motion.div>

              {/* Tarjeta 2 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0E172E] border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,210,255,0.15)] shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Registro de candidatos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controla y valida la información de todos tus candidatos y sus equipos de trabajo.
                </p>
              </motion.div>

              {/* Tarjeta 3 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0E172E] border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,210,255,0.15)] shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Información electoral oficial</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Datos actualizados de la Registraduría Nacional del Estado Civil y mapas electorales por territorio.
                </p>
              </motion.div>

              {/* Tarjeta 4 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0E172E] border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,210,255,0.15)] shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Seguridad avanzada</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Protección de datos, encriptación y autenticación de alto nivel.
                </p>
              </motion.div>

              {/* Tarjeta 5 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0E172E] border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,210,255,0.15)] shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Cloud className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Acceso en tiempo real</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consulta resultados, estadísticas y reportes desde cualquier dispositivo.
                </p>
              </motion.div>

              {/* Tarjeta 6 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0E172E] border border-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,210,255,0.15)] shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Headphones className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Soporte especializado</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Un equipo siempre disponible para acompañarte en todo el proceso.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            D. SECCIÓN DE IMPACTO Y DATOS ESTADÍSTICOS (DATA HUD + BLUEPRINT)
            ========================================================================= */}
        <section
          id="seguridad"
          className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(14,165,233,0.15),transparent)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Encabezado Lateral */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-4 text-left space-y-4"
            >
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                NUESTRO IMPACTO
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Datos que respaldan nuestra gestión
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                La tecnología al servicio de la democracia. Estos son algunos de los resultados que nos motivan a seguir mejorando.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0E172E] hover:bg-[#152345] border border-cyan-500/30 text-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <span>Ver estadísticas completas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Grid de 6 Contadores Numéricos (2 Filas x 3 Columnas) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
              {/* Métrica 1 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0D162B]/90 border border-slate-700/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all shadow-lg group"
              >
                <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-400/20 mb-4 group-hover:scale-105 transition-transform">
                  <Map className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white block tracking-tight">32</span>
                <span className="text-xs text-[#94A3B8] font-medium mt-1.5 block">Departamentos</span>
              </motion.div>

              {/* Métrica 2 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0D162B]/90 border border-slate-700/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all shadow-lg group"
              >
                <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-400/20 mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white block tracking-tight">+1.102</span>
                <span className="text-xs text-[#94A3B8] font-medium mt-1.5 block">Municipios</span>
              </motion.div>

              {/* Métrica 3 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0D162B]/90 border border-slate-700/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all shadow-lg group"
              >
                <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-400/20 mb-4 group-hover:scale-105 transition-transform">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white block tracking-tight">1.102</span>
                <span className="text-xs text-[#94A3B8] font-medium mt-1.5 block">Zonas electorales</span>
              </motion.div>

              {/* Métrica 4 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0D162B]/90 border border-slate-700/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all shadow-lg group"
              >
                <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-400/20 mb-4 group-hover:scale-105 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white block tracking-tight">+12.000</span>
                <span className="text-xs text-[#94A3B8] font-medium mt-1.5 block">Puestos de votación</span>
              </motion.div>

              {/* Métrica 5 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0D162B]/90 border border-slate-700/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all shadow-lg group"
              >
                <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-400/20 mb-4 group-hover:scale-105 transition-transform">
                  <Vote className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white block tracking-tight">+106.000</span>
                <span className="text-xs text-[#94A3B8] font-medium mt-1.5 block">Mesas de votación</span>
              </motion.div>

              {/* Métrica 6 */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="p-6 rounded-2xl bg-[#0D162B]/90 border border-slate-700/80 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,210,255,0.15)] transition-all shadow-lg group"
              >
                <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-cyan-400 border border-cyan-400/20 mb-4 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white block tracking-tight">+39.000.000</span>
                <span className="text-xs text-[#94A3B8] font-medium mt-1.5 block">Ciudadanos habilitados</span>
              </motion.div>
            </div>
          </div>

          {/* Horizonte Iluminado Curvo de la Tierra en el Fondo */}
          <div className="mt-16 w-full h-36 relative overflow-hidden pointer-events-none rounded-b-3xl">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent" />
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[140%] h-[160px] rounded-[100%] border-t border-cyan-400/50 shadow-[0_-15px_40px_rgba(0,210,255,0.3)] bg-gradient-to-b from-[#0F1E3D] to-transparent" />
          </div>
        </section>

        {/* =========================================================================
            E. SECCIÓN DE COBERTURA NACIONAL (CONTRASTE CLARO #F8FAFC)
            ========================================================================= */}
        <section
          id="cobertura"
          className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] text-slate-900 transition-colors"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Columna Izquierda: Mockup Perspectivado de Pantallas */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="lg:col-span-4 relative flex items-center justify-center"
              >
                {/* Pantallas Oscuras en Capas Isométricas */}
                <div className="relative w-full max-w-[340px] h-[360px]">
                  {/* Capa Trasera 1 */}
                  <div className="absolute top-4 left-0 w-56 h-64 rounded-2xl bg-[#091124] border border-slate-700 shadow-xl transform -rotate-12 overflow-hidden opacity-75">
                    <div className="p-3 w-full h-full">
                      <ColombiaHologramMap variant="cyber" />
                    </div>
                  </div>

                  {/* Capa Trasera 2 */}
                  <div className="absolute top-2 left-10 w-60 h-72 rounded-2xl bg-[#0A142B] border border-cyan-500/30 shadow-2xl transform -rotate-6 overflow-hidden">
                    <div className="p-4 w-full h-full">
                      <ColombiaHologramMap variant="cyber" />
                    </div>
                  </div>

                  {/* Tarjeta Frontal Blanca con Opciones */}
                  <div className="absolute top-10 left-16 w-64 rounded-2xl bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 text-left space-y-2.5 z-20">
                    <div className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs">
                          <Map className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">Gobernación</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                          <Landmark className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">Asamblea</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 font-bold text-xs">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">Alcaldía</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                          <Users className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">Concejo</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Columna Centro: Información Oficial */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="lg:col-span-5 text-left space-y-4"
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 block">
                  COBERTURA NACIONAL
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Información electoral para todo el país
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Accede a los datos oficiales de la Registraduría Nacional del Estado Civil y del censo electoral, con cobertura en los 32 departamentos y Bogotá D.C., incluyendo la información de los cargos locales y regionales.
                </p>

                {/* 4 Botones de Categorías */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 text-center">
                    <Map className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Gobernación</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 text-center">
                    <Landmark className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Asamblea</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 text-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Alcaldía</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 text-center">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Concejo</span>
                  </div>
                </div>
              </motion.div>

              {/* Columna Derecha: Silueta Vectorial de Colombia con Nodos Celestes */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="lg:col-span-3 flex items-center justify-center"
              >
                <div className="w-[260px] h-[340px]">
                  <ColombiaHologramMap variant="light" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            F. CALL TO ACTION FINAL (HERO FOOTER BANNER CIUDAD NOCTURNA)
            ========================================================================= */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden bg-[#070B19] border-t border-slate-800/80">
          {/* Fondo Panorámico Nocturno con Montañas y Luces */}
          <div className="absolute inset-0 opacity-40 pointer-events-none -z-10">
            {/* Silueta de Cordillera */}
            <svg viewBox="0 0 1440 320" className="w-full h-full object-cover" preserveAspectRatio="none">
              <path
                fill="#0A142A"
                d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#070B19] to-transparent" />
          </div>

          <motion.div
            variants={fluidFadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="max-w-3xl mx-auto space-y-6 relative z-10"
          >
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Sé parte del cambio
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
              La democracia se construye con tecnología, información y personas como tú.
            </p>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="px-8 py-3.5 rounded-full bg-[#155EEF] hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all shadow-xl shadow-blue-600/40 hover:shadow-blue-500/60 cursor-pointer flex items-center gap-2.5 border border-blue-400/40"
              >
                <span>Comenzar ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* =========================================================================
            SECCIÓN FAQ RÁPIDA PARA CUMPLIR NAVEGACIÓN
            ========================================================================= */}
        <section id="contacto" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80 text-left">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              RESOLUCIÓN DE DUDAS
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Preguntas Frecuentes
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                q: '¿Cómo garantiza la plataforma la transparencia electoral?',
                a: 'El sistema integra los datos oficiales de censo y puestos DIVIPOLE con auditoría criptográfica, eliminando discrepancias y blindando el registro de simpatizantes con trazabilidad completa.',
              },
              {
                q: '¿Es compatible con cualquier tipo de campaña (Alcaldía, Concejo, Gobernación)?',
                a: 'Sí. La arquitectura modular permite configurar cualquier contienda municipal o departamental con asignación de metas automáticas.',
              },
            ].map((faq, idx) => (
              <div key={faq.q} className="rounded-2xl bg-[#0D162B] border border-slate-700/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-sm text-white hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? 'rotate-90 text-cyan-400' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================================================
          G. PIE DE PÁGINA (DARK PRO FOOTER)
          ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-[#070B19] py-10 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Fila Superior */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold leading-none">
                  PLATAFORMA
                </span>
                <span className="text-base font-extrabold text-white leading-none mt-0.5">
                  ELECTORAL
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <a href="#inicio" className="hover:text-white transition-colors">
                Inicio
              </a>
              <a href="#caracteristicas" className="hover:text-white transition-colors">
                Características
              </a>
              <a href="#cobertura" className="hover:text-white transition-colors">
                Cobertura
              </a>
              <a href="#seguridad" className="hover:text-white transition-colors">
                Seguridad
              </a>
              <a href="#contacto" className="hover:text-white transition-colors">
                Contacto
              </a>
            </div>

            {/* Redes Sociales e Indicador Institucional */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-slate-400">
                {/* Facebook */}
                <a href="#inicio" className="hover:text-cyan-400 transition-colors" aria-label="Facebook">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                {/* X (Twitter) */}
                <a href="#inicio" className="hover:text-cyan-400 transition-colors" aria-label="X">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#inicio" className="hover:text-cyan-400 transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* YouTube */}
                <a href="#inicio" className="hover:text-cyan-400 transition-colors" aria-label="YouTube">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>

              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Tecnología que fortalece la democracia
              </span>
            </div>
          </div>

          {/* Fila Inferior */}
          <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 Plataforma Electoral. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#inicio" className="hover:text-slate-300 transition-colors">
                Términos y condiciones
              </a>
              <span>|</span>
              <a href="#inicio" className="hover:text-slate-300 transition-colors">
                Política de privacidad
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
