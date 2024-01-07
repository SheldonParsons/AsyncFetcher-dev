import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/popup/views/login/login.vue'
import Setting from '@/popup/views/setting/setting.vue'
import Project from '@/popup/views/project/project.vue'
import Entry from '@/popup/views/entry/entry.vue'

const routes = [
  // // URL未包含路由hash，则跳转至Setting页面
  // { path: '/', redirect: '/setting', exact: true },
  // 精确匹配 #/login，指向Login页面
  { path: '/login', component: Login, exact: true },
  // 匹配 #/，指向Entry页面
  {
    path: '/',
    component: Entry,
    // 这里是Entry的二级路由配置
    children: [
      // 精确匹配 #/setting，指向Setting页面
      {
        path: 'setting',
        component: Setting,
        exact: true
      },
      // 精确匹配 #/project，指向Project页面
      {
        path: 'project',
        component: Project,
        exact: true
      },
      // 空hash，则跳转至Setting页面
      { path: '', redirect: 'setting' },
      // 未匹配，则跳转至Setting页面
      { path: '/:pathMatch(.*)', redirect: 'setting' }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
