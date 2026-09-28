import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MONTERIA_DIVIPOLE_2026, type PollingPlace } from '../data/monteriaDivipole2026';
import cordobaData from '../data/cordobaDivipole2026.json';
import type { Tenant } from '../types';

export type { PollingPlace };

// Cache en memoria para puestos consultados por municipio
const memoryCache = new Map<string, PollingPlace[]>();

// Inicializar caché con Montería
memoryCache.set('córdoba_montería', MONTERIA_DIVIPOLE_2026);
memoryCache.set('cordoba_monteria', MONTERIA_DIVIPOLE_2026);

function normalizeKey(str: string = ''): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Retorna los puestos oficiales de votación correspondientes a la circunscripción/municipio de la campaña.
 * Si la campaña es de Montería / Córdoba, retorna de inmediato los 95 puestos oficiales del Divipole 2026.
 */
export function getPollingPlacesForTenant(tenant?: Tenant | null): PollingPlace[] {
  const dept = tenant?.departamento ? normalizeKey(tenant.departamento) : 'cordoba';
  const muni = tenant?.municipio ? normalizeKey(tenant.municipio) : 'monteria';
  const cacheKey = `${dept}_${muni}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Si es de Córdoba, filtrar desde el dataset precargado de Córdoba
  if (dept.includes('cordoba')) {
    const filtered = (cordobaData as any[]).filter(
      (p) => normalizeKey(p.municipio) === muni || normalizeKey(p.municipio).includes(muni)
    );
    if (filtered.length > 0) {
      const mapped: PollingPlace[] = filtered.map((p) => ({
        id: p.id,
        name: p.name,
        totalMesas: p.totalMesas || 1,
        zone: p.zone || 'Cabecera',
        departamento: p.departamento,
        municipio: p.municipio,
        address: p.address,
        censo: p.censo,
        lat: p.lat,
        lng: p.lng,
        citrep: p.citrep,
      }));
      memoryCache.set(cacheKey, mapped);
      return mapped;
    }
  }

  // Por defecto, retornar los 95 puestos oficiales de Montería (Divipole 2026)
  return MONTERIA_DIVIPOLE_2026;
}

/**
 * Consulta asíncrona de puestos en Supabase para cualquier circunscripción o municipio de Colombia.
 */
export async function fetchPollingPlacesForTenantAsync(
  tenant?: Tenant | null
): Promise<PollingPlace[]> {
  const localList = getPollingPlacesForTenant(tenant);
  if (!isSupabaseConfigured || !tenant?.municipio) {
    return localList;
  }

  const dept = tenant.departamento || 'Córdoba';
  const muni = tenant.municipio || 'Montería';
  const cacheKey = `${normalizeKey(dept)}_${normalizeKey(muni)}`;

  try {
    const { data, error } = await supabase
      .from('divipole_puestos_2026')
      .select('*')
      .ilike('departamento', `%${dept.trim()}%`)
      .ilike('municipio', `%${muni.trim()}%`)
      .order('zone', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: PollingPlace[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        totalMesas: d.total_mesas || 1,
        zone: d.zone,
        departamento: d.departamento,
        municipio: d.municipio,
        address: d.address,
        censo: d.censo,
        lat: d.lat,
        lng: d.lng,
        citrep: d.citrep,
      }));
      memoryCache.set(cacheKey, mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Error consultando divipole_puestos_2026 en Supabase:', err);
  }

  return localList;
}
