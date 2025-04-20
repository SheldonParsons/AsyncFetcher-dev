export const storageHandle = {
  set: async (key, value) => {
    return await sendMessageToBackground({
      greeting: 'set_db',
      key: key,
      value: value
    }).then((res) => res)
  },
  get: async (key) => {
    return await sendMessageToBackground({ greeting: 'get_db', key: key })
      .then((res) => {
        return res
      })
      .catch((e) => {
        console.log(e)
      })
  },
  remove: async (key) => {
    return await sendMessageToBackground({
      greeting: 'remove_db',
      key: key
    }).then((res) => res)
  },
  setStorage: async (key, value) => {
    return await setStorageData(key, value)
      .then(() => {
        return true
      })
      .catch((error) => {
        console.error('Error storing data:', error)
        return false
      })
  },
  getStorage: async (key) => {
    return await getStorageData(key)
      .then((result) => {
        return result
      })
      .catch((error) => {
        console.error('Error retrieving data:', error)
        return error
      })
  }
}

function setStorageData(key, value) {
  return new Promise((resolve, reject) => {
    const data = {}
    data[key] = value

    chrome.storage.local.set(data, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

function getStorageData(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        console.log('Retrieved data:', result[key])
        resolve(result[key])
      }
    })
  })
}

export async function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    // 建立连接
    const port = chrome.runtime.connect({ name: 'fetcher_content' })
    // 发送消息
    port.postMessage(message)
    // 监听来自后台的响应
    port.onMessage.addListener((response) => {
      // 处理后台响应逻辑
      resolve(response)
    })

    // 监听连接关闭事件（可选）
    port.onDisconnect.addListener(() => {
      // console.log('Connection with background script is closed.')
      setTimeout(() => {
        const port = chrome.runtime.connect({ name: 'fetcher_content' })
        port.postMessage(message)
      }, 1000)
    })
  })
}
