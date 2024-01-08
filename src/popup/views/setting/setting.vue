<template>
  <div>
    <el-row>
      <el-col :offset="1" :span="23" class="setting-top-title">
        <span class="model-title">General</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-divider />
      </el-col>
    </el-row>
    <el-row>
      <el-col :offset="1" :span="19">
        <span class="setting-param-title">开启全局接口监听</span>
      </el-col>
      <el-col :span="2">
        <PluginSwitch
          @changeSwitch="switchGlobalListener"
          :isChecked="globalListener"
          :switchIndex="'switch-global-listener'"
        ></PluginSwitch>
      </el-col>
    </el-row>
    <el-row class="setting-top-title">
      <el-col :offset="1" :span="23">
        <span class="model-title">Information</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-divider />
      </el-col>
    </el-row>
    <el-row justify="start">
      <el-col :offset="1" :span="17">
        <span class="setting-param-title">登录账号</span>
      </el-col>
      <el-col :span="4" class="setting-param-desc">
        <span>{{ username }}</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-divider />
      </el-col>
    </el-row>
    <el-row justify="start">
      <el-col :offset="1" :span="4">
        <span class="setting-param-title">邮箱</span>
      </el-col>
      <el-col :span="17" class="setting-param-desc">
        <span>{{ email === '' ? '暂无' : email }}</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-divider />
      </el-col>
    </el-row>
    <el-row justify="start">
      <el-col :offset="1" :span="15">
        <span class="setting-param-title">私人秘钥</span>
      </el-col>
      <el-col :span="6" class="setting-param-desc">
        <span>{{ privateKey }}</span>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storageHandle } from '@/api/storage'
import PluginSwitch from '@/popup/components/normal/plugin_switch.vue'
const router = useRouter()

const globalListener = ref(true)
const username = ref('暂无')
const privateKey = ref('暂无')
const email = ref('暂无')

onMounted(async () => {
  const isLogin = await storageHandle.get('isLogin')
  const user = await storageHandle.get('user')
  if (!user || !isLogin || isLogin === 0) {
    router.push('/login')
  } else {
    const data = JSON.parse(user)
    username.value = data.nick_name
    privateKey.value = data.private_key
    email.value = data.email
    const global_listener = await storageHandle.get('global_listener')
    if (global_listener !== undefined) {
      globalListener.value = global_listener === 1 ? true : false
    } else {
      await storageHandle.set('global_listener', 1)
      globalListener.value = true
    }
  }
})

async function switchGlobalListener(flag) {
  const message = {
    greeting: 'switch_listener',
    flag: flag
  }
  globalListener.value = flag
  await storageHandle.set('global_listener', flag ? 1 : 0)
  sendMessageToAllTabs(message)
}
// 向所有标签页发送消息
function sendMessageToAllTabs(message) {
  try {
    chrome.tabs.query({}, function (tabs) {
      for (let tab of tabs) {
        if (tab.url && tab.url.startsWith('http')) {
          // 过滤掉非HTTP/HTTPS页面
          chrome.tabs.sendMessage(tab.id, message, function (response) {
            if (chrome.runtime.lastError) {
              // 忽略错误或做一些记录，但不抛出或显示
              console.log(
                `Error sending message to tab ${tab.id}: ${chrome.runtime.lastError.message}`
              )
            } else {
              // 正常处理响应
              console.log('Response:', response)
            }
          })
        }
      }
    })
  } catch (error) {}
}
</script>

<style scoped lang="scss">
.setting-top-title {
  margin-top: 30px;
}

.model-title {
  font-size: 16px;
  font-weight: 500;
}

.setting-param-title {
  font-size: 14px;
  font-weight: 500;
  color: gray;
}
.setting-param-desc {
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  text-align: right;
}
</style>
