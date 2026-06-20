# ChatSpace デプロイ情報

Vercel への本番デプロイに関する情報をまとめたドキュメントです。

## 本番 URL

| 種別 | URL |
|------|-----|
| **本番アプリ** | https://chat-app-eight-teal-38.vercel.app |
| **GitHub リポジトリ** | https://github.com/rocky-rocky14/chat-app |

## 管理画面

| サービス | URL | 内容 |
|---------|-----|------|
| **Vercel ダッシュボード** | https://vercel.com/rocky-rocky14s-projects/chat-app | デプロイ状況・ログ・環境変数 |
| **Neon（Storage）** | Vercel ダッシュボードの Storage タブ | データベース管理 |

## 実施内容

### 1. Vercel プロジェクト作成・連携

- Vercel プロジェクト `chat-app` を作成
- GitHub リポジトリ（`rocky-rocky14/chat-app`）と連携
- `main` ブランチへのプッシュで自動デプロイ

### 2. データベース（PostgreSQL + Neon）

- Vercel Marketplace 経由で Neon を連携
- データベース名: `chat-app-db`
- プラン: **Free（`free_v3`）**
- 環境: Production / Preview

### 3. 本番デプロイ

- `prisma migrate deploy` で本番 DB にスキーマ適用
- Next.js ビルド成功
- 本番 URL で動作確認済み

### 4. Vercel 向け調整

- リアルタイム更新: SSE ではなく **3 秒ポーリング** を採用（サーバーレス制約対応）
- ビルド時に `prisma generate && prisma migrate deploy && next build` を実行
- `.vercelignore` でローカル `.env` がアップロードされないよう設定

## 現在のプラン

| サービス | プラン | 月額 |
|---------|--------|------|
| **Vercel** | Hobby（無料） | $0 |
| **Neon（DB）** | Free（`free_v3`） | $0 |

## 再デプロイ手順

```bash
# コードをプッシュすると自動デプロイ
git push origin main

# 手動デプロイ
npx vercel deploy --prod
```
