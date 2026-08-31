"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "@/app/login/actions";

type UserInfo = { email?: string; displayName?: string } | null;
type Props = { children: ReactNode; user: UserInfo; unreadCount: number; demoMode: boolean };
type NavItem = { label: string; href: string; icon: IconName };
type IconName = "search" | "plus" | "match" | "calendar" | "star" | "message" | "building" | "book";

const primaryNav: NavItem[] = [
  { label: "選手を探す", href: "/", icon: "search" },
  { label: "対戦相手募集", href: "/open-matches", icon: "plus" },
  { label: "マッチメイク", href: "/matchmaking", icon: "match" },
  { label: "興行", href: "/events", icon: "calendar" },
];

const secondaryNav: NavItem[] = [
  { label: "候補", href: "/candidates", icon: "star" },
  { label: "連絡", href: "/messages", icon: "message" },
  { label: "ジム管理", href: "/gym", icon: "building" },
  { label: "操作ガイド", href: "/guide", icon: "book" },
];

const guideSteps = [
  { no: "1", title: "選手を探す", body: "階級・受付状況・試合月・契約kgで候補を絞ります。", href: "/" },
  { no: "2", title: "相談する", body: "選手一覧の「相談する」から試合条件を入力します。", href: "/" },
  { no: "3", title: "案件を進める", body: "相談内容はマッチメイクに入り、交渉から決定まで追えます。", href: "/matchmaking" },
  { no: "4", title: "相手がいなければ募集", body: "条件を公開して対戦相手を募集し、その条件のまま選手検索へ戻れます。", href: "/open-matches" },
];

export function AppShell({ children, user, unreadCount, demoMode }: Props) {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!demoMode) return;
    try {
      if (!localStorage.getItem("ringops_guide_seen_v2")) setWelcomeOpen(true);
    } catch {
      // Storage is optional in review mode.
    }
  }, [demoMode]);

  function closeGuide() {
    setGuideOpen(false);
    setWelcomeOpen(false);
    try { localStorage.setItem("ringops_guide_seen_v2", "1"); } catch {}
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

  return <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[240px] border-r border-[#e2e6ea] bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-[#edf0f2] px-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#173b5e] text-sm font-black text-white shadow-sm">R</span>
          <span><b className="block text-[15px] font-black tracking-[.06em] text-[#152536]">RINGOPS</b><small className="block text-[10px] font-medium text-slate-400">ボクシング業務管理</small></span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-bold text-slate-400">マッチメイク</p>
        <div className="space-y-1">{primaryNav.map((item) => <NavLink item={item} pathname={pathname} key={item.href} />)}</div>
        <div className="my-4 border-t border-[#edf0f2]" />
        <p className="mb-2 px-2 text-[10px] font-bold text-slate-400">その他</p>
        <div className="space-y-1">{secondaryNav.map((item) => <NavLink item={item} pathname={pathname} unreadCount={item.href === "/messages" ? unreadCount : 0} key={item.href} />)}</div>
      </nav>

      <div className="border-t border-[#edf0f2] p-3">
        {demoMode && <div className="mb-2 rounded-xl bg-[#f2f6f9] px-3 py-3">
          <div className="flex items-center justify-between"><span className="text-xs font-black text-[#315b7c]">確認モード</span><span className="size-2 rounded-full bg-emerald-500" /></div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">ログインなしで全機能を試せます。変更はこの端末だけに保存されます。</p>
        </div>}
        <button className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => setGuideOpen(true)}><Icon name="book" />使い方を見る</button>
        {demoMode && <button className="mt-1 flex h-9 w-full items-center rounded-lg px-3 text-left text-[11px] font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600" onClick={resetDemo}>確認データを初期化</button>}
      </div>
    </aside>

    <div className="lg:pl-[240px]">
      <header className="sticky top-0 z-40 border-b border-[#e2e6ea] bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-16 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link className="font-black tracking-[.06em] text-[#173b5e] lg:hidden" href="/">RINGOPS</Link>
            <h1 className="hidden truncate text-sm font-black text-slate-800 lg:block">{pageTitle(pathname)}</h1>
            {demoMode && <span className="rounded-md bg-[#eef4f8] px-2 py-1 text-[10px] font-black text-[#315b7c]">確認版</span>}
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 rounded-lg border border-[#d8dee4] bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => setGuideOpen(true)}>使い方</button>
            {!user ? <Link className="h-9 rounded-lg bg-[#173b5e] px-3 text-xs font-black leading-9 text-white hover:bg-[#102f4b]" href="/login">業界ログイン</Link> : <>
              <span className="hidden text-xs font-bold text-slate-600 sm:inline">{displayName}</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#e9f1f7] text-xs font-black text-[#315b7c]">{displayName.slice(0, 1)}</span>
              <form action={signOut}><button className="px-1 text-[10px] font-bold text-slate-400 hover:text-slate-700">ログアウト</button></form>
            </>}
          </div>
        </div>
        <div className="flex overflow-x-auto border-t border-[#f0f2f4] bg-white px-2 lg:hidden">{mobileNav.map((item) => <Link className={`shrink-0 border-b-2 px-3 py-2.5 text-[11px] font-bold ${isActive(pathname, item.href) ? "border-[#24547a] text-[#24547a]" : "border-transparent text-slate-400"}`} href={item.href} key={item.href}>{item.label}</Link>)}</div>
      </header>
      <div>{children}</div>
    </div>

    {(guideOpen || welcomeOpen) && <div className="fixed inset-0 z-[80] bg-[#0f172a]/30" onMouseDown={closeGuide}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-[430px] overflow-y-auto border-l border-[#e0e4e8] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f2] bg-white px-5 py-4">
          <div><p className="text-[10px] font-bold text-slate-400">はじめての方へ</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">まず4つだけ覚える</h2></div>
          <button className="flex size-9 items-center justify-center rounded-lg border border-[#d8dee4] text-lg text-slate-400 hover:bg-slate-50" onClick={closeGuide}>×</button>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-600">RINGOPSは、選手を探してから試合が決まるまでを1本につなぐ道具です。最初は下の順番だけ触れば十分です。</p>
          <div className="mt-5 space-y-2">{guideSteps.map((step) => <Link className="flex gap-3 rounded-xl border border-[#e2e6ea] p-4 transition hover:border-[#b7c6d2] hover:bg-[#fafcfd]" href={step.href} key={step.no} onClick={closeGuide}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#173b5e] text-xs font-black text-white">{step.no}</span>
            <span><b className="text-sm text-slate-900">{step.title}</b><span className="mt-1 block text-[11px] leading-5 text-slate-500">{step.body}</span></span>
          </Link>)}</div>
          <Link className="mt-5 flex h-11 items-center justify-center rounded-lg border border-[#ccd5dd] bg-white text-sm font-black text-[#315b7c] hover:bg-[#f7fafc]" href="/guide" onClick={closeGuide}>詳しい操作マニュアル</Link>
        </div>
      </aside>
    </div>}
  </div>;
}

function NavLink({ item, pathname, unreadCount = 0 }: { item: NavItem; pathname: string; unreadCount?: number }) {
  const active = isActive(pathname, item.href);
  return <Link className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-bold transition ${active ? "bg-[#edf3f7] text-[#234f70]" : "text-slate-600 hover:bg-[#f7f8fa] hover:text-slate-900"}`} href={item.href}>
    <Icon name={item.icon} />
    <span className="flex-1">{item.label}</span>
    {unreadCount > 0 && <span className="min-w-5 rounded-full bg-[#173b5e] px-1.5 text-center text-[10px] leading-5 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
  </Link>;
}

function Icon({ name }: { name: IconName }) {
  const common = "size-[17px] shrink-0";
  if (name === "search") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
  if (name === "plus") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>;
  if (name === "match") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 7h11l-3-3M17 17H6l3 3M18 7l-3 3M6 17l3-3"/></svg>;
  if (name === "calendar") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>;
  if (name === "star") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 4Z"/></svg>;
  if (name === "message") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5h14v11H9l-4 3V5Z"/></svg>;
  if (name === "building") return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 20V6l7-3 7 3v14M8 9h2M14 9h2M8 13h2M14 13h2M10 20v-4h4v4"/></svg>;
  return <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v18H8.5A3.5 3.5 0 0 0 5 23V5.5ZM19 5.5A3.5 3.5 0 0 0 15.5 2H12v18h3.5A3.5 3.5 0 0 1 19 23V5.5Z"/></svg>;
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
