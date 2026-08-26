import Link from "next/link";
import { BoxerDirectory } from "@/features/boxers/components/boxer-directory";
import { loadBoxers } from "@/lib/ringops/load-boxers";

type SearchParams={division?:string;class?:string;rounds?:string;stance?:string;minWeight?:string;maxWeight?:string;minBouts?:string;maxBouts?:string};

export default async function HomePage({searchParams}:{searchParams:Promise<SearchParams>}) {
  const [params,{ boxers, databaseConnected, industryMode, loadError }] = await Promise.all([searchParams,loadBoxers()]);
  const open = industryMode && !loadError ? boxers.filter((boxer) => boxer.status !== "受付停止").length : null;

  return <>
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-6 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[.16em] text-slate-400">プロボクシング選手データベース</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">この条件で、今試合を組める選手は誰？</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">戦績・ランキング・次戦と、ジムが確認したマッチメイク受付状況を同じ検索で絞り込みます。</p>
          </div>
          {!loadError && <div className="flex items-end gap-5 text-xs">
            <p><span className="text-slate-400">登録 </span><b>{boxers.length}名</b></p>
            {open !== null && <p><span className="text-slate-400">相談可能 </span><b>{open}名</b></p>}
            {databaseConnected && !industryMode && <Link className="border border-slate-950 px-3 py-2 font-black" href="/login">業界ログイン</Link>}
          </div>}
        </div>
      </div>
    </section>

    {loadError ? <>
      <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-800">{loadError}</div>
      <main className="mx-auto max-w-[900px] px-4 py-12 lg:px-7">
        <section className="border-y-2 border-slate-950 bg-white px-5 py-10 text-center">
          <p className="text-lg font-black">現在、選手データを表示できません</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">架空データへ自動で切り替えず、正式データの復旧後に表示します。誤った情報を業務判断に使わせないための保護です。</p>
          <Link className="mt-5 inline-flex h-10 items-center border border-slate-950 px-4 text-xs font-black" href="/">再読み込み</Link>
        </section>
      </main>
    </> : <>
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
        initialStance={params.stance}
        initialMinWeight={params.minWeight}
        initialMaxWeight={params.maxWeight}
        initialMinBouts={params.minBouts}
        initialMaxBouts={params.maxBouts}
      />
    </>}
  </>;
}
