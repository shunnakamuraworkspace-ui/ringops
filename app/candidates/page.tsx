import { CandidateList } from "@/features/boxers/components/candidate-list";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function CandidatesPage(){
  const {boxers,databaseConnected}=await loadBoxers();
  return <main>
    <section className="border-b border-[#d9dee5] bg-white"><div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-7"><h1 className="text-xl font-black sm:text-2xl">候補</h1><p className="mt-1 text-xs text-slate-500">気になる選手を比較して、所属ジムへの相談へ進む場所です。</p></div></section>
    <div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><div className="mb-4 rounded-lg border border-[#d8e2ea] bg-[#f0f5f8] px-4 py-3 text-xs leading-5 text-[#526879]"><b className="text-[#16324a]">次にやること：</b> 条件が合いそうな選手の「相談」を押し、興行日・会場・ウェイト・Rを入力します。</div><CandidateList databaseConnected={databaseConnected} previewBoxers={boxers}/></div>
  </main>;
}
