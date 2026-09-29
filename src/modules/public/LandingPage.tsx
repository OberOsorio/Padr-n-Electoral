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
  MapPin,
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
// COMPONENTE VECTORIAL: MAPA HOLOGRÁFICO DE COLOMBIA CON RED DE NODOS, ÓRBITAS Y PEDESTAL HUD
// ============================================================================
const ColombiaHologramMap: React.FC<{ variant?: 'cyber' | 'light' }> = ({ variant = 'cyber' }) => {
  const isLight = variant === 'light';
  const strokeColor = isLight ? '#0284C7' : '#00D2FF';
  const fillColor = isLight ? 'rgba(14, 165, 233, 0.05)' : 'rgba(0, 210, 255, 0.07)';
  const nodeFill = isLight ? '#0284C7' : '#00D2FF';
  const lineStroke = isLight ? 'rgba(2, 132, 199, 0.35)' : 'rgba(0, 210, 255, 0.45)';

  // Nodos Geográficos de la Constelación (Capitales y Nodos Estratégicos)
  const constellationNodes = [
    { cx: 300, cy: 55, label: 'Riohacha' },
    { cx: 245, cy: 92, label: 'Santa Marta' },
    { cx: 218, cy: 108, label: 'Barranquilla' },
    { cx: 195, cy: 126, label: 'Cartagena' },
    { cx: 270, cy: 116, label: 'Valledupar' },
    { cx: 185, cy: 168, label: 'Montería' },
    { cx: 305, cy: 178, label: 'Cúcuta' },
    { cx: 262, cy: 202, label: 'Bucaramanga' },
    { cx: 198, cy: 236, label: 'Medellín', isPulseHub: true },
    { cx: 154, cy: 258, label: 'Quibdó' },
    { cx: 196, cy: 278, label: 'Manizales' },
    { cx: 190, cy: 294, label: 'Pereira' },
    { cx: 256, cy: 268, label: 'Tunja' },
    { cx: 236, cy: 302, label: 'Bogotá D.C.', isPulseHub: true },
    { cx: 204, cy: 318, label: 'Ibagué' },
    { cx: 266, cy: 328, label: 'Villavicencio' },
    { cx: 168, cy: 342, label: 'Cali', isPulseHub: true },
    { cx: 214, cy: 368, label: 'Neiva' },
    { cx: 170, cy: 388, label: 'Popayán' },
    { cx: 230, cy: 412, label: 'Florencia' },
    { cx: 144, cy: 420, label: 'Pasto' },
    { cx: 188, cy: 438, label: 'Mocoa' },
    { cx: 335, cy: 222, label: 'Arauca' },
    { cx: 298, cy: 272, label: 'Yopal' },
    { cx: 374, cy: 262, label: 'Puerto Carreño' },
    { cx: 368, cy: 338, label: 'Inírida' },
    { cx: 272, cy: 382, label: 'San José del Guaviare' },
    { cx: 328, cy: 432, label: 'Mitú' },
    { cx: 200, cy: 452, label: 'Puerto Asís' },
    { cx: 266, cy: 540, label: 'Leticia' },
  ];

  // Red de Triangulación Poligonal (Low-Poly Cyber Mesh)
  const polygonFacets = [
    // Caribe y Norte
    '300,55 270,116 245,92',
    '245,92 218,108 270,116',
    '218,108 195,126 270,116',
    '195,126 185,168 270,116',
    '270,116 305,178 262,202',
    '185,168 198,236 262,202',
    '185,168 154,258 198,236',
    // Santanderes, Boyacá y Centro
    '305,178 335,222 298,272',
    '305,178 262,202 298,272',
    '262,202 256,268 298,272',
    '262,202 198,236 256,268',
    '198,236 196,278 256,268',
    '198,236 154,258 196,278',
    '196,278 190,294 236,302',
    '196,278 256,268 236,302',
    '256,268 298,272 266,328',
    '256,268 236,302 266,328',
    // Eje Cafetero, Valle, Tolima, Huila
    '190,294 204,318 236,302',
    '190,294 168,342 204,318',
    '204,318 236,302 214,368',
    '236,302 266,328 214,368',
    '168,342 170,388 214,368',
    '170,388 144,420 188,438',
    '170,388 188,438 214,368',
    '214,368 188,438 230,412',
    // Orinoquía y Amazonía
    '298,272 374,262 335,222',
    '298,272 374,262 368,338',
    '298,272 266,328 368,338',
    '266,328 272,382 368,338',
    '266,328 214,368 272,382',
    '272,382 368,338 328,432',
    '272,382 230,412 328,432',
    '214,368 230,412 272,382',
    '144,420 188,438 200,452',
    '188,438 230,412 200,452',
    '230,412 272,382 200,452',
    '272,382 328,432 266,540',
    '272,382 200,452 266,540',
    '328,432 266,540 266,540',
  ];

  // Líneas directas de interconexión
  const networkLines = [
    [300, 55, 270, 116], [270, 116, 245, 92], [245, 92, 218, 108], [218, 108, 195, 126],
    [195, 126, 185, 168], [185, 168, 198, 236], [270, 116, 305, 178], [305, 178, 262, 202],
    [262, 202, 256, 268], [256, 268, 236, 302], [198, 236, 154, 258], [198, 236, 196, 278],
    [196, 278, 190, 294], [190, 294, 204, 318], [204, 318, 236, 302], [198, 236, 262, 202],
    [305, 178, 335, 222], [335, 222, 298, 272], [298, 272, 236, 302], [236, 302, 266, 328],
    [298, 272, 374, 262], [266, 328, 368, 338], [266, 328, 272, 382], [272, 382, 328, 432],
    [368, 338, 328, 432], [190, 294, 168, 342], [168, 342, 170, 388], [170, 388, 144, 420],
    [168, 342, 214, 368], [214, 368, 236, 302], [214, 368, 230, 412], [144, 420, 188, 438],
    [188, 438, 200, 452], [230, 412, 200, 452], [230, 412, 272, 382], [200, 452, 266, 540],
    [272, 382, 266, 540], [328, 432, 266, 540],
  ];

  return (
    <svg
      viewBox="0 0 540 650"
      className="w-full h-full drop-shadow-[0_0_45px_rgba(0,210,255,0.45)] select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Resplandor Neón Multicapa para Contorno */}
        <filter id="hero-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur1" />
          <feGaussianBlur stdDeviation="9" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Resplandor Concentrado de Nodos */}
        <filter id="node-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Resplandor de Destellos Estelares (Star Flare) */}
        <filter id="flare-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradiente para Anillos Orbitales */}
        <linearGradient id="orbit-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#155EEF" stopOpacity="0.15" />
          <stop offset="75%" stopColor="#00D2FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id="orbit-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#155EEF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.85" />
        </linearGradient>

        {/* Gradiente para el Haz de Luz Láser Ascendente del Pedestal */}
        <linearGradient id="laser-cone-grad" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.8" />
          <stop offset="35%" stopColor="#155EEF" stopOpacity="0.35" />
          <stop offset="80%" stopColor="#00D2FF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00D2FF" stopOpacity="0" />
        </linearGradient>

        {/* Gradiente Radial para el Emitter Core */}
        <radialGradient id="emitter-radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="30%" stopColor="#00D2FF" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#155EEF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#060E22" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* =====================================================================
          1. ANILLOS ORBITALES DE LUZ EN PERSPECTIVA 3D (ESPACIALIDAD)
          ===================================================================== */}
      {!isLight && (
        <g opacity="0.85">
          {/* Anillo Orbital Mayor Diagonal (rodea el mapa y pasa detrás de la bandera) */}
          <ellipse
            cx="265"
            cy="270"
            rx="245"
            ry="115"
            transform="rotate(-22 265 270)"
            stroke="url(#orbit-grad-1)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#hero-glow-cyan)"
          />
          {/* Anillo Orbital Menor Intermedio (cintura del territorio) */}
          <ellipse
            cx="265"
            cy="375"
            rx="185"
            ry="65"
            transform="rotate(14 265 375)"
            stroke="url(#orbit-grad-2)"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="8 6"
            filter="url(#hero-glow-cyan)"
          />
        </g>
      )}

      {/* =====================================================================
          2. SILUETA VECTORIAL GEOGRÁFICA PRECISA DE COLOMBIA
          ===================================================================== */}
      <path
        d="M 302 28
           C 288 44, 278 52, 260 70
           C 245 82, 230 90, 215 97
           C 205 104, 198 112, 195 117
           C 190 130, 188 137, 185 142
           C 178 152, 168 157, 160 162
           C 150 158, 142 156, 138 164
           C 132 174, 128 192, 125 212
           C 122 232, 126 247, 128 257
           C 130 277, 134 292, 135 307
           C 136 327, 130 342, 125 357
           C 120 377, 116 392, 115 402
           C 125 412, 138 420, 145 422
           C 162 427, 175 430, 185 432
           C 200 434, 215 436, 225 437
           C 238 452, 248 467, 255 477
           C 265 497, 272 512, 275 522
           C 278 542, 270 560, 266 565
           C 275 555, 288 535, 295 515
           C 305 490, 312 470, 315 455
           C 328 440, 340 428, 350 415
           C 362 395, 370 375, 375 360
           C 382 340, 388 320, 390 305
           C 386 280, 382 260, 375 240
           C 365 230, 350 225, 330 220
           C 315 215, 305 210, 295 205
           C 300 188, 308 175, 310 165
           C 305 150, 300 140, 295 130
           C 290 115, 285 100, 280 90
           C 288 75, 295 60, 300 50
           C 306 40, 308 34, 302 28 Z"
        stroke={strokeColor}
        strokeWidth={isLight ? '2.4' : '3.2'}
        fill={fillColor}
        filter={isLight ? undefined : 'url(#hero-glow-cyan)'}
      />

      {/* =====================================================================
          3. CONSTELACIÓN POLIGONAL TRANSLÚCIDA (FACETAS CIBERNÉTICAS)
          ===================================================================== */}
      {!isLight && (
        <g stroke="rgba(0, 210, 255, 0.4)" strokeWidth="0.8" fill="rgba(0, 210, 255, 0.04)">
          {polygonFacets.map((pts, i) => (
            <polygon key={`poly-${i}`} points={pts} />
          ))}
        </g>
      )}

      {/* Líneas de Red Vectorial Interconectada */}
      <g stroke={lineStroke} strokeWidth="0.85" opacity={isLight ? 0.7 : 0.85}>
        {networkLines.map(([x1, y1, x2, y2], idx) => (
          <line key={`line-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>

      {/* =====================================================================
          4. NODOS LUMINOSOS Y DESTELLOS ESTELARES (STAR FLARES)
          ===================================================================== */}
      {constellationNodes.map((n) => (
        <g key={n.label}>
          {/* Nodo estándar */}
          <circle
            cx={n.cx}
            cy={n.cy}
            r={n.isPulseHub ? '4' : '2.4'}
            fill={nodeFill}
            filter={isLight ? undefined : 'url(#node-glow)'}
          />

          {/* Nodos de alta intensidad con destellos en cruz (Star Flares) y auras pulsantes */}
          {!isLight && n.isPulseHub && (
            <g>
              {/* Halo circular grande */}
              <circle cx={n.cx} cy={n.cy} r="12" fill="#00D2FF" opacity="0.35" />

              {/* Anillo de onda expansiva */}
              <circle
                cx={n.cx}
                cy={n.cy}
                r="18"
                fill="none"
                stroke="#00D2FF"
                strokeWidth="1.2"
                opacity="0.5"
                className="animate-ping"
                style={{ transformOrigin: `${n.cx}px ${n.cy}px`, animationDuration: '3s' }}
              />

              {/* Centro de luz blanca ultra-brillante */}
              <circle cx={n.cx} cy={n.cy} r="2.2" fill="#FFFFFF" />

              {/* Destello de lente estelar de 4 puntas (Cross Flare Glint) */}
              <polygon
                points={`${n.cx},${n.cy - 16} ${n.cx + 2.5},${n.cy - 2.5} ${n.cx + 16},${n.cy} ${n.cx + 2.5},${n.cy + 2.5} ${n.cx},${n.cy + 16} ${n.cx - 2.5},${n.cy + 2.5} ${n.cx - 16},${n.cy} ${n.cx - 2.5},${n.cy - 2.5}`}
                fill="#FFFFFF"
                opacity="0.95"
                filter="url(#flare-glow)"
              />
              <polygon
                points={`${n.cx},${n.cy - 9} ${n.cx + 1.8},${n.cy - 1.8} ${n.cx + 9},${n.cy} ${n.cx + 1.8},${n.cy + 1.8} ${n.cx},${n.cy + 9} ${n.cx - 1.8},${n.cy + 1.8} ${n.cx - 9},${n.cy} ${n.cx - 1.8},${n.cy - 1.8}`}
                fill="#00D2FF"
                opacity="0.85"
              />
            </g>
          )}
        </g>
      ))}

      {/* =====================================================================
          5. PEDESTAL CIBERNÉTICO HUD CON ANILLOS CONCÉNTRICOS Y LUZ ASCENDENTE
          ===================================================================== */}
      {!isLight && (
        <g id="pedestal-hud">
          {/* Haz de Luz Láser Ascendente que Baña la Punta Sur (Leticia) */}
          <polygon
            points="225,565 305,565 275,540 255,540"
            fill="url(#laser-cone-grad)"
            filter="url(#hero-glow-cyan)"
            opacity="0.8"
          />

          {/* Plataforma Base Reflectante Oscura */}
          <ellipse
            cx="266"
            cy="580"
            rx="210"
            ry="44"
            fill="#060E22"
            stroke="rgba(0, 210, 255, 0.4)"
            strokeWidth="1.8"
          />

          {/* Barras de Luz LED Neón Segmentadas en el Perímetro Exterior */}
          <path
            d="M 85,576 A 210 44 0 0 0 165,614"
            stroke="#00D2FF"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            filter="url(#hero-glow-cyan)"
          />
          <path
            d="M 195,620 A 210 44 0 0 0 245,624"
            stroke="#00D2FF"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#hero-glow-cyan)"
          />
          <path
            d="M 285,624 A 210 44 0 0 0 335,620"
            stroke="#00D2FF"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#hero-glow-cyan)"
          />
          <path
            d="M 365,614 A 210 44 0 0 0 445,576"
            stroke="#00D2FF"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            filter="url(#hero-glow-cyan)"
          />

          {/* Anillo Intermedio Metálico Escalonado */}
          <ellipse
            cx="266"
            cy="570"
            rx="155"
            ry="32"
            fill="#091530"
            stroke="#155EEF"
            strokeWidth="2.5"
          />
          <ellipse
            cx="266"
            cy="566"
            rx="145"
            ry="28"
            fill="none"
            stroke="#00D2FF"
            strokeWidth="1.2"
            strokeDasharray="14 6"
            opacity="0.8"
          />

          {/* Anillo Emitter Interior Radiante */}
          <ellipse
            cx="266"
            cy="560"
            rx="95"
            ry="20"
            fill="url(#emitter-radial)"
            stroke="#00D2FF"
            strokeWidth="2"
            filter="url(#hero-glow-cyan)"
          />

          {/* Núcleo Central de Emisión de Alta Intensidad */}
          <ellipse cx="266" cy="558" rx="55" ry="11" fill="#00D2FF" filter="url(#node-glow)" />
          <ellipse cx="266" cy="557" rx="30" ry="6" fill="#FFFFFF" />
        </g>
      )}
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
    <div className="min-h-screen bg-[#070B19] text-slate-100 selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden w-full flex flex-col justify-between font-sans">
      {/* =========================================================================
          RESPLANDORES DE ILUMINACIÓN AMBIENTAL (GLOBAL AMBIENT GLOWS)
          ========================================================================= */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 select-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Haz de luz radial superior */}
        <div
          className="absolute -top-24 left-[15%] sm:left-[30%] w-[800px] sm:w-[1200px] h-[550px] sm:h-[750px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 60% 15%, rgba(21, 94, 239, 0.22) 0%, rgba(7, 11, 25, 0) 65%)',
          }}
        />
        {/* Haz de luz de apoyo lateral izquierdo */}
        <div
          className="absolute top-[10%] -left-32 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 10% 25%, rgba(0, 210, 255, 0.08) 0%, transparent 50%)',
          }}
        />
      </div>

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
            B. HERO SECTION (DOBLE COLUMNA + PEDESTAL HUD EN LIENZO + PANEL FLOTANTE)
            ========================================================================= */}
        <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          {/* Fondo Escénico de Lienzo Continuo Tecnológico (Master Canvas Wallpaper) */}
          <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden opacity-55 mix-blend-screen select-none">
            <img
              src="/landing_bg_master.jpg"
              alt=""
              className="w-full h-full object-cover object-top filter brightness-110 contrast-120"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070B19]/25 via-transparent to-[#070B19]" />
          </div>

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

            {/* Columna Central: Espacio Escénico Despejado para el Pedestal y Haz de Luz del Lienzo */}
            <div
              className="hidden lg:flex lg:col-span-4 relative flex-col items-center justify-end min-h-[480px] pointer-events-none select-none"
              aria-hidden="true"
            >
              {/* Capa de Piso Luminoso bajo el Pedestal */}
              <div
                className="w-[320px] h-[90px] rounded-full pointer-events-none mb-6"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(0, 210, 255, 0.35) 0%, rgba(21, 94, 239, 0.1) 45%, transparent 75%)',
                  filter: 'blur(20px)',
                }}
              />
            </div>

            {/* Columna Derecha: Panel Lateral Flotante de Métricas (4 Tarjetas Glassmorphic Exactas) */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-3 flex flex-col gap-3.5 w-full max-w-[290px] mx-auto lg:mx-0 z-20"
            >
              {/* Tarjeta 1: Departments */}
              <div className="p-4 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex items-center gap-3.5 shadow-xl group">
                <div className="w-12 h-12 rounded-full bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-5.5 h-5.5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    32
                  </span>
                  <span className="text-xs text-slate-300 font-semibold block mt-1">Departamentos</span>
                </div>
              </div>

              {/* Tarjeta 2: Municipalities */}
              <div className="p-4 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex items-center gap-3.5 shadow-xl group">
                <div className="w-12 h-12 rounded-full bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5.5 h-5.5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    +1.102
                  </span>
                  <span className="text-xs text-slate-300 font-semibold block mt-1">Municipios</span>
                </div>
              </div>

              {/* Tarjeta 3: Voting Stations */}
              <div className="p-4 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex items-center gap-3.5 shadow-xl group">
                <div className="w-12 h-12 rounded-full bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                  <Vote className="w-5.5 h-5.5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    +12.000
                  </span>
                  <span className="text-xs text-slate-300 font-semibold block mt-1">Puestos de votación</span>
                </div>
              </div>

              {/* Tarjeta 4: Eligible Citizens */}
              <div className="p-4 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex items-center gap-3.5 shadow-xl group">
                <div className="w-12 h-12 rounded-full bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-5.5 h-5.5" strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight leading-none block">
                    +39.000.000
                  </span>
                  <span className="text-xs text-slate-300 font-semibold block mt-1">Ciudadanos habilitados</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            C. SECCIÓN DE CARACTERÍSTICAS (GRID DE 6 TARJETAS + DARK GRID BLUEPRINT)
            ========================================================================= */}
        <section
          id="caracteristicas"
          className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 bg-[#080E21] rounded-3xl my-6"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
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
            F. CALL TO ACTION FINAL (HERO FOOTER BANNER HORIZONTE PLANETARIO)
            ========================================================================= */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden bg-[#070B19] border-t border-slate-800/80">
          {/* Fondo Panorámico de Horizonte Cósmico Terrestre desde Órbita (Master Canvas Wallpaper) */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none">
            <img
              src="/landing_bg_master.jpg"
              alt=""
              className="w-full h-full object-cover object-bottom opacity-90 filter brightness-110 contrast-115"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B19] via-[#070B19]/30 to-[#070B19]" />
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#070B19] to-transparent" />
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
