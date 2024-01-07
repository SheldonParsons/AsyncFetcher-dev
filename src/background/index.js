/*global chrome*/
import {
  listenAllInterface,
  openDB,
  addData,
  readData,
  cleanData
} from './common'
import { installed } from './installed'
import { sendHttpRequest, getGlobalListenerSwitch } from './message'

const Listener_All_Interface = false

installed()

openDB()

listenAllInterface(Listener_All_Interface)

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  const { greeting } = request
  if (greeting === 'apiRequest') {
    sendHttpRequest(request, sender, sendResponse)
  }
  if (greeting === 'get_global_listener') {
    const message = {
      greeting: 'switch_listener',
      flag: await getGlobalListenerSwitch()
    }
    chrome.tabs.sendMessage(sender.tab.id, message)
  }
  if (greeting === 'add_xhr') {
    const { http } = request
    addData(sender.tab.id, http.req)
  }

  if (greeting === 'get_xhr') {
    readData(sender.tab.id).then((result) => {
      const message = {
        greeting: 'get_interface_list',
        data: result === undefined ? [] : result
      }
      chrome.tabs.sendMessage(sender.tab.id, message)
    })
  }

  if (greeting === 'clean_interface') {
    cleanData(sender.tab.id)
    const message = {
      greeting: 'clean_interface_list'
    }
    chrome.tabs.sendMessage(sender.tab.id, message)
  }

  if (greeting === 'send_interface') {
    const { data } = request
    let axiosConfig = {
      method: data.method.toLowerCase(),
      headers: data.headers
    }
    if (data.method.toLowerCase() !== 'get') {
      axiosConfig['body'] = data.body
    }
    console.log(axiosConfig)
    console.log(data.url)
    // 发起请求
    await fetch(data.url, axiosConfig)
      .then((res) => {
        console.log('fetch response')

        // 提取headers
        const headers = Array.from(res.headers.entries())

        // 提取body
        const bodyPromise = res.text() // 或者 res.json() 如果你知道响应是JSON格式

        // 返回包含headers和body的对象
        return Promise.all([bodyPromise, headers])
      })
      .then(([body, headers]) => {
        console.log('fetch result')
        console.log(body) // 打印body内容
        console.log(headers) // 打印headers内容

        const message = {
          greeting: 'interface_result',
          data: body ? body : '', // 确保body存在
          headers: headers
        }
        chrome.tabs.sendMessage(sender.tab.id, message)
      })
      .catch((e) => {
        console.log('in failed')
        console.log(e)
      })
  }

  if (greeting === 'clean_xhr') {
  }
  return true
})
