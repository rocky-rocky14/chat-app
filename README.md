# ChatSpace

Slack 風のシンプルなチームチャットアプリ。チャンネルと DM でテキストコミュニケーションができます。

## リンク

| 種別 | URL |
|------|-----|
| **本番アプリ** | https://chat-app-eight-teal-38.vercel.app |
| **GitHub リポジトリ** | https://github.com/rocky-rocky14/chat-app |
| **Vercel ダッシュボード** | https://vercel.com/rocky-rocky14s-projects/chat-app |

## 機能

- ワークスペースの作成・招待リンク共有
- 公開チャンネル（`#general` 自動作成）
- テキストメッセージの投稿・編集・削除
- ダイレクトメッセージ（DM）
- 未読バッジ
- リアルタイム更新（3 秒ポーリング）

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL (Neon) + Prisma
- **デプロイ**: Vercel

## 本番アプリへの接続

ブラウザで以下の URL にアクセスするだけで利用できます。

```
https://chat-app-eight-teal-38.vercel.app
```

### 初回利用の流れ

1. 表示名を入力してユーザー登録（ブラウザの localStorage に保存）
2. 「新規ワークスペース」からワークスペースを作成
3. 自動作成された `#general` チャンネルでメッセージを投稿

### メンバーの招待

ワークスペース作成者またはメンバーは、サイドバー下部の「招待リンクをコピー」から URL を共有できます。

```
https://chat-app-eight-teal-38.vercel.app/invite/{招待コード}
```

招待された人は表示名を設定したうえで、この URL からワークスペースに参加できます。

### 画面構成

| パス | 内容 |
|------|------|
| `/` | ワークスペース一覧 |
| `/w/{workspaceId}` | ワークスペース（`#general` へリダイレクト） |
| `/w/{workspaceId}/c/{channelId}` | 公開チャンネル |
| `/w/{workspaceId}/dm/{channelId}` | ダイレクトメッセージ |
| `/invite/{code}` | 招待参加ページ |

## ローカル開発環境への接続

### 前提条件

- Node.js 20 以上
- PostgreSQL データベース（[Neon](https://neon.tech/) 推奨）

### 1. リポジトリの取得

```bash
git clone https://github.com/rocky-rocky14/chat-app.git
cd chat-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` に PostgreSQL の接続文字列を設定します。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

**Neon を使う場合**

1. [Neon コンソール](https://console.neon.tech/) でプロジェクトを作成
2. 接続文字列（Connection string）をコピー
3. `.env` の `DATABASE_URL` に貼り付け

**Vercel 連携済みの DB をローカルから使う場合**

```bash
npx vercel link
npx vercel env pull .env.local
```

`.env.local` に `DATABASE_URL` が自動で設定されます。

### 4. データベースのマイグレーション

```bash
npx prisma migrate dev
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスします。

## Vercel へのデプロイ

Vercel のサーバーレス環境では PostgreSQL（Neon）が必要です。SQLite は使用できません。

### 初回デプロイ

```bash
# Vercel プロジェクトと連携
npx vercel link

# Neon 連携（初回はブラウザで利用規約への同意が必要）
npx vercel integration add neon --name chat-app-db --plan free_v3 -e production -e preview

# 環境変数をローカルに取得
npx vercel env pull .env.local

# 本番デプロイ
npx vercel deploy --prod
```

### 再デプロイ

`main` ブランチへのプッシュで自動デプロイされます。

```bash
git push origin main
```

手動でデプロイする場合:

```bash
npx vercel deploy --prod
```

### ビルド時の処理

`npm run build` 実行時に以下が自動で行われます。

1. `prisma generate` — Prisma クライアント生成
2. `prisma migrate deploy` — 本番 DB へスキーマ適用
3. `next build` — Next.js 本番ビルド

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DATABASE_URL` | はい | PostgreSQL 接続文字列（Neon 等） |

Vercel では Neon 連携時に `DATABASE_URL` が自動設定されます。ローカル開発時は `.env` または `.env.local` に手動で設定してください。

## 管理画面

| サービス | URL | 内容 |
|---------|-----|------|
| **Vercel ダッシュボード** | https://vercel.com/rocky-rocky14s-projects/chat-app | デプロイ状況・ログ・環境変数 |
| **Neon（Storage）** | Vercel ダッシュボードの Storage タブ | データベース管理 |

## 使い方

1. 初回アクセス時に表示名を入力
2. 「新規ワークスペース」からワークスペースを作成
3. `#general` チャンネルでメッセージを投稿
4. サイドバーから招待リンクをコピーしてメンバーを招待
5. メンバー一覧（サイドバーの人物アイコン）から DM を開始

## プロジェクト構成

```
src/
  app/
    page.tsx                         # ワークスペース一覧
    w/[id]/page.tsx                  # デフォルトチャンネルへリダイレクト
    w/[id]/c/[channelId]/page.tsx    # チャンネル
    w/[id]/dm/[channelId]/page.tsx   # DM
    invite/[code]/page.tsx           # 招待参加
    api/                             # API Routes
  components/                        # UI コンポーネント
  lib/                               # ユーティリティ
prisma/
  schema.prisma                      # データベーススキーマ
docs/
  REQUIREMENTS.md                    # 要件定義書
```

## リアルタイム更新について

Vercel サーバーレス環境では WebSocket / SSE の常時接続が制限されるため、MVP では **3 秒間隔のポーリング** で新着メッセージを取得します。未読バッジは 5 秒間隔で更新されます。

## 関連ドキュメント

- [要件定義書](docs/REQUIREMENTS.md)
- [デプロイ詳細](DEPLOYMENT.md)
