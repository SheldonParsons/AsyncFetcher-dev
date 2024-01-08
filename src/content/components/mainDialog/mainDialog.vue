<template>
  <el-dialog
    v-model="isVisible"
    v-if="isVisible"
    :top="'2vh'"
    class="AP-dialog"
    :width="'80%'"
    :show-close="false"
    ><template #header>
      <el-row class="tools-header" justify="start" align="middle">
        <el-col :span="20"><p>当前页面监听接口列表（XHR）</p> </el-col>
        <el-col :offset="3" :span="1"><slot name="icon"></slot></el-col>
      </el-row>
    </template>
    <el-empty
      v-if="status === 1 && interfaceList.length === 0"
      description="Interface not detected by listening"
    />
    <el-row v-if="status === 1 && interfaceList.length !== 0" class="other">
      <el-col :offset="21" :span="2">
        <el-button type="primary" :icon="Promotion" @click.stop="cleanInterface"
          >Clean</el-button
        >
      </el-col>
    </el-row>
    <el-row
      v-for="item in interfaceList.slice().reverse()"
      class="other"
      v-if="status === 1"
    >
      <el-col :offset="1" :span="22">
        <el-card shadow="always" class="other-card" @click="showDetail(item)">
          <span class="other-url" style="overflow-wrap: break-word">{{
            item.url
          }}</span>
          <span class="other-icon">{{ toLocalDate(item.startTime) }}</span>
        </el-card>
      </el-col>
    </el-row>
    <div v-if="status === 2">
      <el-row class="other">
        <el-col :offset="1" :span="2">
          <el-button
            type="primary"
            :icon="ArrowLeftBold"
            @click.stop="changeStatus(1)"
            >Back</el-button
          >
        </el-col>
        <el-col :offset="18" :span="2">
          <el-button
            type="primary"
            :icon="Promotion"
            @click.stop="sendInterface"
            >Send</el-button
          >
        </el-col>
      </el-row>
      <el-row class="other">
        <el-col :offset="1" :span="22">
          <el-card shadow="always" class="other-card">
            <span class="other-url" style="overflow-wrap: break-word">{{
              currentInterface.url
            }}</span>
            <span class="other-icon">{{
              toLocalDate(currentInterface.startTime)
            }}</span>
          </el-card>
        </el-col>
      </el-row>

      <el-row class="other">
        <el-col :offset="1" :span="22">
          <el-divider content-position="left"
            ><span style="font-size: 16px">Request</span></el-divider
          >
        </el-col>
      </el-row>
      <el-row class="other">
        <el-col :offset="1" :span="11">
          <div class="request request-body"><span>Request Body</span></div>
          <textarea
            class="request jsonOutput"
            rows="10"
            cols="50"
            v-model="currentBody"
          ></textarea>
        </el-col>
        <el-col :offset="1" :span="10">
          <div class="request request-headers"><span>Request Header</span></div>
          <textarea
            class="request jsonOutput"
            rows="10"
            cols="50"
            :value="currentHeaders"
          ></textarea>
        </el-col>
      </el-row>
      <el-row class="other" v-if="status === 2">
        <el-col :offset="1" :span="22">
          <el-divider content-position="left"
            ><span style="font-size: 16px">Response</span></el-divider
          >
        </el-col>
      </el-row>
      <el-empty v-if="currentResponse === null" description="No Response" />
      <el-row v-if="currentResponse !== null" class="other">
        <el-col :offset="1" :span="11">
          <div class="request request-body"><span>Response Body</span></div>
          <textarea
            readonly
            class="request jsonOutput"
            rows="10"
            cols="50"
            :value="resBody"
          ></textarea>
        </el-col>
        <el-col :offset="1" :span="10">
          <div class="request request-headers">
            <span>Response Header</span>
          </div>
          <textarea
            readonly
            class="request jsonOutput"
            rows="10"
            cols="50"
            :value="resHeader"
          ></textarea>
        </el-col>
      </el-row>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { apiRequests } from '@/api'
import { ArrowLeftBold, Promotion } from '@element-plus/icons-vue'
// 接受父组件传递的方法
const emit = defineEmits(['onClose'])
// 假设jsonString是你要展示的JSON字符串
const resBody = ref('')
const resHeader = ref('')
const currentBody = ref('')
const currentHeaders = ref('')
const status = ref(1)
const currentInterface = ref(null)
const currentResponse = ref(null)
// 接收父组件传递的参数
const props = defineProps({
  interfaceList: {
    type: Array,
    default: () => []
  },
  visible: {
    type: Boolean,
    default: true
  }
})
watch(
  () => props.visible,
  (n, o) => {
    if (n) {
      status.value = 1
    }
  }
)

function showDetail(item) {
  currentInterface.value = item
  currentBody.value = displayFormattedJson(item.body)
  currentHeaders.value = displayFormattedJson(item.headers)
  status.value = 2
  currentResponse.value = null
}

function toLocalDate(utc) {
  // 将UTC时间转换为本地时间
  let localDate = new Date(utc)
  return formatDate(localDate.toString()) // 输出本地时间字符串
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.greeting === 'interface_result') {
    resBody.value = displayFormattedJson(request.data)
    let _headers = {}
    for (let i = 0; i < request.headers.length; i++) {
      _headers[request.headers[i][0]] = request.headers[i][1]
    }
    resHeader.value = displayFormattedJson(_headers)
    currentResponse.value = true
  }
  sendResponse(true)
  return true
})

function sendInterface() {
  chrome.runtime.sendMessage({
    greeting: 'send_interface',
    data: {
      url: currentInterface.value.url,
      headers: JSON.parse(currentHeaders.value),
      body: currentBody.value,
      method: currentInterface.value.method
    }
  })
}

function cleanInterface() {
  chrome.runtime.sendMessage({
    greeting: 'clean_interface'
  })
}

function formatDate(date) {
  let d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear(),
    hour = d.getHours(),
    minute = d.getMinutes(),
    second = d.getSeconds()

  if (month.length < 2 || hour < month) month = '0' + month
  if (day.length < 2 || day < 10) day = '0' + day
  if (hour.length < 2 || hour < 10) hour = '0' + hour
  if (minute.length < 2 || minute < 10) minute = '0' + minute
  if (second.length < 2 || second < 10) second = '0' + second
  return [year, month, day].join('-') + ' ' + [hour, minute, second].join(':')
}

// 输入框中的内容
const text = ref('')

// 是否显示对话框
const isVisible = computed({
  get() {
    return props.visible
  },
  set() {
    // 关闭对话框的时候，会触发对isVisible=false的修改
    // 通知父组件将对话框显示状态设置为false
    emit('onClose')
  }
})

function changeStatus(statusValue) {
  status.value = statusValue
}

function displayFormattedJson(jsonString) {
  if (jsonString === '') return jsonString
  if (jsonString === null) {
    return ''
  }
  if (Object.prototype.toString.call(jsonString) === '[object Object]') {
    return JSON.stringify(jsonString, null, 4)
  }
  try {
    // 解析JSON字符串
    let jsonObj = JSON.parse(jsonString)

    // 美化JSON字符串
    let formattedJson = JSON.stringify(jsonObj, null, 4)

    // 显示在textarea中
    return formattedJson
  } catch (e) {
    return jsonString
  }
}
</script>

<style scoped lang="scss">
.request {
  width: 100%;
}
.request-body,
.request-headers {
  height: 40px;
  background: linear-gradient(
    90deg,
    rgb(86, 107, 97) 0%,
    rgb(85, 195, 162) 19%,
    rgb(85, 195, 162) 100%
  );
  display: flex;
  justify-content: start;
  align-items: center;
  color: white;
  span {
    margin-left: 10px;
  }
  border-radius: 10px 10px 0px 0px;
}
.jsonOutput::-webkit-scrollbar {
  display: none; /* 隐藏滚动条 */
}
.jsonOutput {
  -ms-overflow-style: none; /* IE 10+ */
  scrollbar-width: none; /* Firefox */
  overflow: scroll;
  display: unset;
  border: none;
  outline: none;
  margin: 0px;
  resize: none;
  box-sizing: border-box;
  padding: 20px;
  font-family: monospace; /* 更易于阅读的字体 */
  white-space: pre; /* 保持空格和换行 */
  overflow: auto; /* 添加滚动条 */
  // border: 1px solid;
  cursor: text;
  font-size: 14px;
  font-weight: 700;
  box-shadow: var(--AP-el-box-shadow-light);
  border-radius: 0px 0px 10px 10px;
}
.other-icon {
  margin-left: auto;
}
.other:not(:first-child) {
  margin-top: 20px;
}
.other:last-child {
  margin-bottom: 20px;
}
.other-url {
  max-width: 80%;
}
</style>

<style lang="scss">
.other-card {
  .AP-el-card__body {
    display: flex;
    justify-content: left;
    align-items: center;
    text-align: center;
  }
  font-size: 14px;
  // cursor: pointer;
}
.AP-dialog {
  cursor: default;
  border-radius: 10px !important;
  .AP-el-dialog__body {
    padding: 20px;
  }
  .AP-el-dialog__header {
    margin: 0px;
    padding: 10px 0px 10px 5px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    background-image: linear-gradient(
      90deg,
      var(--dialog-color) 70%,
      var(--dialog-color)
    );
    p {
      color: white;
      font-size: 16px;
      font-weight: normal;
      font-style: normal;
      display: table-cell;
      vertical-align: middle;
      height: 35px;
      padding-left: 20px;
    }
  }
}
</style>
