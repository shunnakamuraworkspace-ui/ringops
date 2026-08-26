import Link from "next/link";
import { CaseBoard } from "@/features/matchmaking/components/case-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function MatchmakingPage(){
  const { databaseConnected, industryMode } = await loadBoxers();
  return <main><section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1240px] px-4 py-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">マッチメイク案件</h1><p className="mt-2 text-sm text-slate-500">相談開始からジム確認、決定までを案件単位で追います。</p></div>{databaseConnected&&!industryMode&&<Link className="border border-slate-950 px-4 py-2 text-xs font-black" href="/login">業界ログイン</Link>}</div></div></section><div className="mx-auto max-w-[1240px] px-4 py-7"><CaseBoard databaseConnected={databaseConnected} industryMode={industryMode}/></div></main>
}
