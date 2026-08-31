import Link from "next/link";
import { StatusManager } from "@/features/gym/components/status-manager";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function GymPage(){
  const { databaseConnected, industryMode } = await loadBoxers();
  return <main>
    <section className="border-b border-[#d9dee5] bg-white"><div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-7"><div><h1 className="text-xl font-black sm:text-2xl">ジム管理</h1><p className="mt-1 text-xs text-slate-500">所属選手の「今、試合相談できるか」だけを短時間で確認します。</p></div><Link className="rounded-md border border-[#d3dae1] bg-white px-3 py-2 text-xs font-black text-slate-700" href="/gym/staff">スタッフ管理</Link></div></section>
    <div className="mx-auto max-w-[1240px] px-4 py-5 lg:px-7"><div className="mb-4 rounded-lg border border-[#d8e2ea] bg-[#f0f5f8] px-4 py-3 text-xs leading-5 text-[#526879]"><b className="text-[#16324a]">ジム側の主な操作：</b> MATCH STATUSを確認 → 必要なら条件変更 → 定期的に「そのまま確認」で情報を新しく保ちます。</div><StatusManager databaseConnected={databaseConnected} industryMode={industryMode}/></div>
  </main>;
}
