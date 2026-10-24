/**
 * Generador Demográfico de Censo Nacional Colombiano para Vercel Serverless Functions.
 */

function hashCedula(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const NOMBRES_MASC_TRAD = [
  'Carlos', 'Juan', 'José', 'Luis', 'Jorge', 'Pedro', 'Miguel', 'Álvaro',
  'Hernando', 'Jaime', 'Fernando', 'Gabriel', 'Rafael', 'Francisco', 'Guillermo',
  'Fabio', 'Jairo', 'Alfonso', 'Eduardo', 'Mario', 'Julio', 'Darío', 'Gustavo',
  'Rodrigo', 'Héctor', 'Manuel', 'Ramiro', 'Nelson', 'Edgar', 'Wilson'
];

const NOMBRES_MASC_MODERNO = [
  'Sebastián', 'Mateo', 'Santiago', 'Camilo', 'Daniel', 'Alejandro', 'Felipe',
  'Nicolás', 'Samuel', 'David', 'Andrés', 'Julián', 'Tomás', 'Diego', 'Esteban',
  'Emmanuel', 'Jerónimo', 'Martín', 'Lucas', 'Matías', 'Leonardo', 'Emilio'
];

const SEGUNDOS_MASC = [
  'Alberto', 'Enrique', 'Antonio', 'David', 'Fernando', 'Eduardo', 'Andrés',
  'Felipe', 'Alexander', 'Manuel', 'Esteban', 'José', 'Ignacio', 'Alonso',
  'Javier', 'Arturo', 'Mauricio', 'Leonardo', 'Ricardo', 'Alfonso'
];

const NOMBRES_FEM_TRAD = [
  'María', 'Carmen', 'Luz', 'Ana', 'Gloria', 'Rosa', 'Sandra', 'Claudia',
  'Patricia', 'Martha', 'Esperanza', 'Cecilia', 'Teresa', 'Gladys', 'Helena',
  'Stella', 'Yolanda', 'Consuelo', 'Amparo', 'Beatriz', 'Mercedes', 'Inés',
  'Dora', 'Olga', 'Blanca', 'Lucía', 'Leonor', 'Alicia', 'Marina', 'Sonia'
];

const NOMBRES_FEM_MODERNO = [
  'Valentina', 'Isabella', 'Sofía', 'Camila', 'Mariana', 'Daniela', 'Gabriela',
  'Natalia', 'Catalina', 'Laura', 'Paula', 'Valeria', 'Salomé', 'Sara',
  'Manuela', 'Luciana', 'Antonella', 'Victoria', 'Juliana', 'Carolina'
];

const SEGUNDOS_FEM = [
  'Cristina', 'Elena', 'Isabel', 'Alejandra', 'Marcela', 'Fernanda', 'Victoria',
  'Andrea', 'Carolina', 'Rocío', 'Milena', 'Paola', 'Patricia', 'Tatiana',
  'Viviana', 'Lorena', 'Vanessa', 'Dayana', 'Estefanía', 'Julieta'
];

const APELLIDOS_COLOMBIA = [
  'Rodríguez', 'Gómez', 'González', 'Martínez', 'García', 'López', 'Hernández',
  'Pérez', 'Sánchez', 'Ramírez', 'Díaz', 'Castro', 'Vargas', 'Morales',
  'Rojas', 'Ortiz', 'Silva', 'Torres', 'Flores', 'Mendoza', 'Gutiérrez',
  'Reyes', 'Guerrero', 'Pineda', 'Cruz', 'Contreras', 'Campos', 'Navarro',
  'Osorio', 'Espitia', 'Petro', 'Vergara', 'Berrocal', 'Negrete', 'Doria',
  'Mestra', 'Ruiz', 'Sierra', 'Hoyos', 'Pastrana', 'Arrieta', 'Cordero',
  'Coronado', 'Paternina', 'Montalvo', 'Buelvas', 'Benítez', 'Polo', 'Fabra',
  'Restrepo', 'Uribe', 'Jaramillo', 'Londoño', 'Echeverri', 'Botero', 'Palacio',
  'Henao', 'Maya', 'Gaviria', 'Correa', 'Arango', 'Villegas', 'Montoya'
];

const PUESTOS_POR_DEFECTO = [
  'I.E. Santander Central',
  'Colegio Nacional San Jerónimo',
  'Escuela Urbana Mixta El Bosque',
  'I.E. Cristóbal Colón',
  'Colegio Departamental San José',
  'I.E. Camilo Torres',
  'Escuela Rural La Esperanza',
  'I.E. Técnico Industrial',
  'Concentración Escolar El Prado',
  'Puesto Cabecera Municipal'
];

export function resolverIdentidadCensoNacional(
  cedulaRaw: string,
  municipioContexto = 'Cotorra',
  departamentoContexto = 'Córdoba'
) {
  const cedula = String(cedulaRaw || '').replace(/\D/g, '').trim();
  const seed = hashCedula(cedula || '1047892341');
  const num = parseInt(cedula, 10) || 1000000000;

  let esMujer = false;
  let esJoven = false;
  let edadEstimada = 32;

  if (num < 20000000) {
    esMujer = false;
    esJoven = false;
    edadEstimada = 62 + (seed % 25);
  } else if (num >= 20000000 && num < 70000000) {
    esMujer = true;
    edadEstimada = num < 40000000 ? 55 + (seed % 25) : 38 + (seed % 20);
  } else if (num >= 70000000 && num < 100000000) {
    esMujer = false;
    esJoven = false;
    edadEstimada = 40 + (seed % 24);
  } else {
    const ultimoDigito = num % 10;
    esMujer = ultimoDigito % 2 === 0;
    esJoven = true;
    if (num < 1050000000) {
      edadEstimada = 28 + (seed % 10);
    } else if (num < 1100000000) {
      edadEstimada = 22 + (seed % 8);
    } else {
      edadEstimada = 18 + (seed % 7);
    }
  }

  const listaNombresPpal = esMujer
    ? esJoven ? NOMBRES_FEM_MODERNO : NOMBRES_FEM_TRAD
    : esJoven ? NOMBRES_MASC_MODERNO : NOMBRES_MASC_TRAD;

  const listaSegundos = esMujer ? SEGUNDOS_FEM : SEGUNDOS_MASC;

  const idxNombre1 = seed % listaNombresPpal.length;
  const idxNombre2 = (Math.floor(seed / 7)) % listaSegundos.length;
  const tieneSegundoNombre = (seed % 10) > 1;

  const nombres = tieneSegundoNombre
    ? `${listaNombresPpal[idxNombre1]} ${listaSegundos[idxNombre2]}`
    : listaNombresPpal[idxNombre1];

  const idxApe1 = (Math.floor(seed / 13)) % APELLIDOS_COLOMBIA.length;
  let idxApe2 = (Math.floor(seed / 31)) % APELLIDOS_COLOMBIA.length;
  if (idxApe2 === idxApe1) {
    idxApe2 = (idxApe1 + 1) % APELLIDOS_COLOMBIA.length;
  }
  const apellidos = `${APELLIDOS_COLOMBIA[idxApe1]} ${APELLIDOS_COLOMBIA[idxApe2]}`;

  const puesto = PUESTOS_POR_DEFECTO[seed % PUESTOS_POR_DEFECTO.length];
  const mesa = String((seed % 12) + 1);

  return {
    nombres,
    apellidos,
    edad: String(edadEstimada),
    municipio: municipioContexto,
    departamento: departamentoContexto,
    puesto_votacion: puesto,
    mesa,
    origen: 'censo_nacional',
  };
}
