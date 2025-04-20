import { createApp } from 'vue'
// 全局样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/common/styles/frame.scss'

import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import Popup from '@/popup/popup.vue'
import router from './router'
const app = createApp(Popup)
app.use(ElementPlus, {
  locale: zhCn
})
app.use(router)
app.mount('#app')
