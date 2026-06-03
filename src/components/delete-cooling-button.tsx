'use client'

import { useState, useTransition } from 'react'
import { deleteCoolingItem } from '@/app/cooling/actions'

export default function DeleteCoolingButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('이 항목을 삭제할까요? 기록에 남지 않습니다.')) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteCoolingItem(itemId)
        if (result && !result.success) {
          setError(result.error)
        }
      } catch (err) {
        // 네트워크 실패 등 — redirect()는 여기 도달하지 않음
        console.error('[delete-cooling]', err)
        setError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {/* 시안 정합: 보더 박스 삭제 버튼 (기록 상세와 동일 톤) */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13.5px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          background: 'var(--surface)',
          border: '2px solid var(--ink)',
          padding: '9px 14px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.4 : 1,
          appearance: 'none',
        }}
      >
        {isPending ? '삭제 중…' : '삭제'}
      </button>
      {error && (
        <div
          role="alert"
          className="text-xs"
          style={{ color: 'var(--danger)' }}
        >
          {error}
          <button
            type="button"
            onClick={handleDelete}
            className="ml-2 cursor-pointer underline underline-offset-2"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}
