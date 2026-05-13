import { supabase } from '../lib/supabase'

export async function logActivity(user, action, detail = '') {
  if (!user?.email) return
  await supabase.from('activity_log').insert({
    user_email: user.email,
    user_name: user.nombre || user.email.split('@')[0],
    action,
    detail,
  })
}
