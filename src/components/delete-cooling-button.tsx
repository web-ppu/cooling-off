'use client'

import { useTransition } from 'react'
import { deleteCoolingItem } from '@/app/cooling/actions'

export default function DeleteCoolingButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('이 항목을 삭제할까요? 기록에 남지 않습니다.')) return
    startTransition(() => deleteCoolingItem(itemId))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-zinc-400 hover:text-zinc-700 disabled:opacity-40"
    >
      {isPending ? '삭제 중…' : '삭제'}
    </button>
  )
}
