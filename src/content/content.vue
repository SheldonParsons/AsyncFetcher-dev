<template>
  <el-config-provider namespace="AP-el">
    <div class="AP-content" v-if="showListener">
      <div class="content-entry" @click.stop="openInterfaceModel"></div>
    </div>
    <MainDialog
      :interfaceList="interfaceList"
      :visible="isShowMainDialog"
      @onClose="
        () => {
          isShowMainDialog = false
        }
      "
    />
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getGlobalListenerSwitch, isLogin } from '@/common/js/utils.js'
import MainDialog from '@/content/components/mainDialog/mainDialog.vue'
import { sendMessageToBackground } from '@/api/storage'
const show = ref(false)
// 对话框显示状态
const isShowMainDialog = ref(false)
const showListener = ref(true)
const interfaceList = ref([])

onMounted(async () => {
  setTimeout(async () => {
    const result = await getGlobalListenerSwitch()
    const isOpenListener = result === 1 ? true : false
    if (isOpenListener) {
      await isLogin().then((res) => {
        showListener.value = res
      })
    } else {
      showListener.value = false
    }
  }, 0)
})
// content.js
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.greeting === 'switch_listener') {
    showListener.value = request.flag
  }
  if (request.greeting === 'get_interface_list') {
    interfaceList.value = request.data.interfaceList
  }

  if (request.greeting === 'clean_interface_list') {
    interfaceList.value = []
  }
  sendResponse(true)
  return true
})

function openInterfaceModel() {
  try {
    sendMessageToBackground({ greeting: 'get_xhr' })
    isShowMainDialog.value = true
  } catch (error) {
    showListener.value = false
  }
}
</script>

<style scoped lang="scss">
.AP-content {
  .content-entry {
    position: fixed;
    z-index: 9999;
    bottom: 50px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: url('images/content-icon.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    cursor: pointer;
  }
}
</style>

<style lang="scss">
:root {
  --AP-el-color-primary: #009879 !important;
  --AP-el-color-primary-light-3: #33ac93 !important;
  --AP-el-color-primary-light-5: #66c0ad !important;
  --AP-el-color-primary-light-7: #99d4c7 !important;
  --AP-el-color-primary-light-8: #cce8e1 !important;
  --AP-el-color-primary-light-9: #e0fcf5 !important;
  --AP-el-color-primary-dark-2: #007a5f !important;
  --AP-el-color-success: #009879 !important;
  --AP-el-color-success-light-3: #33ac93 !important;
  --AP-el-color-success-light-5: #66c0ad !important;
  --AP-el-color-success-light-7: #99d4c7 !important;
  --AP-el-color-success-light-8: #cce8e1 !important;
  --AP-el-color-success-light-9: #e0fcf5 !important;
}
</style>
