export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          🧊 쿨링오프
        </h1>
        <p className="max-w-sm text-base leading-7 text-zinc-500">
          사고 싶은 마음을 바로 결제로 넘기지 않도록
          <br />
          잠시 식혀 보세요.
        </p>
        <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm text-zinc-400">
          준비 중입니다
        </span>
      </div>
    </main>
  );
}
