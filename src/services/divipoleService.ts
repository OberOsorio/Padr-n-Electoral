import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MONTERIA_DIVIPOLE_2026, type PollingPlace } from '../data/monteriaDivipole2026';
import cordobaData from '../data/cordobaDivipole2026.json';
import type { Tenant } from '../types';

export type { PollingPlace };

// Diccionario de equivalencias para municipios con nombres truncados en el archivo original
export const CORDOBA_MUNICIPIOS_ALIAS: Record<string, string> = {
  'CIENAGA': 'Ciénaga de Oro',
  'LA': 'La Apartada',
  'LOS': 'Los Córdobas',
  'MOMIL': 'Momil',
  'MONTELIBANO': 'Montelíbano',
  'MONTERIA': 'Montería',
  'MOÑITOS': 'Moñitos',
  'PLANETA': 'Planeta Rica',
  'PUEBLO': 'Pueblo Nuevo',
  'PUERTO': 'Puerto Libertador',
  'PURISIMA': 'Purísima',
  'SAN': 'San Pelayo',
  'TIERRALTA': 'Tierralta',
  'TUCHIN': 'Tuchín',
  'VALENCIA': 'Valencia',
  'COTORRA': 'Cotorra',
};

// Cache en memoria para puestos consultados por municipio
const memoryCache = new Map<string, PollingPlace[]>();

// Inicializar caché con Montería
memoryCache.set('CORDOBA_MONTERIA', MONTERIA_DIVIPOLE_2026);
memoryCache.set('CORDOBA_MONTERÍA', MONTERIA_DIVIPOLE_2026);

/**
 * Normaliza un texto removiendo diacríticos (tildes), espacios superfluos y convirtiendo a mayúsculas homogéneas.
 */
export function normalizarTexto(txt: string): string {
  return (txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Filtra los puestos de votación de un dataset DIVIPOLA para el municipio indicado,
 * soportando nombres truncados, alias preconfigurados y búsqueda tolerante por prefijo.
 */
export function obtenerPuestosPorMunicipio(municipioCampana: string, divipoleDataset: any[]): any[] {
  if (!municipioCampana || !Array.isArray(divipoleDataset)) return [];

  const objetivo = normalizarTexto(municipioCampana);

  return divipoleDataset.filter((item) => {
    const rawMuni = normalizarTexto(item.municipio);

    // 1. Coincidencia exacta normalizada
    if (rawMuni === objetivo) return true;

    // 2. Coincidencia a través del diccionario de alias
    const alias = CORDOBA_MUNICIPIOS_ALIAS[item.municipio];
    if (alias && normalizarTexto(alias) === objetivo) return true;

    // 3. Coincidencia de prefijo (ej. "PLANETA" frente a "PLANETA RICA")
    if (objetivo.startsWith(rawMuni) && rawMuni.length >= 4) return true;

    // 4. Coincidencia inversa de prefijo (ej. "CIENAGA DE ORO" frente a "CIENAGA")
    if (rawMuni.startsWith(objetivo) && objetivo.length >= 4) return true;

    // 5. Manejo inteligente para prefijos compuestos compartidos como "SAN" o "PUERTO"
    // Ej: Si objetivo es "SAN CARLOS" o "SAN ANTERO" y rawMuni es "SAN",
    // verificar si el nombre del puesto contiene la subcadena distintiva ("CARLOS", "ANTERO", etc.)
    if (rawMuni === 'SAN' && objetivo.startsWith('SAN ')) {
      const subMuni = objetivo.replace(/^SAN\s+/, '').trim();
      const itemName = normalizarTexto(item.name || '');
      if (subMuni && itemName.includes(subMuni)) return true;
    }

    if (rawMuni === 'PUERTO' && objetivo.startsWith('PUERTO ')) {
      const subMuni = objetivo.replace(/^PUERTO\s+/, '').trim();
      const itemName = normalizarTexto(item.name || '');
      if (subMuni && itemName.includes(subMuni)) return true;
    }

    return false;
  });
}

/**
 * Retorna los puestos oficiales de votación correspondientes a la circunscripción/municipio de la campaña.
 * Si la campaña es de Montería / Córdoba, retorna los 95 puestos oficiales del Divipole 2026.
 * Para otros municipios, filtra con normalización fonética y alias tolerantes.
 */
export function getPollingPlacesForTenant(tenant?: Tenant | null): PollingPlace[] {
  const dept = tenant?.departamento ? normalizarTexto(tenant.departamento) : 'CORDOBA';
  const muni = tenant?.municipio ? tenant.municipio.trim() : 'Montería';
  const cacheKey = `${dept}_${normalizarTexto(muni)}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Si es de Córdoba, filtrar desde el dataset precargado de Córdoba con emparejamiento tolerante
  if (dept.includes('CORDOBA')) {
    const filtered = obtenerPuestosPorMunicipio(muni, cordobaData as any[]);
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
  const cacheKey = `${normalizarTexto(dept)}_${normalizarTexto(muni)}`;

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
