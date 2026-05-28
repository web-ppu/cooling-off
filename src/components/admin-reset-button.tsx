"use client";

import { useTransition } from "react";
import { resetChat } from "@/app/admin/actions";

/**
 * /admin 페이지의 각 item 카드에서 사용하는 "채팅 초기화" 버튼.
 *
 * 동작:
 * - 클릭 → window.confirm 으로 한 번 확인 (실수 방지).
 * - 확인 시 resetChat Server Action 호출 → chat_messages 삭제 + items
 *   결정 상태 클리어 + status 복원.
 * - useTransition 으로 진행 중 버튼 비활성화 + 라벨 변경.
 */
export default function AdminResetButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      `"${itemName}" 의 채팅 기록을 모두 삭제하고 처음 상태로 되돌립니다.\n\n계속할까요? (되돌릴 수 없음)`
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        await resetChat(itemId);
      } catch (error) {
        console.error("[resetChat] failed", error);
        window.alert(
          error instanceof Error
            ? error.message
            : "채팅 초기화에 실패했습니다."
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0 rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      title={`"${itemName}" 의 채팅을 처음 상태로 되돌립니다`}
    >
      {isPending ? "초기화 중…" : "🔄 초기화"}
    </button>
  );
}
