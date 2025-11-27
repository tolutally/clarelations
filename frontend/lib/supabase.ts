import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-url') && 
  !supabaseAnonKey.includes('your-anon-key');

if (!hasValidCredentials) {
  console.warn(
    '⚠️  Supabase credentials not configured. Using mock data mode.\n' +
    'To use real database, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
} else {
  console.log('✅ Supabase connected:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const useMockData = !hasValidCredentials;

console.log('🔍 Mock Data Mode:', useMockData);
