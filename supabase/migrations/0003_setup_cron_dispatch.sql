-- ================================================================
-- pg_cron + pg_net 으로 냉각 만료 알림 cron 트리거 설정
-- 적용 시점: feat/notification-dispatch 머지 전후
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- 멱등성: 재실행 안전 (unschedule 후 재등록)
-- ================================================================
--
-- 배경: Vercel Hobby 플랜 cron 은 일 1회 + 1시간 윈도우 내 임의 실행이라
-- "냉각 만료 시점 ±N분" 보장이 불가능. Supabase pg_cron 으로 5분 폴링하여
-- 우리 API (/api/cron/dispatch-notifications) 를 호출한다.
--
-- 부수 효과: 5분마다 DB 활동이 발생 → Supabase 무료 티어 7일 자동 일시정지
-- 방어가 자동으로 해결됨.
--
-- 사전 준비 (Supabase 대시보드):
--   1) Database → Extensions 에서 pg_cron, pg_net enable
--   2) Project Settings → Vault 에 아래 두 시크릿 등록
--        - cron_app_url      예: https://cooling-off.vercel.app
--        - cron_secret       Vercel 의 CRON_SECRET 과 동일 값
-- ================================================================

-- 1) 확장 활성화 (대시보드에서 했더라도 멱등 보장 차원에서 한 번 더)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) 기존 스케줄 제거 (멱등)
--    cron.unschedule 는 없는 job 이면 에러를 던지므로 존재 확인 후 호출.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'dispatch-notifications'
  ) THEN
    PERFORM cron.unschedule('dispatch-notifications');
  END IF;
END $$;

-- 3) 5분마다 우리 endpoint 호출
--    - 인증: Vercel 라우트가 검사하는 Bearer 토큰을 Vault 에서 꺼내 주입
--    - 야간(KST 22~08) skip 은 라우트가 자체 판단 (코드 정책 일원화)
--    - pg_net 은 fire-and-forget — 응답은 net._http_response 에 저장됨
SELECT cron.schedule(
  'dispatch-notifications',
  '*/5 * * * *',
  $cron$
  SELECT net.http_get(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_app_url')
           || '/api/cron/dispatch-notifications',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    )
  );
  $cron$
);

-- ================================================================
-- 검증 쿼리 (수동 실행)
-- ================================================================
-- 스케줄 등록 확인:
--   SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'dispatch-notifications';
--
-- 최근 실행 결과 (성공/실패):
--   SELECT jobid, status, return_message, start_time, end_time
--     FROM cron.job_run_details
--     WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'dispatch-notifications')
--     ORDER BY start_time DESC
--     LIMIT 10;
--
-- 최근 HTTP 응답 (status code, body):
--   SELECT id, status_code, content, created
--     FROM net._http_response
--     ORDER BY created DESC
--     LIMIT 10;
--
-- 수동 일회성 호출 (cron 안 기다리고 즉시 테스트):
--   SELECT net.http_get(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_app_url')
--            || '/api/cron/dispatch-notifications',
--     headers := jsonb_build_object(
--       'Authorization',
--       'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
--     )
--   );
-- ================================================================
