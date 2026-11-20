import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Only the publishable key may be used here: everything in this file ships to the browser.
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

if (supabaseKey.startsWith('sb_secret_')) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY contains a secret key. Use the publishable key (sb_publishable_...).')
}

/** Single shared Supabase client. Only the services layer should import this. */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/** Name of the storage bucket that holds book covers. */
export const COVERS_BUCKET = 'covers'
