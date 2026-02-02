import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qubqrhmuxegnuzkzjqiq.supabase.co'
const supabaseAnonKey = 'sb_publishable_Q66Xf65opB-CTd0cAc_38Q_IC0sOj2f'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
