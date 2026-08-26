import Link from "next/link";
import { StaffManager } from "@/features/gym/components/staff-manager";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function StaffPage(){const {databaseConnected,industryMode}=await loadBoxers();return <main><section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1100px] px-4 py-7"><Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/gym">← ジム管理</Link><h1 className="mt-4 text-3xl font-black">スタッフ管理</h1><p className="mt-2 text-sm text-slate-500">組織単位でスタッフを招待し、業務権限を設定します。</p></div></section><div className="mx-auto max-w-[1100px] px-4 py-7"><StaffManager databaseConnected={databaseConnected} industryMode={industryMode}/></div></main>}
