# RINGOPS

日本のプロボクシング業界向け業務プラットフォーム。

RINGOPSは、選手検索、マッチメイク受付、対戦相手募集、案件管理、興行管理、関係者間連絡を一つにつなぐことを目的とします。

## 開発方針

- 日本語中心の業務UI
- 選手名鑑と検索を最優先
- MATCH STATUSは公式戦績と分離
- JBC等の外部データはProvider方式で将来接続
- 許諾未確認のサイトを前提にした本番スクレイピングは行わない
- Supabase RLSで組織・権限をDB側から制御
- TREASUREチケットシステムとは独立運用し、将来共通IDで連携

## 環境変数

`.env.example` を参照してください。

## Supabase

`ringops` schemaをData APIから利用する場合、Supabase DashboardのAPI設定で `ringops` をExposed schemasへ追加してください。

## ローカル起動

```bash
npm install
npm run dev
```
