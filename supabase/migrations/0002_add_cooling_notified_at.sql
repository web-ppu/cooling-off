-- ================================================================
-- 냉각 만료 알림 발송 추적 컬럼 추가
-- 적용 시점: feat/notification-dispatch 머지 전후
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- 멱등성: 이미 적용된 환경에서 다시 실행해도 안전
-- ================================================================

-- 1) 컬럼 추가 (null = 미발송, non-null = 발송 완료 시각)
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS cooling_notified_at TIMESTAMPTZ;

-- 2) Cron 조회 인덱스 (ready 상태 + 미발송 + 활성)
CREATE INDEX IF NOT EXISTS idx_items_ready_unnotified
  ON items (user_id)
  WHERE deleted_at IS NULL
    AND status = 'ready'
    AND cooling_notified_at IS NULL;

-- 검증
-- SELECT id, status, cooling_notified_at FROM items WHERE status = 'ready' LIMIT 5;
