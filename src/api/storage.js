export const storageHandle = {
  set: async (key, value) => {
    return await sendMessageToBackground({
      greeting: 'set_db',
      key: key,
      value: value
    }).then((res) => res)
  },
  get: async (key) => {
    return await sendMessageToBackground({ greeting: 'get_db', key: key }).then(
      (res) => {
        return res
      }
    )
  },
  remove: async (key) => {
    return await sendMessageToBackground({
      greeting: 'remove_db',
      key: key
    }).then((res) => res)
  }
}

export async function sendMessageToBackground(message, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    // 定义内部函数进行消息发送
    const send = (retryCount) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // 如果未达到最大重试次数，进行重试
            if (retryCount < maxRetries) {
              const nextRetry = retryCount + 1
              const delay = 1000 // 1秒延迟（可调整）
              // 使用 setTimeout 进行延迟后重试
              setTimeout(() => {
                send(nextRetry)
              }, delay)
            } else {
              console.error(
                'Exceeded maximum retry attempts. Unable to send message.'
              )
              reject(chrome.runtime.lastError)
            }
          } else {
            // 发送成功，处理响应
            resolve(response)
          }
        })
      } catch (error) {}
    }

    // 初始重试次数为 0
    send(0)
  })
}
