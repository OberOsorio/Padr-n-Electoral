/**
 * Validador estricto de identificadores UUID v4 / PostgreSQL
 * Evita errores 400 Bad Request ("invalid input syntax for type uuid")
 * al consultar columnas de tipo UUID con valores como 'sandbox', 'local' o cadenas vacías.
 */
export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}
