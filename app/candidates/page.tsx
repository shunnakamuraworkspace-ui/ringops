import { OpsHeader } from "@/components/ops-ui";
import { CandidateList } from "@/features/boxers/components/candidate-list";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function CandidatesPage(){
  const {boxers,databaseConnected}=await loadBoxers();
  return <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-7">
    <OpsHeader title="候補" description="保存した選手を同じ条件軸で比較し、そのまま所属ジムへ相談します。" />
    <div className="pt-4"><CandidateList databaseConnected={databaseConnected} previewBoxers={boxers}/></div>
  </main>;
}