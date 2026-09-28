import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'src', 'data', 'divipole2026.json');
const allPuestos = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Filter Monteria
const monteria = allPuestos.filter(
  (p) => p.departamento === 'Córdoba' && p.municipio === 'Montería'
);

const tsContent = `// Puestos Oficiales de Votación DIVIPOLE Congreso 2026 - Registraduría Nacional del Estado Civil
// Circunscripción: Córdoba / Municipio: Montería (Total: ${monteria.length} Puestos)

export interface PollingPlace {
  id: string;
  name: string;
  totalMesas: number;
  zone: string;
  departamento?: string;
  municipio?: string;
  address?: string;
  censo?: number;
  citrep?: string;
  lat?: number;
  lng?: number;
}

export const MONTERIA_DIVIPOLE_2026: PollingPlace[] = ${JSON.stringify(monteria, null, 2)};
`;

fs.writeFileSync(
  path.join(process.cwd(), 'src', 'data', 'monteriaDivipole2026.ts'),
  tsContent,
  'utf-8'
);

console.log('Successfully wrote src/data/monteriaDivipole2026.ts with', monteria.length, 'puestos');
