# BAYTAKE

## プロジェクト概要
eBayマーケットを先読みする招待制データコミュニティ
有料メンバーシップ / Discord連携 / トレンドアラート配信

## ブランド
- カラー: 黒 #0A0A0A / 金 #C9A84C / 赤 #B22222
- フォント: Arial Black（見出し）
- タグライン: TAKE OVER THE BAY

## 技術スタック（フェーズ1）
- フロントエンド: HTML / CSS / JS（GAS Webアプリ）
- バックエンド: Google Apps Script
- データ: Google Sheets（marketplace-scraperと連携）
- 通知: Discord Webhook
- 開発: Claude Code + claude --chrome

## フェーズ1 実装タスク
- [ ] ダッシュボード画面（トレンドデータ表示）
- [ ] メンバー認証（招待制）
- [ ] Discord Bot（アラート自動投稿）
- [ ] Stripe連携（有料メンバーシップ）

## 関連リポジトリ
- marketplace-scraper: データ収集
- sales-ops-with-claude: 全体管理

## ポート・サービス
- フェーズ2以降: さくらVPS（jarvis-claude.uk）
