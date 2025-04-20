import { apiRequest } from '@/api'
import { sendMessageToAllTabs } from '@/common/js/utils.js'
import { removeData, readData, set,removeAllData } from './common'
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
