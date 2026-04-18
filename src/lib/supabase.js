import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvlwxtlmqiqabpytgayb.supabase.co'
const supabaseKey = 'sb_publishable_5da8MlrYoHoo2AcB9MHGTQ_m479S2d5'

export const supabase = createClient(supabaseUrl, supabaseKey)
