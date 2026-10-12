/**
 * Utilidad universal y robusta para cálculo y extracción de edad exacta.
 * Soporta edades directas (ej. 28 o "28"), años de nacimiento (ej. 1998 o "1998"),
 * fechas en formato latino (DD/MM/YYYY, DD-MM-YYYY), formato ISO (YYYY-MM-DD)
 * e instancias de Date.
 */

function calcularDiferenciaAnios(fechaNacimiento: Date): number | null {
  const hoy = new Date();
  if (fechaNacimiento > hoy || fechaNacimiento.getFullYear() < 1900) {
    return null;
  }

  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNac = fechaNacimiento.getMonth();

  if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }

  return edad >= 0 && edad <= 125 ? edad : null;
}

export function calcularEdadUniversal(
  input: string | number | Date | null | undefined
): number | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  const anioActual = new Date().getFullYear();

  // Caso 1: Número directo
  if (typeof input === 'number') {
    // Si ya es una edad humana válida (ej. 18 a 125)
    if (input > 0 && input < 125) {
      return Math.floor(input);
    }
    // Si es un año de nacimiento (ej. 1995)
    if (input >= 1900 && input <= anioActual) {
      return anioActual - Math.floor(input);
    }
    return null;
  }

  // Caso 2: Cadena de texto
  if (typeof input === 'string') {
    const str = input.trim();
    if (!str) return null;

    // A. Si es un número de edad en texto (ej. "28")
    const numDirecto = Number(str);
    if (!isNaN(numDirecto) && /^\d{1,3}$/.test(str)) {
      if (numDirecto > 0 && numDirecto < 125) {
        return Math.floor(numDirecto);
      }
    }

    // B. Si son 4 dígitos exactos correspondientes a un año (ej. "1998")
    if (/^\d{4}$/.test(str)) {
      const anio = parseInt(str, 10);
      if (anio >= 1900 && anio <= anioActual) {
        return anioActual - anio;
      }
      return null;
    }

    // C. Formato latino DD/MM/YYYY o DD-MM-YYYY
    const matchLatino = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (matchLatino) {
      const dia = parseInt(matchLatino[1], 10);
      const mes = parseInt(matchLatino[2], 10) - 1; // Mes base 0
      const anio = parseInt(matchLatino[3], 10);
      const fechaNac = new Date(anio, mes, dia);
      return calcularDiferenciaAnios(fechaNac);
    }

    // D. Formato ISO YYYY-MM-DD o YYYY/MM/DD
    const matchIso = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (matchIso) {
      const anio = parseInt(matchIso[1], 10);
      const mes = parseInt(matchIso[2], 10) - 1;
      const dia = parseInt(matchIso[3], 10);
      const fechaNac = new Date(anio, mes, dia);
      return calcularDiferenciaAnios(fechaNac);
    }

    // E. Intento con parser de fecha nativo
    const fechaParsed = new Date(str);
    if (!isNaN(fechaParsed.getTime()) && fechaParsed.getFullYear() >= 1900) {
      return calcularDiferenciaAnios(fechaParsed);
    }
  }

  // Caso 3: Ya es una instancia Date
  if (input instanceof Date && !isNaN(input.getTime())) {
    return calcularDiferenciaAnios(input);
  }

  return null;
}
