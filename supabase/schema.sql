-- ================================================================
-- 쿨링오프 DB 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체 실행
-- auth.users 는 Supabase Auth 가 관리하는 기본 테이블
-- ================================================================

-- ── items ────────────────────────────────────────────────────────
-- 사용자가 등록한 물건. 냉각 → 결정 대기 → 결정 완료 상태를 거친다.
-- 삭제는 soft delete (deleted_at) 로 처리한다.

CREATE TABLE items (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  price                INTEGER     NOT NULL CHECK (price >= 1),
  url                  TEXT,
  reason               TEXT,
  status               TEXT        NOT NULL DEFAULT 'cooling'
                                   CONSTRAINT items_status_check
                                   CHECK (status IN ('cooling', 'ready', 'decided')),
  decision             TEXT        CONSTRAINT items_decision_check
                                   CHECK (decision IN ('bought', 'passed')),
  decided_at           TIMESTAMPTZ,
  cooling_ends_at      TIMESTAMPTZ NOT NULL,
  fact_summary         JSONB,       -- null: 요약 없음 / string[]: 요약 목록
  -- 냉각 만료 푸시 알림 발송 시점. null = 아직 안 보냄, non-null = 발송 완료.
  -- notification-policy §5: "물건당 1회" — 발송 성공 시 채워지고 다시 안 건드림.
  cooling_notified_at  TIMESTAMPTZ,
  deleted_at           TIMESTAMPTZ, -- null: 활성 / non-null: soft delete
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Cron 발송: ready 상태에서 아직 알림이 안 간 항목을 사용자별로 빠르게 모음.
CREATE INDEX idx_items_ready_unnotified
  ON items (user_id)
  WHERE deleted_at IS NULL
    AND status = 'ready'
    AND cooling_notified_at IS NULL;

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

-- ── push_subscriptions ───────────────────────────────────────────
-- Web Push 구독 정보. 브라우저별로 1개씩 저장된다.
-- Cron이 냉각 만료 시 이 테이블을 조회해 푸시를 발송한다.

CREATE TABLE push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user
  ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ── profiles ─────────────────────────────────────────────────────
-- auth.users 의 공개 프로필. 회원가입 시 트리거로 자동 생성된다.

CREATE TABLE profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 회원가입 시 자동으로 profiles 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
