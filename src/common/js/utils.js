import { storageHandle } from '@/api/storage'

export async function getGlobalListenerSwitch() {
  let result = await storageHandle.get('global_listener')
  if (result === undefined || result === null) {
    result = await storageHandle.set('global_listener', 1)
  }
  return result
}

export async function auth_and_get_headers(router) {
  const user = await storageHandle.get('user')
  const isLogin = await storageHandle.get('isLogin')
  if (user) {
    const _data = JSON.parse(user)
    const _result = {
      Authorization: 'token=' + _data.token
    }
    return _result
  } else if (!user || !isLogin || isLogin === 0) {
    router.push('/login')
  }
}

export async function isLogin() {
  const isLogin = await storageHandle.get('isLogin')
  return isLogin && isLogin === 1
}

// 向所有标签页发送消息
export function sendMessageToAllTabs(message) {
  try {
    chrome.tabs.query({}, function (tabs) {
      for (let tab of tabs) {
        if (tab.url && tab.url.startsWith('http')) {
          try {
            chrome.tabs.sendMessage(tab.id, message, function (response) {
              if (chrome.runtime.lastError) {
                // 忽略错误或做一些记录，但不抛出或显示
                console.log(
                  `Error sending message to tab ${tab.id}: ${chrome.runtime.lastError.message}`
                )
              } else {
                // 正常处理响应
                console.log('Response:', response)
              }
            })
          } catch (error) {}
          // 过滤掉非HTTP/HTTPS页面
        }
      }
    })
  } catch (error) {}
}
