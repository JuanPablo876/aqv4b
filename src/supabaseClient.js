import { createClient } from '@supabase/supabase-js';

// Environment validation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing REACT_APP_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration incomplete - check environment variables');
  console.error('Current environment:', process.env.NODE_ENV);
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
}

export const supabase = createClient(
  supabaseUrl || 'missing-url',
  supabaseAnonKey || 'missing-key'
);
