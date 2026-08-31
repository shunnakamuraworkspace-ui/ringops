import { OpenMatchBoard } from "@/features/open-matches/components/open-match-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams={fromEvent?:string;competition?:string;division?:string;rounds?:string;date?:string;venue?:string;minWeight?:string;maxWeight?:string};

export default async function OpenMatchesPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const [params,{ databaseConnected, industryMode }] = await Promise.all([searchParams,loadBoxers()]);
  return <main>
    <section className="border-b border-[#d9dee5] bg-white"><div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-7"><h1 className="text-xl font-black sm:text-2xl">対戦相手募集</h1><p className="mt-1 text-xs text-slate-500">条件を公開し、合う選手を探すための募集ボードです。</p></div></section>
    <div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><div className="mb-4 rounded-lg border border-[#d8e2ea] bg-[#f0f5f8] px-4 py-3 text-xs leading-5 text-[#526879]"><b className="text-[#16324a]">使い方：</b> 募集を作成 → 「この条件で選手を探す」 → 候補を選ぶ → 所属ジムへ相談、の順です。</div><OpenMatchBoard databaseConnected={databaseConnected} industryMode={industryMode} initialCompetition={params.competition} initialDivision={params.division} initialRounds={params.rounds} initialDate={params.date} initialVenue={params.venue} initialMinWeight={params.minWeight} initialMaxWeight={params.maxWeight} openFormInitially={params.fromEvent==="1"}/></div>
  </main>;
}
