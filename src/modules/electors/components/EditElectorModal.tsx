import { useState, useEffect } from 'react';
import type { ElectorWithRegistrant, Elector } from '../../../types';
import { PREDEFINED_POLLING_PLACES } from '../constants';
import {
  X,
  User,
  Phone,
  MapPin,
  Layers,
  FileText,
  Loader2,
  Shield,
  Save,
  CreditCard,
} from 'lucide-react';

interface EditElectorModalProps {
  elector: ElectorWithRegistrant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Elector>) => Promise<boolean>;
}

export const EditElectorModal = ({
  elector,
  isOpen,
  onClose,
  onSave,
}: EditElectorModalProps) => {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [telefono, setTelefono] = useState('');
  const [puestoVotacion, setPuestoVotacion] = useState(PREDEFINED_POLLING_PLACES[0].name);
  const [mesa, setMesa] = useState<number>(1);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (elector) {
      setNombres(elector.nombres);
      setApellidos(elector.apellidos);
      setEdad(elector.edad !== undefined && elector.edad !== null ? Number(elector.edad) : '');
      setTelefono(elector.telefono || '');
      setPuestoVotacion(elector.puesto_votacion);
      setMesa(elector.mesa || 1);
      setNotas(elector.notas || '');
      setError(null);
    }
  }, [elector]);

  if (!isOpen || !elector) return null;

  const currentPlace =
    PREDEFINED_POLLING_PLACES.find((p) => p.name === puestoVotacion) ||
    PREDEFINED_POLLING_PLACES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim()) {
      setError('Nombres y apellidos son requeridos.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const numEdad = typeof edad === 'number' ? edad : (edad ? parseInt(String(edad), 10) : null);
      const success = await onSave(elector.id, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        edad: numEdad,
        telefono: telefono.trim() || null,
        puesto_votacion: puestoVotacion,
        mesa: Number(mesa),
        notas: notas.trim() || null,
      });

      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl p-6 md:p-8 overflow-hidden transition-colors">
        {/* Línea de realce superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Encabezado del modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/60 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Editar Registro de Elector
              </h3>
              <p className="text-[11px] font-mono text-amber-600 dark:text-[#E5B869] font-medium">
                Acción de Administrador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensaje de error si aplica */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Formulario de edición */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cédula de solo lectura */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Documento de Identidad (No modificable)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                disabled
                value={elector.cedula}
                className="w-full h-10 pl-10 pr-3.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Nombres, Apellidos y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                Nombres
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                Apellidos
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sm:col-span-1 space-y-1">
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                Edad
              </label>
              <input
                type="number"
                min="16"
                max="125"
                value={edad}
                onChange={(e) => setEdad(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej. 28"
                className="w-full h-9.5 px-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Teléfono de Contacto
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                placeholder="Sin teléfono"
                className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Puesto y Mesa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                Puesto de Votación
              </label>
              <div className="relative">
                <select
                  value={puestoVotacion}
                  onChange={(e) => {
                    setPuestoVotacion(e.target.value);
                    const p = PREDEFINED_POLLING_PLACES.find((x) => x.name === e.target.value);
                    if (p && mesa > p.totalMesas) setMesa(1);
                  }}
                  className="w-full h-9.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {PREDEFINED_POLLING_PLACES.map((p) => (
                    <option key={p.id} value={p.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {p.name}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                Mesa
              </label>
              <div className="relative">
                <select
                  value={mesa}
                  onChange={(e) => setMesa(Number(e.target.value))}
                  className="w-full h-9.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {Array.from({ length: currentPlace.totalMesas }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      Mesa {m}
                    </option>
                  ))}
                </select>
                <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Observaciones
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Sin observaciones adicionales"
                className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
