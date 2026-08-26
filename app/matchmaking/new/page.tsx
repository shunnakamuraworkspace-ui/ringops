import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConsultationForm } from "@/features/matchmaking/components/consultation-form";
import { loadBoxer } from "@/lib/ringops/load-boxers";

export default async function NewConsultationPage({ searchParams }: { searchParams: Promise<{ boxer?: string }> }) {
  const { boxer: id } = await searchParams;
  if (!id) notFound();
  const { boxer, databaseConnected, industryMode } = await loadBoxer(id);
  if (!boxer) notFound();
  if (databaseConnected && !industryMode) redirect(`/login?message=${encodeURIComponent("所属ジムへの相談には業界ログインが必要です。")}`);

  return <main className="mx-auto max-w-4xl px-4 py-7">
    <Link className="text-xs font-black text-slate-500 underline underline-offset-4" href={`/boxers/${boxer.id}`}>← 選手ページへ戻る</Link>
    <h1 className="mt-5 text-3xl font-black">所属ジムへ相談</h1>
    <p className="mb-6 mt-2 text-sm text-slate-500">相談を開始すると、対象選手・条件・関係組織を紐づけたマッチメイク案件になります。</p>
    <ConsultationForm boxer={boxer} databaseConnected={databaseConnected}/>
  </main>;
}
