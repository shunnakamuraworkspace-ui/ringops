import { EventBoard } from "@/features/events/components/event-board";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function EventsPage(){
  const {databaseConnected,industryMode}=await loadBoxers();
  return <main>
    <section className="border-b border-[#d9dee5] bg-white"><div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-7"><h1 className="text-xl font-black sm:text-2xl">興行</h1><p className="mt-1 text-xs text-slate-500">カード全体を見ながら、募集中・交渉中・決定を管理します。</p></div></section>
    <div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><div className="mb-4 rounded-lg border border-[#d8e2ea] bg-[#f0f5f8] px-4 py-3 text-xs leading-5 text-[#526879]"><b className="text-[#16324a]">確認ポイント：</b> 対戦枠を追加し、「この条件で募集」からOPEN MATCHへ条件が引き継がれる流れを試せます。</div><EventBoard databaseConnected={databaseConnected} industryMode={industryMode}/></div>
  </main>;
}
