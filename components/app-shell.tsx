"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "@/app/login/actions";

type UserInfo = { email?: string; displayName?: string } | null;
type Props = { children: ReactNode; user: UserInfo; unreadCount: number; demoMode: boolean };
type NavItem = { label: string; href: string; code: string };

const primaryNav: NavItem[] = [
  { label: "選手を探す", href: "/", code: "01" },
  { label: "対戦相手募集", href: "/open-matches", code: "02" },
  { label: "マッチメイク", href: "/matchmaking", code: "03" },
  { label: "興行", href: "/events", code: "04" },
];

const secondaryNav: NavItem[] = [
  { label: "候補", href: "/candidates", code: "A" },
  { label: "連絡", href: "/messages", code: "B" },
  { label: "ジム管理", href: "/gym", code: "C" },
  { label: "操作ガイド", href: "/guide", code: "?" },
];

const guideSteps = [
  { no: "01", title: "選手を探す", body: "階級・受付状況・試合月・契約kgで候補を絞ります。", href: "/" },
  { no: "02", title: "相談する", body: "選手一覧の「相談」から試合条件を入力します。", href: "/" },
  { no: "03", title: "案件を進める", body: "相談内容はマッチメイクに入り、交渉から決定まで追えます。", href: "/matchmaking" },
  { no: "04", title: "相手がいなければ募集", body: "条件を公開し、その条件のまま選手検索へ戻れます。", href: "/open-matches" },
];

export function AppShell({ children, user, unreadCount, demoMode }: Props) {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!demoMode) return;
    try {
      if (!localStorage.getItem("ringops_guide_seen_v3")) setWelcomeOpen(true);
    } catch {}
  }, [demoMode]);

  function closeGuide() {
    setGuideOpen(false);
    setWelcomeOpen(false);
    try { localStorage.setItem("ringops_guide_seen_v3", "1"); } catch {}
  }

  function resetDemo() {
    if (!window.confirm("確認用に変更した候補・募集・案件・興行・メッセージを初期状態へ戻しますか？")) return;
    try {
      const keys: string[] = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith("ringops_")) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } finally {
      window.location.href = "/";
    }
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "確認ユーザー";
  const mobileNav = [...primaryNav, ...secondaryNav.filter((item) => item.href !== "/guide")];

  return (
    <div className="min-h-screen bg-[var(--ringops-paper)] text-[var(--ringops-ink)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[226px] border-r border-[var(--ringops-line-strong)] bg-[#f8f8f5] lg:flex lg:flex-col">
        <div className="border-b border-[var(--ringops-line-strong)] px-5 py-5">
          <Link href="/" className="block">
            <b className="block text-[17px] font-black tracking-[.08em]">RINGOPS</b>
            <span className="mt-1 block text-[9px] font-black uppercase tracking-[.18em] text-slate-400">Matchmaking Desk</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div>{primaryNav.map((item) => <NavLink item={item} pathname={pathname} key={item.href} />)}</div>
          <div className="mx-5 my-5 border-t border-[var(--ringops-line)]" />
          <div>{secondaryNav.map((item) => <NavLink item={item} pathname={pathname} unreadCount={item.href === "/messages" ? unreadCount : 0} key={item.href} />)}</div>
        </nav>

        <div className="border-t border-[var(--ringops-line-strong)]">
          {demoMode ? (
            <div className="border-b border-[var(--ringops-line)] px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[.08em] text-slate-500">確認モード</span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-600" />LOCAL</span>
              </div>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-500">ログインなしで操作できます。変更はこの端末だけに保存されます。</p>
            </div>
          ) : null}
          <div className="px-3 py-3">
            <button className="flex h-9 w-full items-center justify-between px-2 text-left text-[11px] font-bold text-slate-600 hover:bg-white" onClick={() => setGuideOpen(true)}><span>使い方</span><span>?</span></button>
            {demoMode ? <button className="flex h-8 w-full items-center px-2 text-left text-[10px] font-semibold text-slate-400 hover:bg-white hover:text-slate-700" onClick={resetDemo}>確認データを初期化</button> : null}
          </div>
        </div>
      </aside>

      <div className="lg:pl-[226px]">
        <header className="sticky top-0 z-40 border-b border-[var(--ringops-line-strong)] bg-[#f8f8f5]/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link className="text-sm font-black tracking-[.08em] lg:hidden" href="/">RINGOPS</Link>
              <span className="hidden text-[10px] font-black uppercase tracking-[.12em] text-slate-400 lg:inline">{pageCode(pathname)}</span>
              <h1 className="truncate text-xs font-black text-slate-800">{pageTitle(pathname)}</h1>
              {demoMode ? <span className="border-l border-[var(--ringops-line)] pl-3 text-[9px] font-black text-slate-400">確認版</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 border border-transparent px-2 text-xs font-black text-slate-500 hover:border-[var(--ringops-line)] hover:bg-white" onClick={() => setGuideOpen(true)}>?</button>
              {!user ? (
                <Link className="ops-secondary h-8" href="/login">業界ログイン</Link>
              ) : (
                <>
                  <span className="hidden text-[11px] font-bold text-slate-600 sm:inline">{displayName}</span>
                  <form action={signOut}><button className="px-1 text-[10px] font-bold text-slate-400 hover:text-slate-700">ログアウト</button></form>
                </>
              )}
            </div>
          </div>
          <div className="flex overflow-x-auto border-t border-[var(--ringops-line)] lg:hidden">
            {mobileNav.map((item) => (
              <Link className={`shrink-0 border-r border-[var(--ringops-line)] px-3 py-2.5 text-[10px] font-black ${isActive(pathname, item.href) ? "bg-white text-[var(--ringops-accent)]" : "text-slate-400"}`} href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </div>
        </header>
        <div>{children}</div>
      </div>

      {(guideOpen || welcomeOpen) ? (
        <div className="fixed inset-0 z-[80] bg-black/20" onMouseDown={closeGuide}>
          <aside className="absolute right-0 top-0 h-full w-full max-w-[420px] overflow-y-auto border-l border-[var(--ringops-line-strong)] bg-[#fbfbf9]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--ringops-line-strong)] bg-[#fbfbf9] px-5 py-5">
              <div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Quick Guide</p><h2 className="mt-2 text-xl font-black tracking-tight">試合を組むまでの4手順</h2></div>
              <button className="flex size-8 items-center justify-center border border-[var(--ringops-line)] text-lg text-slate-400 hover:bg-white" onClick={closeGuide}>×</button>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-slate-600">最初はこの4つだけ分かれば使えます。各項目を押すとその画面へ移動します。</p>
              <div className="mt-6 border-t border-[var(--ringops-line-strong)]">
                {guideSteps.map((step) => (
                  <Link className="grid grid-cols-[44px_1fr] gap-3 border-b border-[var(--ringops-line)] py-4 hover:bg-white" href={step.href} key={step.no} onClick={closeGuide}>
                    <span className="font-mono text-lg font-black text-slate-300">{step.no}</span>
                    <span><b className="text-sm">{step.title}</b><span className="mt-1 block text-[11px] leading-5 text-slate-500">{step.body}</span></span>
                  </Link>
                ))}
              </div>
              <Link className="ops-secondary mt-5 w-full" href="/guide" onClick={closeGuide}>詳しい操作マニュアル</Link>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({ item, pathname, unreadCount = 0 }: { item: NavItem; pathname: string; unreadCount?: number }) {
  const active = isActive(pathname, item.href);
  return (
    <Link className={`grid h-10 grid-cols-[30px_1fr_auto] items-center border-l-2 px-4 text-[12px] font-bold transition ${active ? "border-[var(--ringops-accent)] bg-white text-[var(--ringops-ink)]" : "border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-900"}`} href={item.href}>
      <span className={`font-mono text-[9px] ${active ? "text-[var(--ringops-accent)]" : "text-slate-300"}`}>{item.code}</span>
      <span>{item.label}</span>
      {unreadCount > 0 ? <span className="min-w-5 border border-[var(--ringops-line)] bg-white px-1 text-center text-[9px] leading-5 text-slate-600">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/boxers/") : pathname.startsWith(href);
}

function pageTitle(pathname: string) {
  if (pathname === "/") return "選手を探す";
  if (pathname.startsWith("/boxers/")) return "選手詳細";
  if (pathname.startsWith("/candidates")) return "候補";
  if (pathname.startsWith("/open-matches")) return "対戦相手募集";
  if (pathname.startsWith("/matchmaking/new")) return "所属ジムへ相談";
  if (pathname.startsWith("/matchmaking")) return "マッチメイク";
  if (pathname.startsWith("/events")) return "興行";
  if (pathname.startsWith("/messages")) return "連絡";
  if (pathname.startsWith("/gym")) return "ジム管理";
  if (pathname.startsWith("/guide")) return "操作ガイド";
  return "RINGOPS";
}

function pageCode(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/boxers/")) return "01";
  if (pathname.startsWith("/open-matches")) return "02";
  if (pathname.startsWith("/matchmaking")) return "03";
  if (pathname.startsWith("/events")) return "04";
  return "OPS";
}
