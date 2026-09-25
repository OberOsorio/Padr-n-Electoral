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
  Save,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PREDEFINED_POLLING_PLACES } from '../electors/constants';
import type { CollisionCheckResult } from '../../types';

export interface LeaderRegisterViewProps {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  puestoVotacion: string;
  mesa: number;
  notas: string;
  isCheckingCedula: boolean;
  isAutofilledFromCenso?: boolean;
  collisionResult: CollisionCheckResult | null;
  submitting: boolean;
  formError: string | null;
  lastRegistered: {
    nombres: string;
    telefono?: string;
    puesto: string;
    mesa: number;
  } | null;
  onCedulaChange: (val: string) => void;
  onCedulaBlur?: () => void;
  setNombres: (val: string) => void;
  setApellidos: (val: string) => void;
  setTelefono: (val: string) => void;
  setPuestoVotacion: (val: string) => void;
  setMesa: (val: number) => void;
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
  telefono,
  puestoVotacion,
  mesa,
  notas,
  isCheckingCedula,
  isAutofilledFromCenso = false,
  collisionResult,
  submitting,
  formError,
  lastRegistered,
  onCedulaChange,
  onCedulaBlur,
  setNombres,
  setApellidos,
  setTelefono,
  setPuestoVotacion,
  setMesa,
  setNotas,
  onDismissLastRegistered,
  onSubmit,
  formatRegistrationDate,
  getRoleBadge,
}) => {
  const currentPollingPlace =
    PREDEFINED_POLLING_PLACES.find((p) => p.name === puestoVotacion) ||
    PREDEFINED_POLLING_PLACES[0];

  const isFormLocked = collisionResult?.exists ?? false;

  return (
    <motion.div
      key="tab-register"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Alerta de Registro Exitoso */}
      {lastRegistered && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">¡Elector Guardado Exitosamente!</p>
            </div>
            <button
              type="button"
              onClick={onDismissLastRegistered}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-white cursor-pointer px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-300/90">
            <strong>{lastRegistered.nombres}</strong> quedó registrado en <strong>{lastRegistered.puesto}</strong> (Mesa {lastRegistered.mesa}).
          </p>
        </div>
      )}

      {/* Tarjeta Contenedora del Formulario */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs dark:shadow-xl backdrop-blur-sm transition-colors">
        {/* Header Ejecutivo con Badge Cobalto */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Registro de Elector</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Validación de duplicados y asignación territorial en tiempo real
            </p>
          </div>
        </div>

        {/* Error en el Formulario */}
        {formError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Cédula */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Número de Cédula / Documento *
              </label>
              {isCheckingCedula && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={cedula}
                onChange={(e) => onCedulaChange(e.target.value)}
                onBlur={onCedulaBlur}
                placeholder="Ej. 1088492019"
                className={`w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-950/80 border rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  isFormLocked
                    ? 'border-rose-300 dark:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30'
                    : 'border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {isCheckingCedula ? (
                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : isFormLocked ? (
                  <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                ) : cedula.length >= 6 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
                  className="mt-3 rounded-2xl bg-gradient-to-br from-rose-50 via-rose-50/60 to-amber-50 dark:from-rose-950/60 dark:via-slate-900 dark:to-slate-900 border border-rose-200 dark:border-rose-500/40 p-4 shadow-lg overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header de la Ficha */}
                  <div className="flex items-center justify-between pb-3 border-b border-rose-200/80 dark:border-rose-900/60">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-700/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 font-mono">
                          Ficha de Elector Ya Vinculado
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Registro previo en esta campaña
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-mono">
                      Duplicado Bloqueado
                    </span>
                  </div>

                  {/* Detalle del Elector y Trazabilidad */}
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-rose-100 dark:border-slate-700/70 shadow-2xs">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {collisionResult.elector.nombres} {collisionResult.elector.apellidos}
                        </p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          Documento: <strong className="text-slate-800 dark:text-slate-200">C.C. {collisionResult.elector.cedula}</strong>
                        </p>
                      </div>

                      {collisionResult.elector.telefono && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {collisionResult.elector.telefono}
                          </span>
                          <a
                            href={`https://wa.me/57${collisionResult.elector.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
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
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700/60">
                        <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">
                          Lugar de Votación
                        </span>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                              {collisionResult.elector.puesto_votacion}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              Mesa: <strong className="text-blue-600 dark:text-blue-400">{collisionResult.elector.mesa}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Operador y Fecha */}
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700/60">
                        <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">
                          Registrado Por
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {collisionResult.elector.registrado_por_nombre || 'Personal Autorizado'}
                          </p>
                          {getRoleBadge(collisionResult.elector.registrado_por_rol)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{formatRegistrationDate(collisionResult.elector.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-700 dark:text-rose-300/90 italic flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Para preservar el censo, el registro duplicado ha sido bloqueado.</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nombres y Apellidos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Datos de Identidad del Elector *
              </span>
              {isAutofilledFromCenso && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs animate-in fade-in">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Autocompletado desde Censo Maestro</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting || isFormLocked}
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Juan Carlos"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting || isFormLocked}
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Osorio Morales"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Teléfono Celular (WhatsApp) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
              Teléfono Móvil (WhatsApp)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="tel"
                inputMode="tel"
                disabled={submitting || isFormLocked}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 3124567890"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Puesto y Mesa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                Puesto de Votación *
              </label>
              <select
                disabled={submitting || isFormLocked}
                value={puestoVotacion}
                onChange={(e) => {
                  setPuestoVotacion(e.target.value);
                  setMesa(1);
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {PREDEFINED_POLLING_PLACES.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                Mesa *
              </label>
              <select
                disabled={submitting || isFormLocked}
                value={mesa}
                onChange={(e) => setMesa(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {Array.from({ length: currentPollingPlace.totalMesas }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Mesa {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              disabled={submitting || isFormLocked}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Líder comunal, requiere transporte, vota a primera hora..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Botón Primario: Azul Cobalto con Glass Effect */}
          <button
            type="submit"
            disabled={submitting || isFormLocked}
            className={`w-full py-3.5 px-4 font-medium text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              isFormLocked
                ? 'bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 opacity-90 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : isFormLocked ? (
              <>
                <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Registro Bloqueado (Ya Existe)</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Elector en Mi Lista</span>
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
