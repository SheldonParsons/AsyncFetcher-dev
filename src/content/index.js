import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import '@/content/element-plus.scss'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import Content from '@/content/content.vue'
import { getGlobalListenerSwitch } from '@/common/js/utils.js'

document.addEventListener('listenInterfaceEvent', async function (e) {
  const result = await getGlobalListenerSwitch()
  if (result === 1) {
    chrome.runtime.sendMessage({ greeting: 'add_xhr', http: e.detail })
  }
})

var s = document.createElement('script')
s.src = chrome.runtime.getURL('insert.js')
s.onload = function () {
  this.remove()
}
;(document.head || document.documentElement).appendChild(s)

document.addEventListener('DOMContentLoaded', function () {
  // 创建id为AP-container的div
  const apApp = document.createElement('div')
  apApp.id = 'AP-container'
  // 将刚创建的div插入body最后
  document.body.appendChild(apApp)
  // 创建Vue APP
  const app = createApp(Content)
  // 集成Element Plus
  app.use(ElementPlus, {
    locale: zhCn
  })
  // 将Vue APP插入刚创建的div
  app.mount('#AP-container')
})
