import { CandidateList } from "@/features/boxers/components/candidate-list";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function CandidatesPage(){
  const {boxers,databaseConnected}=await loadBoxers();
  return <main>
    <section className="border-b border-[#e5e9ed] bg-white"><div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><h1 className="text-2xl font-black tracking-tight text-slate-950">候補</h1><p className="mt-1 text-sm text-slate-500">保存した選手を比較して、そのまま所属ジムへ相談できます。</p></div></section>
    <div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><CandidateList databaseConnected={databaseConnected} previewBoxers={boxers}/></div>
  </main>;
}
