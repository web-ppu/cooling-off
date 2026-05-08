-- ================================================================
-- 쿨링오프 DB 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체 실행
-- auth.users 는 Supabase Auth 가 관리하는 기본 테이블
-- ================================================================

-- ── items ────────────────────────────────────────────────────────
-- 사용자가 등록한 물건. 냉각 → 결정 대기 → 결정 완료 상태를 거친다.
-- 삭제는 soft delete (deleted_at) 로 처리한다.

CREATE TABLE items (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  price            INTEGER     NOT NULL CHECK (price >= 1),
  url              TEXT,
  reason           TEXT,
  status           TEXT        NOT NULL DEFAULT 'cooling'
                               CONSTRAINT items_status_check
                               CHECK (status IN ('cooling', 'ready', 'decided')),
  decision         TEXT        CONSTRAINT items_decision_check
                               CHECK (decision IN ('bought', 'passed')),
  decided_at       TIMESTAMPTZ,
  cooling_ends_at  TIMESTAMPTZ NOT NULL,
  fact_summary     JSONB,       -- null: 요약 없음 / string[]: 요약 목록
  deleted_at       TIMESTAMPTZ, -- null: 활성 / non-null: soft delete
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── chat_messages ────────────────────────────────────────────────
-- AI 채팅 기록. item 1개당 최대 10턴 (사용자 + AI 각 1회 = 1턴).
-- 결정 후 대화 다시 보기에 사용된다.

CREATE TABLE chat_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID        NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CONSTRAINT chat_messages_role_check
                           CHECK (role IN ('user', 'assistant')),
  content      TEXT        NOT NULL,
  turn_number  INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 인덱스 ──────────────────────────────────────────────────────

-- 홈 화면: 사용자의 활성 항목 상태별 조회
CREATE INDEX idx_items_user_active
  ON items (user_id, status)
  WHERE deleted_at IS NULL;

-- 기록 화면: 결정 완료 항목 최신순 조회
CREATE INDEX idx_items_user_decided
  ON items (user_id, decided_at DESC)
  WHERE deleted_at IS NULL AND status = 'decided';

-- Cron: 냉각 만료 항목 일괄 조회 (service_role 로 실행)
CREATE INDEX idx_items_cooling_expiry
  ON items (cooling_ends_at)
  WHERE deleted_at IS NULL AND status = 'cooling';

-- 대화 다시 보기: 메시지 순서 조회
CREATE INDEX idx_chat_messages_item
  ON chat_messages (item_id, turn_number);

-- ── RLS ─────────────────────────────────────────────────────────

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- items: 본인 데이터만 접근
CREATE POLICY "items_select_own" ON items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "items_insert_own" ON items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_update_own" ON items
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_delete_own" ON items
  FOR DELETE USING (auth.uid() = user_id);

-- chat_messages: 본인 데이터만 접근 (append-only, UPDATE 없음)
CREATE POLICY "chat_messages_select_own" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_insert_own" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
