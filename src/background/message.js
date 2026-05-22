import { apiRequest } from '@/api'
import { sendMessageToAllTabs } from '@/common/js/utils.js'
import { removeData, readData, set, removeAllData } from './common'
import { storageHandle } from '@/api/storage'

export function sendHttpRequest(request, sender, sendResponse) {
  // 接收来自content script的消息，request里不允许传递function和file类型的参数
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    // 接收来自content的api请求
    let { config } = request
    // API请求成功的回调
    config.success = (data) => {
      data.result = 'succ'
      sendResponse(data)
    }
    // API请求失败的回调
    config.fail = (msg) => {
      sendResponse({
        result: 'fail',
        msg
      })
    }
    config.global_sender = true
    // 发起请求
    apiRequest(config)
  })
}

export async function getGlobalListenerSwitch(db) {
  return await readData('global_listener', db).then(async (result) => {
    if (result === undefined) {
      await set('global_listener', 1)
      return 1
    } else {
      return result
    }
  })
}

export async function resetGlobalParams(db) {
  await removeData('user', db)
  await removeData('isLogin', db)
  await removeData('global_listener', db)
  await removeAllData(db)
  await storageHandle.setStorage('fetcherUser', null)
  await storageHandle.setStorage('fetcherIsLogin', 0)
  await storageHandle.setStorage('global_listener', 0)
  const message = {
    greeting: 'switch_listener',
    flag: false
  }
  sendMessageToAllTabs(message)
}

export async function setGlobalListener(db) {
  readData('global_listener', db).then(async (isLogin) => {
    if (isLogin && isLogin === 1) {
      await set('global_listener', 1)
    } else {
      await set('global_listener', 0)
    }
  })
}

export async function sendInterface(request, sender) {
  const { data } = request
  let axiosConfig = {
    method: data.method.toLowerCase(),
    headers: data.headers
  }
  if (data.method.toLowerCase() !== 'get') {
    axiosConfig['body'] = data.body
  }
  // 发起请求
  await fetch(data.url, axiosConfig)
    .then((res) => {
      // 提取headers
      const headers = Array.from(res.headers.entries())

      // 提取body
      const bodyPromise = res.text() // 或者 res.json() 如果你知道响应是JSON格式

      // 返回包含headers和body的对象
      return Promise.all([bodyPromise, headers])
    })
    .then(([body, headers]) => {
      const message = {
        greeting: 'interface_result',
        data: body ? body : '', // 确保body存在
        headers: headers
      }
      chrome.tabs.sendMessage(sender.tab.id, message)
    })
    .catch((e) => {
      console.log(e)
    })
}

/**
 * 辅助函数：模拟睡眠
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 核心导出函数
 * @param {string} COOKIE 
 * @param {string[]} FILE_CODE_LIST 
 * @returns {Promise<string[]>} 返回下载链接数组
 */
export async function exportFiles(COOKIE, FILE_CODE_LIST, onUrlFound) {
  // 使用 map 映射每个任务，生成一个 Promise 数组
  const tasks = FILE_CODE_LIST.map(async (FILE_CODE, index) => {
    try {
      // --- 1. 发起导出请求 ---
      const exportRes = await fetch(
        "https://vd9f7c2663.docs.qq.com/v1/export/export_office",
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json, text/plain, */*",
            "Cookie": COOKIE
          },
          // 这里的 body 拼接方式采用了 ChatGPT 的写法，确实比较简练
          body: `exportType=0&switches=%7B%22embedFonts%22%3Afalse%7D&exportSource=client&docId=300000000%24${FILE_CODE}`
        }
      );

      const exportJson = await exportRes.json();

      // 安全检查：如果请求成功但没有 operationId (比如 cookie 过期或权限不足)
      if (!exportJson.operationId) {
        console.error(`文件 ${FILE_CODE} 导出失败:`, exportJson);
        return null;
      }

      const operationId = exportJson.operationId;

      // --- 2. 轮询查询进度 ---
      for (let i = 0; i < 5; i++) {
        const progressRes = await fetch(
          `https://vd9f7c2663.docs.qq.com/v1/export/query_progress?operationId=${operationId}`,
          {
            headers: {
              "Accept": "application/json, text/plain, */*",
              "Cookie": COOKIE
            }
          }
        );

        const progressJson = await progressRes.json();

        if (progressJson.file_url) {
          const url = progressJson.file_url;

          if (onUrlFound && typeof onUrlFound === 'function') {
            onUrlFound(url, index, FILE_CODE);
          }

          return url;
        }

        // 等待 1 秒再试
        await sleep(1000);
      }

      console.warn(`文件 ${FILE_CODE} 轮询超时`);
      return null; // 超时未获取到

    } catch (error) {
      console.error(`处理文件 ${FILE_CODE} 时发生异常:`, error);
      return null; // 发生网络错误等异常，返回 null 保证不影响其他文件
    }
  });

  // 等待所有任务完成
  const results = await Promise.all(tasks);

  // 过滤掉 null 的结果（即失败的任务），得到最终的下载列表
  return results.filter(url => url !== null);
}

