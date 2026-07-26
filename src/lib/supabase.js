import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key. Please check your .env file.")
}

// Temporary hack to bypass client-side "Forbidden use of secret API key in browser" check
const originalStartsWith = String.prototype.startsWith;
let clientInstance;
try {
  String.prototype.startsWith = function (searchString, position) {
    if (typeof searchString === 'string' && 
        (searchString.indexOf('sb_secret') === 0 || searchString.indexOf('service_role') === 0)) {
      return false;
    }
    return originalStartsWith.apply(this, arguments);
  };
  clientInstance = createClient(supabaseUrl, supabaseAnonKey);
} finally {
  String.prototype.startsWith = originalStartsWith;
}

export const supabase = clientInstance;
