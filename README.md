# One Path Study 基幹運営アプリ

集団指導形式の大学受験塾「One Path Study」向けの基幹運営システムです。
生徒名簿・クラス編成/授業スケジュール・出欠管理・演習/要約提出トラッキング・
月次面談記録・社内タスク/相談機能の MVP 6機能（提案書 3-1〜3-6）を実装して
います。詳細な仕様は提案書を参照してください。

## 技術スタック

- Next.js (App Router / TypeScript) + Tailwind CSS v4
- Prisma ORM + PostgreSQL
- NextAuth (Auth.js) v5 Credentials Provider による社員番号＋パスワード認証

## セットアップ（ローカル開発）

Postgres が必要です。ローカルに無ければ Docker で立てるのが手軽です。

```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -e POSTGRES_DB=onepathstudy \
  postgres:16

npm install
cp .env.example .env   # NEXTAUTH_SECRET を発行して設定してください
npx prisma migrate dev # DBマイグレーションを適用
npm run dev
```

（`npm run dev` はシードを自動実行しません。初回だけ `npm run db:seed` を
実行してください。`npm run build` はマイグレーション適用とシードを自動で
行います＝本番デプロイ時に手動操作は不要です。）

`http://localhost:3000` を開き、以下のシードアカウント（社員番号でログイン）
で入れます。初期パスワードは全員共通で `onepath` で、初回ログイン時に
パスワード変更が必須です（変更が完了するまで他の画面には進めません）。

| 氏名 | 社員番号 | 役職 |
|---|---|---|
| 梅本隼人 | 026001 | 役員 |
| 木村朝陽 | 026002 | 役員 |
| 宮坂優里 | 026003 | 本部社員 |

新しい社員の追加・役職変更・パスワードリセットは、役員アカウントで
`/settings` から行えます。

## 主なコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` / `npm run start` | 本番ビルド / 起動 |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | マイグレーション作成・適用（開発用） |
| `npm run db:seed` | シードデータ投入（科目・校舎マスタ、初期社員） |
| `npx prisma studio` | DBの中身をブラウザで確認 |

## 環境変数

`.env.example` を参照してください。`NEXTAUTH_URL` は意図的に設定していません
（`auth.config.ts` で `trustHost: true` を指定し、リクエスト先のホストから
自動判定します）。これにより Vercel のプレビューデプロイ等、実行時に
ドメインが変わる環境でもそのまま動作します。固定ドメインに限定したい場合の
み `NEXTAUTH_URL` を設定してください。

## Vercel へのデプロイ手順

1. [vercel.com](https://vercel.com) にアクセスし、GitHub アカウントでログイン。
2. 「Add New...」→「Project」→ この `onepathstudy` リポジトリを Import。
   （リポジトリはブランチが1本のみなので、そのままで問題ありません）
3. データベースを用意する：プロジェクト作成画面または作成後の
   「Storage」タブから「Create Database」→ Postgres を選択して接続
   （Neon 等のマーケットプレイス経由になる場合があります。名前は何でも
   構いません）。作成すると接続文字列が発行されます。
4. 「Settings」→「Environment Variables」で以下を設定：
   - `DATABASE_URL`：手順3で発行された接続文字列をそのまま貼り付け
     （Vercel の Postgres 連携が `POSTGRES_URL` 等の別名で変数を追加する
     場合は、値をコピーして `DATABASE_URL` という名前で追加してください）
   - `NEXTAUTH_SECRET`：ランダムな文字列（下記コマンドで生成できます）
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
5. 「Deploy」を押す。ビルド時に `npm run build` が自動実行され、
   マイグレーション適用・初期社員アカウント投入まで自動で完了します。
6. デプロイ完了後に発行される URL（例: `onepathstudy.vercel.app`）を
   梅本さん・木村さん・宮坂さんで共有してください。社員番号（026001/
   026002/026003）と初期パスワード「onepath」でログインできます。

以降、このブランチに新しいコミットを push するたびに Vercel が自動で
再デプロイします。

## メール通知（任意）

タスクを割り当てたとき／相談・クレームを投稿したとき、担当者にメール通知
を送れます（[Resend](https://resend.com) を利用）。設定しなくてもアプリ
自体は問題なく動作します（通知だけスキップされます）。

1. [resend.com](https://resend.com) で無料アカウントを作成し、API キーを発行
2. Vercel の「Environment Variables」に `RESEND_API_KEY` としてそのキーを追加
3. 各社員のメールアドレスを `/settings` の編集画面から登録
4. 再デプロイ（新しいコミットを push するか、Redeploy）

独自ドメイン（例: `onepathstudy.com`）をResendで認証すれば、送信元アドレス
を `RESEND_FROM_EMAIL` で好きなものに変更できます。未設定の間は
`onboarding@resend.dev` から送信されます。

## 役職別アクセス範囲（提案書 3-7）

`lib/permissions.ts` に集約しています。

| 役職 | 範囲 |
|---|---|
| 講師 (TEACHER) | 自分が担当するクラスの出欠・演習提出のみ。生徒名簿・設定は非表示。タスク/相談は自分が担当者・作成者・投稿者のもののみ閲覧可 |
| 校舎スタッフ (STAFF) | 所属校舎の生徒名簿・クラス・出欠・演習提出。タスク/相談は講師と同様に自分の関与分のみ |
| 本部社員 (HQ) | 全校舎の生徒・クラス・出欠・演習提出・タスク・相談を横断閲覧（設定は不可） |
| 役員 (EXECUTIVE) | 全機能に加え、社員・役職・校舎・科目マスタの管理（`/settings`）、相談ステータスの管理者権限 |

## ディレクトリ構成の要点

- `app/(app)/` … ログイン後の画面（ダッシュボード・タスク/相談・生徒名簿・
  クラス・出欠・演習提出・面談記録・設定）
- `app/actions/` … 各機能の Server Actions（フォーム送信の処理）
- `auth.ts` / `auth.config.ts` / `proxy.ts` … 認証とルート保護
  （Next.js 16 では `middleware.ts` が `proxy.ts` に名称変更されています）
- `lib/permissions.ts` / `lib/classAccess.ts` … 役職別アクセス制御ロジック
- `prisma/schema.prisma` … データモデル定義（前提や判断の根拠はファイル内コメント参照）

## 設計判断メモ（提案書に明記のない項目）

ユーザーへの確認を経て以下の方針で実装しています。

- 個人宛タスクのステータスは「未対応 / 対応中 / 完了」の3段階。
- 相談・クレームに返信スレッド機能は設けず、投稿とステータス変更のみ。
- 相談・クレームは生徒への任意紐付けが可能（生徒名簿と連携、必須ではない）。
- 校舎（キャンパス）は最初から複数校舎に対応するデータ構造を用意（`Campus` モデル）。
- 業務効率化のため、タスク・相談の担当者へのメール通知機能を追加（`User.email`、`lib/email.ts`）。

その他、提案書に記載のない実装判断は `prisma/schema.prisma` 冒頭のコメントに
まとめています（例: `ClassSession` の追加理由、生徒の在籍ステータス追加など）。
