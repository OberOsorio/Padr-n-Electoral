import React from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  MapPin,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Clock,
  CreditCard,
  UserPlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PREDEFINED_POLLING_PLACES, formatearPuestoSimple } from '../electors/constants';
import type { CollisionCheckResult, PollingPlace } from '../../types';

export interface LeaderRegisterViewProps {
  cedula: string;
  nombres: string;
  apellidos: string;
  edad: number | '';
  telefono: string;
  puestoVotacion: string;
  mesa: number | '';
  notas: string;
  isCheckingCedula: boolean;
  isAutofilledFromCenso?: boolean;
  collisionResult: CollisionCheckResult | null;
  submitting: boolean;
  formError: string | null;
  lastRegistered: {
    nombres: string;
    edad?: number | null;
    telefono?: string;
    puesto: string;
    mesa: number;
  } | null;
  pollingPlaces?: PollingPlace[];
  onCedulaChange: (val: string) => void;
  onCedulaBlur?: () => void;
  setNombres: (val: string) => void;
  setApellidos: (val: string) => void;
  setEdad: (val: number | '') => void;
  setTelefono: (val: string) => void;
  setPuestoVotacion: (val: string) => void;
  setMesa: (val: number | '') => void;
  setNotas: (val: string) => void;
  onDismissLastRegistered: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formatRegistrationDate: (isoString?: string) => string;
  getRoleBadge: (role?: string) => React.ReactNode;
}

export const LeaderRegisterView: React.FC<LeaderRegisterViewProps> = ({
  cedula,
  nombres,
  apellidos,
  edad,
  telefono,
  puestoVotacion,
  mesa,
  notas,
  isCheckingCedula,
  isAutofilledFromCenso,
  collisionResult,
  submitting,
  formError,
  lastRegistered,
  pollingPlaces,
  onCedulaChange,
  onCedulaBlur,
  setNombres,
  setApellidos,
  setEdad,
  setTelefono,
  setPuestoVotacion,
  setMesa,
  setNotas,
  onDismissLastRegistered,
  onSubmit,
  formatRegistrationDate,
  getRoleBadge,
}) => {
  const availablePlaces = pollingPlaces && pollingPlaces.length > 0 ? pollingPlaces : PREDEFINED_POLLING_PLACES;

  const currentPollingPlace = puestoVotacion
    ? availablePlaces.find((p) => p.name === puestoVotacion) || null
    : null;

  const isFormLocked = collisionResult?.exists ?? false;

  return (
    <motion.div
      key="tab-register"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 w-full max-w-full overflow-x-hidden"
    >
      {/* Alerta de Registro Exitoso Ultra-Premium */}
      {lastRegistered && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-950/90 border border-emerald-500/30 text-emerald-200 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  ¡Elector Guardado Exitosamente!
                </p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  <strong>{lastRegistered.nombres}</strong> quedó registrado en <strong>{lastRegistered.puesto}</strong> (Mesa {lastRegistered.mesa}).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissLastRegistered}
              className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0"
              title="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Tarjeta Contenedora del Formulario Ultra-Premium */}
      <div className="relative w-full bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-slate-800/80 border-t-2 border-t-blue-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden group">
        {/* Resplandor ambiental de fondo */}
        <div className="absolute -top-28 -right-28 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Ejecutivo Ultra-Premium */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Registro de Elector</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Validación de duplicados y asignación territorial en tiempo real
              </p>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-[11px] font-mono text-slate-300 select-none shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Validación Segura</span>
          </div>
        </div>

        {/* Error en el Formulario */}
        {formError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 shadow-lg">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          {/* Cédula */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Número de Cédula / Documento</span>
                <span className="text-blue-400 font-bold">*</span>
              </label>
              {isCheckingCedula ? (
                <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  <Loader2 className="h-3 w-3 animate-spin" /> Verificando censo...
                </span>
              ) : isAutofilledFromCenso ? (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Datos del Censo
                </span>
              ) : null}
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={cedula}
                onChange={(e) => onCedulaChange(e.target.value)}
                onBlur={onCedulaBlur}
                placeholder="Ej. 1088492019"
                className={`w-full pl-10 pr-11 py-3 bg-slate-950/60 border rounded-xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner ${
                  isFormLocked
                    ? 'border-rose-500/60 bg-rose-950/20 focus:ring-1 focus:ring-rose-500/40'
                    : 'border-slate-800 hover:border-slate-700/80 focus:bg-slate-900/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {isCheckingCedula ? (
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                ) : isFormLocked ? (
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                ) : cedula.length >= 6 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : null}
              </div>
            </div>

            {/* Ficha de Elector Ya Vinculado a la Campaña */}
            <AnimatePresence>
              {collisionResult?.exists && collisionResult.elector && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-3 rounded-2xl bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-slate-950/90 border border-rose-500/40 p-4 sm:p-5 shadow-2xl overflow-hidden relative backdrop-blur-md"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header de la Ficha */}
                  <div className="flex items-center justify-between pb-3 border-b border-rose-900/60">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-rose-900/50 border border-rose-700/60 flex items-center justify-center text-rose-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
                          Ficha de Elector Ya Vinculado
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Registro previo en esta campaña
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800/80 font-mono">
                      Duplicado Bloqueado
                    </span>
                  </div>

                  {/* Detalle del Elector y Trazabilidad */}
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-inner">
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">
                          {collisionResult.elector.nombres} {collisionResult.elector.apellidos}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Documento: <strong className="text-slate-200">C.C. {collisionResult.elector.cedula}</strong></span>
                          {collisionResult.elector.edad && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 font-bold text-slate-200 font-mono border border-slate-700">
                              {collisionResult.elector.edad} años
                            </span>
                          )}
                        </p>
                      </div>

                      {collisionResult.elector.telefono && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs font-mono text-slate-300 font-medium">
                            {collisionResult.elector.telefono}
                          </span>
                          <a
                            href={`https://wa.me/57${collisionResult.elector.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                            title="Contactar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Datos de Asignación y Operador Registrador */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Puesto y Mesa */}
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Lugar de Votación
                        </span>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-200 leading-tight">
                              {collisionResult.elector.puesto_votacion}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Mesa: <strong className="text-blue-400">{collisionResult.elector.mesa}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Operador y Fecha */}
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Registrado Por
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-200 truncate">
                            {collisionResult.elector.registrado_por_nombre || 'Personal Autorizado'}
                          </p>
                          {getRoleBadge(collisionResult.elector.registrado_por_rol)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatRegistrationDate(collisionResult.elector.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-300 italic flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Para preservar el censo, el registro duplicado ha sido bloqueado.</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nombres y Apellidos */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                Datos de Identidad del Elector <span className="text-blue-400">*</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">
                  Nombres <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting || isFormLocked}
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Juan Carlos"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">
                  Apellidos <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting || isFormLocked}
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Osorio Morales"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Teléfono Celular (WhatsApp) y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                Teléfono Móvil (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="tel"
                  disabled={submitting || isFormLocked}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 3124567890"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="sm:col-span-1 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                  Edad
                </label>
                {edad !== '' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {edad}a
                  </span>
                )}
              </div>
              <input
                type="number"
                min="16"
                max="125"
                disabled={submitting || isFormLocked}
                value={edad}
                onChange={(e) => setEdad(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej. 28"
                className="w-full px-3 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-sm font-mono text-white placeholder:text-slate-500 text-center focus:outline-none transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Puesto y Mesa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Puesto de Votación <span className="text-blue-400">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentPollingPlace
                    ? `${formatearPuestoSimple(currentPollingPlace.name, currentPollingPlace.zone).detalle} · ${currentPollingPlace.totalMesas} Mesas`
                    : 'Seleccione un puesto'}
                </span>
              </div>
              <select
                disabled={submitting || isFormLocked}
                value={puestoVotacion || ''}
                onChange={(e) => {
                  setPuestoVotacion(e.target.value);
                  setMesa('');
                }}
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs sm:text-sm text-white focus:outline-none transition-all cursor-pointer shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Seleccione un puesto de votación...
                </option>
                {availablePlaces.map((p) => {
                  const f = formatearPuestoSimple(p.name, p.zone);
                  return (
                    <option key={p.id} value={p.name} className="bg-slate-900 text-white py-1">
                      {f.titulo} ({f.detalle})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                Mesa <span className="text-blue-400">*</span>
              </label>
              <select
                disabled={submitting || isFormLocked || !puestoVotacion}
                value={mesa || ''}
                onChange={(e) => setMesa(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs sm:text-sm font-mono text-white focus:outline-none transition-all cursor-pointer shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  {puestoVotacion ? 'Seleccione mesa...' : 'Seleccione puesto...'}
                </option>
                {Array.from({ length: currentPollingPlace?.totalMesas || 0 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white py-1">
                    Mesa {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              disabled={submitting || isFormLocked}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Líder comunal, requiere transporte, vota a primera hora..."
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Botón Principal de Acción Ultra-Premium */}
          <button
            type="submit"
            disabled={submitting || isFormLocked}
            className={`w-full mt-2 py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer ${
              isFormLocked
                ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300 opacity-90 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:shadow-blue-500/50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>GUARDANDO ELECTOR...</span>
              </>
            ) : isFormLocked ? (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>REGISTRO BLOQUEADO (DUPLICADO)</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-white" />
                <span>GUARDAR ELECTOR EN MI LISTA</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
