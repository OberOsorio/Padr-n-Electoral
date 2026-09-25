export interface PollingPlace {
  id: string;
  name: string;
  totalMesas: number;
  zone: string;
}

export const PREDEFINED_POLLING_PLACES: PollingPlace[] = [
  { id: 'p1', name: 'I.E. Santander Central', totalMesas: 12, zone: 'Comuna 1' },
  { id: 'p2', name: 'Colegio Mayor Departamental', totalMesas: 10, zone: 'Comuna 3' },
  { id: 'p3', name: 'Coliseo Municipal de Deportes', totalMesas: 14, zone: 'Comuna 2' },
  { id: 'p4', name: 'I.E. Técnico San Juan Bautista', totalMesas: 8, zone: 'Zona Rural' },
  { id: 'p5', name: 'Escuela Mixta El Prado', totalMesas: 6, zone: 'Comuna 4' },
  { id: 'p6', name: 'Universidad del Valle - Sede Norte', totalMesas: 16, zone: 'Comuna 5' },
  { id: 'p7', name: 'Institución Educativa Normal Superior', totalMesas: 10, zone: 'Comuna 1' },
];
