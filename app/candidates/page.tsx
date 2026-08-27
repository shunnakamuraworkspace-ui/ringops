import { CandidateList } from "@/features/boxers/components/candidate-list";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function CandidatesPage(){
  const {boxers,databaseConnected}=await loadBoxers();
  return <main>
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-7 lg:px-7">
        <h1 className="text-3xl font-black">候補選手</h1>
        <p className="mt-2 text-sm text-slate-500">検索で見つけた選手を一時保存し、比較してから所属ジムへの相談へ進みます。</p>
      </div>
    </section>
    <div className="mx-auto max-w-[1240px] px-4 py-7 lg:px-7">
      <CandidateList databaseConnected={databaseConnected} previewBoxers={boxers}/>
    </div>
  </main>;
}
