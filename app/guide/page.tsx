import Link from "next/link";

const steps = [
  { no:"01", title:"選手名鑑で探す", href:"/", action:"階級・戦績・地域・受付状況で候補を絞ります。", check:"まず「受付中」を押し、選手詳細を1人開いてください。" },
  { no:"02", title:"候補に保存する", href:"/candidates", action:"気になる選手を候補へ置き、比較して相談対象を決めます。", check:"確認モードでは候補例を最初から入れています。" },
  { no:"03", title:"所属ジムへ相談する", href:"/candidates", action:"興行日・会場・契約ウェイト・R・相談内容を入れて案件を作ります。", check:"候補一覧の「相談」から進むと迷いません。" },
  { no:"04", title:"案件を進める", href:"/matchmaking", action:"相談中 → 交渉中 → ジム確認待ち → 内定 → 決定を追います。", check:"条件変更や再募集もこの案件を起点にします。" },
  { no:"05", title:"対戦相手を募集する", href:"/open-matches", action:"対象選手・階級・ウェイト・R・期限を入れてOPEN MATCHを作ります。", check:"「この条件で選手を探す」で名鑑へ戻れます。" },
  { no:"06", title:"興行を管理する", href:"/events", action:"興行に対戦枠を追加し、募集中・交渉中・決定を一覧で管理します。", check:"カード全体の穴がどこかを一画面で確認します。" },
  { no:"07", title:"連絡をまとめる", href:"/messages", action:"案件や興行に紐づくやり取りをチャットに残します。", check:"LINEや個人DMへ情報が散らばらない状態を目指します。" },
  { no:"08", title:"ジム側で受付状況を確認する", href:"/gym", action:"所属選手のMATCH STATUSを定期確認し、情報の鮮度を保ちます。", check:"「そのまま確認」で確認日時を更新するイメージです。" },
];

const terms = [
  ["MATCH STATUS","選手が現在、試合の相談を受けられるかを示すジム確認情報。公式戦績とは別です。"],
  ["OPEN MATCH","対戦相手を募集する公開案件。条件からそのまま選手検索へつなげます。"],
  ["マッチメイク案件","1つの対戦候補を、相談開始から試合決定まで管理する業務単位です。"],
  ["候補","まだ相談前のショートリスト。比較・検討のための一時保存です。"],
];

export default function GuidePage(){
  return <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8 lg:py-9">
    <section className="rounded-xl border border-[#d7dee5] bg-white p-5 sm:p-7">
      <p className="text-[10px] font-black tracking-[.12em] text-[#5c7387]">RINGOPS MANUAL</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-black sm:text-3xl">はじめての操作マニュアル</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">専門的なシステム知識は不要です。RINGOPSは「選手を探す → 相談する → 試合を決める → 興行を管理する」の順番だけ覚えれば使えます。</p></div>
        <Link className="rounded-md bg-[#16324a] px-4 py-3 text-xs font-black text-white" href="/">選手名鑑から始める</Link>
      </div>
    </section>

    <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">{steps.map(step=><article className="rounded-xl border border-[#dce2e8] bg-white p-4 sm:p-5" key={step.no}>
        <div className="flex gap-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#16324a] text-xs font-black text-white">{step.no}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-black">{step.title}</h2><Link className="text-xs font-black text-[#315d7d] underline underline-offset-4" href={step.href}>この画面を開く</Link></div><p className="mt-2 text-sm leading-6 text-slate-700">{step.action}</p><div className="mt-3 rounded-md bg-[#f3f6f8] px-3 py-2 text-[11px] font-bold leading-5 text-slate-600"><b className="text-slate-800">確認ポイント：</b>{step.check}</div></div></div>
      </article>)}</div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <section className="rounded-xl border border-[#dce2e8] bg-white p-4"><h2 className="text-sm font-black">興行主の最短ルート</h2><p className="mt-2 text-xs leading-5 text-slate-600">選手名鑑 → 候補 → 相談 → マッチメイク → 興行</p><Link className="mt-3 inline-flex text-xs font-black text-[#315d7d] underline underline-offset-4" href="/">選手を探す</Link></section>
        <section className="rounded-xl border border-[#dce2e8] bg-white p-4"><h2 className="text-sm font-black">ジムの最短ルート</h2><p className="mt-2 text-xs leading-5 text-slate-600">ジム管理 → 相談確認 → 案件承認 → 連絡</p><Link className="mt-3 inline-flex text-xs font-black text-[#315d7d] underline underline-offset-4" href="/gym">ジム管理を見る</Link></section>
        <section className="rounded-xl border border-[#dce2e8] bg-white p-4"><h2 className="text-sm font-black">用語</h2><dl className="mt-3 space-y-4">{terms.map(([term,body])=><div key={term}><dt className="text-xs font-black text-slate-900">{term}</dt><dd className="mt-1 text-[11px] leading-5 text-slate-600">{body}</dd></div>)}</dl></section>
        <section className="rounded-xl border border-[#c9d7e3] bg-[#edf4f8] p-4"><h2 className="text-sm font-black text-[#16324a]">確認モードについて</h2><p className="mt-2 text-[11px] leading-5 text-[#506579]">表示している選手・ジム・興行は確認用の架空データです。ボタン操作は本番DBを汚さず、この端末に保存されます。</p></section>
      </aside>
    </section>
  </main>;
}
