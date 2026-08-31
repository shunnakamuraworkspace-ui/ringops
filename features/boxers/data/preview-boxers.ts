export type Ranking = { body: string; rank: number | null; title?: string };
export type BoxerPreview = {
  id: string; name: string; kana: string; gym: string; prefecture: string; nationality: string;
  countryCode?: string; domesticOrInternational?: "国内" | "海外"; competitionCategory?: "男子" | "女子";
  division: string; boxerClass: "A級" | "B級" | "C級"; stance: "右" | "左";
  totalBouts: number; wins: number; losses: number; draws: number; koWins: number;
  rankings: Ranking[]; lastBout: string; nextBout: string | null; nextVenue: string | null;
  status: "受付中" | "条件次第" | "受付停止"; available: string; availableMonth: string;
  rounds: number[]; minWeight: number; maxWeight: number; travel: string; verified: string;
  heightCm: number; reachCm: number; birthDate: string; instagram?: string;
};

export const boxerPreviewData: BoxerPreview[] = [
  { id:"20000000-0000-4000-8000-000000000001", name:"山田 直樹", kana:"やまだ なおき", gym:"青空ボクシングジム", prefecture:"東京都", nationality:"日本", countryCode:"JP", domesticOrInternational:"国内", competitionCategory:"男子", division:"スーパーバンタム級", boxerClass:"B級", stance:"右", totalBouts:8, wins:6, losses:2, draws:0, koWins:3, rankings:[], lastBout:"2026.06.12", nextBout:null, nextVenue:null, status:"受付中", available:"2026年11月以降", availableMonth:"2026-11", rounds:[6], minWeight:55.0, maxWeight:55.5, travel:"国内可", verified:"3日前", heightCm:169, reachCm:171, birthDate:"2000-02-14", instagram:"https://instagram.com/" },
  { id:"20000000-0000-4000-8000-000000000002", name:"佐藤 海斗", kana:"さとう かいと", gym:"東都ファイトジム", prefecture:"東京都", nationality:"日本", countryCode:"JP", domesticOrInternational:"国内", competitionCategory:"男子", division:"スーパーバンタム級", boxerClass:"B級", stance:"左", totalBouts:7, wins:5, losses:1, draws:1, koWins:2, rankings:[{body:"日本",rank:14}], lastBout:"2026.05.28", nextBout:"2026.09.18", nextVenue:"後楽園ホール", status:"条件次第", available:"次戦後に相談可", availableMonth:"2026-11", rounds:[6,8], minWeight:54.5, maxWeight:55.5, travel:"要相談", verified:"今日", heightCm:171, reachCm:174, birthDate:"1999-08-02" },
  { id:"20000000-0000-4000-8000-000000000003", name:"鈴木 蓮", kana:"すずき れん", gym:"港町ボクシングクラブ", prefecture:"神奈川県", nationality:"日本", countryCode:"JP", domesticOrInternational:"国内", competitionCategory:"男子", division:"フェザー級", boxerClass:"A級", stance:"右", totalBouts:13, wins:10, losses:3, draws:0, koWins:6, rankings:[{body:"OPBF",rank:11},{body:"日本",rank:8}], lastBout:"2026.07.03", nextBout:"2026.10.08", nextVenue:"後楽園ホール", status:"受付停止", available:"—", availableMonth:"", rounds:[8], minWeight:57.0, maxWeight:57.5, travel:"国内可", verified:"5日前", heightCm:173, reachCm:176, birthDate:"1997-11-19" },
  { id:"20000000-0000-4000-8000-000000000004", name:"高橋 悠真", kana:"たかはし ゆうま", gym:"北辰ボクシングジム", prefecture:"埼玉県", nationality:"日本", countryCode:"JP", domesticOrInternational:"国内", competitionCategory:"男子", division:"ライト級", boxerClass:"C級", stance:"左", totalBouts:3, wins:2, losses:1, draws:0, koWins:1, rankings:[], lastBout:"2026.04.21", nextBout:null, nextVenue:null, status:"受付中", available:"今すぐ", availableMonth:"2026-09", rounds:[4], minWeight:61.0, maxWeight:61.5, travel:"関東のみ", verified:"8日前", heightCm:175, reachCm:178, birthDate:"2002-05-06" },
  { id:"20000000-0000-4000-8000-000000000005", name:"中村 拓海", kana:"なかむら たくみ", gym:"西東京ボクシングジム", prefecture:"東京都", nationality:"日本", countryCode:"JP", domesticOrInternational:"国内", competitionCategory:"男子", division:"スーパーフェザー級", boxerClass:"A級", stance:"右", totalBouts:16, wins:12, losses:3, draws:1, koWins:7, rankings:[{body:"WBO Asia Pacific",rank:9},{body:"OPBF",rank:13}], lastBout:"2026.08.02", nextBout:null, nextVenue:null, status:"受付中", available:"2026年12月以降", availableMonth:"2026-12", rounds:[8,10], minWeight:58.5, maxWeight:59.5, travel:"国内可", verified:"昨日", heightCm:174, reachCm:177, birthDate:"1996-03-27" },
  { id:"20000000-0000-4000-8000-000000000007", name:"藤本 美咲", kana:"ふじもと みさき", gym:"桜ヶ丘ボクシングジム", prefecture:"東京都", nationality:"日本", countryCode:"JP", domesticOrInternational:"国内", competitionCategory:"女子", division:"フライ級", boxerClass:"B級", stance:"右", totalBouts:6, wins:5, losses:1, draws:0, koWins:2, rankings:[], lastBout:"2026.06.29", nextBout:null, nextVenue:null, status:"受付中", available:"2026年10月以降", availableMonth:"2026-10", rounds:[6], minWeight:49.8, maxWeight:51.0, travel:"国内遠征可", verified:"2日前", heightCm:158, reachCm:160, birthDate:"2001-07-18" },
  { id:"20000000-0000-4000-8000-000000000008", name:"マルコ・サントス", kana:"マルコ サントス", gym:"Pacific Boxing Club", prefecture:"海外", nationality:"フィリピン", countryCode:"PH", domesticOrInternational:"海外", competitionCategory:"男子", division:"スーパーバンタム級", boxerClass:"A級", stance:"左", totalBouts:15, wins:11, losses:3, draws:1, koWins:5, rankings:[{body:"WBO Asia Pacific",rank:15}], lastBout:"2026.07.19", nextBout:null, nextVenue:null, status:"条件次第", available:"2026年11月以降", availableMonth:"2026-11", rounds:[8], minWeight:54.0, maxWeight:55.5, travel:"日本遠征可・条件相談", verified:"4日前", heightCm:168, reachCm:172, birthDate:"1998-10-09" }
];

export const divisions = [
  "アトム級",
  "ミニフライ級",
  "ミニマム級",
  "ライトフライ級",
  "フライ級",
  "スーパーフライ級",
  "バンタム級",
  "スーパーバンタム級",
  "フェザー級",
  "スーパーフェザー級",
  "ライト級",
  "スーパーライト級",
  "ウェルター級",
  "スーパーウェルター級",
  "ミドル級",
  "スーパーミドル級",
  "ライトヘビー級",
  "クルーザー級",
  "ヘビー級",
];
