"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "@/app/login/actions";

type UserInfo = { email?: string; displayName?: string } | null;

type Props = {
  children: ReactNode;
  user: UserInfo;
  unreadCount: number;
  demoMode: boolean;
};

const groups = [
  { label: "探す", items: [["選手名鑑", "/"], ["候補", "/candidates"]] },
  { label: "組む", items: [["対戦相手募集", "/open-matches"], ["マッチメイク", "/matchmaking"]] },
  { label: "運営", items: [["興行", "/events"], ["連絡", "/messages"], ["ジム管理", "/gym"]] },
] as const;

const guideSteps = [
  { no: "01", title: "選手を探す", body: "階級・戦績・地域・MATCH STATUSで絞り、詳細を確認します。", href: "/" },
  { no: "02", title: "候補に入れる", body: "比較したい選手を候補へ保存。確認モードでは最初から候補例も入っています。", href: "/candidates" },
  { no: "03", title: "ジムへ相談する", body: "候補から興行日・契約ウェイト・Rを入れて相談案件を作ります。", href: "/matchmaking" },
  { no: "04", title: "交渉を進める", body: "相談中→交渉中→ジム確認待ち→内定→決定まで案件で追います。", href: "/matchmaking" },
  { no: "05", title: "相手を募集する", body: "対戦相手が未定・流れた時はOPEN MATCHを作り、その条件で選手検索へ戻れます。", href: "/open-matches" },
  { no: "06", title: "興行を組む", body: "興行単位で対戦枠を作り、募集中・交渉中・決定を一覧で管理します。", href: "/events" },
];

export function AppShell({ children, user, unreadCount, demoMode }: Props) {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!demoMode) return;
    try {
      const seeded = localStorage.getItem("ringops_demo_seeded_v3");
      if (!seeded) {
        localStorage.setItem("ringops_candidate_boxers", JSON.stringify([
          "20000000-0000-0000-0000-000000000001",
          "20000000-0000-0000-0000-000000000002",
          "20000000-0000-0000-0000-000000000007",
        ]));
        localStorage.setItem("ringops_demo_seeded_v3", "1");
      }
      if (!localStorage.getItem("ringops_guide_seen_v1")) setWelcomeOpen(true);
    } catch {
      // Browser storage is optional for the review experience.
    }
  }, [demoMode]);

  function closeWelcome() {
    setWelcomeOpen(false);
    try { localStorage.setItem("ringops_guide_seen_v1", "1"); } catch {}
  }

  function resetDemo() {
    if (!window.confirm("確認モードで作成した候補・募集・案件・興行・メッセージを初期状態へ戻しますか？")) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith("ringops_")) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } finally {
      window.location.href = "/";
    }
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "確認ユーザー";

  return <div className="min-h-screen bg-[#f4f6f8] text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[224px] border-r border-[#d9dee5] bg-[#fbfcfd] lg:flex lg:flex-col">
      <div className="border-b border-[#e3e7ec] px-5 py-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#102033] text-sm font-black tracking-tight text-white">R</span>
          <span><b className="block text-[15px] tracking-[.08em]">RINGOPS</b><small className="mt-0.5 block text-[10px] font-bold text-slate-500">BOXING OPERATIONS</small></span>
        </Link>
      </div>

      {demoMode && <div className="mx-3 mt-3 rounded-lg border border-[#cdd8e5] bg-[#f0f5fa] px-3 py-2.5">
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#2f6f9f]"/><b className="text-xs">確認モード</b></div>
        <p className="mt-1 text-[10px] leading-4 text-slate-600">架空データで全体の操作を試せます。確認操作はこの端末にだけ保存されます。</p>
      </div>}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => <div className="mb-5" key={group.label}>
          <p className="mb-1.5 px-2 text-[10px] font-black tracking-[.08em] text-slate-400">{group.label}</p>
          <div className="space-y-0.5">{group.items.map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link className={`flex h-10 items-center justify-between rounded-md px-3 text-[13px] font-bold transition ${active ? "bg-[#e8eef4] text-[#16324a]" : "text-slate-650 hover:bg-[#f0f2f5] hover:text-slate-950"}`} href={href} key={href}>
              <span>{label}</span>{label === "連絡" && unreadCount > 0 && <span className="min-w-5 rounded-full bg-[#16324a] px-1.5 text-center text-[10px] leading-5 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </Link>;
          })}</div>
        </div>)}
      </nav>

      <div className="border-t border-[#e3e7ec] p-3">
        <button className="mb-1 flex h-10 w-full items-center rounded-md px-3 text-left text-xs font-bold text-slate-700 hover:bg-[#eef1f4]" onClick={() => setGuideOpen(true)}>使い方・操作ガイド</button>
        <Link className="mb-1 flex h-10 items-center rounded-md px-3 text-xs font-bold text-slate-700 hover:bg-[#eef1f4]" href="/guide">マニュアルを開く</Link>
        {demoMode && <button className="flex h-10 w-full items-center rounded-md px-3 text-left text-[11px] font-bold text-slate-500 hover:bg-[#eef1f4]" onClick={resetDemo}>確認データを初期化</button>}
      </div>
    </aside>

    <div className="lg:pl-[224px]">
      <header className="sticky top-0 z-40 border-b border-[#d9dee5] bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:hidden"><Link className="font-black tracking-[.08em]" href="/">RINGOPS</Link>{demoMode && <span className="rounded bg-[#e8eef4] px-2 py-1 text-[10px] font-black text-[#16324a]">確認</span>}</div>
          <div className="hidden min-w-0 items-center gap-3 lg:flex"><span className="text-xs font-bold text-slate-500">{pageTitle(pathname)}</span>{demoMode && <span className="text-[10px] font-bold text-slate-400">デモデータで操作確認中</span>}</div>
          <div className="flex items-center gap-2">
            <button className="h-9 rounded-md border border-[#cfd6dd] bg-white px-3 text-xs font-bold text-slate-700 hover:bg-[#f7f8fa]" onClick={() => setGuideOpen(true)}>使い方</button>
            {!user ? <Link className="h-9 rounded-md bg-[#16324a] px-3 text-xs font-black leading-9 text-white hover:bg-[#10283c]" href="/login">業界ログイン</Link> : <>
              <span className="hidden text-xs font-bold text-slate-600 sm:inline">{displayName}</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#e8eef4] text-xs font-black text-[#16324a]">{displayName.slice(0,1)}</span>
              <form action={signOut}><button className="px-1 text-[10px] font-bold text-slate-400 hover:text-slate-700">ログアウト</button></form>
            </>}
          </div>
        </div>
        <div className="flex overflow-x-auto border-t border-[#edf0f3] bg-[#fbfcfd] px-2 lg:hidden">
          {groups.flatMap((group) => group.items).map(([label, href]) => <Link className={`shrink-0 border-b-2 px-3 py-2.5 text-[11px] font-bold ${isActive(pathname, href) ? "border-[#16324a] text-[#16324a]" : "border-transparent text-slate-500"}`} href={href} key={href}>{label}</Link>)}
        </div>
      </header>

      {demoMode && <div className="border-b border-[#dbe3eb] bg-[#eef4f8] px-4 py-2 lg:px-6">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2 text-[11px]">
          <p className="font-bold text-[#27465f]"><b>確認用フルモード</b>：ログインなしで検索・候補・相談・募集・案件・興行・連絡・ジム管理を試せます。</p>
          <button className="font-black text-[#16324a] underline underline-offset-4" onClick={() => setGuideOpen(true)}>何から触ればいい？</button>
        </div>
      </div>}

      <div>{children}</div>
    </div>

    {(guideOpen || welcomeOpen) && <div className="fixed inset-0 z-[80] bg-slate-950/30" onMouseDown={() => { setGuideOpen(false); closeWelcome(); }}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-[460px] overflow-y-auto border-l border-[#d9dee5] bg-[#fbfcfd] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dde2e7] bg-white px-5 py-4">
          <div><p className="text-[10px] font-black tracking-[.1em] text-[#597086]">START GUIDE</p><h2 className="mt-1 text-xl font-black">3分でわかる RINGOPS</h2></div>
          <button className="size-9 rounded-md border border-[#d4dae0] bg-white text-lg text-slate-500" onClick={() => { setGuideOpen(false); closeWelcome(); }}>×</button>
        </div>
        <div className="p-5">
          <div className="rounded-lg border border-[#cad6e1] bg-[#edf4f8] p-4"><b className="text-sm text-[#16324a]">最初はこの順番で触ってください</b><p className="mt-1 text-xs leading-5 text-[#506579]">RINGOPSは「選手を探す」から始まり、「相談 → 交渉 → 決定 → 興行管理」までを一本につなぐ業務ツールです。</p></div>
          <div className="mt-5 space-y-2">{guideSteps.map((step) => <Link className="group flex gap-3 rounded-lg border border-[#dfe3e8] bg-white p-3.5 hover:border-[#9fb2c4] hover:bg-[#fafcfd]" href={step.href} key={step.no} onClick={() => { setGuideOpen(false); closeWelcome(); }}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#16324a] text-[10px] font-black text-white">{step.no}</span>
            <span><b className="text-sm">{step.title}</b><span className="mt-1 block text-[11px] leading-5 text-slate-600">{step.body}</span></span>
          </Link>)}</div>
          <div className="mt-6 border-t border-[#dfe3e8] pt-5"><h3 className="text-sm font-black">役割別の見方</h3><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-[#dfe3e8] bg-white p-3"><b className="text-xs">興行主・マッチメーカー</b><p className="mt-1 text-[11px] leading-5 text-slate-600">選手名鑑 → OPEN MATCH → 案件 → 興行</p></div><div className="rounded-lg border border-[#dfe3e8] bg-white p-3"><b className="text-xs">ジム</b><p className="mt-1 text-[11px] leading-5 text-slate-600">ジム管理 → 相談確認 → 案件承認 → 連絡</p></div></div></div>
          <Link className="mt-5 flex h-11 items-center justify-center rounded-md bg-[#16324a] text-sm font-black text-white" href="/guide" onClick={() => { setGuideOpen(false); closeWelcome(); }}>詳しいマニュアルを見る</Link>
        </div>
      </aside>
    </div>}
  </div>;
}

function isActive(pathname: string, href: string) { return href === "/" ? pathname === "/" : pathname.startsWith(href); }
function pageTitle(pathname: string) {
  if (pathname === "/") return "選手名鑑";
  if (pathname.startsWith("/boxers/")) return "選手詳細";
  if (pathname.startsWith("/candidates")) return "候補";
  if (pathname.startsWith("/open-matches")) return "対戦相手募集";
  if (pathname.startsWith("/matchmaking")) return "マッチメイク";
  if (pathname.startsWith("/events")) return "興行";
  if (pathname.startsWith("/messages")) return "連絡";
  if (pathname.startsWith("/gym")) return "ジム管理";
  if (pathname.startsWith("/guide")) return "操作マニュアル";
  return "RINGOPS";
}
