/*
 * 脚本名称：i 茅台
 * 更新时间：2023-10-11
 * 定时任务：17 9 * * *
 * 脚本说明：自动申购茅台酒，兼容 Node.js 和手机 NE 环境执行。
 * 环境变量：export MT_TOKENS="MT-Device-ID,MT-Token"  // 设备ID,用户TOKEN  多账号用 @ 隔开
 * 环境变量：export MT_PROVINCE="广东省"  // 省份
 * 环境变量：export MT_CITY="广州市"  // 城市
 * 环境变量：export MT_DISTRICT="天河区|海珠区"  // 需要申购的区域，多个区域以 | 隔开，留空为随机申购全市所有门店
 * 环境变量：export MT_ITEM_BLACK="2478|10056"  // 申购商品ID黑名单，多个ID以 | 隔开，留空为随机申购所有商品
 * 环境变量：export MT_VERSION="1.4.9"  // APP版本号 非必填
 * 环境变量：export MT_USERAGENT="iOS;16.1.2;Apple;?unrecognized?"  // User-Agent 非必填
 * 环境变量：export MT_R="clips_OlU6TmFRag5rCXwbNAQ/Tz1SKlN8THcecBp/HGhHdw=="  // 非必填

--------------- BoxJS & 重写模块 --------------

https://raw.githubusercontent.com/FoKit/Scripts/main/boxjs/fokit.boxjs.json
https://raw.githubusercontent.com/FoKit/Scripts/main/rewrite/get_maotai_token.conf
https://raw.githubusercontent.com/FoKit/Scripts/main/rewrite/get_maotai_token.sgmodule

------------------ Surge 配置 -----------------

[MITM]
hostname = %APPEND% app.moutai519.com.cn

[Script]
茅台Token = type=http-request,pattern=^https:\/\/app\.moutai519\.com\.cn\/xhr\/front\/mall\/message\/unRead\/query,requires-body=0,max-size=0,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js

i 茅台 = type=cron,cronexp=17 9 * * *,timeout=60,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js,script-update-interval=0

------------------ Loon 配置 ------------------

[MITM]
hostname = app.moutai519.com.cn

[Script]
http-request ^https:\/\/app\.moutai519\.com\.cn\/xhr\/front\/mall\/message\/unRead\/query tag=茅台Token, script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js,requires-body=0

cron "17 9 * * *" script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js,tag = i 茅台,enable=true

-------------- Quantumult X 配置 --------------

[MITM]
hostname = app.moutai519.com.cn

[rewrite_local]
^https:\/\/app\.moutai519\.com\.cn\/xhr\/front\/mall\/message\/unRead\/query url script-request-header https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js

[task_local]
17 9 * * * https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js, tag=i 茅台, enabled=true

------------------ Stash 配置 -----------------

cron:
  script:
    - name: i 茅台
      cron: '17 9 * * *'
      timeout: 10

http:
  mitm:
    - "app.moutai519.com.cn"
  script:
    - match: ^https:\/\/app\.moutai519\.com\.cn\/xhr\/front\/mall\/message\/unRead\/query
      name: 茅台Token
      type: request
      require-body: true

script-providers:
  i 茅台:
    url: https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/i-maotai.js
    interval: 86400

*/

const $ = new Env('i 茅台');
const notify = $.isNode() ? require('./sendNotify') : '';
const MT_INFO = '028e7f96f6369cafe1d105579c5b9377';
const nowDate = parseInt((new Date().getTime() / 1000).toString());  // 当前时间戳
const zeroDate = (nowDate - (nowDate % 86400) - 3600 * 8) * 1000;  // 今日零点时间戳
let productInfo = [], message = '', CookieArr = [], Cookie = '', DeviceID = '';

let MT_PROVINCE = $.getdata('MT_PROVINCE') || '广东省';
let MT_CITY = $.getdata('MT_CITY') || '深圳市';
let MT_DISTRICT = $.getdata('MT_DISTRICT') || '福田区';
let MT_ITEM_BLACK = $.getdata('MT_ITEM_BLACK') || '2478|10056';
let MT_TOKENS = $.getdata('MT_TOKENS') || '';
let MT_VERSION = $.getdata('MT_VERSION') || '1.4.9';
let MT_USERAGENT = $.getdata('MT_USERAGENT') || 'iOS;16.1.2;Apple;?unrecognized?';
let MT_R = $.getdata('MT_R') || 'clips_OlU6TmFRag5rCXwbNAQ/Tz1SKlN8THcecBp/HGhHdw==';

if ($.isNode()) {
  MT_PROVINCE = process.env.MT_PROVINCE ? process.env.MT_PROVINCE : MT_PROVINCE;
  MT_CITY = process.env.MT_CITY ? process.env.MT_CITY : MT_CITY;
  MT_DISTRICT = process.env.MT_DISTRICT ? process.env.MT_DISTRICT : MT_DISTRICT;
  MT_ITEM_BLACK = process.env.MT_ITEM_BLACK ? process.env.MT_ITEM_BLACK : MT_ITEM_BLACK;
  MT_TOKENS = process.env.MT_TOKENS ? process.env.MT_TOKENS : MT_TOKENS;
  MT_VERSION = process.env.MT_VERSION ? process.env.MT_VERSION : MT_VERSION;
  MT_USERAGENT = process.env.MT_USERAGENT ? process.env.MT_USERAGENT : MT_USERAGENT;
  MT_R = process.env.MT_R ? process.env.MT_R : MT_R;
}

!(async () => {
  if (isGetCookie = typeof $request !== `undefined`) {
    GetCookie();
    $.done();
  }

  function GetCookie() {
    if ($request && $request.headers) {
      if (($request.headers['MT-Token'] && $request.headers['MT-Device-ID']) || ($request.headers['mt-token'] && $request.headers['mt-device-id'])) {
        let new_MT_Token = $request.headers['MT-Token'] || $request.headers['mt-token'];
        let new_Device_ID = $request.headers['MT-Device-ID'] || $request.headers['mt-device-id'];
        let old_MT_Token = MT_TOKENS.split(',') ? MT_TOKENS.split(',')[1] : '';
        if (old_MT_Token !== new_MT_Token) {
          $.setdata(new_Device_ID + ',' + new_MT_Token, 'MT_TOKENS');
          $.msg($.name, `🎉 Token获取成功`, `${new_Device_ID + ',' + new_MT_Token}`);
        } else {
          $.log(`无需更新 MT-Token:\n${new_Device_ID + ',' + new_MT_Token}\n`);
        }
      }
      if ($request.headers['MT-APP-Version'] || $request.headers['mt-app-version']) {
        $.MT_VERSION = $request.headers['MT-APP-Version'] || $request.headers['mt-app-version'];
        $.setdata($.MT_VERSION, `MT_VERSION`);
        $.log(`🎉 MT_VERSION 写入成功:\n${$.MT_VERSION}\n`);
      }
      if ($request.headers['User-Agent'] || $request.headers['user-agent']) {
        $.MT_USERAGENT = $request.headers['User-Agent'] || $request.headers['user-agent'];
        $.setdata($.MT_USERAGENT, `MT_USERAGENT`);
        $.log(`🎉 MT_USERAGENT 写入成功:\n${$.MT_USERAGENT}\n`);
      }
      if ($request.headers['MT-R'] || $request.headers['mt-r']) {
        $.MT_R = $request.headers['MT-R'] || $request.headers['mt-r'];
        $.setdata($.MT_R, `MT_R`);
        $.log(`🎉 MT_R 写入成功:\n${$.MT_R}\n`);
      }
    }
  }

  MT_TOKENS = MT_TOKENS.split('@');
  Object.keys(MT_TOKENS).forEach((item) => {
    if (MT_TOKENS[item]) {
      CookieArr.push(MT_TOKENS[item]);
    }
  });
  if (!CookieArr[0]) {
    $.msg($.name, '❌ 未配置 MT_TOKENS\n');
    return;
  } else {
    console.log(`\n当前 MT_TOKENS 数量: ${CookieArr.length} 个\n`);
  }
  $.sessionId = '', $.shopIds = [], $.itemCodes = [];
  await getShopMap();  // 获取门店地图
  await getSessionId();  // 获取申购列表
  await getShopInfo();  // 获取门店库存
  for (let i = 0; i < CookieArr.length; i++) {
    $.userName = '', $.userId = '', $.mobile = '';
    console.log(`\n======== 账号${i + 1} ========\n`);
    message += `账号 ${i + 1}  `
    let TOKEN = CookieArr[i].split(',');
    if (TOKEN.length === 2) {
      DeviceID = TOKEN[0];
      Cookie = TOKEN[1];
    } else {
      console.log(`Token格式错误。\n`);
      continue;
    }
    await getLatestVersion();  // 获取最新版本
    await getUserInfo();  // 获取用户信息
    if ($.userName) {
      let randomInt = Math.floor(Math.random() * 300);  // 随机等待 0-300 秒
      console.log(`随机等待 ${randomInt} 秒\n`);
      await $.wait(randomInt * 1000);
      for (const itemID of $.itemCodes) {
        $.itemId = itemID;
        $.shopIds = $.stock[$.itemId];
        if (!$.shopIds) {
          let msg = `❌ ${getProductInfo($.itemId, 'title')} [${$.itemId}]暂无可申购门店。\n`;
          console.log(msg);
          message += msg;
          continue;
        }
        if ($.shopIds.length > 1) {
          $.shopId = randomArr($.shopIds);
        } else {
          $.shopId = $.shopIds;
        }
        $.actParam = await getActParam();
        if ($.actParam) {
          console.log(`开始申购: ${getProductInfo($.itemId, 'title')} [${$.shopId}-${$.itemId}]\n`);
          await $.wait(1000 * 5);
          await reservationAdd();  // 申购商品
        } else {
          console.log(`getActParam失败, 跳出。`);
        }
      }
      await $.wait(1000 * 3);
      await getEnergyAward();  // 领取耐力
      await get7DayReward();  // 领取连续申购奖励
      // await getApplyingDays();  // 查询累计申购天数领取奖励
      await getCumulativelyReward();  // 领取累计申购奖励
      // await reservationList();  // 查询申购记录
    } else {
      console.log(`❌ MT_TOKENS 已失效。\n`);
      message += `❌ MT_TOKENS 已失效。\n`;
    }
    message += `\n`;
  }
  if (message) {
    message = message.replace(/\n+$/, '');
    $.msg($.name, '', message);
    if ($.isNode()) await notify.sendNotify($.name, message);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 出错了，原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });


// 获取最新版本
async function getLatestVersion() {
  data = await http_get(`https://apps.apple.com/cn/app/i%E8%8C%85%E5%8F%B0/id1600482450`);
  if (data) {
    try {
      MT_VERSION = data.match(/whats-new__latest__version">版本 ([\d\.]+)/)[1];
      !$.isNode() ? $.setdata(MT_VERSION, `MT_VERSION`) : '';  // 持久化
    } catch (e) {
      $.log(e);
    };
  } else {
    console.log(`最新版本获取失败\n`);
  }
}


// 获取门店地图
async function getShopMap() {
  data = await http_get(`https://static.moutai519.com.cn/mt-backend/xhr/front/mall/resource/get`);
  if (data && data?.code === 2000) {
    mapData = await http_get(data.data.mtshops_pc.url);
    if (mapData) {
      $.shopMap = mapData;
    }
  } else {
    console.log(`门店地图获取失败\n`);
  }
}


// 获取用户信息
function getUserInfo() {
  let opt = {
    url: `https://app.moutai519.com.cn/xhr/front/user/info`,
    headers: {
      'Accept-Language': `zh-Hans-CN;q=1`,
      'MT-Token': Cookie,
      'Connection': `keep-alive`,
      'Accept-Encoding': `gzip, deflate, br`,
      'MT-Device-ID': DeviceID,
      'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
      'User-Agent': MT_USERAGENT,
      'MT-User-Tag': `0`,
      'MT-Bundle-ID': `com.moutai.mall`,
      'Host': `app.moutai519.com.cn`,
      'MT-Team-ID': ``,
      'MT-APP-Version': MT_VERSION,
      'MT-R': MT_R,
      'MT-Network-Type': `Unknown`,
      'Accept': `*/*`,
    }
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.get(opt, (err, resp, data) => {
      try {
        if (err) $.log(err);
        if (data) {
          // console.log(data);
          data = JSON.parse(data);
          if (data?.code === 2000) {
            $.userName = data.data.userName;
            $.userId = data.data.userId;
            $.mobile = data.data.mobile;
            console.log(`用户姓名: ${$.userName}\n用户编号: ${$.userId}\n手机号码: ${$.mobile}\n`);
            message += `用户姓名：${$.userName}  手机号码：${$.mobile}\n`;
          } else {
            console.log(`用户信息获取失败`, data);
          }
        } else {
          $.log("⚠️ 服务器返回了空数据\n");
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// 获取申购列表
function getSessionId() {
  let opt = {
    url: `https://static.moutai519.com.cn/mt-backend/xhr/front/mall/index/session/get/${zeroDate}`,
    headers: {
      // 'mt-device-id': DeviceID,
      'mt-user-tag': '0',
      'accept': '*/*',
      'mt-network-type': 'WIFI',
      // 'mt-token': Cookie,
      'mt-bundle-id': 'com.moutai.mall',
      'accept-language': 'zh-Hans-CN;q=1',
      'mt-app-version': MT_VERSION,
    }
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.get(opt, (err, resp, data) => {
      try {
        if (err) $.log(err);
        if (data) {
          // console.log(data);
          data = JSON.parse(data);
          if (data?.code === 2000) {
            $.sessionId = data.data.sessionId;
            // console.log(`${$.sessionId}\n`);
            itemList = data.data.itemList;
            if (itemList.length > 0) {
              if (MT_ITEM_BLACK) console.log(`申购商品黑名单: ${MT_ITEM_BLACK}`)
              for (let item of itemList) {
                if (MT_ITEM_BLACK) {
                  if (!new RegExp(MT_ITEM_BLACK).test(item.itemCode)) {
                    $.itemCodes.push(item.itemCode);
                  }
                } else {
                  $.itemCodes.push(item.itemCode);
                }
              }
              console.log(`申购商品白名单：${$.itemCodes.join('|')}\n`);
            }
          } else {
            console.log(`查询失败`, data);
          }
        } else {
          $.log("⚠️ 服务器返回了空数据\n");
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// 获取门店库存
function getShopInfo() {
  console.log(`获取[${MT_PROVINCE + MT_CITY + MT_DISTRICT}]门店库存:\n`);
  let opt = {
    url: `https://static.moutai519.com.cn/mt-backend/xhr/front/mall/shop/list/slim/v3/${$.sessionId}/${encodeURIComponent(MT_PROVINCE)}/10056/${zeroDate}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.get(opt, (err, resp, data) => {
      try {
        if (err) $.log(err);
        if (data) {
          data = JSON.parse(data);
          if (data?.code === 2000) {
            productInfo = data.data.items;
            shopInfo = data.data.shops;
            let shops = data.data.shops;
            $.stock = {}
            for (const _ in shops) {
              const shopId = shops[_].shopId;
              const items = shops[_].items;
              if ($.shopMap[shopId]['cityName'] === MT_CITY) {
                if (MT_DISTRICT && !new RegExp(MT_DISTRICT).test($.shopMap[shopId]['districtName'])) continue;
                for (const _ in items) {
                  const { count, itemId, inventory, ownerName } = items[_];
                  if (!$.stock[itemId]) $.stock[itemId] = [];
                  $.stock[itemId].push(shopId);
                  console.log(`【${ownerName}】[${shopId}-${itemId}] ${getProductInfo(itemId, 'title')}  价格:${getProductInfo(itemId, 'price')}  库存:${inventory}`);
                  // console.log(`门店:${ownerName}  商品[${itemId}]:${getProductInfo(itemId, 'title')}  价格:${getProductInfo(itemId, 'price')}  库存:${inventory}`);
                }
              }
            }
            // console.log($.stock);
          } else {
            console.log(`查询失败`, data);
          }
        } else {
          $.log("⚠️ 服务器返回了空数据\n");
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// 获取actParam
async function getActParam() {
  let opt = {
    url: `https://api.fokit.cn/i-maotai`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `{"itemInfoList":[{"count":1,"itemId":${$.itemId}}],"sessionId":${$.sessionId},"userId":"None","shopId":${$.shopId}}`,
  }
  return new Promise(resolve => {
    $.post(opt, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data).actParam;
          // $.log("获取actParam成功", data);
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve(data);
      }
    });
  });
}


// 开始申购
async function reservationAdd() {
  const time = Date.now();
  // const mtv = await getMTV(time);
  let opt = {
    url: `https://app.moutai519.com.cn/xhr/front/mall/reservation/add`,
    headers: {
      'MT-Info': MT_INFO,
      'Accept-Encoding': `gzip, deflate, br`,
      'Host': `app.moutai519.com.cn`,
      // 'MT-V': mtv,
      'MT-User-Tag': `0`,
      'MT-Token': Cookie,
      'Connection': `keep-alive`,
      'MT-Device-ID': DeviceID,
      'Accept-Language': `zh-Hans-CN;q=1`,
      'MT-Team-ID': ``,
      'Content-Type': `application/json`,
      'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
      'MT-APP-Version': MT_VERSION,
      'User-Agent': MT_USERAGENT,
      'MT-K': time,
      'MT-R': MT_R,
      'MT-Bundle-ID': `com.moutai.mall`,
      'MT-Network-Type': `Unknown`,
      'Accept': `*/*`,
      'MT-Lat': ``,
      'MT-Lng': ``,
    },
    body: `{"actParam":"${$.actParam}","itemInfoList":[{"count":1,"itemId":"${$.itemId}"}],"shopId":"${$.shopId}","sessionId":${$.sessionId}}`
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.post(opt, (err, resp, data) => {
      try {
        let result = '';
        // console.log(resp);
        if (err) {
          $.log(err);
          if (resp.statusCode === 480) {
            result = `❌ ${getProductInfo($.itemId, 'title')} 申购失败：${JSON.parse(data).message} - ${$.shopMap[$.shopId]['name']}\n`
          }
        } else {
          if (data) {
            // console.log(data);
            data = JSON.parse(data);
            if (data?.code === 2000) {
              result = `🎉 ${getProductInfo($.itemId, 'title')} 申购成功 - ${$.shopMap[$.shopId]['name']}\n`
            } else if (data?.code === 4021) {
              result = `❌ ${getProductInfo($.itemId, 'title')} 申购失败：${data.message} - ${$.shopMap[$.shopId]['name']}\n`;
            } else {
              console.log(`请求失败- ${$.shopMap[$.shopId]['name']}`, data);
            }
          } else {
            $.log("⚠️ 服务器返回了空数据\n");
          }
        }
        console.log(result);
        message += result;
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// 领取耐力
async function getEnergyAward() {
  const time = Date.now();
  let opt = {
    url: `https://h5.moutai519.com.cn/game/isolationPage/getUserEnergyAward`,
    headers: {
      'MT-Token': Cookie,
      'MT-Network-Type': `Unknown`,
      'Accept-Language': `zh-Hans-CN;q=1`,
      'MT-APP-Version': MT_VERSION,
      'Accept-Encoding': `gzip, deflate, br`,
      'Connection': `keep-alive`,
      'MT-Device-ID': DeviceID,
      'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
      'Referer': 'https://h5.moutai519.com.cn/gux/game/main?appConfig=2_1_2',
      'Origin': 'https://h5.moutai519.com.cn',
      'User-Agent': MT_USERAGENT,
      'MT-User-Tag': `0`,
      'MT-K': time,
      'MT-Bundle-ID': `com.moutai.mall`,
      'Host': `app.moutai519.com.cn`,
      'MT-R': MT_R,
      'Accept': `*/*`,
      'MT-Team-ID': ``,
    },
    body: ``
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.post(opt, (err, resp, data) => {
      try {
        // console.log($.toStr(resp));
        let result = '';
        if (err) $.log(err);
        if (data) {
          // console.log(data);
          data = JSON.parse(data);
          if (data?.code === 200) {
            if (data.data?.awardRule.length > 0) {
              let awardRule = data.data.awardRule;
              for (const item of awardRule) {
                result += `🎉 获得申购奖励: ${item.goodName} +${item.count}`;
              }
            }
          } else if (data?.code === 40001) {
            result = `❌ 领取耐力失败: ${data.message}\n`;
          } else {
            console.log($.toStr(data));
          }
        } else {
          $.log("⚠️ 服务器返回了空数据\n");
        }
        console.log(result);
        message += result;
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// 领取连续申购小茅运奖励
async function get7DayReward() {
  const time = Date.now();
  let opt = {
    url: `https://h5.moutai519.com.cn/game/xmyApplyingReward/receive7DaysContinuouslyApplyingReward`,
    headers: {
      'MT-Token': Cookie,
      'MT-Network-Type': `Unknown`,
      'Accept-Language': `zh-Hans-CN;q=1`,
      'MT-APP-Version': MT_VERSION,
      'Accept-Encoding': `gzip, deflate, br`,
      'Connection': `keep-alive`,
      'MT-Device-ID': DeviceID,
      'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
      'Referer': 'https://h5.moutai519.com.cn/gux/game/task?appConfig=2_1_1',
      'Origin': 'https://h5.moutai519.com.cn',
      'User-Agent': MT_USERAGENT,
      'MT-User-Tag': `0`,
      'MT-K': time,
      'MT-Bundle-ID': `com.moutai.mall`,
      'Host': `app.moutai519.com.cn`,
      'MT-R': MT_R,
      'Accept': `*/*`,
      'MT-Team-ID': ``,
    },
    body: ``
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.post(opt, (err, resp, data) => {
      try {
        // console.log($.toStr(resp));
        let result = '';
        if (err) $.log(err);
        if (data) {
          // console.log(data);
          data = JSON.parse(data);
          if (data?.code === 2000) {
            if (data?.data?.rewardAmount > 0) {
              result += `🎉 获得连续申购奖励: 小茅运 +${data.data.rewardAmount}`;
            } else {
              console.log(`❌ 未达到连续申购奖励领取条件\n`);
            }
          } else {
            console.log($.toStr(data));
          }
        } else {
          $.log("⚠️ 服务器返回了空数据\n");
        }
        console.log(result);
        message += result;
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// 查询累计申购天数
// async function getApplyingDays() {
//   const time = Date.now();
//   let opt = {
//     url: `https://h5.moutai519.com.cn/game/xmyApplyingReward/cumulativelyApplyingDays`,
//     headers: {
//       'MT-Token': Cookie,
//       'MT-Network-Type': `Unknown`,
//       'Accept-Language': `zh-Hans-CN;q=1`,
//       'MT-APP-Version': MT_VERSION,
//       'Accept-Encoding': `gzip, deflate, br`,
//       'Connection': `keep-alive`,
//       'MT-Device-ID': DeviceID,
//       'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
//       'Referer': 'https://h5.moutai519.com.cn/gux/game/task?appConfig=2_1_1',
//       'Origin': 'https://h5.moutai519.com.cn',
//       'User-Agent': MT_USERAGENT,
//       'MT-User-Tag': `0`,
//       'MT-K': time,
//       'MT-Bundle-ID': `com.moutai.mall`,
//       'Host': `app.moutai519.com.cn`,
//       'MT-R': MT_R,
//       'Accept': `*/*`,
//       'MT-Team-ID': ``,
//     },
//     body: ``
//   }
//   // console.log(opt);
//   return new Promise(resolve => {
//     $.post(opt, async (err, resp, data) => {
//       try {
//         // console.log($.toStr(resp));
//         let result = '';
//         if (err) $.log(err);
//         if (data) {
//           // console.log(data);
//           data = JSON.parse(data);
//           if (data?.code === 2000) {
//             let previousDays = data.data.previousDays;  // 申购天数
//             if (data?.data?.appliedToday) previousDays += 1;
//             let rewardReceived = data.data.rewardReceived;  // 奖励天数
//             for (let days in rewardReceived) {
//               if (previousDays >= Number(days) && !rewardReceived[days]) {
//                 console.log(`开始领取申购${days}天奖励...\n`);
//                 await getCumulativelyReward();
//               }
//             }
//           } else {
//             console.log($.toStr(data));
//           }
//         } else {
//           $.log("⚠️ 服务器返回了空数据\n");
//         }
//         console.log(result);
//         message += result;
//       } catch (error) {
//         $.log(error);
//       } finally {
//         resolve();
//       }
//     });
//   });
// }


// 领取累计申购天数奖励
async function getCumulativelyReward() {
  const time = Date.now();
  let opt = {
    url: `https://h5.moutai519.com.cn/game/xmyApplyingReward/receiveCumulativelyApplyingReward`,
    headers: {
      'MT-Token': Cookie,
      'MT-Network-Type': `Unknown`,
      'Accept-Language': `zh-Hans-CN;q=1`,
      'MT-APP-Version': MT_VERSION,
      'Accept-Encoding': `gzip, deflate, br`,
      'Connection': `keep-alive`,
      'MT-Device-ID': DeviceID,
      'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
      'Referer': 'https://h5.moutai519.com.cn/gux/game/task?appConfig=2_1_1',
      'Origin': 'https://h5.moutai519.com.cn',
      'User-Agent': MT_USERAGENT,
      'MT-User-Tag': `0`,
      'MT-K': time,
      'MT-Bundle-ID': `com.moutai.mall`,
      'Host': `app.moutai519.com.cn`,
      'MT-R': MT_R,
      'Accept': `*/*`,
      'MT-Team-ID': ``,
    },
    body: ``
  }
  // console.log(opt);
  return new Promise(resolve => {
    $.post(opt, (err, resp, data) => {
      try {
        // console.log($.toStr(resp));
        let result = '';
        if (err) $.log(err);
        if (data) {
          // console.log(data);
          data = JSON.parse(data);
          if (data?.code === 2000) {
            if (data?.data?.rewardAmount > 0) {
              result += `🎉 获得累计申购奖励: 小茅运 +${data.data.rewardAmount}`;
            }
          } else {
            console.log(`❌ 未达到累计申购奖励领取条件\n`);
          }
        } else {
          $.log("⚠️ 服务器返回了空数据\n");
        }
        console.log(result);
        message += result;
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}


// // 申购记录
// async function reservationList() {
//   const time = Date.now();
//   // const mtv = await getMTV(time);
//   let opt = {
//     url: `https://app.moutai519.com.cn/xhr/front/mall/reservation/list/pageOne/query`,
//     headers: {
//       'MT-Token': Cookie,
//       'MT-Network-Type': `Unknown`,
//       'Accept-Language': `zh-Hans-CN;q=1`,
//       'MT-APP-Version': MT_VERSION,
//       'Accept-Encoding': `gzip, deflate, br`,
//       'Connection': `keep-alive`,
//       'MT-Device-ID': DeviceID,
//       'MT-Request-ID': `${Date.now() * 100000 + parseInt(10000 * Math.random())}`,
//       'User-Agent': MT_USERAGENT,
//       'MT-User-Tag': `0`,
//       'MT-K': time,
//       'MT-Bundle-ID': `com.moutai.mall`,
//       'Host': `app.moutai519.com.cn`,
//       // 'MT-V': mtv,
//       'MT-R': MT_R,
//       'Accept': `*/*`,
//       'MT-Team-ID': ``,
//     }
//   }
//   // console.log(opt);
//   return new Promise(resolve => {
//     $.get(opt, (err, resp, data) => {
//       try {
//         if (err) {
//           $.log(err);
//         } else {
//           if (data) {
//             // console.log(data);
//             data = JSON.parse(data);
//             if (data?.code === 2000) {
//               const reservationList = data.data.reservationItemVOS;
//               for (let i = 0; i < reservationList.length; i++) {
//                 const {
//                   reserveStartTime, // 申购场次
//                   reservationTime, // 申购时间
//                   itemName, // 商品名称
//                   count,  // 申购数量
//                   price, // 商品价格
//                   shopId, // 店铺ID
//                   itemId, // 商品ID
//                   status  // 订单状态
//                 } = reservationList[i];
//                 if ($.time('MM-dd', reservationTime) === $.time('MM-dd')) {
//                   message += (`申购时间: ${$.time('yyyy-MM-dd HH:mm:ss', reservationTime)}\n商品名称: ${itemName}\n商品价格: ${price} 元\n申购数量: ${count} 瓶\n\n`);
//                 } else {
//                   message += (`今日暂无申购记录\n`);
//                 }
//               }
//             } else {
//               console.log(`请求失败`, data);
//             }
//           } else {
//             $.log("⚠️ 服务器返回了空数据\n");
//           }
//         }
//       } catch (error) {
//         $.log(error);
//       } finally {
//         resolve();
//       }
//     });
//   });
// }


// 获取产品信息
function getProductInfo(productId, y) {
  for (const x in productInfo) {
    const { picUrl, title, price, count, itemId, inventory, areaLimitTag, areaLimit } = productInfo[x];
    if (productId === itemId) {
      return productInfo[x][y];
    }
  }
}


function http_get(url, headers = { 'Content-Type': 'application/x-www-form-urlencoded' }) {
  let opt = {
    url,
    headers
  }
  // console.log(opt)；
  return new Promise(resolve => {
    $.get(opt, (err, resp, data) => {
      let result = '';
      try {
        if (err) {
          $.log(err);
        } else {
          if (data) {
            // console.log(data);
            try {
              result = JSON.parse(data);
            } catch (e) {
              result = data;
            }
          } else {
            $.log("⚠️ 服务器返回了空数据\n");
          }
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve(result);
      }
    });
  });
}


// 随机数组
function randomArr(arr) {
  return arr[parseInt(Math.random() * arr.length, 10)];
}


// prettier-ignore
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
