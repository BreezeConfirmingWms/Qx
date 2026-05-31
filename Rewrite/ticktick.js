/******************************
脚本功能：滴答清单-解锁高级会员
脚本作者：afengye
脚本频道：https://t.me/afengye
注意事项：需登录
使用声明：️仅供学习交流
*******************************
[rewrite_local]
^https:\/\/ticktick\.com\/api\/v2\/user\/status url script-response-body 
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
