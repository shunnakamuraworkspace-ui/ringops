import Link from "next/link";
import { BoxerDirectory } from "@/features/boxers/components/boxer-directory";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function HomePage({searchParams}:{searchParams:Promise<{division?:string;class?:string;rounds?:string}>}) {
  const [params,{ boxers, databaseConnected, industryMode }] = await Promise.all([searchParams,loadBoxers()]);
  const open = industryMode ? boxers.filter((boxer) => boxer.status !== "受付停止").length : null;

  return <>
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-6 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[.16em] text-slate-400">プロボクシング選手データベース</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">この条件で、今試合を組める選手は誰？</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">戦績・ランキング・次戦と、ジムが確認したマッチメイク受付状況を同じ検索で絞り込みます。</p>
          </div>
          <div className="flex items-end gap-5 text-xs">
            <p><span className="text-slate-400">登録 </span><b>{boxers.length}名</b></p>
            {open !== null && <p><span className="text-slate-400">相談可能 </span><b>{open}名</b></p>}
            {databaseConnected && !industryMode && <Link className="border border-slate-950 px-3 py-2 font-black" href="/login">業界ログイン</Link>}
          </div>
        </div>
      </div>
    </section>
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-[11px] font-bold text-slate-500">
      {!databaseConnected
        ? "現在は架空データの独立開発環境です。正式データProvider接続後も同じ検索構造を使用します。"
        : industryMode
          ? "業界ログイン中：MATCH STATUSと試合条件を含めて検索できます。"
          : "一般公開表示：MATCH STATUS・契約ウェイト等の業界情報はログイン後に表示します。"}
    </div>
    <BoxerDirectory
      boxers={boxers}
      databaseConnected={databaseConnected}
      industryMode={industryMode}
      initialDivision={params.division}
      initialClass={params.class}
      initialRounds={params.rounds}
    />
  </>;
}
