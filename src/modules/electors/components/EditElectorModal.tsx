import { useState, useEffect, useMemo } from 'react';
import type { ElectorWithRegistrant, Elector } from '../../../types';
import { formatearPuestoSimple } from '../constants';
import { useTenant } from '../../../context/TenantContext';
import { getPollingPlacesForTenant } from '../../../services/divipoleService';
import { Modal } from '../../../components/ui/Modal';
import {
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
  const { currentTenant } = useTenant();
  const pollingPlaces = useMemo(() => getPollingPlacesForTenant(currentTenant), [currentTenant]);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [telefono, setTelefono] = useState('');
  const [puestoVotacion, setPuestoVotacion] = useState(
    pollingPlaces[0]?.name || ''
  );
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

  const currentPlace = useMemo(() => {
    return (
      pollingPlaces.find((p) => p.name === puestoVotacion) ||
      pollingPlaces[0] || { id: 'default', name: puestoVotacion || '', totalMesas: 15, zone: 'Cabecera' }
    );
  }, [pollingPlaces, puestoVotacion]);

  if (!elector) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim()) {
      setError('Nombres y apellidos son requeridos.');
      return;
    }

    if (!puestoVotacion || !puestoVotacion.trim()) {
      setError('Por favor seleccione un puesto de votación.');
      return;
    }

    if (!mesa || Number(mesa) <= 0) {
      setError('Por favor seleccione una mesa.');
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
    <Modal.Root open={isOpen} onClose={onClose} variant="default" loading={saving}>
      <Modal.Content maxWidth="max-w-lg" className="dark:bg-[#121215] dark:border-white/[0.08]">
        {/* Encabezado */}
        <Modal.Header className="dark:bg-[#18181b]/50 border-b border-slate-100 dark:border-white/[0.06] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <Modal.Title className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Editar Registro de Elector
              </Modal.Title>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Auditoría / Actualización Administrativa
              </p>
            </div>
          </div>
          <Modal.CloseButton disabled={saving} />
        </Modal.Header>

        {/* Mensaje de error si aplica */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Formulario de edición */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Cédula de solo lectura */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Documento de Identidad (No modificable)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                disabled
                value={elector.cedula}
                className="w-full h-9.5 pl-10 pr-3.5 bg-slate-100 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06] rounded-xl text-xs font-mono text-slate-500 dark:text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Nombres, Apellidos y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Nombres
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Apellidos
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-1 space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Edad
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                value={edad}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setEdad(val ? Number(val) : '');
                }}
                placeholder="Ej. 28"
                className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Teléfono de Contacto
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                placeholder="Sin teléfono registrado"
                className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Puesto y Mesa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Puesto de Votación
              </label>
              <div className="relative">
                <select
                  value={puestoVotacion || ''}
                  onChange={(e) => {
                    const newPuesto = e.target.value;
                    setPuestoVotacion(newPuesto);
                    const p = pollingPlaces.find((x) => x.name === newPuesto);
                    if (p && mesa > p.totalMesas) setMesa(1);
                  }}
                  className="w-full h-9.5 pl-3 pr-8 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-[#18181b] text-slate-400 dark:text-zinc-500">
                    Seleccione puesto...
                  </option>
                  {!pollingPlaces.some((p) => p.name === puestoVotacion) && puestoVotacion && (
                    <option key="custom-puesto" value={puestoVotacion} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">
                      {formatearPuestoSimple(puestoVotacion).label || puestoVotacion}
                    </option>
                  )}
                  {pollingPlaces.map((p) => {
                    const f = formatearPuestoSimple(p.name, p.zone);
                    return (
                      <option key={p.id} value={p.name} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">
                        {f.titulo} ({f.detalle})
                      </option>
                    );
                  })}
                </select>
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Mesa
              </label>
              <div className="relative">
                <select
                  value={mesa || ''}
                  onChange={(e) => setMesa(Number(e.target.value))}
                  disabled={!puestoVotacion}
                  className="w-full h-9.5 pl-3 pr-8 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="" disabled className="bg-white dark:bg-[#18181b] text-slate-400 dark:text-zinc-500">
                    {puestoVotacion ? 'Mesa...' : 'Puesto primero...'}
                  </option>
                  {Array.from({ length: currentPlace.totalMesas }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-white">
                      Mesa {m}
                    </option>
                  ))}
                </select>
                <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Observaciones
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Sin observaciones adicionales"
                className="w-full h-9.5 pl-9 pr-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <Modal.Footer className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer active:scale-[0.98]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Guardar Cambios</span>
            </button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
};
