-- ================================================================
-- 알림 권한 제안 상태 컬럼 추가
-- 적용 시점: feat/notification-ver-pc 머지 전후
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- 멱등성: 이미 적용된 환경에서 다시 실행해도 안전 (IF NOT EXISTS / DROP IF EXISTS)
-- ================================================================

-- 1) 컬럼 추가 (기본값 'pending', NOT NULL)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_proposal_state TEXT
  NOT NULL DEFAULT 'pending';

-- 2) 제약 조건 (멱등성 확보 위해 기존 제약 먼저 제거)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_notification_proposal_state_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_notification_proposal_state_check
  CHECK (notification_proposal_state IN
    ('pending', 'granted', 'denied', 'dismissed', 'ios_install_started'));

-- 검증
-- SELECT id, notification_proposal_state FROM profiles LIMIT 5;
