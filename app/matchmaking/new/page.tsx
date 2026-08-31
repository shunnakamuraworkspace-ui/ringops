import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConsultationForm } from "@/features/matchmaking/components/consultation-form";
import { loadBoxer } from "@/lib/ringops/load-boxers";

export default async function NewConsultationPage({ searchParams }: { searchParams: Promise<{ boxer?: string }> }) {
  const { boxer: id } = await searchParams;
  if (!id) notFound();
  const { boxer, databaseConnected, industryMode, reviewMode } = await loadBoxer(id);
  if (!boxer) notFound();
  if (databaseConnected && !industryMode && !reviewMode) redirect(`/login?message=${encodeURIComponent("所属ジムへの相談には業界ログインが必要です。")}`);

  return <main className="mx-auto max-w-[1080px] px-4 py-6 lg:px-7">
    <Link className="text-xs font-bold text-slate-500 hover:text-slate-900" href={`/boxers/${boxer.id}`}>← 選手詳細へ戻る</Link>
    <div className="mt-4 mb-5">
      <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">所属ジムへ相談</h1>
      <p className="mt-1 text-sm text-slate-500">試合条件を入力すると、そのままマッチメイク案件になります。</p>
    </div>
    <ConsultationForm boxer={boxer} databaseConnected={databaseConnected}/>
  </main>;
}
