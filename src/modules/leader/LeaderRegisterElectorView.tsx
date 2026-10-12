import React, { useState, useMemo, useRef } from 'react';
import { 
  UserCheck, 
  RotateCcw, 
  UserPlus, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getPollingPlacesForTenant, formatearPuestoSimple } from '../electors/constants';
import { buscarCiudadanoEnCenso, calcularEdadDesdeCenso, estimarEdadPorCedula } from '../../services/censoService';
import type { PollingPlace } from '../../types';

export interface LeaderRegisterProps {
  currentUserId: string;
  activeTenant: {
    id: string;
    municipio?: string;
    departamento?: string;
    name?: string;
  } | null;
  onSuccess?: (registeredElector?: any) => void;
}

export const LeaderRegisterElectorView: React.FC<LeaderRegisterProps> = ({
  currentUserId,
  activeTenant,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    edad: '',
    puesto_votacion: '',
    mesa: '',
    observaciones: '',
  });

  const [modoLote, setModoLote] = useState(false);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [estadoCedula, setEstadoCedula] = useState<{ tipo: 'ok' | 'error' | 'idle'; mensaje: string }>({
    tipo: 'idle',
    mensaje: '',
  });

  // Puestos oficiales de la campaña territorial
  const pollingPlaces: PollingPlace[] = useMemo(() => {
    return getPollingPlacesForTenant(activeTenant as any);
  }, [activeTenant]);

  const currentPollingPlace = useMemo(() => {
    if (!formData.puesto_votacion) return null;
    return pollingPlaces.find((p) => p.name === formData.puesto_votacion) || null;
  }, [formData.puesto_votacion, pollingPlaces]);

  const debounceTimerRef = useRef<any>(null);
  const latestCedulaRef = useRef<string>('');

  // 1. Consulta y validación automática de cédula en tiempo real
  const consultarCedula = async (cedulaRaw: string) => {
    const cedulaLimpia = cedulaRaw.trim().replace(/\D/g, '');
    latestCedulaRef.current = cedulaLimpia;

    if (!cedulaLimpia || cedulaLimpia.length < 5) {
      setEstadoCedula({ tipo: 'idle', mensaje: '' });
      setLoadingConsulta(false);
      return;
    }

    try {
      setLoadingConsulta(true);

      // A. Validar duplicado en la campaña activa
      if (activeTenant?.id) {
        const { data: duplicado } = await (supabase.from('electores') as any)
          .select(`
            id,
            nombres,
            apellidos,
            puesto_votacion,
            registrado_por,
            registrador:profiles(full_name, role)
          `)
          .eq('tenant_id', activeTenant.id)
          .eq('cedula', cedulaLimpia)
          .maybeSingle();

        if (latestCedulaRef.current !== cedulaLimpia) return;

        if (duplicado) {
          const registradorNombre = duplicado.registrador?.full_name || 'otro líder de la campaña';
          setEstadoCedula({
            tipo: 'error',
            mensaje: `Cédula ya registrada para ${duplicado.nombres} ${duplicado.apellidos} por ${registradorNombre} (Puesto: ${duplicado.puesto_votacion || 'Principal'}).`,
          });
          setLoadingConsulta(false);
          return;
        }
      }

      // B. Consultar censo/padrón general y DNP
      const censoResult = await buscarCiudadanoEnCenso(cedulaLimpia);
      if (latestCedulaRef.current !== cedulaLimpia) return;

      if (censoResult.found && (censoResult.nombres || censoResult.apellidos)) {
        const edadObtenida =
          censoResult.edad ??
          (censoResult as any).anios ??
          (censoResult as any).fecha_nacimiento ??
          (censoResult as any).nacimiento;

        let edadCalculada = calcularEdadDesdeCenso(edadObtenida);
        if (!edadCalculada) {
          edadCalculada = estimarEdadPorCedula(cedulaLimpia) || '';
        }

        setFormData((prev) => ({
          ...prev,
          nombres: censoResult.nombres || prev.nombres,
          apellidos: censoResult.apellidos || prev.apellidos,
          edad: edadCalculada ? String(edadCalculada) : prev.edad,
          puesto_votacion: prev.puesto_votacion || censoResult.puesto_sugerido || '',
          mesa: prev.mesa || (censoResult.mesa_sugerida ? String(censoResult.mesa_sugerida) : ''),
        }));

        setEstadoCedula({
          tipo: 'ok',
          mensaje: 'Datos verificados en el censo oficial.',
        });
      } else {
        // Estimar edad si la cédula es colombiana estándar
        const edadEstimada = estimarEdadPorCedula(cedulaLimpia);
        if (edadEstimada) {
          setFormData((prev) => ({
            ...prev,
            edad: prev.edad || String(edadEstimada),
          }));
        }

        setEstadoCedula({
          tipo: 'ok',
          mensaje: 'Disponible para registro.',
        });
      }
    } catch (err) {
      console.error('Error al consultar documento:', err);
    } finally {
      if (latestCedulaRef.current === cedulaLimpia) {
        setLoadingConsulta(false);
      }
    }
  };

  const handleCedulaChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, cedula: clean }));
    setSuccessMsg(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!clean) {
      setFormData((prev) => ({
        ...prev,
        cedula: '',
        nombres: '',
        apellidos: '',
        edad: '',
      }));
      setEstadoCedula({ tipo: 'idle', mensaje: '' });
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      consultarCedula(clean);
    }, 300);
  };

  // 2. Limpieza total del formulario
  const handleLimpiar = () => {
    setFormData({
      cedula: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      edad: '',
      puesto_votacion: '',
      mesa: '',
      observaciones: '',
    });
    setModoLote(false);
    setEstadoCedula({ tipo: 'idle', mensaje: '' });
    setSuccessMsg(null);
  };

  // 3. Guardar elector en Supabase
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    const cedulaLimpia = formData.cedula.trim();
    if (!cedulaLimpia || !formData.nombres.trim() || !formData.apellidos.trim()) {
      alert('Por favor completa la cédula, nombres y apellidos requeridos.');
      return;
    }

    if (!formData.puesto_votacion.trim()) {
      alert('Por favor selecciona el puesto de votación asignado.');
      return;
    }

    if (!formData.mesa.trim() || Number(formData.mesa) <= 0) {
      alert('Por favor selecciona el número de mesa de votación.');
      return;
    }

    if (estadoCedula.tipo === 'error') {
      alert('No es posible registrar un documento duplicado en esta campaña.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        tenant_id: activeTenant?.id || null,
        registrado_por: currentUserId || null,
        cedula: cedulaLimpia,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono.trim() || null,
        edad: formData.edad ? parseInt(formData.edad, 10) : null,
        puesto_votacion: formData.puesto_votacion.trim(),
        mesa: parseInt(formData.mesa, 10),
        notas: formData.observaciones.trim() || null,
        created_at: new Date().toISOString(),
      };

      // 1. Guardar en Supabase
      const { data: inserted, error: insertError } = await (supabase.from('electores') as any)
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // 2. Guardar en almacenamiento local para respuesta instantánea
      try {
        const stored = localStorage.getItem('electoral_leader_electors');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(inserted || payload);
        localStorage.setItem('electoral_leader_electors', JSON.stringify(list));
      } catch {
        // ignore local cache error
      }

      const mensajeConfirmacion = `¡Elector ${formData.nombres} ${formData.apellidos} guardado exitosamente en tu lista!`;
      setSuccessMsg(mensajeConfirmacion);

      if (modoLote) {
        // Modo Lote: Mantener puesto y mesa seleccionados
        setFormData((prev) => ({
          cedula: '',
          nombres: '',
          apellidos: '',
          telefono: '',
          edad: '',
          puesto_votacion: prev.puesto_votacion,
          mesa: prev.mesa,
          observaciones: '',
        }));
        setEstadoCedula({ tipo: 'idle', mensaje: '' });
      } else {
        handleLimpiar();
        setSuccessMsg(mensajeConfirmacion);
      }

      if (onSuccess) {
        onSuccess(inserted || payload);
      }
    } catch (err: any) {
      console.error('Error al guardar elector:', err);
      alert(`No se pudo guardar el elector: ${err.message || 'Error en el servidor'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 transition-colors">
      <div className="bg-white dark:bg-[#0b1328] border border-slate-200/90 dark:border-[#162345] rounded-3xl p-6 sm:p-8 shadow-xl transition-all">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-200 dark:border-[#162345]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 shrink-0">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Registro de Elector
                </h2>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Validación de duplicados y asignación territorial en tiempo real
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#060a14] dark:text-slate-300 dark:border-[#1a2b50] font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500"/>
            <span>Validación Segura</span>
          </div>
        </div>

        {/* Mensaje de Éxito al Registrar */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-xs text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleGuardar} className="space-y-4 sm:space-y-5">
          
          {/* Cédula con Buscador Integrado */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
              <label>Número de Cédula / Documento *</label>
              {loadingConsulta && (
                <span className="flex items-center gap-1 text-blue-500 lowercase font-normal font-sans">
                  <Loader2 className="w-3 h-3 animate-spin"/> consultando...
                </span>
              )}
              {estadoCedula.tipo === 'ok' && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold normal-case font-sans">
                  <CheckCircle2 className="w-3 h-3"/> {estadoCedula.mensaje}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={formData.cedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                onBlur={() => consultarCedula(formData.cedula)}
                placeholder="Ej. 1088492019"
                className={`w-full bg-slate-50 dark:bg-[#060a14] border rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all ${
                  estadoCedula.tipo === 'error'
                    ? 'border-rose-400 dark:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40'
                    : 'border-slate-300 dark:border-[#1a2b50] focus:border-blue-500 focus:bg-white dark:focus:bg-[#060a14]'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {loadingConsulta ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : estadoCedula.tipo === 'error' ? (
                  <Lock className="w-4 h-4 text-rose-500" />
                ) : estadoCedula.tipo === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : null}
              </div>
            </div>
            {estadoCedula.tipo === 'error' && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-start gap-1.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
                <span>{estadoCedula.mensaje}</span>
              </p>
            )}
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                Nombres *
              </label>
              <input
                type="text"
                required
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                placeholder="Ej. Juan Carlos"
                className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#060a14] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                Apellidos *
              </label>
              <input
                type="text"
                required
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Ej. Osorio Morales"
                className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#060a14] transition-all"
              />
            </div>
          </div>

          {/* Teléfono Móvil y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                Teléfono Móvil (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ej. 3124567890"
                  className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl pl-11 pr-4 py-3 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#060a14] transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                <label>Edad</label>
                {formData.edad && (
                  <span className="text-blue-600 dark:text-sky-400 font-mono text-xs font-bold">
                    ({formData.edad}A)
                  </span>
                )}
              </div>
              <input
                type="number"
                min="16"
                max="125"
                value={formData.edad}
                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                placeholder="Ej. 28"
                className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#060a14] transition-all"
              />
            </div>
          </div>

          {/* Puesto y Mesa de la Jurisdicción de la Campaña */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                <label>Puesto de Votación *</label>
                {currentPollingPlace && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                    {currentPollingPlace.totalMesas} mesas registradas
                  </span>
                )}
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  value={formData.puesto_votacion}
                  onChange={(e) => setFormData({ ...formData, puesto_votacion: e.target.value, mesa: '' })}
                  className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl pl-11 pr-8 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-all appearance-none truncate"
                >
                  <option value="">Seleccione un puesto de la jurisdicción...</option>
                  {pollingPlaces.map((p) => {
                    const f = formatearPuestoSimple(p.name, p.zone);
                    return (
                      <option key={p.id} value={p.name} className="bg-white dark:bg-[#0b1328] text-slate-900 dark:text-white py-1">
                        {f.titulo} ({f.detalle})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono block">
                Mesa *
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  disabled={!formData.puesto_votacion}
                  value={formData.mesa}
                  onChange={(e) => setFormData({ ...formData, mesa: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl pl-11 pr-8 py-3 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer transition-all disabled:opacity-50 appearance-none"
                >
                  <option value="">
                    {formData.puesto_votacion ? 'Seleccionar mesa...' : 'Elige puesto...'}
                  </option>
                  {Array.from({ length: currentPollingPlace?.totalMesas || 30 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-[#0b1328] text-slate-900 dark:text-white font-mono">
                      Mesa {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Modo Lote Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="modoLote"
              checked={modoLote}
              onChange={(e) => setModoLote(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
            />
            <label htmlFor="modoLote" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
              Recordar puesto y mesa para el siguiente registro (Modo Lote)
            </label>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Ej. Líder comunal, requiere transporte, vota a primera hora..."
              className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-300 dark:border-[#1a2b50] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#060a14] transition-all resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLimpiar}
              disabled={saving}
              className="py-3.5 px-5 rounded-2xl border border-slate-200 dark:border-[#1a2b50] bg-slate-100 hover:bg-slate-200 dark:bg-[#080e1e] dark:hover:bg-[#0d162d] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4"/>
              <span>Limpiar</span>
            </button>

            <button
              type="submit"
              disabled={saving || estadoCedula.tipo === 'error'}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserCheck className="w-4 h-4"/>}
              <span>{saving ? 'Guardando...' : 'GUARDAR ELECTOR EN MI LISTA'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
