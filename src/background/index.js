/*global chrome*/
import {
  openDB,
  addData,
  readData,
  cleanData,
  removeAllInterfaceList,
  listenAllInterface,
  set,
  removeData
} from './common'
import { installed } from './installed'
import {
  sendHttpRequest,
  getGlobalListenerSwitch,
  resetGlobalParams,
  sendInterface
} from './message'

const Listener_All_Interface = false

var db

async function packGetGlobalListenerSwitch(db, sender) {
  const message = {
    greeting: 'switch_listener',
    flag: await getGlobalListenerSwitch(db)
  }
  chrome.tabs.sendMessage(sender.tab.id, message)
}

function initDB() {
  openDB().then((res) => {
    db = res

    if (Listener_All_Interface) listenAllInterface()

    resetGlobalParams(db)

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (chrome.runtime.lastError) {
        console.error('Message failed to send:', chrome.runtime.lastError)
      }
      const { greeting } = request
      if (greeting === 'apiRequest') {
        sendHttpRequest(request, sender, sendResponse)
      }
      if (greeting === 'get_global_listener') {
        packGetGlobalListenerSwitch(db, sender)
      }
      if (greeting === 'add_xhr') {
        const { http } = request
        if (http) {
          addData(sender.tab.id, http.req, db)
        } else {
          console.log(request)
        }
      }

      if (greeting === 'get_xhr') {
        readData(sender.tab.id, db).then((result) => {
          const message = {
            greeting: 'get_interface_list',
            data: result === undefined ? [] : result
          }
          chrome.tabs.sendMessage(sender.tab.id, message)
        })
      }

      if (greeting === 'clean_all_interface') {
        removeAllInterfaceList(db)
      }

      if (greeting === 'clean_interface') {
        cleanData(sender.tab.id, db)
        const message = {
          greeting: 'clean_interface_list'
        }
        chrome.tabs.sendMessage(sender.tab.id, message)
      }

      if (greeting === 'send_interface') {
        sendInterface(request, sender)
      }

      if (greeting === 'clean_xhr') {
      }

      if (greeting === 'set_db') {
        set(request.key, request.value, db).then((res) => {
          sendResponse(res)
        })
      }
      if (greeting === 'get_db') {
        readData(request.key, db).then((res) => {
          if (res) {
            sendResponse(res.value)
          } else {
            sendResponse(res)
          }
        })
      }
      if (greeting === 'remove_db') {
        removeData(request.key, db).then((res) => {
          sendResponse(res)
        })
      }
      return true
    })
  })
}

installed(initDB)
