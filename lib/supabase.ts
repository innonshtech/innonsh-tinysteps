import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    console.warn("Please define SUPABASE_URL in env file");
  }
}

// Server client (service role — full access, bypasses RLS)
// Use this ONLY in secure server environments (API routes, Server Components, etc.)
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceRoleKey 
  ? createClient(
      supabaseUrl || '',
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
        }
      }
    )
  : (null as any);

// Client client (anon key — adheres to RLS)
// Use this in the browser or when acting on behalf of a user
export const supabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
    }
  }
);
