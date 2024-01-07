import { apiRequest } from '@/api'
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
    // 发起请求
    apiRequest(config)
  })
}

export async function getGlobalListenerSwitch() {
  const result = await storageHandle.get('global_listener')
  if (result === undefined) {
    await storageHandle.set('global_listener', 1)
    return 1
  } else {
    return result
  }
}
