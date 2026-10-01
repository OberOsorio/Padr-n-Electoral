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
          A. BARRA DE NAVEGACIÓN (HEADER FIJO GLASSMORPHISM)
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#070B19]/85 backdrop-blur-xl border-b border-slate-800/60 shadow-lg shadow-black/20 transition-all">
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

      <main className="flex-1 z-10 pt-20" id="inicio">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Columna Izquierda: Información Principal */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-7 text-left space-y-6"
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
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
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

            {/* Columna Derecha: Panel de Métricas Electorales (Grid 2x2) */}
            <motion.div
              variants={fluidFadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
            >
              {/* Tarjeta 1: Departamentos */}
              <div className="p-5 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex flex-col justify-between shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform mb-4">
                  <Shield className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-3xl font-black font-mono text-white tracking-tight leading-none block">
                    32
                  </span>
                  <span className="text-sm text-slate-300 font-semibold block mt-1.5">Departamentos</span>
                </div>
              </div>

              {/* Tarjeta 2: Municipios */}
              <div className="p-5 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex flex-col justify-between shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform mb-4">
                  <MapPin className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-3xl font-black font-mono text-white tracking-tight leading-none block">
                    +1.102
                  </span>
                  <span className="text-sm text-slate-300 font-semibold block mt-1.5">Municipios</span>
                </div>
              </div>

              {/* Tarjeta 3: Puestos de Votación */}
              <div className="p-5 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex flex-col justify-between shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform mb-4">
                  <Vote className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-3xl font-black font-mono text-white tracking-tight leading-none block">
                    +12.000
                  </span>
                  <span className="text-sm text-slate-300 font-semibold block mt-1.5">Puestos de votación</span>
                </div>
              </div>

              {/* Tarjeta 4: Ciudadanos Habilitados */}
              <div className="p-5 rounded-2xl bg-[#081226]/85 backdrop-blur-xl border border-sky-400/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] transition-all duration-300 flex flex-col justify-between shadow-xl group">
                <div className="w-12 h-12 rounded-xl bg-[#051129] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0 group-hover:scale-105 transition-transform mb-4">
                  <Users className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight leading-none block">
                    +39.000.000
                  </span>
                  <span className="text-sm text-slate-300 font-semibold block mt-1.5">Ciudadanos habilitados</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================================================================
            C. SECCIÓN DE CARACTERÍSTICAS (GRID DE 6 TARJETAS EXACTAS)
            ========================================================================= */}
        <section id="caracteristicas" className="scroll-mt-20 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
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
          className="scroll-mt-20 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(14,165,233,0.15),transparent)]"
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
          className="scroll-mt-20 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] text-slate-900 transition-colors"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Columna Izquierda: Información Oficial */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="lg:col-span-7 text-left space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
                  <span>COBERTURA NACIONAL</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Información electoral para todo el país
                </h2>

                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Accede a los datos oficiales de la Registraduría Nacional del Estado Civil y del censo electoral, con cobertura integral en los 32 departamentos y Bogotá D.C., abarcando la gestión de cargos departamentales y municipales.
                </p>

                {/* 4 Botones de Categorías */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center gap-2 text-center">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                      <Map className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">Gobernación</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center gap-2 text-center">
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Landmark className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">Asamblea</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center gap-2 text-center">
                    <span className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">Alcaldía</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center gap-2 text-center">
                    <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                      <Users className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">Concejo</span>
                  </div>
                </div>
              </motion.div>

              {/* Columna Derecha: Tarjeta Estructurada de Niveles de Elección */}
              <motion.div
                variants={fluidFadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="lg:col-span-5 flex justify-center"
              >
                <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6 text-left space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        ESTRUCTURA ELECTORAL
                      </span>
                      <h3 className="text-base font-bold text-slate-900">Niveles Territoriales</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                      32 Departamentos
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                          <Map className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Gobernaciones</div>
                          <div className="text-[11px] text-slate-500">Poder ejecutivo departamental</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                          <Landmark className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Asambleas Departamentales</div>
                          <div className="text-[11px] text-slate-500">Corporaciones públicas regionales</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Alcaldías Municipales</div>
                          <div className="text-[11px] text-slate-500">1.102 municipios y distritos</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                          <Users className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Concejos Municipales</div>
                          <div className="text-[11px] text-slate-500">Representación local y comunitaria</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
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
        <section id="contacto" className="scroll-mt-20 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80 text-left">
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
