import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsultationForm } from "@/features/matchmaking/components/consultation-form";
import { boxerPreviewData } from "@/features/boxers/data/preview-boxers";

export default async function NewConsultationPage({searchParams}:{searchParams:Promise<{boxer?:string}>}){const {boxer:id}=await searchParams; const boxer=boxerPreviewData.find(b=>b.id===id); if(!boxer)notFound(); return <main className="mx-auto max-w-4xl px-4 py-7"><Link className="text-xs font-black text-slate-500 underline" href={`/boxers/${boxer.id}`}>← 選手ページへ戻る</Link><h1 className="mt-5 text-3xl font-black">所属ジムへ相談</h1><p className="mb-6 mt-2 text-sm text-slate-500">相談を開始するとマッチメイク案件として管理します。</p><ConsultationForm boxer={boxer}/></main>}
