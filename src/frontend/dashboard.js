/* BAYTAKE Dashboard — Data fetch & render logic */

// ── 状態管理 ──────────────────────────────────────────────────────────────────
const state = {
  data: null,
  alerts: null,
  summary: null,
  loading: { data: true, alerts: true },
};

// ── 初期化 ────────────────────────────────────────────────────────────────────
function init() {
  google.script.run
    .withSuccessHandler(onDataLoaded)
    .withFailureHandler((e) => onError("data", e))
    .getData();

  google.script.run
    .withSuccessHandler(onAlertsLoaded)
    .withFailureHandler((e) => onError("alerts", e))
    .getAlerts();
}

// ── データ受信ハンドラ ─────────────────────────────────────────────────────────
function onDataLoaded(result) {
  state.loading.data = false;

  if (result.error) {
    showError("data-section", result.error);
    return;
  }

  state.data = result;
  renderSummary(result);
  renderDataTable(result.rows || []);
}

function onAlertsLoaded(result) {
  state.loading.alerts = false;

  if (result.error) {
    showError("alerts-section", result.error);
    return;
  }

  state.alerts = result;
  renderAlerts(result.alerts || []);
}

function onError(section, err) {
  console.error(`[${section}] エラー:`, err);
  showError(section + "-section", err.message || "データ取得に失敗しました");
}

// ── サマリー描画 ───────────────────────────────────────────────────────────────
function renderSummary(result) {
  const lastUpdatedEl = document.getElementById("last-updated");
  const totalItemsEl  = document.getElementById("total-items");
  const sheetNameEl   = document.getElementById("sheet-name");

  if (lastUpdatedEl) {
    const sheet = result.sheetName || "";
    // YYYYMMDD_HHMM_JST → YYYY/MM/DD HH:MM JST
    const fmt = sheet.replace(
      /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})_JST$/,
      "$1/$2/$3 $4:$5 JST"
    );
    lastUpdatedEl.textContent = fmt || "—";
  }

  if (totalItemsEl) {
    totalItemsEl.textContent = Number(result.totalRows || 0).toLocaleString();
  }

  if (sheetNameEl) {
    sheetNameEl.textContent = result.sheetName || "—";
  }
}

// ── アラート描画 ───────────────────────────────────────────────────────────────
function renderAlerts(alerts) {
  const container = document.getElementById("alerts-container");
  if (!container) return;

  const countEl = document.getElementById("alert-count");
  if (countEl) countEl.textContent = alerts.length;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="padding:24px;color:#666;text-align:center;">
        直近48時間のアラート対象商品はありません
      </div>`;
    return;
  }

  container.innerHTML = alerts
    .map((item) => {
      const price = parseFloat(item.avg_sold_price || 0);
      const sold  = item.total_sold_count || 0;
      const cond  = item.condition || "—";
      const title = escHtml(item.title || "タイトル不明");
      const url   = item.item_url || "#";

      return `
        <div class="alert-card">
          <div class="alert-price">$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="alert-title">
            <a href="${url}" target="_blank" rel="noopener">${title}</a>
          </div>
          <div class="alert-meta">
            <span>📦 ${escHtml(cond)}</span>
            <span>🔁 ${sold}件落札</span>
          </div>
        </div>`;
    })
    .join("");
}

// ── データテーブル描画 ─────────────────────────────────────────────────────────
function renderDataTable(rows) {
  const tbody = document.getElementById("data-tbody");
  if (!tbody) return;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#555;">データなし</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((row, i) => {
      const price   = parseFloat(row.avg_sold_price || 0);
      const sold    = row.total_sold_count || "—";
      const cond    = row.condition || row.price ? (row.condition || "—") : "—";
      const seller  = row.seller_name || "—";
      const title   = escHtml(row.title || "—");
      const url     = row.item_url || "#";
      const condCls = conditionClass(cond);

      return `
        <tr>
          <td class="rank-num">${i + 1}</td>
          <td class="td-title">
            <a href="${url}" target="_blank" rel="noopener" title="${title}">${title}</a>
          </td>
          <td class="td-price">
            $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td class="td-condition">
            <span class="condition-badge ${condCls}">${escHtml(cond)}</span>
          </td>
          <td style="text-align:center;color:#888;">${sold}</td>
          <td class="td-seller">${escHtml(seller)}</td>
        </tr>`;
    })
    .join("");
}

// ── ユーティリティ ─────────────────────────────────────────────────────────────
function conditionClass(cond) {
  const c = (cond || "").toLowerCase();
  if (c.includes("new") || c.includes("新品")) return "cond-new";
  if (c.includes("psa") || c.includes("bgs") || c.includes("cgc") || c.includes("graded")) return "cond-graded";
  return "cond-used";
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showError(sectionId, message) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const inner = el.querySelector(".loading, .alerts-grid, .table-wrap");
  if (inner) {
    inner.innerHTML = `<div class="error-msg">⚠️ ${escHtml(message)}</div>`;
  }
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
