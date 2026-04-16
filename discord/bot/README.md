# BAYTAKE Discord Bot

## セットアップ手順

### 1. .env を作成
```bash
cp ../.env.example ../.env
```
`.env` に以下を入力:
```
DISCORD_BOT_TOKEN=（Discord Developer PortalのBotトークン）
DISCORD_SERVER_ID=（BAYTAKEサーバーのID）
```

### 2. サーバー自動セットアップ
```bash
npm run setup
```

## Bot権限（Discord Developer Portalで設定）
- Manage Channels
- Manage Roles
- View Channels
- Send Messages
