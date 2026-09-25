/**
 * Normaliza y separa una cadena de nombre completo en Nombres y Apellidos respetando
 * partículas compuestas ("del Carmen", "de la Rosa", "de los Reyes", "San Juan", etc.).
 */

const NOMBRES_COMPUESTOS_COMUNES = [
  'del carmen',
  'de la cruz',
  'de jesus',
  'de dios',
  'de los angeles',
  'de las nieves',
  'del rosario',
  'del pilar',
  'maria del carmen',
  'ana del carmen',
  'luz del carmen',
  'juan de dios',
  'maria jose',
  'juan carlos',
  'juan pablo',
  'juan manuel',
];

export interface ParsedFullName {
  nombres: string;
  apellidos: string;
}

/**
 * Capitaliza palabras respetando partículas menores ('del', 'de', 'la', 'los', 'las', 'el', 'y').
 */
export function formatearMayusculas(str: string): string {
  if (!str) return '';
  const palabrasMenores = ['del', 'de', 'la', 'los', 'las', 'el', 'y'];
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      if (idx !== 0 && palabrasMenores.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

/**
 * Extrae un apellido de la cola de tokens respetando preposiciones y artículos compuestos:
 * "de la", "de los", "de las", "del", "de", "san", "santa".
 */
function extraerApellidoDeCola(tokens: string[]): string {
  if (tokens.length === 0) return '';
  let part = tokens.pop()!;

  const len = tokens.length;
  if (len >= 2) {
    const p1 = tokens[len - 2].toLowerCase();
    const p2 = tokens[len - 1].toLowerCase();
    if (p1 === 'de' && (p2 === 'la' || p2 === 'los' || p2 === 'las')) {
      const art = tokens.pop()!;
      const prep = tokens.pop()!;
      return `${prep} ${art} ${part}`;
    }
  }

  if (tokens.length >= 1) {
    const p = tokens[tokens.length - 1].toLowerCase();
    if (['de', 'del', 'san', 'santa'].includes(p)) {
      const prep = tokens.pop()!;
      return `${prep} ${part}`;
    }
  }

  return part;
}

/**
 * Parsea un nombre completo dividiendo con precisión en nombres y apellidos.
 */
export function parseNombreCompleto(rawFullName: string): ParsedFullName {
  if (!rawFullName || typeof rawFullName !== 'string') {
    return { nombres: '', apellidos: '' };
  }

  // Limpiar espacios múltiples
  const textoLimpio = rawFullName.trim().replace(/\s+/g, ' ');
  if (!textoLimpio) {
    return { nombres: '', apellidos: '' };
  }

  // 1. Detectar si contiene un nombre compuesto conocido al inicio
  for (const compuesto of NOMBRES_COMPUESTOS_COMUNES) {
    // Caso A: un primer nombre seguido de la partícula (ej: 'Erica del Carmen Orozco Urango')
    const regexPrefijo = new RegExp(`^([a-záéíóúñA-ZÁÉÍÓÚÑ]+)\\s+(${compuesto})(?:\\s+|$)`, 'i');
    const matchPrefijo = textoLimpio.match(regexPrefijo);

    if (matchPrefijo) {
      const nombresExtraidos = `${matchPrefijo[1]} ${matchPrefijo[2]}`;
      const apellidosRestantes = textoLimpio.substring(nombresExtraidos.length).trim();
      return {
        nombres: formatearMayusculas(nombresExtraidos),
        apellidos: formatearMayusculas(apellidosRestantes),
      };
    }

    // Caso B: empieza directamente con el compuesto (ej: 'Maria del Carmen Orozco', 'Juan Carlos Perez')
    const regexDirecto = new RegExp(`^(${compuesto})(?:\\s+|$)`, 'i');
    const matchDirecto = textoLimpio.match(regexDirecto);
    if (matchDirecto && textoLimpio.length > matchDirecto[1].length) {
      const nombresExtraidos = matchDirecto[1];
      const apellidosRestantes = textoLimpio.substring(nombresExtraidos.length).trim();
      return {
        nombres: formatearMayusculas(nombresExtraidos),
        apellidos: formatearMayusculas(apellidosRestantes),
      };
    }
  }

  // 2. Procesamiento de tokens estándar de derecha a izquierda
  const palabras = textoLimpio.split(/\s+/).filter(Boolean);

  if (palabras.length <= 1) {
    return {
      nombres: formatearMayusculas(palabras[0] || ''),
      apellidos: '',
    };
  }

  if (palabras.length === 2) {
    return {
      nombres: formatearMayusculas(palabras[0]),
      apellidos: formatearMayusculas(palabras[1]),
    };
  }

  const tokens = [...palabras];
  const segundoApellido = extraerApellidoDeCola(tokens);
  const primerApellido = extraerApellidoDeCola(tokens);
  const nombresRestantes = tokens.join(' ');

  if (!nombresRestantes) {
    return {
      nombres: formatearMayusculas(primerApellido),
      apellidos: formatearMayusculas(segundoApellido),
    };
  }

  return {
    nombres: formatearMayusculas(nombresRestantes),
    apellidos: formatearMayusculas(`${primerApellido} ${segundoApellido}`),
  };
}
