'use client'

import { useState, useTransition } from 'react'
import { deleteHistoryItem } from '@/app/history/actions'

export default function DeleteHistoryButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('이 기록을 삭제할까요? 대화 내용도 함께 사라집니다.')) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await deleteHistoryItem(itemId)
        if (result && !result.success) {
          setError(result.error)
        }
      } catch (err) {
        // 네트워크 실패 등 — redirect()는 여기 도달하지 않음
        console.error('[delete-history]', err)
        setError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          background: 'var(--surface)',
          border: '2px solid var(--ink)',
          padding: '6px 14px',
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
          style={{
            fontSize: 12,
            color: 'var(--danger)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {error}
          <button
            type="button"
            onClick={handleDelete}
            style={{
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  )
}
