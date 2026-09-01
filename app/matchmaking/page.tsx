import { OpsHeader } from "@/components/ops-ui";
import { CaseBoard } from "@/features/matchmaking/components/case-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function MatchmakingPage(){
  const { databaseConnected, industryMode } = await loadBoxers();
  return <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-7">
    <OpsHeader title="マッチメイク" description="相談から試合決定まで、案件の現在地と次の操作を一画面で追います。" />
    <div className="pt-4"><CaseBoard databaseConnected={databaseConnected} industryMode={industryMode}/></div>
  </main>;
}