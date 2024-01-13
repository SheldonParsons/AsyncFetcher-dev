<template>
  <div class="M-nav">
    <el-row class="logo-row">
      <el-col :span="24" class="logo-col">
        <div class="logo">
          <img src="@/popup/images/content-icon.png" alt="" />
          <span style="font-size: 16px; margin-top: 2px">AsyncFetcher</span>
        </div>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-tabs
          v-model="path"
          class="top-nav"
          @tab-change="onTabChange"
          stretch
        >
          <el-tab-pane label="Setting" name="/setting"></el-tab-pane>
          <el-tab-pane label="Project" name="/project"></el-tab-pane>
        </el-tabs>
        <el-tooltip effect="light" placement="bottom">
          <template #content>
            <span @click="logout" style="cursor: pointer">退出登录 </span>
          </template>
          <div class="btn-exit" @click="logout">
            <LogoutIcon></LogoutIcon>
          </div>
        </el-tooltip>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import LogoutIcon from '@/common/svg/logoutIcon.vue'
import { storageHandle } from '@/api/storage'
import { sendMessageToAllTabs } from '@/common/js/utils.js'
// route钩子，返回当前的路由地址
const route = useRoute()
// router钩子，返回路由器实例
const router = useRouter()
// 获取当前路由path
const path = route.path
// Tab组件控制路由跳转
const onTabChange = (gotoPath) => {
  router.push(gotoPath)
}

// 退出到Login页面
const logout = async () => {
  await storageHandle.set('isLogin', 0)
  await storageHandle.set('global_listener', 0)
  const message = {
    greeting: 'switch_listener',
    flag: false
  }
  sendMessageToAllTabs(message)
  router.push('/login')
}
</script>

<style scoped lang="scss">
.M-nav {
  position: fixed;
  z-index: 999;
  background: #fff;
  width: 580px;

  .top-nav {
    margin: 0 auto;
    padding-bottom: 1px;
    width: 200px;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
  }

  .btn-exit {
    cursor: pointer;
    position: absolute;
    top: 8px;
    right: 16px;
  }
  .logo-row {
    .logo-col {
      display: flex;
      justify-content: center;
      text-align: center;
      color: white;
    }
    height: 40px;
    background: linear-gradient(
      90deg,
      rgb(86, 107, 97) 0%,
      rgb(85, 195, 162) 19%,
      #ee5a5a 100%
    );
  }
  .logo {
    position: absolute;
    top: 10px;
    left: 16px;
    display: flex;
    justify-content: center;
    text-align: center;

    img {
      width: 20px;
      height: 20px;
      margin-right: 10px;
    }
  }
}
</style>
