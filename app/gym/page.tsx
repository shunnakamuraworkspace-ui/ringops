import Link from "next/link";
import { StatusManager } from "@/features/gym/components/status-manager";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function GymPage(){
  const { databaseConnected, industryMode } = await loadBoxers();
  return <main><section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1240px] px-4 py-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">ジム管理</h1><p className="mt-2 text-sm text-slate-500">現場情報だけを短時間で更新します。公式戦績・ランキングは別管理です。</p></div><div className="flex gap-2">{databaseConnected&&!industryMode&&<Link className="border border-slate-950 px-4 py-2 text-xs font-black" href="/login">業界ログイン</Link>}<Link className="border border-slate-300 px-4 py-2 text-xs font-black text-slate-700" href="/gym/staff">スタッフ管理</Link></div></div></div></section><div className="mx-auto max-w-[1240px] px-4 py-7"><StatusManager databaseConnected={databaseConnected} industryMode={industryMode}/></div></main>
}
