# One Path Study 基幹管理アプリ

生徒管理・授業スケジュール・演習問題データベース・進捗記録を一元管理する、
One Path Study の運営者向け管理システムです。詳細な仕様は設計書を参照してください。

## 技術スタック

- Next.js (App Router / TypeScript) + Tailwind CSS v4
- Prisma ORM + SQLite（`prisma/dev.db`。将来的に PostgreSQL 等へ移行しやすい構成）
- NextAuth (Auth.js) v5 Credentials Provider によるメール＋パスワード認証

## セットアップ

```bash
npm install
cp .env.example .env   # NEXTAUTH_SECRET を発行して設定してください
npx prisma migrate dev # DBマイグレーションを適用
npm run db:seed        # 科目・対象大学マスタと初期ユーザーを投入
npm run dev
```

`http://localhost:3000` を開き、以下のシードアカウントでログインできます。

| 氏名 | メールアドレス | パスワード |
|---|---|---|
| 梅本隼人 | umemoto@onepathstudy.com | onepath2027 |
| 木村朝陽 | kimura@onepathstudy.com | onepath2027 |

初期パスワードは開発用の仮パスワードです。本番運用前に変更、または
`/settings` の講師アカウント編集からパスワードを再設定してください。

## 主なコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` / `npm run start` | 本番ビルド / 起動 |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | マイグレーション作成・適用（開発用） |
| `npm run db:seed` | シードデータ投入（科目・対象大学マスタ、初期ユーザー） |
| `npx prisma studio` | DBの中身をブラウザで確認 |

## 環境変数

`.env.example` を参照してください。`NEXTAUTH_URL` は意図的に設定していません
（`auth.config.ts` で `trustHost: true` を指定し、リクエスト先のホストから
自動判定します）。これにより Vercel のプレビューデプロイ等、実行時に
ドメインが変わる環境でもそのまま動作します。固定ドメインに限定したい場合の
み `NEXTAUTH_URL` を設定してください。

## デプロイに関する注意

- 想定ホスティングは Vercel です。SQLite をそのまま使う場合、Vercel の
  サーバーレス環境はファイルシステムが実行間で永続化されないため、
  本番運用では Turso 等の SQLite 互換サービス、または `DATABASE_URL` を
  変更して PostgreSQL 等へ切り替えることを推奨します（Prisma のスキーマは
  移行しやすいよう標準的な型で設計しています）。
- 本番デプロイ時は `npx prisma migrate deploy` でマイグレーションを適用し、
  初回のみ `npm run db:seed` を実行してください。

## ディレクトリ構成の要点

- `app/(app)/` … ログイン後の画面（ダッシュボード・生徒管理・スケジュール・
  演習データベース・進捗記録・設定）
- `app/actions/` … 各機能の Server Actions（フォーム送信の処理）
- `auth.ts` / `auth.config.ts` / `proxy.ts` … 認証とルート保護
  （Next.js 16 では `middleware.ts` が `proxy.ts` に名称変更されています）
- `prisma/schema.prisma` … データモデル定義

## 設計判断メモ

- 設計書では `ProgressLog.relatedProblemIds` を配列フィールドとしていますが、
  SQLite が scalar list 型をサポートしないため、`Problem` と `ProgressLog` の
  多対多リレーションとして実装しています（意味的には同一です）。
- 対象大学は `Student.targetUniversity` / `Problem.university` が自由入力
  項目である一方、設定画面から候補マスタ（`University`）を編集できるように
  しています。フォームでは自由入力＋マスタ候補の入力補完（datalist）を
  併用しています。
