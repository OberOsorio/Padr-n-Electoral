import { supabase } from '../lib/supabase';

/**
 * Elimina de manera real y física un elector en la base de datos de Supabase.
 * Respeta las políticas de Row Level Security (RLS) del tenant activo.
 */
export async function eliminarElectorEnBaseDatos(electorId: string): Promise<boolean> {
  if (!electorId) return false;

  const { error } = await supabase
    .from('electores')
    .delete()
    .eq('id', electorId);

  if (error) {
    console.error('[Supabase Error] Fallo al eliminar elector:', error.message);
    throw error;
  }

  console.log(`[Supabase] Elector ${electorId} eliminado físicamente de la base de datos.`);
  return true;
}

/**
 * Elimina por lote un conjunto de electores en la base de datos de Supabase.
 */
export async function eliminarElectoresPorLoteEnBaseDatos(electorIds: string[]): Promise<boolean> {
  if (!electorIds || electorIds.length === 0) return false;

  const { error } = await supabase
    .from('electores')
    .delete()
    .in('id', electorIds);

  if (error) {
    console.error('[Supabase Error] Fallo al eliminar electores por lote:', error.message);
    throw error;
  }

  console.log(`[Supabase] ${electorIds.length} electores eliminados físicamente por lote.`);
  return true;
}
