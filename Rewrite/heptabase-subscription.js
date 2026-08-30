/**
 * Quantumult X — Heptabase 订阅强制 active（mitm 响应改写脚本）
 *
 * 目标端点: POST https://api.heptabase.com/auth/subscription
 * 依据: app2-unpacked 内 main-bI1vvwyr.js / makeManualBackup-JVHNoHsf.js 的字段逻辑
 *   const { id, cancel_at_period_end, current_period_end,
 *           start_date, status, items } = await ol.retrieveSubscription(i)
 *   priceId    = items.data[].price.id
 *   unitAmount = items.data[].price.unit_amount ?? null
 *
 * 效果: 等价于把 app.asar 中 Ue() 补丁为固定返回
 *   { id, shouldCancelAtPeriodEnd: false, startDate, currentPeriodEnd,
 *     status: "active", priceId, ... }
 * 无论上游返回正常订阅 / 已取消 / 4xx 错误，一律改写为 active。
 *
 * 配套 rewrite 规则（quantumultx.conf）:
 *   ^https?:\/\/api\.heptabase\.com\/auth\/subscription$ url script-response-body heptabase-subscription.js
 */

// 与 app.asar 补丁完全相同的固定值
var SUB_ID   = "C7C5AC18-CA5F-4C4D-B5F3-1EF740F5F5B8";
var PRICE_ID = "0113A429-2D2C-42AC-A596-4BC21661CF09";
var START_DATE         = 1735660800;  // 2025-01-01 00:00 UTC+8
var CURRENT_PERIOD_END = 1893427200;  // 2030-01-01 00:00 UTC+8

(function () {
  // 上游 2xx 才尝试保留原响应字段；非 2xx（如 TOKEN_EXPIRED）直接全量替换
  var ok = $response.status !== undefined && String($response.status).indexOf("2") === 0;

  var orig = null;
  try {
    if (ok && typeof $response.body === "string" && $response.body.length) {
      orig = JSON.parse($response.body);
    }
  } catch (e) {
    orig = null; // 非 JSON（网关错误页等）→ 使用兜底数据
  }
  var canMerge = orig && typeof orig === "object" && !Array.isArray(orig);

  // 保留真实订阅 id，保证 items.data[].subscription 与顶层 id 自洽
  // （客户端有 d.data.find(p => p.subscription === a) 的查找，不自洽会抛错）
  var id = (canMerge && typeof orig.id === "string" && orig.id) ? orig.id : SUB_ID;

  var forced = {
    id: id,
    cancel_at_period_end: false,
    current_period_end: CURRENT_PERIOD_END,
    start_date: START_DATE,
    status: "active",
    items: {
      data: [
        { subscription: id, price: { id: PRICE_ID, unit_amount: null } }
      ]
    }
  };

  // 合并保留上游的未知附加字段，但 items 整体替换，避免残留旧 price 条目
  var out = canMerge ? Object.assign({}, orig, forced) : forced;
  out.items = forced.items;
  var body = JSON.stringify(out);

  var origStatus = $response.status === undefined ? "?" : $response.status;
  console.log("[hepta-sub] /auth/subscription upstream=" + origStatus +
    (canMerge ? ' ("' + orig.status + '")' : " (replaced)") + " -> active, id=" + id);

  if (ok) {
    $done({ body: body });
  } else {
    // 上游报错时强制 200：客户端 r.ok 为 false 会走 throw 分支，必须翻成成功响应
    $done({ status: 200, headers: { "Content-Type": "application/json" }, body: body });
  }
})();
