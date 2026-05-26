'use client'

import { useTransition } from 'react'
import { deleteHistoryItem } from '@/app/history/actions'

export default function DeleteHistoryButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('이 기록을 삭제할까요? 대화 내용도 함께 사라집니다.')) return
    startTransition(() => deleteHistoryItem(itemId))
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
