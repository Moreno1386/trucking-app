import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvlwxtlmqiqabpytgayb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bHd4dGxtcWlxYWJweXRnYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDYwOTMsImV4cCI6MjA5MTUyMjA5M30.6qs_VrmByUxdadn72RPMfPgPiPkHDuZPjJLO-6-NAnQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
