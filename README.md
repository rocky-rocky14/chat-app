# ChatSpace

Slack 風のシンプルなチームチャットアプリ。チャンネルと DM でテキストコミュニケーションができます。

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

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# DATABASE_URL に PostgreSQL の接続文字列を設定

# データベースのマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアプリにアクセスできます。

## Vercel へのデプロイ

Vercel のサーバーレス環境では PostgreSQL（Neon）が必要です。

```bash
# 1. Neon 連携（初回はブラウザで利用規約への同意が必要）
npx vercel integration add neon --name chat-app-db --plan free -e production -e preview

# 2. 環境変数をローカルに取得
npx vercel env pull .env.local

# 3. 本番デプロイ
npx vercel deploy --prod
```

ビルド時に `prisma migrate deploy` が自動実行され、本番 DB にスキーマが適用されます。

## 使い方

1. 初回アクセス時に表示名を入力
2. 「新規ワークスペース」からワークスペースを作成
3. `#general` チャンネルでメッセージを投稿
4. サイドバーから招待リンクをコピーしてメンバーを招待
5. メンバー一覧から DM を開始

## プロジェクト構成

```
src/
  app/
    page.tsx                         # ワークスペース一覧
    w/[id]/page.tsx                  # デフォルトチャンネルへリダイレクト
    w/[id]/c/[channelId]/page.tsx    # チャンネル
    w/[id]/dm/[channelId]/page.tsx   # DM
    invite/[code]/page.tsx             # 招待参加
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
