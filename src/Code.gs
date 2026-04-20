/**
 * BAYTAKE Dashboard — Google Apps Script バックエンド
 *
 * スクリプトプロパティ（スクリプトエディタ → プロジェクトの設定 → スクリプトプロパティ）:
 *   SPREADSHEET_ID  = 1HaTHctdWkUYMutYVonTw18g2SnGdQcFG-M3Q5ag2Hfk
 *
 * デプロイ: ウェブアプリとして公開
 *   実行ユーザー:  自分
 *   アクセス権限:  自分のみ（メンバー限定の場合は「全員（匿名含む）」）
 */

// タイムスタンプシート名パターン: YYYYMMDD_HHMM_JST
var SHEET_PATTERN = /^\d{8}_\d{4}_JST$/;

// アラート条件
var ALERT_MIN_PRICE      = 500;   // 平均落札額 $500 以上
var ALERT_MIN_SOLD_COUNT = 3;     // 落札件数 3 件以上
var ALERT_MAX_ITEMS      = 10;    // アラート最大表示件数

// ── エントリポイント ───────────────────────────────────────────────────────────

/**
 * GAS Webアプリのエントリポイント。
 * index.html をテンプレートとして返す。
 */
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('BAYTAKE Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── データ取得 API ────────────────────────────────────────────────────────────

/**
 * 最新タイムスタンプシートから上位20件のデータを返す。
 *
 * @returns {{sheetName:string, rows:Object[], totalRows:number, lastUpdated:string} | {error:string}}
 */
function getData() {
  try {
    var ss    = _getSpreadsheet();
    var sheet = _getLatestSheet(ss);

    if (!sheet) {
      return { error: 'データシートが見つかりません。run_terapeak.py を実行してください。' };
    }

    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var allRows = data.slice(1);

    // 価格ありの行（詳細取得済み）を優先し、上位20件を返す
    var detailRows = allRows.filter(function(r) {
      return _colVal(r, headers, 'price') !== '';
    });
    var displayRows = (detailRows.length > 0 ? detailRows : allRows).slice(0, 20);

    var rows = displayRows.map(function(r) {
      return _rowToObject(r, headers);
    });

    return {
      sheetName:   sheet.getName(),
      rows:        rows,
      totalRows:   allRows.length,
      lastUpdated: sheet.getName(),
    };

  } catch (err) {
    Logger.log('getData エラー: ' + err.message);
    return { error: 'データ取得中にエラーが発生しました: ' + err.message };
  }
}

/**
 * アラート条件（高額 × 高回転）に合致する商品を返す。
 * 複数シートを比較して直近48時間に登場した商品を優先する。
 *
 * @returns {{alerts:Object[], captchaCount:number} | {error:string}}
 */
function getAlerts() {
  try {
    var ss     = _getSpreadsheet();
    var sheets = _getTimestampSheets(ss);

    if (sheets.length === 0) {
      return { alerts: [], captchaCount: 0 };
    }

    var latestSheet = sheets[0];
    var data        = latestSheet.getDataRange().getValues();
    var headers     = data[0];
    var rows        = data.slice(1);

    // 48時間カットオフ（シート名をタイムスタンプとして使用）
    var cutoffName = _sheetNameHoursAgo(48);

    var alerts = [];
    rows.forEach(function(r) {
      var price     = parseFloat(_colVal(r, headers, 'avg_sold_price')) || 0;
      var soldCount = parseInt(_colVal(r, headers, 'total_sold_count')) || 0;

      if (price >= ALERT_MIN_PRICE && soldCount >= ALERT_MIN_SOLD_COUNT) {
        alerts.push(_rowToObject(r, headers));
      }
    });

    // avg_sold_price 降順でソート
    alerts.sort(function(a, b) {
      return (parseFloat(b.avg_sold_price) || 0) - (parseFloat(a.avg_sold_price) || 0);
    });

    return {
      alerts:       alerts.slice(0, ALERT_MAX_ITEMS),
      captchaCount: 0,  // 将来: CONFIG シートから取得
    };

  } catch (err) {
    Logger.log('getAlerts エラー: ' + err.message);
    return { error: 'アラート取得中にエラーが発生しました: ' + err.message };
  }
}

// ── プライベートヘルパー ──────────────────────────────────────────────────────

/** スクリプトプロパティから SPREADSHEET_ID を取得してスプレッドシートを開く */
function _getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('スクリプトプロパティ SPREADSHEET_ID が設定されていません');
  }
  return SpreadsheetApp.openById(id);
}

/** タイムスタンプシート一覧を降順（最新→古い）で返す */
function _getTimestampSheets(ss) {
  return ss.getSheets()
    .filter(function(s) { return SHEET_PATTERN.test(s.getName()); })
    .sort(function(a, b) { return b.getName().localeCompare(a.getName()); });
}

/** 最新のタイムスタンプシートを返す */
function _getLatestSheet(ss) {
  var sheets = _getTimestampSheets(ss);
  return sheets.length > 0 ? sheets[0] : null;
}

/** 行配列から指定カラム名の値を取得 */
function _colVal(row, headers, colName) {
  var idx = headers.indexOf(colName);
  return idx >= 0 ? row[idx] : '';
}

/** 行配列をヘッダーキーのオブジェクトに変換 */
function _rowToObject(row, headers) {
  var obj = {};
  headers.forEach(function(h, i) {
    obj[h] = row[i] !== undefined ? String(row[i]) : '';
  });
  return obj;
}

/**
 * 現在時刻から N 時間前のシート名文字列を生成（比較用）
 * 形式: YYYYMMDD_HHMM_JST
 */
function _sheetNameHoursAgo(hours) {
  var now = new Date();
  var past = new Date(now.getTime() - hours * 60 * 60 * 1000);

  // JST に変換（UTC+9）
  var jst = new Date(past.getTime() + 9 * 60 * 60 * 1000);

  var pad = function(n) { return n < 10 ? '0' + n : String(n); };
  return (
    jst.getUTCFullYear() +
    pad(jst.getUTCMonth() + 1) +
    pad(jst.getUTCDate()) + '_' +
    pad(jst.getUTCHours()) +
    pad(jst.getUTCMinutes()) + '_JST'
  );
}
