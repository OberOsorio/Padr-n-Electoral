import { MONTERIA_DIVIPOLE_2026, type PollingPlace } from '../../data/monteriaDivipole2026';
export {
  getPollingPlacesForTenant,
  fetchPollingPlacesForTenantAsync,
  obtenerPuestosPorMunicipio,
  normalizarTexto,
} from '../../services/divipoleService';
export { formatearPuestoSimple, ElectorLocationSelector } from './components/ElectorLocationSelector';
export type { PuestoFormateado } from './components/ElectorLocationSelector';
export { getElectoresPaginados } from './useElectorsList';

export type { PollingPlace };
export { MONTERIA_DIVIPOLE_2026 };

// Puestos oficiales de votación DIVIPOLE 2026 (Registraduría Nacional del Estado Civil)
// Configurados por defecto con la circunscripción de la campaña activa (Montería, Córdoba - 95 Puestos)
export const PREDEFINED_POLLING_PLACES: PollingPlace[] = MONTERIA_DIVIPOLE_2026;
