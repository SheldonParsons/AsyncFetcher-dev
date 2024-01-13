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

export async function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open('AsyncFetcherDatabase', 1)

    request.onerror = function (event) {
      reject(event.target.error)
    }

    request.onsuccess = function (event) {
      resolve(event.target.result)
    }

    request.onupgradeneeded = function (event) {
      let db = event.target.result
      db.createObjectStore('AsyncFetcherObjectStore', { keyPath: 'id' })
    }
  })
}
function containsFiveOrMoreConsecutiveDigits(input) {
  // 将输入转换为字符串
  const str = input.toString()
  return /\d{5,}/.test(str)
}
export async function removeAllInterfaceList(db) {
  return new Promise(async (resolve, reject) => {
    if (db === undefined) {
      db = await getDb()
    }

    // 获取所有打开的标签页 ID

    let transaction = db.transaction(['AsyncFetcherObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncFetcherObjectStore')

    // 打开游标遍历 object store
    const cursorRequest = objectStore.openCursor()
    cursorRequest.onsuccess = (e) => {
      const cursor = e.target.result
      if (cursor) {
        // 使用游标的键（即 tabId）进行检查
        if (containsFiveOrMoreConsecutiveDigits(cursor.key)) {
          // 获取当前记录
          const record = cursor.value

          // 更新 interfaceList
          record.interfaceList = []

          // 将更新后的记录写回 object store
          objectStore.put(record)
        }

        // 移动到下一条记录
        cursor.continue()
      } else {
        resolve()
      }
    }

    cursorRequest.onerror = (e) => {
      console.error('Cursor request failed', e)
      reject(e)
    }
  })
}

export async function set(key, value, db) {
  return new Promise(async (resolve, reject) => {
    if (db === undefined) {
      db = await getDb()
    }
    let transaction = db.transaction(['AsyncFetcherObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncFetcherObjectStore')

    transaction.oncomplete = function () {
      resolve(true)
    }

    transaction.onerror = function (event) {
      reject(event.target.error)
    }
    // 先尝试从数据库中读取数据
    let getRequest = objectStore.get(key)

    getRequest.onsuccess = function () {
      // 然后立即更新数据
      objectStore.put({ id: key, value: value })
    }

    getRequest.onerror = function () {
      objectStore.put({ id: key, value: value })
    }
  })
}

export async function addData(tabId, data, db) {
  return new Promise(async (resolve, reject) => {
    if (db === undefined) {
      db = await getDb()
    }
    let transaction = db.transaction(['AsyncFetcherObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncFetcherObjectStore')

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

async function getDb() {
  return openDB().then((res) => {
    return res
  })
}

export async function readData(key, db) {
  return new Promise(async (resolve, reject) => {
    if (db === undefined) {
      db = await getDb()
    }
    let transaction = db.transaction(['AsyncFetcherObjectStore'])
    let objectStore = transaction.objectStore('AsyncFetcherObjectStore')
    let request = objectStore.get(key)

    request.onerror = function (event) {
      resolve(event)
    }

    request.onsuccess = function (event) {
      if (request.result) {
        resolve(request.result)
      } else {
        resolve(undefined)
      }
    }
  })
}
export async function removeData(key, db) {
  return new Promise(async (resolve, reject) => {
    if (db === undefined) {
      db = await getDb() // 确保数据库已经打开
    }

    let transaction = db.transaction(['AsyncFetcherObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncFetcherObjectStore')
    let request = objectStore.delete(key) // 使用 delete 方法删除指定 key 的记录

    request.onerror = function (event) {
      reject(event.target.error) // 如果出错，则拒绝 Promise
    }

    request.onsuccess = function (event) {
      resolve(true) // 成功删除后，解析 Promise
    }
  })
}

export async function cleanData(tabId, db) {
  return new Promise(async (resolve, reject) => {
    if (db === undefined) {
      db = await getDb()
    }
    let transaction = db.transaction(['AsyncFetcherObjectStore'], 'readwrite')
    let objectStore = transaction.objectStore('AsyncFetcherObjectStore')

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
