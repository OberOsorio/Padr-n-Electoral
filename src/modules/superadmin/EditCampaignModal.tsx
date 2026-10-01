import React, { useState, useMemo } from 'react';
import { X, Edit3, Save, MapPin, Building, Hash, User, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { COLOMBIA_GEO_DATA } from '../../data/colombiaGeoData';
import { PremiumSelect } from '../../components/ui/PremiumSelect';

// Diccionario oficial completo de Departamentos y Municipios de Colombia
export const DIVISION_COLOMBIA: Record<string, string[]> = (() => {
  const dict: Record<string, string[]> = {};
  
  // Poblar con la base de datos geográfica oficial
  for (const dep of COLOMBIA_GEO_DATA) {
    dict[dep.nombre] = [...dep.municipios];
  }

  // Lista detallada y oficial de los 30 municipios de Córdoba
  dict['Córdoba'] = [
    'Cotorra', 'Santa Cruz de Lorica', 'Cereté', 'Montería', 'San Pelayo', 
    'San Bernardo del Viento', 'Sahagún', 'Ciénaga de Oro', 'Chinú', 
    'Planeta Rica', 'Tierralta', 'Montelíbano', 'Puerto Escondido', 
    'Moñitos', 'San Antero', 'Pueblo Nuevo', 'Ayapel', 'Buenavista', 
    'Canalete', 'Chimá', 'La Apartada', 'Los Córdobas', 'Momil', 
    'Purísima de la Concepción', 'Puerto Libertador', 'San Andrés de Sotavento', 
    'San Carlos', 'San José de Uré', 'Tuchín', 'Valencia'
  ].sort((a, b) => a.localeCompare(b, 'es'));

  // Asegurar orden alfabético para cada departamento
  for (const k of Object.keys(dict)) {
    dict[k] = [...new Set(dict[k])].sort((a, b) => a.localeCompare(b, 'es'));
  }
  return dict;
})();

export const LISTA_DEPARTAMENTOS = Object.keys(DIVISION_COLOMBIA).sort((a, b) => a.localeCompare(b, 'es'));

export interface EditCampaignModalProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    municipio?: string;
    departamento?: string;
    admin_name?: string;
    admin_email?: string;
    director_nombre?: string;
    director_email?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onCampaignUpdated: (updated: any) => void;
}

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onCampaignUpdated,
}) => {
  const [name, setName] = useState(campaign.name || '');
  const [slug, setSlug] = useState(campaign.slug || '');
  const [departamento, setDepartamento] = useState(campaign.departamento || 'Córdoba');
  const [municipio, setMunicipio] = useState(campaign.municipio || 'Cotorra');
  const [directorNombre, setDirectorNombre] = useState(campaign.director_nombre || campaign.admin_name || '');
  const [directorEmail, setDirectorEmail] = useState(campaign.director_email || campaign.admin_email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lista reactiva de municipios según el departamento seleccionado
  const municipiosDisponibles = useMemo(() => {
    const list = DIVISION_COLOMBIA[departamento] || [];
    if (municipio && !list.includes(municipio)) {
      return [municipio, ...list];
    }
    return list;
  }, [departamento, municipio]);

  const handleDepartamentoChange = (nuevoDepto: string) => {
    setDepartamento(nuevoDepto);
    const listaMuni = DIVISION_COLOMBIA[nuevoDepto] || [];
    const primerMunicipio = listaMuni.length > 0 ? listaMuni[0] : '';
    setMunicipio(primerMunicipio);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      municipio: municipio.trim(),
      departamento: departamento.trim(),
      admin_name: directorNombre.trim(),
      admin_email: directorEmail.trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Persistir cambios en la tabla tenants de Supabase
      const { error } = await (supabase.from('tenants') as any)
        .update(payload)
        .eq('id', campaign.id);

      if (error) throw error;

      // 2. Si se ajustó el director en profiles
      if (directorEmail) {
        try {
          await (supabase.from('profiles') as any)
            .update({ full_name: directorNombre.trim() })
            .eq('email', directorEmail.trim())
            .eq('tenant_id', campaign.id);
        } catch (profileErr) {
          console.warn('Nota: No se pudo actualizar profile del director:', profileErr);
        }
      }

      onCampaignUpdated({
        ...campaign,
        ...payload,
        director_nombre: directorNombre,
        director_email: directorEmail,
      });

      onClose();
    } catch (err: any) {
      console.error('Error al actualizar campaña:', err);
      setErrorMsg(err.message || 'Error guardando los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-[#162342] rounded-[28px] w-full max-w-lg sm:max-w-xl max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-[#141e36] flex items-center justify-between bg-slate-50 dark:bg-[#070b16] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/25 shrink-0">
              <Edit3 className="w-5 h-5"/>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">Editar Campaña</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">ID: {campaign.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Formulario con Scroll Interno */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Fila 1: Nombre y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Nombre de la Campaña
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <Building className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"/>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-bold"
                  placeholder="TODO POR COTORRA"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Slug (URL Identificador)
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <Hash className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"/>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
                  placeholder="todo-por-cotorra"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Selectores Desplegables Oficiales de Colombia (Combobox Premium) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiumSelect
              label="Departamento"
              value={departamento}
              options={LISTA_DEPARTAMENTOS}
              onChange={handleDepartamentoChange}
              icon={MapPin}
              searchPlaceholder="Buscar departamento..."
            />

            <PremiumSelect
              label="Municipio"
              value={municipio}
              options={municipiosDisponibles}
              onChange={(val) => setMunicipio(val)}
              icon={MapPin}
              searchPlaceholder="Buscar municipio..."
            />
          </div>

          {/* Fila 3: Director y Correo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Director / Administrador
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"/>
                <input
                  type="text"
                  value={directorNombre}
                  onChange={(e) => setDirectorNombre(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-semibold"
                  placeholder="Nombre del director"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Correo Electrónico Admin
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#16223e] rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0"/>
                <input
                  type="email"
                  value={directorEmail}
                  onChange={(e) => setDirectorEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
                  placeholder="admin@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-[#141e36]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              <span>{loading ? 'Guardando...' : 'Guardar Cambios Efectivos'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
