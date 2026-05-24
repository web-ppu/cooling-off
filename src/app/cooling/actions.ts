'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteCoolingItem(itemId: string) {
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
    .in('status', ['cooling', 'ready'])

  redirect('/')
}
