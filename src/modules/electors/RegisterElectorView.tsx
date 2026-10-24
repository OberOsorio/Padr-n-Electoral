import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ElectorWithRegistrant, CollisionCheckResult } from '../../types';
import {
  UserPlus,
  CreditCard,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Lock,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCheck } from '../../components/ui/AnimatedCheck';
import {
  getMunicipiosPorDepartamento,
  getPollingPlacesPorMunicipio,
  fetchPollingPlacesForTenantAsync,
  type PollingPlace,
} from './constants';
import {
  resolverMunicipioCampana,
  normalizarTexto,
} from '../../services/divipoleService';
import { ElectorLocationSelector } from './components/ElectorLocationSelector';
import { useTenant } from '../../context/TenantContext';
import { useElectorSearch } from './useElectorSearch';
import { isValidUUID } from '../../utils/uuid';

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
  const edadInputRef = useRef<HTMLInputElement>(null);
  const telefonoInputRef = useRef<HTMLInputElement>(null);
  const mesaInputRef = useRef<HTMLSelectElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Estados del formulario
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [telefono, setTelefono] = useState('');
  const [puestoVotacion, setPuestoVotacion] = useState('');
  const [mesa, setMesa] = useState<number | ''>('');
  const [notas, setNotas] = useState('');

  // Memoria de sesión para puesto y mesa
  const [rememberLocation, setRememberLocation] = useState<boolean>(() => {
    return localStorage.getItem('electoral_remember_location') === 'true';
  });

  // Estados de validación anti-colisión y jurisdicción
  const [isCheckingCedula, setIsCheckingCedula] = useState(false);
  const [collisionResult, setCollisionResult] = useState<CollisionCheckResult | null>(null);
  const [isAutofilledFromCenso, setIsAutofilledFromCenso] = useState(false);
  const { buscarDocumento } = useElectorSearch();
  const [alertaJurisdiccion, setAlertaJurisdiccion] = useState<{
    mostrar: boolean;
    municipioElector?: string;
    puestoElector?: string;
  }>({ mostrar: false });
  const currentCedulaRef = useRef<string>('');
  const autofilledCedulaRef = useRef<string>('');
  const lastSearchedCedulaRef = useRef<string>('');
  const isSearchingCedulaRef = useRef<boolean>(false);

  // Estados de envío y feedback
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Cargar memoria de sesión de puesto y mesa al montar
  useEffect(() => {
    const isRemember = localStorage.getItem('electoral_remember_location') === 'true';
    if (isRemember) {
      const savedPuesto = localStorage.getItem('electoral_saved_puesto');
      const savedMesa = localStorage.getItem('electoral_saved_mesa');

      if (savedPuesto) {
        setPuestoVotacion(savedPuesto);
      }
      if (savedMesa && !isNaN(Number(savedMesa))) {
        setMesa(Number(savedMesa));
      }
    }

    cedulaInputRef.current?.focus();
  }, []);

  const { currentTenant, currentTenantId, planUsage, refetchTenants } = useTenant();

  // Circunscripción activa de la campaña
  const departamentoCampana = currentTenant?.departamento || 'Córdoba';
  const municipioCampanaDefault = currentTenant?.municipio || resolverMunicipioCampana(currentTenant) || 'Cotorra';

  const [selectedMunicipio, setSelectedMunicipio] = useState<string>(municipioCampanaDefault);

  // Sincronizar circunscripción territorial si cambia la campaña activa
  useEffect(() => {
    const defaultMuni = currentTenant?.municipio || resolverMunicipioCampana(currentTenant) || 'Cotorra';
    setSelectedMunicipio(defaultMuni);
  }, [currentTenant]);

  const availableMunicipios = useMemo(() => {
    return getMunicipiosPorDepartamento(departamentoCampana);
  }, [departamentoCampana]);

  const [pollingPlaces, setPollingPlaces] = useState<PollingPlace[]>(() => {
    return getPollingPlacesPorMunicipio(municipioCampanaDefault, departamentoCampana);
  });

  useEffect(() => {
    let isMounted = true;
    const local = getPollingPlacesPorMunicipio(selectedMunicipio, departamentoCampana);
    if (local.length > 0) {
      setPollingPlaces(local);
    }

    fetchPollingPlacesForTenantAsync(currentTenant, selectedMunicipio).then((asyncPlaces) => {
      if (isMounted && asyncPlaces && asyncPlaces.length > 0) {
        setPollingPlaces(asyncPlaces);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTenant, selectedMunicipio, departamentoCampana]);

  const handleMunicipioChange = useCallback((newMuni: string) => {
    setSelectedMunicipio(newMuni);
    setPuestoVotacion('');
    setMesa('');
    setAlertaJurisdiccion({ mostrar: false });
  }, []);

  const validarJurisdiccionElector = useCallback(
    (datosCenso?: { municipio?: string | null; departamento?: string | null; puesto?: string | null }) => {
      if (!datosCenso || !datosCenso.municipio || !datosCenso.municipio.trim()) {
        setAlertaJurisdiccion({ mostrar: false });
        return false;
      }

      const normalizar = (txt: string) =>
        txt
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

      const municipioCampanaRaw = currentTenant?.municipio || resolverMunicipioCampana(currentTenant) || 'cotorra';
      const municipioCampana = normalizar(municipioCampanaRaw);
      const municipioElector = normalizar(datosCenso.municipio);

      const esForaneo = Boolean(municipioElector) && municipioElector !== municipioCampana;

      if (esForaneo) {
        setAlertaJurisdiccion({
          mostrar: true,
          municipioElector: datosCenso.municipio.trim(),
          puestoElector: datosCenso.puesto?.trim() || undefined,
        });
        return true;
      } else {
        setAlertaJurisdiccion({ mostrar: false });
        return false;
      }
    },
    [currentTenant]
  );

  useEffect(() => {
    if (puestoVotacion && pollingPlaces.length > 0 && !pollingPlaces.some((p) => p.name === puestoVotacion)) {
      setPuestoVotacion('');
      setMesa('');
    }
    setAlertaJurisdiccion({ mostrar: false });
  }, [pollingPlaces, puestoVotacion]);

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

  const getRoleBadge = (role?: string) => {
    const r = (role || 'admin').toLowerCase();
    if (r === 'lider') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          Líder
        </span>
      );
    }
    if (r === 'coordinador') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Coordinador
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        Admin
      </span>
    );
  };

  // Validación anti-colisión y autocompletado en tiempo real
  const checkCedulaCollision = useCallback(async (cedulaValue: string, force = false) => {
    const cleanCedula = cedulaValue.trim().replace(/\D/g, '');
    if (cleanCedula.length < 5) {
      setCollisionResult(null);
      setIsCheckingCedula(false);
      return;
    }

    // Evitar llamadas duplicadas o carreras si ya está resuelto para este documento exacto
    if (!force && cleanCedula === lastSearchedCedulaRef.current && (collisionResult !== null || isAutofilledFromCenso)) {
      return;
    }

    setIsCheckingCedula(true);
    isSearchingCedulaRef.current = true;

    try {
      const res = await buscarDocumento(cleanCedula, currentTenantId);

      // Si el usuario continuó modificando el valor mientras se consultaba, descartar
      if (currentCedulaRef.current !== cleanCedula) {
        return;
      }

      lastSearchedCedulaRef.current = cleanCedula;

      if (res && res.duplicado) {
        setCollisionResult({
          exists: true,
          elector: {
            id: 'dup',
            cedula: cleanCedula,
            nombres: res.nombres,
            apellidos: res.apellidos,
            edad: null,
            telefono: '',
            puesto_votacion: res.puesto_votacion || 'Principal',
            mesa: 1,
            created_at: new Date().toISOString(),
            registrado_por_nombre: 'Personal Autorizado',
            registrado_por_rol: 'Líder / Admin',
          },
        });
        setIsAutofilledFromCenso(false);
        autofilledCedulaRef.current = '';
        return;
      }

      if (res && (res.nombres || res.apellidos)) {
        setCollisionResult({ exists: false });
        setNombres(res.nombres);
        setApellidos(res.apellidos);

        const edadFinal: number | '' =
          res.edad && !isNaN(Number(res.edad)) && Number(res.edad) > 0
            ? Number(res.edad)
            : '';
        setEdad(edadFinal);

        const esForaneo = validarJurisdiccionElector({
          municipio: res.municipio || null,
          departamento: res.departamento || null,
          puesto: res.puesto_votacion || null,
        });

        if (!esForaneo && res.puesto_votacion) {
          const matchedPlace = pollingPlaces.find(
            (p) => normalizarTexto(p.name) === normalizarTexto(res.puesto_votacion!)
          );
          if (matchedPlace) {
            setPuestoVotacion(matchedPlace.name);
            if (res.mesa) {
              setMesa(Number(res.mesa) || '');
            }
          }
        }

        autofilledCedulaRef.current = cleanCedula;
        setIsAutofilledFromCenso(true);
        return;
      }

      setCollisionResult({ exists: false });
      if (autofilledCedulaRef.current || isAutofilledFromCenso) {
        setNombres('');
        setApellidos('');
        setEdad('');
        if (!rememberLocation) {
          setPuestoVotacion('');
          setMesa('');
        }
      }
      autofilledCedulaRef.current = '';
      setIsAutofilledFromCenso(false);
      setAlertaJurisdiccion({ mostrar: false });
    } catch (err) {
      console.error('Error al verificar documento:', err);
      setCollisionResult({ exists: false });
    } finally {
      setIsCheckingCedula(false);
      isSearchingCedulaRef.current = false;
    }
  }, [currentTenantId, pollingPlaces, rememberLocation, buscarDocumento, validarJurisdiccionElector, collisionResult, isAutofilledFromCenso]);

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const prevCedula = currentCedulaRef.current;
    setCedula(val);
    currentCedulaRef.current = val;
    setServerError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const seEliminoNumero = val.length < prevCedula.length;

    if (seEliminoNumero || (autofilledCedulaRef.current && autofilledCedulaRef.current !== val)) {
      setNombres('');
      setApellidos('');
      setEdad('');
      if (!rememberLocation) {
        setPuestoVotacion('');
        setMesa('');
      }
      setIsAutofilledFromCenso(false);
      autofilledCedulaRef.current = '';
      lastSearchedCedulaRef.current = '';
      setAlertaJurisdiccion({ mostrar: false });
      setCollisionResult(null);
    }

    if (!val) {
      setNombres('');
      setApellidos('');
      setEdad('');
      if (!rememberLocation) {
        setPuestoVotacion('');
        setMesa('');
      }
      setCollisionResult(null);
      setIsCheckingCedula(false);
      setIsAutofilledFromCenso(false);
      autofilledCedulaRef.current = '';
      lastSearchedCedulaRef.current = '';
      setAlertaJurisdiccion({ mostrar: false });
      return;
    }

    if (val.length < 6) {
      setCollisionResult(null);
      setIsCheckingCedula(false);
      setAlertaJurisdiccion({ mostrar: false });
      return;
    }

    // Debounce calibrado a 400ms para evitar interrupciones de escritura
    setIsCheckingCedula(true);
    debounceTimerRef.current = setTimeout(() => {
      checkCedulaCollision(val);
    }, 400);
  };

  const handlePuestoChange = (newPuesto: string) => {
    setPuestoVotacion(newPuesto);
    setMesa('');
  };

  const handleLimpiarFormulario = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    currentCedulaRef.current = '';
    lastSearchedCedulaRef.current = '';
    isSearchingCedulaRef.current = false;

    setCedula('');
    setNombres('');
    setApellidos('');
    setEdad('');
    setTelefono('');
    setPuestoVotacion('');
    setMesa('');
    setNotas('');

    setRememberLocation(false);
    localStorage.setItem('electoral_remember_location', 'false');
    localStorage.removeItem('electoral_saved_puesto');
    localStorage.removeItem('electoral_saved_mesa');

    setIsCheckingCedula(false);
    setCollisionResult(null);
    setIsAutofilledFromCenso(false);
    autofilledCedulaRef.current = '';
    setAlertaJurisdiccion({ mostrar: false });
    setServerError(null);

    cedulaInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const cleanCedula = cedula.trim().replace(/\D/g, '');
    const cleanNombres = nombres.trim();
    const cleanApellidos = apellidos.trim();
    const numEdad = typeof edad === 'number' ? edad : (edad ? parseInt(String(edad), 10) : null);

    if (!cleanCedula || cleanCedula.length < 5) {
      setServerError('Ingrese un número de cédula válido (mínimo 5 dígitos).');
      cedulaInputRef.current?.focus();
      return;
    }

    if (alertaJurisdiccion.mostrar) {
      setServerError(
        `El ciudadano pertenece a otra jurisdicción (${alertaJurisdiccion.municipioElector}). Confirme en el aviso superior si desea autorizar el registro o bloquearlo.`
      );
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

    if (!puestoVotacion || !puestoVotacion.trim()) {
      setServerError('Por favor seleccione un puesto de votación.');
      return;
    }

    if (!mesa || Number(mesa) <= 0) {
      setServerError('Por favor seleccione el número de mesa correspondiente.');
      return;
    }

    if (collisionResult?.exists) {
      setServerError('No es posible registrar: el elector ya existe en el padrón de esta campaña.');
      return;
    }

    if (planUsage.isLimitReached) {
      setServerError(
        `Límite de registros alcanzado para esta campaña (${planUsage.totalElectors.toLocaleString()} de ${planUsage.maxElectors.toLocaleString()}). Comuníquese con el SuperAdmin para ampliar la capacidad.`
      );
      return;
    }

    setSaving(true);

    try {
      if (!isSupabaseConfigured) {
        const newElector: ElectorWithRegistrant = {
          id: `local-${Date.now()}`,
          cedula: cleanCedula,
          nombres: cleanNombres,
          apellidos: cleanApellidos,
          edad: numEdad,
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

        window.dispatchEvent(new Event('elector_registered'));
        refetchTenants();
      } else {
        let savedSuccessfully = false;
        try {
          const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)('registrar_elector_directo', {
            p_cedula: cleanCedula,
            p_nombres: cleanNombres,
            p_apellidos: cleanApellidos,
            p_telefono: telefono.trim() || null,
            p_puesto: puestoVotacion,
            p_mesa: Number(mesa),
            p_notas: notas.trim() || null,
            p_tenant_id: isValidUUID(currentTenantId) ? currentTenantId : null,
            p_edad: numEdad,
          });

          if (!rpcErr && rpcRes && rpcRes.success === true) {
            savedSuccessfully = true;
          } else if (rpcRes && rpcRes.success === false) {
            throw new Error(rpcRes.error || 'Error al registrar elector.');
          }
        } catch (rpcEx: any) {
          if (rpcEx?.message?.includes('previamente')) {
            throw rpcEx;
          }
        }

        if (!savedSuccessfully) {
          const resolvedTenantId = isValidUUID(currentTenantId) ? currentTenantId : null;

          const insertPayload: any = {
            cedula: cleanCedula,
            nombres: cleanNombres,
            apellidos: cleanApellidos,
            edad: numEdad,
            telefono: telefono.trim() || null,
            puesto_votacion: puestoVotacion,
            mesa: Number(mesa),
            notas: notas.trim() || null,
            tenant_id: resolvedTenantId,
          };

          let { error: insertError } = await (supabase.from('electores') as any).insert(insertPayload);

          if (insertError && (insertError.message?.includes('electores_tenant_id_fkey') || insertError.code === '23503')) {
            insertPayload.tenant_id = null;
            const retryRes = await (supabase.from('electores') as any).insert(insertPayload);
            insertError = retryRes.error;
          }

          if (insertError) {
            if (insertError.code === '23505' || insertError.message.includes('unique')) {
              throw new Error('Esta cédula ya fue registrada previamente en esta campaña.');
            }
            throw insertError;
          }
        }

        refetchTenants();
      }

      if (rememberLocation) {
        localStorage.setItem('electoral_remember_location', 'true');
        localStorage.setItem('electoral_saved_puesto', puestoVotacion);
        localStorage.setItem('electoral_saved_mesa', String(mesa));
      } else {
        localStorage.setItem('electoral_remember_location', 'false');
        localStorage.removeItem('electoral_saved_puesto');
        localStorage.removeItem('electoral_saved_mesa');
      }

      setToastMessage({
        title: 'Elector Registrado con Éxito',
        description: `${cleanNombres} ${cleanApellidos}${numEdad ? ` (${numEdad} años)` : ''} · ${puestoVotacion} (Mesa ${mesa})`,
      });

      setCedula('');
      setNombres('');
      setApellidos('');
      setEdad('');
      setTelefono('');
      setNotas('');
      setCollisionResult(null);
      setIsAutofilledFromCenso(false);
      autofilledCedulaRef.current = '';

      if (!rememberLocation) {
        setPuestoVotacion('');
        setMesa('');
      }

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

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.ctrlKey || e.metaKey)) {
        return;
      }
      if (nextRef && nextRef.current) {
        e.preventDefault();
        nextRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="relative min-h-[calc(100vh-2rem)] p-3 sm:p-6 lg:p-8 max-w-[1100px] mx-auto pb-24 md:pb-10 w-full overflow-x-hidden transition-colors duration-200"
    >
      {/* Toast Flotante Glassmorphic de Éxito Animado */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
            className="fixed top-4 sm:top-6 inset-x-4 sm:inset-x-auto sm:right-6 z-50 sm:max-w-md p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-2xl flex items-start gap-3 pointer-events-auto"
          >
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
              <AnimatedCheck size={20} className="text-emerald-500" />
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                {toastMessage.title}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 truncate">
                {toastMessage.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado del Formulario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.07] mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Registrar Elector
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Inscripción individual y verificación en tiempo real del censo
          </p>
        </div>

        {onNavigateToDashboard && (
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors self-start sm:self-auto cursor-pointer font-medium active:scale-[0.98]"
          >
            ← Volver al Dashboard
          </button>
        )}
      </div>

      {/* Tarjeta Principal del Formulario */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.07] p-4 sm:p-6 md:p-8 shadow-xs relative overflow-hidden transition-colors duration-200">
        
        {/* Alerta de Cuota y Límite de Campaña */}
        {planUsage.isNearLimit && (
          <div
            className={`mb-6 rounded-xl p-4 text-xs flex items-start gap-3 border ${
              planUsage.isLimitReached
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300'
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
              <p className="mt-0.5 leading-relaxed font-mono tabular-nums">
                {planUsage.isLimitReached
                  ? `Esta campaña ha ocupado sus ${planUsage.totalElectors.toLocaleString()} de ${planUsage.maxElectors.toLocaleString()} registros asignados en su plan ${currentTenant?.plan?.toUpperCase() || 'ILIMITADO'}.`
                  : `Esta campaña ha consumido ${planUsage.totalElectors.toLocaleString()} de ${planUsage.maxElectors.toLocaleString()} registros (${planUsage.percentage}% de capacidad).`}
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Error de Servidor */}
        {serverError && (
          <div className="mb-6 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-semibold text-rose-800 dark:text-rose-200">Atención al registrar</p>
              <p className="mt-0.5 text-rose-600 dark:text-rose-300/90">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN ANTI-COLISIÓN */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="cedula"
                className="text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Cédula de Ciudadanía / Documento</span>
                <span className="text-blue-500 dark:text-blue-400">*</span>
              </label>

              {/* Indicador de verificación anti-colisión */}
              <div className="text-[10px] font-mono flex items-center gap-1.5">
                {isCheckingCedula && (
                  <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500 dark:text-blue-400" />
                    Verificando...
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
                  if (
                    clean.length >= 6 &&
                    clean !== lastSearchedCedulaRef.current &&
                    !isSearchingCedulaRef.current
                  ) {
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                      debounceTimerRef.current = null;
                    }
                    checkCedulaCollision(clean);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const clean = cedula.replace(/\D/g, '');
                    if (clean.length >= 5) {
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                      }
                      if (clean !== lastSearchedCedulaRef.current && !isSearchingCedulaRef.current) {
                        checkCedulaCollision(clean, true);
                      }
                    }
                    nombresInputRef.current?.focus();
                  } else {
                    handleKeyDown(e, nombresInputRef);
                  }
                }}
                placeholder="Ej. 1047892341 (solo dígitos)"
                disabled={saving}
                className={`w-full h-10.5 pl-4 pr-24 bg-slate-50 dark:bg-[#18181b] border rounded-xl text-base sm:text-sm font-mono tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all ${
                  collisionResult?.exists
                    ? 'border-amber-500 dark:border-amber-500/60 focus:border-amber-500'
                    : 'border-slate-200/80 dark:border-white/[0.08] focus:border-blue-500'
                }`}
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isCheckingCedula ? (
                  <span className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-medium text-blue-500 dark:text-blue-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando</span>
                  </span>
                ) : collisionResult?.exists ? (
                  <span className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-amber-500 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                ) : collisionResult && !collisionResult.exists && cedula.length >= 5 ? (
                  <button
                    type="button"
                    onClick={() => checkCedulaCollision(cedula, true)}
                    title="Volver a consultar"
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-semibold">Listo</span>
                  </button>
                ) : cedula.length >= 5 ? (
                  <button
                    type="button"
                    onClick={() => checkCedulaCollision(cedula, true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-700 dark:text-zinc-200 bg-slate-200/70 hover:bg-slate-300/80 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] rounded-lg transition-all cursor-pointer active:scale-95"
                  >
                    <span>Consultar</span>
                  </button>
                ) : (
                  <CreditCard className="w-4 h-4 text-slate-400 dark:text-zinc-600 mr-1" />
                )}
              </div>
            </div>

            {/* Ficha de Elector Ya Vinculado a la Campaña */}
            <AnimatePresence>
              {collisionResult?.exists && collisionResult.elector && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
                  className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 p-4 sm:p-5 shadow-xs relative overflow-hidden"
                >
                  {/* Header de la Ficha */}
                  <div className="flex items-center justify-between pb-3 border-b border-rose-200/80 dark:border-rose-500/20">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300 font-mono">
                          Elector Previamente Registrado
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                          Ya vinculado a esta campaña
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                      Duplicado Bloqueado
                    </span>
                  </div>

                  {/* Detalle del Elector y Trazabilidad */}
                  <div className="mt-3 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-white dark:bg-[#18181b] p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                          {collisionResult.elector.nombres} {collisionResult.elector.apellidos}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Documento: <strong className="text-slate-800 dark:text-zinc-200">C.C. {collisionResult.elector.cedula}</strong></span>
                          {collisionResult.elector.edad && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-white/[0.06] font-medium text-slate-700 dark:text-zinc-300">
                              {collisionResult.elector.edad} años
                            </span>
                          )}
                        </p>
                      </div>

                      {collisionResult.elector.telefono && (
                        <div className="flex items-center gap-2 self-start sm:self-auto font-mono tabular-nums">
                          <span className="text-xs text-slate-700 dark:text-zinc-300">
                            {collisionResult.elector.telefono}
                          </span>
                          <a
                            href={`https://wa.me/57${collisionResult.elector.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
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
                      <div className="p-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06]">
                        <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 block mb-1">
                          Puesto de Votación
                        </span>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-zinc-200 leading-tight">
                              {collisionResult.elector.puesto_votacion}
                            </p>
                            <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-zinc-400 mt-0.5">
                              Mesa: <strong className="text-blue-600 dark:text-blue-400">{collisionResult.elector.mesa}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Operador y Fecha */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06]">
                        <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 block mb-1">
                          Operador Responsable
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                            {collisionResult.elector.registrado_por_nombre || 'Personal Autorizado'}
                          </p>
                          {getRoleBadge(collisionResult.elector.registrado_por_rol)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                          <span>{formatRegistrationDate(collisionResult.elector.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-700 dark:text-rose-300 italic flex items-center gap-1.5 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Para mantener la integridad del censo, los campos y el botón de guardado han sido inhabilitados.</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Banner de Advertencia de Jurisdicción Electoral */}
            {alertaJurisdiccion.mostrar && !collisionResult?.exists && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      Aviso de Jurisdicción: Este elector vota en {alertaJurisdiccion.municipioElector}
                      {alertaJurisdiccion.puestoElector ? ` (${alertaJurisdiccion.puestoElector})` : ''}, fuera de la circunscripción ({currentTenant?.municipio || resolverMunicipioCampana(currentTenant) || 'Cotorra'}).
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                      Puede cancelar la operación o autorizar el registro foráneo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleLimpiarFormulario}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    Bloquear y Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tag = `[Elector fuera de circunscripción: ${alertaJurisdiccion.municipioElector || 'Externo'}]`;
                      setNotas((prev) => (prev.includes(tag) ? prev : prev ? `${tag} ${prev}` : tag));
                      setAlertaJurisdiccion({ mostrar: false });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium hover:bg-amber-500/25 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    Autorizar Registro
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: DATOS PERSONALES */}
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Datos Personales del Elector
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="nombres"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                >
                  Nombres <span className="text-blue-500 dark:text-blue-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
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
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="apellidos"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                >
                  Apellidos <span className="text-blue-500 dark:text-blue-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
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
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Fila: Teléfono de Contacto y Edad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-1.5">
                <label
                  htmlFor="telefono"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                >
                  Teléfono de Contacto (Opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    ref={telefonoInputRef}
                    id="telefono"
                    type="tel"
                    inputMode="numeric"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(e, edadInputRef)}
                    placeholder="Ej. 3124567890"
                    disabled={saving || collisionResult?.exists}
                    className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 space-y-1.5">
                <label
                  htmlFor="edad"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                >
                  Edad {edad !== '' && <span className="text-blue-600 dark:text-blue-400 font-mono tabular-nums">({edad}a)</span>}
                </label>
                <div className="relative">
                  <input
                    ref={edadInputRef}
                    id="edad"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={edad}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEdad(val ? Number(val) : '');
                    }}
                    onKeyDown={(e) => handleKeyDown(e, mesaInputRef)}
                    placeholder="Ej. 28"
                    disabled={saving || collisionResult?.exists}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-base sm:text-sm font-mono tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SELECTOR EN CASCADA (PUESTO Y MESA) */}
          <ElectorLocationSelector
            puestoVotacion={puestoVotacion}
            onPuestoChange={handlePuestoChange}
            mesa={mesa}
            onMesaChange={(newMesa) => setMesa(newMesa)}
            pollingPlaces={pollingPlaces}
            municipio={selectedMunicipio}
            onMunicipioChange={handleMunicipioChange}
            departamento={departamentoCampana}
            availableMunicipios={availableMunicipios}
            disabled={saving || (collisionResult?.exists ?? false)}
            mesaInputRef={mesaInputRef}
            rememberLocation={rememberLocation}
            onRememberLocationChange={(val) => setRememberLocation(val)}
            showSectionWrapper={true}
            showRememberCheckbox={true}
          />

          {/* Notas adicionales opcionales */}
          <div className="space-y-1.5">
            <label
              htmlFor="notas"
              className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300"
            >
              Observaciones / Referencia (Opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                id="notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Requiere transporte / Referencia del líder"
                disabled={saving || collisionResult?.exists}
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-end gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleLimpiarFormulario}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-mono text-slate-700 dark:text-zinc-200 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>

              <button
                type="submit"
                disabled={saving || collisionResult?.exists || cedula.length < 5 || planUsage.isLimitReached}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                  collisionResult?.exists
                    ? 'bg-rose-700/80 dark:bg-rose-900/80 border border-rose-500/50 text-rose-200'
                    : planUsage.isLimitReached
                    ? 'bg-slate-400 dark:bg-zinc-700'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : collisionResult?.exists ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Registro Bloqueado (Ya Existe)</span>
                  </>
                ) : planUsage.isLimitReached ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Límite de Plan Alcanzado</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Guardar Elector</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
