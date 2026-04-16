require("dotenv").config({ path: "../.env" });
const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require("discord.js");
const config = require("../config.json");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const SERVER_ID = process.env.DISCORD_SERVER_ID;

if (!TOKEN || !SERVER_ID) {
  console.error("❌ DISCORD_BOT_TOKEN と DISCORD_SERVER_ID を ../.env に設定してください");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── カテゴリ定義 ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: "📋 INFORMATION",
    channels: ["📣｜お知らせ", "🚨｜トレンドアラート"],
    permission: "information",
  },
  {
    name: "🤝 COMMUNITY",
    channels: [
      "👋｜自己紹介",
      "💬｜交流",
      "💭｜つぶやき",
      "📝｜日報",
      "📊｜週報",
      "📈｜月報",
      "💡｜情報提供",
      "🙋｜提案",
    ],
    permission: "community",
  },
  {
    name: "🔒 MANAGEMENT",
    channels: ["🔍｜監査報告", "📋｜業務連絡", "💬｜相談", "💡｜提案", "📝｜報告"],
    permission: "management",
  },
];

// ─── ロール定義 ───────────────────────────────────────────────────────────────
const ROLES = [
  { name: "BAYTAKE Member", color: 0xc9a84c },
  { name: "BAYTAKE Admin",  color: 0xb22222 },
  { name: "Developer",      color: 0xffffff },
];

// ─── 権限OverwriteビルダーHelpers ─────────────────────────────────────────────
function buildPermissionOverwrites(guild, roles, permissionType) {
  const memberRole = roles.get("BAYTAKE Member");
  const adminRole  = roles.get("BAYTAKE Admin");

  if (permissionType === "information") {
    // @everyone: 閲覧のみ (SendMessages拒否), Member: 閲覧のみ
    return [
      {
        id: guild.roles.everyone,
        allow: [PermissionFlagsBits.ViewChannel],
        deny:  [PermissionFlagsBits.SendMessages],
      },
      {
        id: memberRole,
        allow: [PermissionFlagsBits.ViewChannel],
        deny:  [PermissionFlagsBits.SendMessages],
      },
    ];
  }

  if (permissionType === "community") {
    // @everyone: 全拒否, Member: 閲覧+送信許可
    return [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: memberRole,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.UseExternalEmojis,
        ],
      },
    ];
  }

  if (permissionType === "management") {
    // @everyone: 全拒否, Member: 全拒否, Admin: 全許可
    return [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: memberRole,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: adminRole,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
    ];
  }

  return [];
}

// ─── メイン処理 ───────────────────────────────────────────────────────────────
async function setup(guild) {
  console.log(`\n🚀 BAYTAKEサーバーセットアップ開始: ${guild.name}\n`);

  // ── ① ロール作成 ─────────────────────────────────────────────────────────
  const createdRoles = new Map();

  for (const roleDef of ROLES) {
    const existing = guild.roles.cache.find((r) => r.name === roleDef.name);
    if (existing) {
      console.log(`⏭️  ロール既存スキップ: ${roleDef.name}`);
      createdRoles.set(roleDef.name, existing);
      continue;
    }
    const role = await guild.roles.create({
      name:   roleDef.name,
      color:  roleDef.color,
      reason: "BAYTAKE 自動セットアップ",
    });
    console.log(`✅ ロール作成: ${role.name}`);
    createdRoles.set(role.name, role);
  }

  console.log("");

  // ── ② カテゴリ＋チャンネル作成 ───────────────────────────────────────────
  for (const catDef of CATEGORIES) {
    // カテゴリ作成
    const existingCat = guild.channels.cache.find(
      (c) => c.name === catDef.name && c.type === ChannelType.GuildCategory
    );

    let category;
    if (existingCat) {
      console.log(`⏭️  カテゴリ既存スキップ: ${catDef.name}`);
      category = existingCat;
    } else {
      category = await guild.channels.create({
        name:                 catDef.name,
        type:                 ChannelType.GuildCategory,
        permissionOverwrites: buildPermissionOverwrites(guild, createdRoles, catDef.permission),
        reason:               "BAYTAKE 自動セットアップ",
      });
      console.log(`✅ カテゴリ作成: ${catDef.name}`);
    }

    // チャンネル作成
    for (const chName of catDef.channels) {
      const existingCh = guild.channels.cache.find(
        (c) => c.name === chName && c.parentId === category.id
      );
      if (existingCh) {
        console.log(`  ⏭️  チャンネル既存スキップ: ${chName}`);
        continue;
      }
      await guild.channels.create({
        name:   chName,
        type:   ChannelType.GuildText,
        parent: category,
        reason: "BAYTAKE 自動セットアップ",
      });
      console.log(`  ✅ チャンネル作成: ${chName}`);
    }

    console.log("");
  }

  console.log("🎉 セットアップ完了！");
}

// ─── Bot起動 ─────────────────────────────────────────────────────────────────
client.once("ready", async () => {
  console.log(`🤖 Botログイン: ${client.user.tag}`);

  const guild = client.guilds.cache.get(SERVER_ID);
  if (!guild) {
    console.error(`❌ サーバーが見つかりません。DISCORD_SERVER_ID を確認してください: ${SERVER_ID}`);
    process.exit(1);
  }

  try {
    await setup(guild);
  } catch (err) {
    console.error("❌ セットアップエラー:", err.message);
    process.exit(1);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(TOKEN);
