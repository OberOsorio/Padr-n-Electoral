import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ElectorWithRegistrant, CollisionCheckResult } from '../../types';
import {
  UserPlus,
  Shield,
  CreditCard,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BookmarkCheck,
  RotateCcw,
  Check,
  Layers,
  Lock,
  Clock,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCheck } from '../../components/ui/AnimatedCheck';
import { PREDEFINED_POLLING_PLACES } from './constants';
import { useTenant } from '../../context/TenantContext';
import { buscarCiudadanoEnCenso } from '../../services/censoService';

interface RegisterElectorViewProps {
  onSuccess?: () => void;
  onNavigateToDashboard?: () => void;
}

export const RegisterElectorView = ({
  onSuccess,
  onNavigateToDashboard,
}: RegisterElectorViewProps) => {
  // Referencias para navegación rápida por teclado
  const cedulaInputRef = useRef<HTMLInputElement>(null);
  const nombresInputRef = useRef<HTMLInputElement>(null);
  const apellidosInputRef = useRef<HTMLInputElement>(null);
  const telefonoInputRef = useRef<HTMLInputElement>(null);
  const mesaInputRef = useRef<HTMLSelectElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Estados del formulario
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [puestoVotacion, setPuestoVotacion] = useState(PREDEFINED_POLLING_PLACES[0].name);
  const [mesa, setMesa] = useState<number>(1);
  const [notas, setNotas] = useState('');

  // Memoria de sesión para puesto y mesa
  const [rememberLocation, setRememberLocation] = useState<boolean>(() => {
    return localStorage.getItem('electoral_remember_location') !== 'false';
  });

  // Estados de validación anti-colisión
  const [isCheckingCedula, setIsCheckingCedula] = useState(false);
  const [collisionResult, setCollisionResult] = useState<CollisionCheckResult | null>(null);
  const [isAutofilledFromCenso, setIsAutofilledFromCenso] = useState(false);

  // Estados de envío y feedback
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Cargar memoria de sesión de puesto y mesa al montar
  useEffect(() => {
    const savedPuesto = localStorage.getItem('electoral_saved_puesto');
    const savedMesa = localStorage.getItem('electoral_saved_mesa');

    if (savedPuesto && PREDEFINED_POLLING_PLACES.some((p) => p.name === savedPuesto)) {
      setPuestoVotacion(savedPuesto);
    }
    if (savedMesa && !isNaN(Number(savedMesa))) {
      setMesa(Number(savedMesa));
    }

    // Auto-foco inicial en Cédula
    cedulaInputRef.current?.focus();
  }, []);

  const { currentTenant, currentTenantId, planUsage, refetchTenants } = useTenant();

  // Actualizar lista de mesas según el puesto seleccionado
  const currentPollingPlace = PREDEFINED_POLLING_PLACES.find(
    (p) => p.name === puestoVotacion
  ) || PREDEFINED_POLLING_PLACES[0];

  const totalMesas = currentPollingPlace.totalMesas;

  // Formato legible de fecha y hora exacta de registro
  const formatRegistrationDate = (isoString?: string) => {
    if (!isoString) return 'Fecha no disponible';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Badge de rol del operador
  const getRoleBadge = (role?: string) => {
    const r = (role || 'admin').toLowerCase();
    if (r === 'lider') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
          Líder
        </span>
      );
    }
    if (r === 'coordinador') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
          Coordinador
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
        Admin
      </span>
    );
  };

  // Validación anti-colisión en tiempo real con Debounce aislada por Tenant
  const checkCedulaCollision = useCallback(async (cedulaValue: string) => {
    const cleanCedula = cedulaValue.trim().replace(/\D/g, '');
    if (cleanCedula.length < 5) {
      setCollisionResult(null);
      setIsCheckingCedula(false);
      return;
    }

    setIsCheckingCedula(true);

    const autofillFromCenso = async (cleanNum: string) => {
      try {
        const censo = await buscarCiudadanoEnCenso(cleanNum);
        if (censo.found && censo.nombres) {
          setNombres(censo.nombres);
          if (censo.apellidos) setApellidos(censo.apellidos);
          if (censo.puesto_sugerido && PREDEFINED_POLLING_PLACES.some((p) => p.name === censo.puesto_sugerido)) {
            setPuestoVotacion(censo.puesto_sugerido);
          }
          if (censo.mesa_sugerida) {
            setMesa(censo.mesa_sugerida);
          }
          setIsAutofilledFromCenso(true);
        } else {
          setIsAutofilledFromCenso(false);
        }
      } catch (e) {
        console.error('Error al autocompletar desde censo maestro:', e);
        setIsAutofilledFromCenso(false);
      }
    };

    // Iniciar consulta de censo maestro en paralelo
    const autofillPromise = autofillFromCenso(cleanCedula);

    try {
      if (!isSupabaseConfigured) {
        // Validación en almacenamiento local de demostración aislada por tenant
        const stored = localStorage.getItem('electoral_local_electors');
        const localList: ElectorWithRegistrant[] = stored ? JSON.parse(stored) : [];
        const found = localList.find(
          (e) =>
            e.cedula === cleanCedula &&
            (!currentTenantId || e.tenant_id === currentTenantId || !e.tenant_id)
        );

        if (found) {
          // Consultar nombre y rol del operador en la lista de equipo local
          const teamStored = localStorage.getItem('electoral_local_team');
          const teamList: any[] = teamStored ? JSON.parse(teamStored) : [];
          const operator = teamList.find((m) => m.id === found.registrado_por);

          setCollisionResult({
            exists: true,
            elector: {
              id: found.id,
              cedula: found.cedula,
              nombres: found.nombres,
              apellidos: found.apellidos,
              telefono: found.telefono,
              puesto_votacion: found.puesto_votacion,
              mesa: found.mesa,
              created_at: found.created_at,
              registrado_por_nombre: found.registrador?.full_name || operator?.full_name || 'Dr. Alejandro Morales',
              registrado_por_rol: found.registrador?.role || operator?.role || 'admin',
            },
          });
          setIsAutofilledFromCenso(false);
        } else {
          setCollisionResult({ exists: false });
          await autofillPromise;
        }
        return;
      }

      // 1. Intentar verificación mediante función RPC check_existing_elector
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('check_existing_elector', {
          p_cedula: cleanCedula,
          p_tenant_id: currentTenantId,
        });

        if (!rpcError && rpcData) {
          const item = Array.isArray(rpcData) ? rpcData[0] : rpcData;
          if (item && item.cedula) {
            setCollisionResult({
              exists: true,
              elector: {
                id: item.id,
                cedula: item.cedula,
                nombres: item.nombres,
                apellidos: item.apellidos,
                telefono: item.telefono,
                puesto_votacion: item.puesto_votacion,
                mesa: item.mesa,
                created_at: item.created_at,
                registrado_por_nombre: item.registrado_por_nombre || 'Personal de Campaña',
                registrado_por_rol: item.registrado_por_rol || 'admin',
              },
            });
            setIsAutofilledFromCenso(false);
            return;
          }
        }
      } catch (rpcErr) {
        console.warn('RPC check_existing_elector no disponible, usando fallback relacional:', rpcErr);
      }

      // 2. Fallback a consulta relacional directa
      let query = (supabase.from('electores') as any)
        .select(`
          id,
          cedula,
          nombres,
          apellidos,
          telefono,
          puesto_votacion,
          mesa,
          created_at,
          registrador:profiles(full_name, role)
        `)
        .eq('cedula', cleanCedula);

      if (currentTenantId) {
        query = query.eq('tenant_id', currentTenantId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error al verificar cédula en Supabase:', error);
        return;
      }

      if (data) {
        const item = data as any;
        setCollisionResult({
          exists: true,
          elector: {
            id: item.id,
            cedula: item.cedula,
            nombres: item.nombres,
            apellidos: item.apellidos,
            telefono: item.telefono,
            puesto_votacion: item.puesto_votacion,
            mesa: item.mesa,
            created_at: item.created_at,
            registrado_por_nombre: item.registrador?.full_name || 'Personal Autorizado',
            registrado_por_rol: item.registrador?.role || 'admin',
          },
        });
        setIsAutofilledFromCenso(false);
      } else {
        setCollisionResult({ exists: false });
        await autofillPromise;
      }
    } catch (err) {
      console.error('Error en debounce de verificación:', err);
    } finally {
      setIsCheckingCedula(false);
    }
  }, [currentTenantId]);

  // Manejador del cambio en cédula con debounce estricto de 400ms
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Numpad: solo dígitos
    setCedula(val);
    setServerError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.length < 5) {
      setCollisionResult(null);
      setIsCheckingCedula(false);
      setIsAutofilledFromCenso(false);
      return;
    }

    setIsCheckingCedula(true);
    debounceTimerRef.current = setTimeout(() => {
      checkCedulaCollision(val);
    }, 250);
  };

  // Manejar cambio de puesto en cascada
  const handlePuestoChange = (newPuesto: string) => {
    setPuestoVotacion(newPuesto);
    const place = PREDEFINED_POLLING_PLACES.find((p) => p.name === newPuesto);
    if (place && mesa > place.totalMesas) {
      setMesa(1);
    }
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const cleanCedula = cedula.trim().replace(/\D/g, '');
    const cleanNombres = nombres.trim();
    const cleanApellidos = apellidos.trim();

    if (!cleanCedula || cleanCedula.length < 5) {
      setServerError('Ingrese un número de cédula válido (mínimo 5 dígitos).');
      cedulaInputRef.current?.focus();
      return;
    }

    if (!cleanNombres) {
      setServerError('El campo de nombres es obligatorio.');
      nombresInputRef.current?.focus();
      return;
    }

    if (!cleanApellidos) {
      setServerError('El campo de apellidos es obligatorio.');
      apellidosInputRef.current?.focus();
      return;
    }

    if (collisionResult?.exists) {
      setServerError('No es posible registrar: el elector ya existe en el padrón de esta campaña.');
      return;
    }

    // Validación de Cuota Multi-Tenant (Límite por Plan de Campaña)
    if (planUsage.isLimitReached) {
      setServerError(
        `Límite de registros alcanzado para esta campaña (${planUsage.totalElectors.toLocaleString()} de ${planUsage.maxElectors.toLocaleString()}). Comuníquese con el SuperAdmin para ampliar la capacidad.`
      );
      return;
    }

    setSaving(true);

    try {
      if (!isSupabaseConfigured) {
        // Guardado local de demostración
        const newElector: ElectorWithRegistrant = {
          id: `local-${Date.now()}`,
          cedula: cleanCedula,
          nombres: cleanNombres,
          apellidos: cleanApellidos,
          telefono: telefono.trim() || null,
          puesto_votacion: puestoVotacion,
          mesa: Number(mesa),
          notas: notas.trim() || null,
          registrado_por: 'demo-user',
          tenant_id: currentTenantId || 'ten_alcaldia_2027',
          created_at: new Date().toISOString(),
          registrador: { full_name: 'Administrador General', role: 'admin' },
        };

        const existingStored = localStorage.getItem('electoral_local_electors');
        const list: ElectorWithRegistrant[] = existingStored ? JSON.parse(existingStored) : [];
        list.unshift(newElector);
        localStorage.setItem('electoral_local_electors', JSON.stringify(list));

        // Disparar evento para actualizar Dashboard y contexto de Tenant
        window.dispatchEvent(new Event('elector_registered'));
        refetchTenants();
      } else {
        // Inserción en Supabase con RLS y asignación explícita de tenant
        const { error: insertError } = await (supabase.from('electores') as any).insert({
          cedula: cleanCedula,
          nombres: cleanNombres,
          apellidos: cleanApellidos,
          telefono: telefono.trim() || null,
          puesto_votacion: puestoVotacion,
          mesa: Number(mesa),
          notas: notas.trim() || null,
          ...(currentTenantId ? { tenant_id: currentTenantId } : {}),
        });

        if (insertError) {
          if (insertError.code === '23505' || insertError.message.includes('unique')) {
            throw new Error('Esta cédula ya fue registrada previamente en esta campaña.');
          }
          throw insertError;
        }

        refetchTenants();
      }

      // Guardar memoria de sesión si el checkbox está activo
      if (rememberLocation) {
        localStorage.setItem('electoral_remember_location', 'true');
        localStorage.setItem('electoral_saved_puesto', puestoVotacion);
        localStorage.setItem('electoral_saved_mesa', String(mesa));
      } else {
        localStorage.setItem('electoral_remember_location', 'false');
        localStorage.removeItem('electoral_saved_puesto');
        localStorage.removeItem('electoral_saved_mesa');
      }

      // Toast de confirmación con datos del elector
      setToastMessage({
        title: 'Elector Registrado con Éxito',
        description: `${cleanNombres} ${cleanApellidos} · ${puestoVotacion} (Mesa ${mesa})`,
      });

      // Limpiar campos personales preservando puesto y mesa si aplica
      setCedula('');
      setNombres('');
      setApellidos('');
      setTelefono('');
      setNotas('');
      setCollisionResult(null);
      setIsAutofilledFromCenso(false);

      // Foco automático en el campo cédula para continuar digitando a alta velocidad
      setTimeout(() => {
        cedulaInputRef.current?.focus();
      }, 50);

      onSuccess?.();
    } catch (err: unknown) {
      console.error('Error al registrar elector:', err);
      setServerError(
        err instanceof Error ? err.message : 'Error inesperado al guardar el registro.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Manejo de atajo por teclado (Enter en inputs para saltar al siguiente)
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter o Cmd+Enter: guardar directamente
        return;
      }
      if (nextRef && nextRef.current) {
        e.preventDefault();
        nextRef.current.focus();
      }
    }
  };

  // Auto-cierre del Toast flotante tras 3.5 segundos
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-4 sm:p-6 lg:p-10 max-w-[1100px] mx-auto pb-24 md:pb-10 animate-in fade-in duration-300">
      
      {/* Toast Flotante Glassmorphic de Éxito Animado */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-4 sm:top-6 inset-x-4 sm:inset-x-auto sm:right-6 z-50 sm:max-w-md p-4 rounded-2xl bg-[#0F172A]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(16,185,129,0.2)] flex items-start gap-3.5 pointer-events-auto"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <AnimatedCheck size={22} className="text-emerald-400" />
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-slate-100 font-mono">
                {toastMessage.title}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                {toastMessage.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado del Formulario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/60 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Registrar Elector
          </h1>
        </div>

        {onNavigateToDashboard && (
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="text-xs font-mono text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors self-start sm:self-auto cursor-pointer font-medium"
          >
            ← Volver al Dashboard
          </button>
        )}
      </div>

      {/* Tarjeta Principal del Formulario */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 dark:backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-4 sm:p-6 md:p-8 shadow-xs dark:shadow-xl relative overflow-hidden transition-colors">
        {/* Línea de realce superior sutil */}
        <div 
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" 
          aria-hidden="true" 
        />

        {/* Alerta de Cuota y Límite de Campaña */}
        {planUsage.isNearLimit && (
          <div
            className={`mb-6 rounded-xl p-4 text-xs flex items-start gap-3 border ${
              planUsage.isLimitReached
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                planUsage.isLimitReached
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <div>
              <p className="font-semibold uppercase tracking-wider text-[11px] font-mono">
                {planUsage.isLimitReached
                  ? 'Límite de Campaña Alcanzado (100%)'
                  : `Alerta de Capacidad de Campaña (${planUsage.percentage}%)`}
              </p>
              <p className="mt-0.5 leading-relaxed">
                {planUsage.isLimitReached
                  ? `Esta campaña ha ocupado sus ${planUsage.totalElectors.toLocaleString()} de ${planUsage.maxElectors.toLocaleString()} registros asignados en su plan ${currentTenant?.plan.toUpperCase()}. Las nuevas inscripciones están bloqueadas hasta ampliar el plan.`
                  : `Esta campaña ha consumido ${planUsage.totalElectors.toLocaleString()} de ${planUsage.maxElectors.toLocaleString()} registros (${planUsage.percentage}% de capacidad). Considere ampliar el cupo pronto.`}
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Error de Servidor */}
        {serverError && (
          <div className="mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-semibold text-rose-800 dark:text-rose-200">Atención al registrar</p>
              <p className="mt-0.5 text-rose-600 dark:text-rose-300/90">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN ANTI-COLISIÓN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="cedula"
                className="text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Cédula de Ciudadanía / Documento</span>
                <span className="text-blue-500 dark:text-blue-400">*</span>
              </label>

              {/* Indicador de verificación anti-colisión */}
              <div className="text-[10px] font-mono flex items-center gap-1.5">
                {isCheckingCedula && (
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500 dark:text-blue-400" />
                    Verificando colisión...
                  </span>
                )}
                {!isCheckingCedula && collisionResult && !collisionResult.exists && cedula.length >= 5 && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    Disponible para registro
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                ref={cedulaInputRef}
                id="cedula"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={cedula}
                onChange={handleCedulaChange}
                onBlur={() => {
                  const clean = cedula.replace(/\D/g, '');
                  if (clean.length >= 5 && !collisionResult) {
                    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                    checkCedulaCollision(clean);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, nombresInputRef)}
                placeholder="Ej. 1047892341 (solo números)"
                disabled={saving}
                className={`w-full h-11 pl-4 pr-11 bg-slate-50 dark:bg-slate-900/90 border rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all ${
                  collisionResult?.exists
                    ? 'border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                    : 'border-slate-200 dark:border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
                }`}
              />

              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {isCheckingCedula ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500 dark:text-blue-400" />
                ) : collisionResult?.exists ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                ) : collisionResult && !collisionResult.exists && cedula.length >= 5 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                )}
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
                  className="rounded-2xl bg-gradient-to-br from-rose-50 via-rose-50/60 to-amber-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border border-rose-300 dark:border-rose-500/50 p-4 sm:p-5 shadow-lg overflow-hidden relative"
                >
                  {/* Watermark / Background glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header de la Ficha */}
                  <div className="flex items-center justify-between pb-3 border-b border-rose-200 dark:border-rose-900/60">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-700/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 font-mono">
                          Ficha de Elector Ya Vinculado
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Registro previo detectado en esta campaña
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80 font-mono">
                      Duplicado Bloqueado
                    </span>
                  </div>

                  {/* Detalle del Elector y Trazabilidad */}
                  <div className="mt-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white/80 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
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
                      <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Lugar de Votación Asignado
                        </span>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
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
                      <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Operador Responsable
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {collisionResult.elector.registrado_por_nombre || 'Personal Autorizado'}
                          </p>
                          {getRoleBadge(collisionResult.elector.registrado_por_rol)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatRegistrationDate(collisionResult.elector.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-700 dark:text-rose-300/90 italic flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Para mantener la integridad del censo, los campos y el botón de guardado han sido inhabilitados.</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECCIÓN 2: DATOS PERSONALES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Datos Personales del Elector
              </span>
              {isAutofilledFromCenso && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Autocompletado desde Censo Maestro</span>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
              <label
                htmlFor="nombres"
                className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
              >
                Nombres <span className="text-blue-500 dark:text-blue-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  ref={nombresInputRef}
                  id="nombres"
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, apellidosInputRef)}
                  placeholder="Ej. Juan Carlos"
                  disabled={saving || collisionResult?.exists}
                  className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="apellidos"
                className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
              >
                Apellidos <span className="text-blue-500 dark:text-blue-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  ref={apellidosInputRef}
                  id="apellidos"
                  type="text"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, telefonoInputRef)}
                  placeholder="Ej. Rodríguez Martínez"
                  disabled={saving || collisionResult?.exists}
                  className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Teléfono de contacto */}
          <div className="space-y-1.5">
            <label
              htmlFor="telefono"
              className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
            >
              Teléfono de Contacto (Opcional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                ref={telefonoInputRef}
                id="telefono"
                type="tel"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(e, mesaInputRef)}
                placeholder="Ej. 3124567890"
                disabled={saving || collisionResult?.exists}
                className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          {/* SECCIÓN 3: SELECTOR EN CASCADA (PUESTO Y MESA) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Ubicación Electoral
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-300">
                {currentPollingPlace.zone} · {totalMesas} Mesas Habilitadas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selector de Puesto de Votación */}
              <div className="md:col-span-2 space-y-1.5">
                <label
                  htmlFor="puesto"
                  className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
                >
                  Puesto de Votación
                </label>
                <div className="relative">
                  <select
                    id="puesto"
                    value={puestoVotacion}
                    onChange={(e) => handlePuestoChange(e.target.value)}
                    disabled={saving || collisionResult?.exists}
                    className="w-full h-10.5 pl-3.5 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    {PREDEFINED_POLLING_PLACES.map((p) => (
                      <option key={p.id} value={p.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {p.name} ({p.zone})
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Selector de Mesa Dinámico */}
              <div className="space-y-1.5">
                <label
                  htmlFor="mesa"
                  className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
                >
                  Número de Mesa
                </label>
                <div className="relative">
                  <select
                    ref={mesaInputRef}
                    id="mesa"
                    value={mesa}
                    onChange={(e) => setMesa(Number(e.target.value))}
                    disabled={saving || collisionResult?.exists}
                    className="w-full h-10.5 pl-3.5 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    {Array.from({ length: totalMesas }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono">
                        Mesa {m}
                      </option>
                    ))}
                  </select>
                  <Layers className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Checkbox Memoria de Sesión */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/50">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberLocation}
                  onChange={(e) => setRememberLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 peer-checked:bg-blue-600 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
                  <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 stroke-[3]" />
                </div>
                <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  Recordar puesto y mesa para el siguiente registro (Modo Lote)
                </span>
              </label>

              {rememberLocation && (
                <span className="text-[10px] font-mono text-amber-600 dark:text-[#E5B869] flex items-center gap-1 font-medium">
                  <BookmarkCheck className="w-3 h-3" />
                  Memoria activa
                </span>
              )}
            </div>
          </div>

          {/* Notas adicionales opcionales */}
          <div className="space-y-1.5">
            <label
              htmlFor="notas"
              className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
            >
              Observaciones / Referencia (Opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                id="notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Requiere transporte / Contacto vecinal"
                disabled={saving || collisionResult?.exists}
                className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-300">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Validación de integridad RLS activa</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setCedula('');
                  setNombres('');
                  setApellidos('');
                  setTelefono('');
                  setNotas('');
                  setCollisionResult(null);
                  setServerError(null);
                  cedulaInputRef.current?.focus();
                }}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>

              <button
                type="submit"
                disabled={saving || collisionResult?.exists || cedula.length < 5 || planUsage.isLimitReached}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  collisionResult?.exists
                    ? 'bg-rose-700/80 dark:bg-rose-900/80 border border-rose-500/50 text-rose-200'
                    : planUsage.isLimitReached
                    ? 'bg-slate-400 dark:bg-slate-700'
                    : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : collisionResult?.exists ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Registro Bloqueado (Ya Existe)</span>
                  </>
                ) : planUsage.isLimitReached ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span>Límite de Plan Alcanzado</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Guardar Elector</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
