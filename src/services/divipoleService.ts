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
 * Detecta a qué municipio pertenece un puesto de votación dentro del dataset DIVIPOLA de Córdoba.
 */
export function detectarMunicipioDePuesto(nombrePuesto?: string | null): string | null {
  if (!nombrePuesto) return null;
  const target = normalizarTexto(nombrePuesto);
  if (!target) return null;

  const found = (cordobaData as any[]).find(
    (item) => normalizarTexto(item.name) === target || target.includes(normalizarTexto(item.name))
  );

  if (found && found.municipio) {
    return CORDOBA_MUNICIPIOS_ALIAS[found.municipio] || found.municipio;
  }

  return null;
}

/**
 * Retorna la lista de municipios oficiales disponibles para un departamento dado (Divipole 2026).
 */
export function getMunicipiosPorDepartamento(departamento: string = 'Córdoba'): string[] {
  const normDept = normalizarTexto(departamento);
  if (normDept.includes('CORDOBA')) {
    return [
      'Cotorra',
      'Montería',
      'Cereté',
      'Sahagún',
      'Lorica',
      'Tierralta',
      'Montelíbano',
      'Planeta Rica',
      'San Pelayo',
      'Ciénaga de Oro',
      'Chinú',
      'Pueblo Nuevo',
      'Puerto Libertador',
      'San Carlos',
      'San Antero',
      'Tuchín',
      'Valencia',
      'Ayapel',
      'Buenavista',
      'Canalete',
      'Chimá',
      'La Apartada',
      'Los Córdobas',
      'Momil',
      'Moñitos',
      'Purísima',
      'San Bernardo del Viento',
    ].sort((a, b) => a.localeCompare(b));
  }
  return ['Cotorra', 'Montería'];
}

/**
 * Retorna los puestos oficiales de votación correspondientes a un municipio y departamento específicos.
 */
export function getPollingPlacesPorMunicipio(
  municipio: string,
  departamento: string = 'Córdoba'
): PollingPlace[] {
  const normDept = normalizarTexto(departamento);
  const normMuni = normalizarTexto(municipio);
  const cacheKey = `${normDept}_${normMuni}`;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  if (normDept.includes('CORDOBA')) {
    const filtered = obtenerPuestosPorMunicipio(municipio, cordobaData as any[]);
    if (filtered.length > 0) {
      const mapped: PollingPlace[] = filtered.map((p) => ({
        id: p.id,
        name: p.name,
        totalMesas: p.totalMesas || p.total_mesas || 1,
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

  // Fallback si es Montería específicamente
  if (normMuni === 'MONTERIA' || normMuni === 'MONTERÍA') {
    return MONTERIA_DIVIPOLE_2026;
  }

  return [];
}

/**
 * Extrae el municipio objetivo de una campaña (usando tenant.municipio o infiriéndolo del nombre de la campaña si aplica).
 */
export function resolverMunicipioCampana(tenant?: Tenant | null): string {
  if (tenant?.municipio && tenant.municipio.trim()) {
    return tenant.municipio.trim();
  }
  if (tenant?.name) {
    const upperName = normalizarTexto(tenant.name);
    for (const [rawKey, fullMuni] of Object.entries(CORDOBA_MUNICIPIOS_ALIAS)) {
      if (upperName.includes(normalizarTexto(fullMuni)) || (rawKey.length >= 4 && upperName.includes(rawKey))) {
        return fullMuni;
      }
    }
  }
  return 'Cotorra';
}

/**
 * Retorna los puestos oficiales de votación correspondientes a la circunscripción/municipio de la campaña.
 */
export function getPollingPlacesForTenant(tenant?: Tenant | null): PollingPlace[] {
  const dept = tenant?.departamento ? normalizarTexto(tenant.departamento) : 'CORDOBA';
  const muni = resolverMunicipioCampana(tenant);
  const places = getPollingPlacesPorMunicipio(muni, dept);
  if (places.length > 0) {
    return places;
  }

  // Por defecto, retornar Cotorra (o Montería como último recurso)
  const cotorraPlaces = getPollingPlacesPorMunicipio('Cotorra', 'Córdoba');
  return cotorraPlaces.length > 0 ? cotorraPlaces : MONTERIA_DIVIPOLE_2026;
}

/**
 * Consulta asíncrona de puestos en Supabase para cualquier circunscripción o municipio de Colombia (Divipole 2026).
 */
export async function fetchPollingPlacesForTenantAsync(
  tenant?: Tenant | null,
  municipioOverride?: string
): Promise<PollingPlace[]> {
  const dept = tenant?.departamento || 'Córdoba';
  const muni = municipioOverride || tenant?.municipio || resolverMunicipioCampana(tenant) || 'Cotorra';

  // 1. Intentar resolver sincrónicamente desde dataset precargado
  const localList = getPollingPlacesPorMunicipio(muni, dept);
  if (localList.length > 0) {
    return localList;
  }

  if (!isSupabaseConfigured) {
    return localList;
  }

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
        totalMesas: d.total_mesas || d.totalMesas || 1,
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
