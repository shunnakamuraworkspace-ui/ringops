import { OpsHeader } from "@/components/ops-ui";
import { EventBoard } from "@/features/events/components/event-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function EventsPage(){
  const {databaseConnected,industryMode}=await loadBoxers();
  return <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-7">
    <OpsHeader title="興行" description="試合番号を軸に、募集中・交渉中・決定をカード全体で管理します。" />
    <div className="pt-4"><EventBoard databaseConnected={databaseConnected} industryMode={industryMode}/></div>
  </main>;
}