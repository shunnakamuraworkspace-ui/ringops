"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BoxerPreview } from "@/features/boxers/data/preview-boxers";
import { StatusMark } from "@/components/ops-ui";
import { createClient } from "@/lib/supabase/client";

export function ConsultationForm({ boxer, databaseConnected }: { boxer: BoxerPreview; databaseConnected: boolean }) {
  const router = useRouter();
  const defaultWeight = boxer.minWeight && boxer.maxWeight ? ((boxer.minWeight + boxer.maxWeight) / 2).toFixed(1) : "";
  const defaultRounds = String(boxer.rounds[0] ?? 6);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [weight, setWeight] = useState(defaultWeight);
  const [rounds, setRounds] = useState(defaultRounds);
  const [message, setMessage] = useState("");

  function fillExample() {
    setEvent("秋季プロボクシング興行");
    setDate("2026-10-24");
    setVenue("後楽園ホール");
    setWeight(defaultWeight || "55.0");
    setRounds(defaultRounds);
    setMessage("対戦候補として条件をご相談したいです。日程・ウェイトをご確認ください。");
  }

  function saveLocalCase() {
    const existing = JSON.parse(localStorage.getItem("ringops_cases") || "[]") as unknown[];
    const id = `case-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const item = {id,boxerAId:null,boxerA:null,boxerBId:boxer.id,boxerB:boxer.name,event,date,venue,weight:`${weight}kg`,rounds:Number(rounds),message,status:"相談中",createdAt:now};
    localStorage.setItem("ringops_cases", JSON.stringify([item, ...existing]));
    const messages = JSON.parse(localStorage.getItem("ringops_case_messages") || "{}") as Record<string, unknown[]>;
    messages[id] = [{ id: `msg-${crypto.randomUUID()}`, sender: "自組織", body: message || "相談を開始しました。", createdAt: now }];
    localStorage.setItem("ringops_case_messages", JSON.stringify(messages));
    router.push(`/matchmaking?created=${encodeURIComponent(id)}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();setSaving(true);setError("");
    try {
      if (databaseConnected) {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data, error: rpcError } = await supabase.schema("ringops").rpc("start_boxer_consultation", {p_boxer_id: boxer.id,p_event_name: event,p_event_date: date,p_contract_weight_kg: Number(weight),p_rounds: Number(rounds),p_message: message || "対戦候補として相談を開始しました。"});
          if (rpcError) throw rpcError;
          if (venue) { const { error: venueError } = await supabase.schema("ringops").from("matchmaking_cases").update({ venue_name: venue }).eq("id", data); if (venueError) throw venueError; }
          router.push(`/matchmaking?created=${encodeURIComponent(String(data))}`);return;
        }
      }
      saveLocalCase();
    } catch { setError("相談を登録できませんでした。入力内容を確認してください。"); setSaving(false); }
  }

  return <form className="border-y border-[var(--ringops-line-strong)] bg-white" onSubmit={submit}>
    <div className="grid border-b border-[var(--ringops-line-strong)] bg-[#f8f8f5] lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="px-4 py-4"><div className="flex flex-wrap items-baseline gap-3"><h2 className="text-lg font-black">{boxer.name}</h2><span className="text-[11px] font-bold text-slate-500">{boxer.gym}</span></div><p className="mt-1 text-[10px] font-bold text-slate-400">{boxer.division} · {boxer.boxerClass} · {boxer.wins}-{boxer.losses}{boxer.draws ? `-${boxer.draws}` : ""}</p></div>
      <div className="border-t border-[var(--ringops-line)] px-4 py-3 lg:border-l lg:border-t-0"><StatusMark label={boxer.status} tone={boxer.status === "受付中" ? "open" : boxer.status === "条件次第" ? "conditional" : "paused"} compact /><p className="mt-1 text-[10px] text-slate-500">{boxer.minWeight && boxer.maxWeight ? `${boxer.minWeight.toFixed(1)}–${boxer.maxWeight.toFixed(1)}kg` : "契約kg 要確認"} · {boxer.rounds.map((value) => `${value}R`).join(" / ")}</p></div>
    </div>

    {error ? <p className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">{error}</p> : null}

    <div className="grid lg:grid-cols-[160px_1fr]">
      <div className="border-b border-[var(--ringops-line)] px-4 py-3 lg:border-b-0 lg:border-r"><p className="ops-label">試合条件</p><p className="mt-2 text-[10px] leading-5 text-slate-400">決まっている項目だけ入力してください。</p>{!databaseConnected ? <button className="ops-text-action mt-3" onClick={fillExample} type="button">入力例をセット</button> : null}</div>
      <div className="grid gap-0 sm:grid-cols-2">
        <Field label="興行名"><input className="input" required value={event} onChange={(e) => setEvent(e.target.value)} placeholder="10月後楽園興行" /></Field>
        <Field label="試合予定日"><input className="input" required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="契約ウェイト"><input className="input" inputMode="decimal" required type="number" step="0.1" min="35" max="150" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="55.0" /></Field>
        <Field label="ラウンド"><select className="input" value={rounds} onChange={(e) => setRounds(e.target.value)}>{[4, 6, 8, 10, 12].map((v) => <option value={v} key={v}>{v}R</option>)}</select></Field>
        <Field label="会場"><input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="後楽園ホール" /></Field>
        <Field label="メモ"><input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="補足条件" /></Field>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ringops-line-strong)] px-4 py-3"><p className="text-[10px] font-bold text-slate-400">送信後はマッチメイク案件へ直接移動します。</p><button className="ops-primary" disabled={saving} type="submit">{saving ? "登録中…" : "相談を開始"}</button></div>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="border-b border-[var(--ringops-line)] p-3 sm:border-r last:sm:border-r-0"><span className="ops-label mb-1.5 block">{label}</span>{children}</label>; }
