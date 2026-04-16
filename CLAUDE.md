# BAYTAKE

## プロジェクト概要
eBayマーケットを先読みする招待制データコミュニティ
有料メンバーシップ / Discord連携 / トレンドアラート配信

## ブランド
- カラー: 黒 #0A0A0A / 金 #C9A84C / 赤 #B22222
- フォント: Arial Black（見出し）
- タグライン: TAKE OVER THE BAY

## リポジトリ構成
baytake/（親）
├── discord/          ← Discord設定・Bot
│   ├── .env.example  ← トークンテンプレート（コミットOK）
│   ├── .env          ← 実際の値（.gitignore・絶対コミット禁止）
│   ├── config.json   ← チャンネル・ロール設定（コミットOK）
│   └── bot/          ← Discord Bot本体
├── src/
│   ├── frontend/     ← GAS Webアプリ
│   └── backend/      ← バックエンド
└── docs/             ← 設計ドキュメント

## 関連リポジトリ（子）
- marketplace-scraper: Terapeak・メルカリ・ヤフオクデータ収集
- bay-auto: eBay自動化ツール

## 技術スタック（フェーズ1）
- フロントエンド: HTML/CSS/JS（GAS Webアプリ）
- バックエンド: Google Apps Script
- データ: Google Sheets（marketplace-scraperと連携）
- 通知: Discord Webhook
- 開発: Claude Code + claude --chrome

## フェーズ1 実装タスク
- [ ] Discordサーバーチャンネル自動セットアップBot
- [ ] トレンドアラート自動投稿Bot
- [ ] ダッシュボード画面（トレンドデータ表示）
- [ ] メンバー認証（招待制）
- [ ] Stripe連携（有料メンバーシップ）

## セキュリティルール
- discord/.env は絶対にGitHubにコミットしない
- Botトークンは .env.example にテンプレートのみ記載
- 実際のトークンは別途Shingoさんが .env に手動入力

## VPS移行後（フェーズ2）
- さくらVPS（jarvis-claude.uk）でWebサイト本格稼働
- Stripe決済・メンバー管理システム
- PostgreSQL（Jarvis CRM既存DB）
