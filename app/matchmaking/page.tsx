import { CaseBoard } from "@/features/matchmaking/components/case-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function MatchmakingPage(){
  const { databaseConnected, industryMode } = await loadBoxers();
  return <main>
    <section className="border-b border-[#d9dee5] bg-white"><div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-7"><h1 className="text-xl font-black sm:text-2xl">マッチメイク</h1><p className="mt-1 text-xs text-slate-500">1つの対戦候補を、相談から試合決定まで案件として追います。</p></div></section>
    <div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><div className="mb-4 rounded-lg border border-[#d8e2ea] bg-[#f0f5f8] px-4 py-3 text-xs leading-5 text-[#526879]"><b className="text-[#16324a]">進め方：</b> 相談中 → 交渉中 → ジム確認待ち → 内定 → 決定。相手が流れた場合は同じ条件で再募集できます。</div><CaseBoard databaseConnected={databaseConnected} industryMode={industryMode}/></div>
  </main>;
}
