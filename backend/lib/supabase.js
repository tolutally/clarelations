import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure .env.local contains:');
  console.error('  VITE_SUPABASE_URL=your-url');
  console.error('  VITE_SUPABASE_ANON_KEY=your-key');
  throw new Error('Missing Supabase environment variables');
}

console.log('✅ Supabase client initialized for backend');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for backend operations (bypasses RLS)
export const supabaseServiceRole = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : (() => {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key (may cause RLS issues)');
      return createClient(supabaseUrl, supabaseAnonKey);
    })();