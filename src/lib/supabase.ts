import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Credenciales públicas de cliente para conexión a Supabase
const FALLBACK_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDgwNTEsImV4cCI6MjEwNTkyNDA1MX0.gUwS5uerHQq9OEq82wYwQdx81lYnh8-Ez9lK0GSwe1o';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  envUrl && !envUrl.includes('placeholder') && envUrl.trim() !== ''
    ? envUrl.trim()
    : FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  envAnonKey && !envAnonKey.includes('placeholder') && envAnonKey.trim() !== ''
    ? envAnonKey.trim()
    : FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = true;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

