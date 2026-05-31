/*
[rewrite_local]
^https:\/\/ticktick\.com\/api\/v2\/user\/status url script-response-body https://raw.githubusercontent.com/BreezeConfirmingWms/Qx/refs/heads/develop/Rewrite/tick.js
[mitm] 
hostname = ticktick.com
*/
let obj = JSON.parse($response.body);

obj = {
    ...obj,
    "needSubscribe" : false,
    "pro" : true,
    "teamPro" : true,
    "teamUser" : true,
}

$done({body: JSON.stringify(obj)});