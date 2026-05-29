import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { formatKRW, formatReadyAt } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * /admin — 테스트/QA 전용 도구 페이지.
 *
 * 화이트리스트(`ADMIN_EMAILS` 환경변수)에 등록된 사용자만 접근 가능.
 * 비admin 은 홈으로 리다이렉트.
 *
 * 제공 기능:
 * - 본인이 등록한 item 목록(soft-deleted 제외) 표시.
 * - 각 item 의 status 와 무관하게 "AI 채팅으로 진입" 버튼 제공.
 *   → 정상 흐름(/cooling/[id] → ready 시 /chat/[itemId])을 우회해서
 *      cooling 상태에서도 채팅을 곧장 시작할 수 있게 한다.
 * - decided 상태 item 도 표시하되 채팅 진입은 막는다 (이미 결정 끝남).
 *
 * 정책 충돌 없음:
 * - 일반 사용자에게 노출되지 않으므로 PRD/screen-spec 의 냉각 정책은 그대로.
 * - DB 수정 없이 진입로만 우회 — cooling_ends_at 등 데이터 무손상.
 */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/");

  const { data: items } = await supabase
    .from("items")
    .select("id, name, price, status, cooling_ends_at, created_at, decision")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen min-h-dvh max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              ADMIN
            </span>
            <h1 className="text-xl font-semibold text-zinc-900">테스트 도구</h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            화이트리스트(ADMIN_EMAILS) 멤버 전용 · 정상 사용자 정책 영향 없음
          </p>
        </div>
        <Link href="/" prefetch={false} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← 홈
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            내 등록 물건 — status 무관 채팅 진입
          </h2>
          <span className="text-xs text-zinc-400">{items?.length ?? 0}건</span>
        </div>

        {!items || items.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
            등록된 물건이 없어요. 먼저{" "}
            <Link
              href="/register"
              prefetch={false}
              className="font-medium text-zinc-700 underline underline-offset-2"
            >
              등록
            </Link>
            해 주세요.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <AdminItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <strong className="font-semibold">⚠ 주의</strong>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>이 도구는 테스트/QA 전용입니다. 시연·실 사용에서는 정상 흐름을 따르세요.</li>
          <li>cooling 중인 item 으로 채팅 진입해도 cooling_ends_at 등 DB 데이터는 수정되지 않습니다.</li>
          <li>채팅 후 [안 삼]/[삼] 선택 시 일반 흐름과 동일하게 items 가 decided 로 전환됩니다.</li>
        </ul>
      </section>
    </main>
  );
}

type AdminItem = {
  id: string;
  name: string;
  price: number;
  status: "cooling" | "ready" | "decided";
  cooling_ends_at: string;
  created_at: string;
  decision: "bought" | "passed" | null;
};

function AdminItemRow({ item }: { item: AdminItem }) {
  const canEnterChat = item.status !== "decided";
  const statusLabel = getStatusLabel(item.status);

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-900">
            {item.name}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusLabel.classes}`}
          >
            {statusLabel.text}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {formatKRW(item.price)} · 결정 가능 {formatReadyAt(item.cooling_ends_at)}
        </div>
      </div>

      {canEnterChat ? (
        <Link
          href={`/chat/${item.id}`}
          prefetch={false}
          className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
        >
          🔧 채팅 진입
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-zinc-400">
          {item.decision === "bought" ? "삼" : "안 삼"} · 결정 완료
        </span>
      )}
    </li>
  );
}

function getStatusLabel(status: AdminItem["status"]): {
  text: string;
  classes: string;
} {
  switch (status) {
    case "cooling":
      return {
        text: "냉각 중",
        classes: "bg-sky-100 text-sky-800",
      };
    case "ready":
      return {
        text: "결정 대기",
        classes: "bg-emerald-100 text-emerald-800",
      };
    case "decided":
      return {
        text: "결정 완료",
        classes: "bg-zinc-100 text-zinc-600",
      };
  }
}
