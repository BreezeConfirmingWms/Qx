/*
[rewrite_local]
^https:\/\/api\.heptabase\.com\/auth\/subscription$ url script-echo-response https://raw.githubusercontent.com/BreezeConfirmingWms/Qx/refs/heads/develop/Rewrite/heptabase-subscription.js
^https:\/\/api\.heptabase\.com\/subscription\/(endFreeTrial|update|generateUpdatePreview)$ url reject-200
[mitm]
hostname = api.heptabase.com
*/

/**
 * Quantumult X — Heptabase 订阅强制 active
 *
 * 对齐 app-example/new 与 patch_asar.py 的短路对象：
 *   { id, shouldCancelAtPeriodEnd:false, startDate, currentPeriodEnd,
 *     status:"active", priceId, shouldShowPaymentFailure:true }
 *
 * 客户端 ll.retrieveSubscription(id) 解构的是 Stripe 线格式：
 *   { id, cancel_at_period_end, current_period_end, start_date, status, items }
 *   priceId    = items.data[].price.id
 *   unitAmount = items.data[].price.unit_amount ?? null
 * 且 d.data.find(p => p.subscription === a) 要求 items 内 subscription === 顶层 id。
 *
 * 支持两种 rewrite：
 *   script-echo-response   推荐：不打上游，等价 asar 短路
 *   script-response-body   兜底：改写上游响应（含 4xx → 200）
 */

var SUB_ID   = "C7C5AC18-CA5F-4C4D-B5F3-1EF740F5F5B8";
var PRICE_ID = "0113A429-2D2C-42AC-A596-4BC21661CF09";
var START_DATE         = 1735660800;  // 2025-01-01 00:00 UTC+8
var CURRENT_PERIOD_END = 1893427200;  // 2030-01-01 00:00 UTC+8

(function () {
  var resp = typeof $response === "object" && $response ? $response : null;
  var statusStr = resp && resp.status !== undefined ? String(resp.status) : "";
  var ok = statusStr.indexOf("2") === 0;

  var orig = null;
  try {
    if (ok && resp && typeof resp.body === "string" && resp.body.length) {
      orig = JSON.parse(resp.body);
    }
  } catch (e) {
    orig = null;
  }
  var canMerge = orig && typeof orig === "object" && !Array.isArray(orig);

  // 有真实 id 时保留，保证 items.data[].subscription 与顶层 id 自洽
  var id = (canMerge && typeof orig.id === "string" && orig.id) ? orig.id : SUB_ID;

  var forced = {
    id: id,
    object: "subscription",
    cancel_at_period_end: false,
    current_period_end: CURRENT_PERIOD_END,
    start_date: START_DATE,
    status: "active",
    items: {
      object: "list",
      data: [
        { id: "si_local", object: "subscription_item", subscription: id,
          price: { id: PRICE_ID, object: "price", unit_amount: null } }
      ]
    }
  };

  var out = canMerge ? Object.assign({}, orig, forced) : forced;
  out.items = forced.items;
  out.status = "active";
  out.cancel_at_period_end = false;
  out.current_period_end = CURRENT_PERIOD_END;
  out.start_date = START_DATE;

  var body = JSON.stringify(out);
  var url = (typeof $request === "object" && $request && $request.url) ? $request.url : "";
  console.log("[hepta-sub] " + url + " upstream=" + (statusStr || "echo") +
    (canMerge ? ' ("' + orig.status + '")' : " (hardcoded)") + " -> active, id=" + id);

  $done({
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: body
  });
})();
