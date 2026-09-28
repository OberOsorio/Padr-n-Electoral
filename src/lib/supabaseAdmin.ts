import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { supabaseUrl } from './supabase';

const envServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cliente de administración con permisos de Service Role (para creación y verificación directa de usuarios)
export const supabaseAdmin = envServiceKey && envServiceKey.trim() !== ''
  ? createClient<Database>(supabaseUrl, envServiceKey.trim(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
