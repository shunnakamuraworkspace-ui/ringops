import Link from "next/link";
import { OpenMatchBoard } from "@/features/open-matches/components/open-match-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams={fromEvent?:string;competition?:string;division?:string;rounds?:string;date?:string;venue?:string;minWeight?:string;maxWeight?:string};

export default async function OpenMatchesPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const [params,{ databaseConnected, industryMode }] = await Promise.all([searchParams,loadBoxers()]);
  return <main>
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-7 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-black">対戦相手募集</h1><p className="mt-2 text-sm text-slate-500">募集条件をそのまま選手検索へ引き継げる業務画面です。</p></div>
          {databaseConnected&&!industryMode&&<Link className="border border-slate-950 px-4 py-2 text-xs font-black" href="/login">業界ログイン</Link>}
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-[1240px] px-4 py-7 lg:px-7">
      <OpenMatchBoard
        databaseConnected={databaseConnected}
        industryMode={industryMode}
        initialCompetition={params.competition}
        initialDivision={params.division}
        initialRounds={params.rounds}
        initialDate={params.date}
        initialVenue={params.venue}
        initialMinWeight={params.minWeight}
        initialMaxWeight={params.maxWeight}
        openFormInitially={params.fromEvent==="1"}
      />
    </div>
  </main>;
}
