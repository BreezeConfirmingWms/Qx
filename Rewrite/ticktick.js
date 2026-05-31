/******************************
脚本功能：TickTick-解锁高级会员
脚本作者：yum
注意事项：需登录
使用声明：️仅供学习交流
*******************************
[rewrite_local]
^https:\/\/ticktick\.com\/api\/v2\/user\/status url script-response-body https://raw.githubusercontent.com/BreezeConfirmingWms/Qx/refs/heads/develop/Rewrite/ticktick.js
[mitm] 
hostname = ticktick.com
*******************************/
let obj = JSON.parse($response.body);

obj = {
    ...obj,
    "needSubscribe" : false,
    "pro" : true,
    "teamPro" : true,
    "teamUser" : true,
}

$done({body: JSON.stringify(obj)});
