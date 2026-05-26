'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteHistoryItem(itemId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', user.id)
    .eq('status', 'decided')

  redirect('/history')
}
