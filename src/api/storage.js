export const storageHandle = {
  set: async (key, value) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  },
  get: (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          // reject(chrome.runtime.lastError)
          resolve(undefined)
        } else {
          resolve(result[key])
        }
      })
    })
  },
  remove: (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  }
}
