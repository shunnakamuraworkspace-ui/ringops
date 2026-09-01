import { OpsHeader } from "@/components/ops-ui";
import { OpenMatchBoard } from "@/features/open-matches/components/open-match-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams={fromEvent?:string;competition?:string;division?:string;rounds?:string;date?:string;venue?:string;minWeight?:string;maxWeight?:string};

export default async function OpenMatchesPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const [params,{ databaseConnected, industryMode }] = await Promise.all([searchParams,loadBoxers()]);
  return <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-7">
    <OpsHeader title="対戦相手募集" description="興行条件を公開し、その条件のまま候補選手の検索と相談へ進みます。" />
    <div className="pt-4"><OpenMatchBoard databaseConnected={databaseConnected} industryMode={industryMode} initialCompetition={params.competition} initialDivision={params.division} initialRounds={params.rounds} initialDate={params.date} initialVenue={params.venue} initialMinWeight={params.minWeight} initialMaxWeight={params.maxWeight} openFormInitially={params.fromEvent==="1"}/></div>
  </main>;
}