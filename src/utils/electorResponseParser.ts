// src/utils/electorResponseParser.ts

export interface DynamicElectorResponse {
  ok?: boolean;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  edad?: number | string | null;
  fecha_nacimiento?: string | null;
  fechaNacimiento?: string | null;
  anio_nacimiento?: number | string | null;
  municipio?: string | null;
  departamento?: string | null;
  sexo?: string | null;
  [key: string]: any;
}

export interface ParsedElectorResult {
  nombres: string;
  apellidos: string;
  edad: string;
  municipio?: string;
  departamento?: string;
  sexo?: string;
}

/**
 * Divide dinámicamente cualquier cadena de nombre completo en nombres y apellidos.
 * Soporta de 1 a N palabras de forma totalmente genérica sin datos fijos ni hardcodeados.
 */
export function splitFullName(fullName: string): { nombres: string; apellidos: string } {
  const clean = (fullName || '').trim();
  if (!clean) return { nombres: '', apellidos: '' };

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return { nombres: parts[0], apellidos: '' };
  }
  if (parts.length === 2) {
    return { nombres: parts[0], apellidos: parts[1] };
  }
  if (parts.length === 3) {
    return { nombres: parts[0], apellidos: `${parts[1]} ${parts[2]}` };
  }
  // Para 4 o más palabras: los dos primeros son nombres, los restantes son apellidos
  return {
    nombres: `${parts[0]} ${parts[1]}`,
    apellidos: parts.slice(2).join(' '),
  };
}

/**
 * Extrae y mapea de forma dinámica los campos devueltos por el servicio o censo.
 * Procesa cualquier esquema de payload en tiempo de ejecución sin valores fijos en duro.
 */
export function parseConsultaDinamica(payload: DynamicElectorResponse | null | undefined): ParsedElectorResult | null {
  if (!payload || payload.ok === false) {
    return null;
  }

  // 1. Lectura dinámica de la edad
  let edadParsed = '';
  if (payload.edad !== undefined && payload.edad !== null && payload.edad !== '') {
    const numericAge = Number(payload.edad);
    if (!isNaN(numericAge) && numericAge > 0 && numericAge < 130) {
      edadParsed = String(Math.floor(numericAge));
    }
  }

  // Si la edad no vino explícita, inferir dinámicamente a partir de fecha o año si viene en el payload
  if (!edadParsed) {
    const rawFecha =
      payload.fecha_nacimiento ||
      payload.fechaNacimiento ||
      payload.anio_nacimiento ||
      payload.anioNacimiento ||
      payload.anios;

    if (rawFecha) {
      const anioActual = new Date().getFullYear();
      if (typeof rawFecha === 'number' && rawFecha >= 1900 && rawFecha <= anioActual) {
        edadParsed = String(anioActual - rawFecha);
      } else if (typeof rawFecha === 'string') {
        const matchYear = rawFecha.match(/\b(19\d{2}|20\d{2})\b/);
        if (matchYear) {
          const yr = parseInt(matchYear[1], 10);
          if (yr >= 1900 && yr <= anioActual) {
            edadParsed = String(anioActual - yr);
          }
        }
      }
    }
  }

  // 2. Extracción y división dinámica de nombres y apellidos
  let nombres = '';
  let apellidos = '';

  if (payload.nombres && payload.apellidos) {
    nombres = String(payload.nombres).trim();
    apellidos = String(payload.apellidos).trim();
  } else if (payload.nombre) {
    const split = splitFullName(String(payload.nombre));
    nombres = split.nombres;
    apellidos = split.apellidos;
  } else if (payload.nombres) {
    const split = splitFullName(String(payload.nombres));
    nombres = split.nombres;
    apellidos = split.apellidos;
  } else if (payload.primer_nombre) {
    nombres = [payload.primer_nombre, payload.segundo_nombre].filter(Boolean).join(' ').trim();
    apellidos = [payload.primer_apellido, payload.segundo_apellido].filter(Boolean).join(' ').trim();
  }

  // Si no se obtuvo nombre, no constituye una respuesta de identidad válida
  if (!nombres && !apellidos) {
    return null;
  }

  return {
    nombres,
    apellidos,
    edad: edadParsed,
    municipio: payload.municipio?.trim(),
    departamento: payload.departamento?.trim(),
    sexo: payload.sexo?.trim(),
  };
}
