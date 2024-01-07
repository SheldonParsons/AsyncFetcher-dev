const resourceTypes = {
  image: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'],
  script: ['.js', '.ts'],
  style: ['.css', '.scss', '.less', '.styl'],
  font: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
  framework: ['.vue', '.mjs', 'jsx', '.hbs', 'svelte'],
  media: [
    '.mp3',
    '.wav',
    '.aac',
    '.flac',
    '.ogg',
    '.aiff',
    '.aif',
    '.wma',
    '.m4a',
    '.mp4',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.mkv',
    '.webm',
    '.mpeg',
    '.mpg'
  ]
  // 这里可以根据需要添加更多资源类型
}

function isResourceType(url, types) {
  return types.some((type) => url.endsWith(type))
}

function is_http(protocol) {
  return ['http:', 'https'].some((type) => protocol === type)
}

export function listenAllInterface(flag) {
  if (flag) {
    if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
      chrome.webRequest.onBeforeSendHeaders.addListener(
        function (details) {
          const url = new URL(details.url)
          const pathname = url.pathname.toLowerCase()
          let is_catch = false
          if (is_http(url.protocol) === false && is_catch === false) {
            is_catch = true
          }
          if (pathname === '/' && is_catch === false) {
            is_catch = true
          }
          if (details.requestHeaders && is_catch === false) {
            // 遍历请求头部信息
            for (const header of details.requestHeaders) {
              if (
                header.name === 'Accept' &&
                header.value.indexOf(
                  'text/html,application/xhtml+xml,application/xml'
                ) !== -1
              ) {
                is_catch = true
              }
            }
          }
          if (pathname.startsWith('/@') && is_catch === false) {
            is_catch = true
          }
          if (pathname.indexOf('.') !== -1 && is_catch === false) {
            for (const [type, extensions] of Object.entries(resourceTypes)) {
              if (isResourceType(pathname, extensions)) {
                is_catch = true
                break
              }
            }
          }

          if (is_catch === false) {
            console.log(url)
          }
        },
        {
          urls: ['<all_urls>']
        },
        ['requestHeaders']
      )
      chrome.webRequest.onBeforeRequest.addListener(
        function (details) {
          console.log(details.requestBody)
        },
        {
          urls: ['<all_urls>']
        }
      )
    }
  }
}

let db

export async function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open('AsyncPluginDatabase', 1)

    request.onerror = function (event) {
      reject(event.target.error)
    }

    request.onsuccess = function (event) {
      db = event.target.result
      resolve(db)
    }

    request.onupgradeneeded = function (event) {
      let db = event.target.result
      db.createObjectStore('AsyncPluginObjectStore', { keyPath: 'id' })
    }
  })
}

export async function addData(tabId, data) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(['AsyncPluginObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncPluginObjectStore')

    transaction.oncomplete = function () {
      resolve(true)
    }

    transaction.onerror = function (event) {
      reject(event.target.error)
    }

    // 先尝试从数据库中读取数据
    let getRequest = objectStore.get(tabId)

    getRequest.onsuccess = function () {
      let _data = getRequest.result ? getRequest.result.interfaceList : []

      if (_data.length < 15) {
        _data.push(data)
      } else {
        _data.shift()
        _data.push(data)
      }

      // 然后立即更新数据
      objectStore.put({ id: tabId, interfaceList: _data })
    }

    getRequest.onerror = function () {
      // 如果读取失败，则尝试添加新数据
      objectStore.put({ id: tabId, interfaceList: [data] })
    }
  })
}

export async function readData(tabId) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(['AsyncPluginObjectStore'])
    let objectStore = transaction.objectStore('AsyncPluginObjectStore')
    let request = objectStore.get(tabId)

    request.onerror = function (event) {}

    request.onsuccess = function (event) {
      if (request.result) {
        resolve(request.result)
      } else {
        reject()
      }
    }
  })
}

export async function cleanData(tabId) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(['AsyncPluginObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncPluginObjectStore')

    transaction.oncomplete = function () {
      resolve(true)
    }

    transaction.onerror = function (event) {
      reject(event.target.error)
    }

    // 先尝试从数据库中读取数据
    let getRequest = objectStore.get(tabId)

    getRequest.onsuccess = function () {
      // 清空接口数据
      objectStore.put({ id: tabId, interfaceList: [] })
    }

    getRequest.onerror = function () {
      // 清空接口数据
      objectStore.put({ id: tabId, interfaceList: [] })
    }
  })
}
