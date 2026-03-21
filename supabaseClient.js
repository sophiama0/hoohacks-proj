import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sebuzpqurjjtvbqqfvel.supabase.co'
const supabaseAnonKey = 'sb_publishable_oLgvQAN7DGQMRH49LvuMEA_yPGrPDSi'

window.supabase = createClient(supabaseUrl, supabaseAnonKey)