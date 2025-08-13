import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl !== 'your_supabase_project_url' && 
                    supabaseAnonKey !== 'your_supabase_anon_key' &&
                    supabaseUrl.includes('supabase.co')

if (!isConfigured) {
  console.warn('⚠️ Supabase configuration missing or using placeholder values. Please update your .env.local file with actual Supabase credentials.')
}

// Create Supabase client with proper error handling
export const supabase = isConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient('https://placeholder.supabase.co', 'placeholder_key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })

// Export configuration status for use in components
export const isSupabaseConfigured = () => isConfigured

export type Website = {
  id: number
  url: string
  created_at: string
}

export type ScreenshotResult = {
  id: number
  url: string
  screenshot_path?: string
  status: 'up' | 'down' | 'error'
  ssl_valid: boolean
  response_time?: number
  error_message?: string
  last_checked: string
}
