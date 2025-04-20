<template>
  <div v-if="!loading">
    <el-row style="margin-top: 60px">
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
    <el-row style="margin-top: 30px">
      <el-col :offset="1" :span="17">
        <span class="setting-param-title">清空全局监听内容</span>
      </el-col>
      <el-col :span="4" style="text-align: end">
        <el-button
          style="width: 80%"
          type="primary"
          :icon="Promotion"
          @click.stop="cleanAllInterface"
          >Clean</el-button
        >
      </el-col>
    </el-row>
    <el-row v-if="show_download_btn" style="margin-top: 30px">
      <el-col
        :offset="1"
        :span="17"
        style="display: flex; flex-direction: column; gap: 5px"
      >
        <span class="setting-param-title">获取下载文件URL</span>
        <span
          >总文件数：{{ all_download_count }} ，已下载：{{
            downloaded_count
          }}。请不要关闭该窗口！</span
        >
      </el-col>
      <el-col :span="4" style="text-align: end">
        <el-button
          style="width: 80%"
          type="primary"
          :icon="Promotion"
          @click.stop="getDownloadFileUrl"
          >获取</el-button
        >
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
        <span>{{ email === "" ? "暂无" : email }}</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-divider />
      </el-col>
    </el-row>
    <el-row justify="start" style="margin-bottom: 20px">
      <el-col :offset="1" :span="15">
        <span class="setting-param-title">私人秘钥</span>
      </el-col>
      <el-col :span="6" class="setting-param-desc">
        <span>{{ privateKey }}</span>
      </el-col>
    </el-row>
  </div>
  <div v-if="loading" class="main-loading">
    <el-row>
      <el-col :span="24">
        <NormalLoading></NormalLoading>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { storageHandle, sendMessageToBackground } from "@/api/storage";
import { ElMessage } from "element-plus";
import { Promotion } from "@element-plus/icons-vue";
import PluginSwitch from "@/popup/components/normal/plugin_switch.vue";
import { sendMessageToAllTabs } from "@/common/js/utils.js";
import NormalLoading from "@/popup/components/loading/normal_loading.vue";
const router = useRouter();

const globalListener = ref(true);
const username = ref("暂无");
const privateKey = ref("暂无");
const email = ref("暂无");
const loading = ref(true);
const current_tab = ref(0);
const all_download_count = ref(0);
const downloaded_count = ref(0);
const download_url_list = ref([]);
const show_download_btn = ref(false)

onMounted(async () => {
  await onMountedAction();
  getCurrentTab();
});

function getCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    current_tab.value = tabs[0];
    if (current_tab.value.url.startsWith("https://365.kdocs.cn")) {
      show_download_btn.value = true
    }
  });
}

async function onMountedAction() {
  try {
    const user = await storageHandle.getStorage("fetcherUser");
    const isLogin = await storageHandle.getStorage("fetcherIsLogin");
    if (!user || !isLogin || isLogin === 0) {
      router.push("/login");
    } else {
      try {
        const data = JSON.parse(user);
        if (data.private_key === "") {
          router.push("/login");
          return;
        }
        username.value = data.nick_name;
        privateKey.value = data.private_key;
        email.value = data.email;
        const global_listener = await storageHandle.getStorage(
          "global_listener"
        );
        if (global_listener !== undefined && global_listener !== null) {
          globalListener.value = global_listener === 1 ? true : false;
        } else {
          await storageHandle.setStorage("global_listener", 1);
          globalListener.value = true;
        }
        loading.value = false;
        storageHandle.get("user");
      } catch (error) {
        router.push("/login");
        return;
      }
    }
  } catch (error) {
    router.push("/login");
  }
}

function cleanAllInterface() {
  sendMessageToBackground({
    greeting: "clean_all_interface",
  });
  ElMessage({
    message: "已清除所有监听接口",
    type: "success",
    center: true,
  });
}

function startToDownloadFile() {
  all_download_count.value = 0
  downloaded_count.value = 0
  download_url_list.value = []
  sendMessageToBackground({
    greeting: "start_to_download_file",
    tabId: current_tab.value.id,
  });
  ElMessage({
    message: "准备开始获取文件下载地址",
    type: "success",
    center: true,
  });
}

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.type === "download_info") {
      if (msg.info.count === -1) {
        ElMessage({
          message: "当前页面没有可下载的文件，请尝试刷新页面。",
          type: "info",
          center: true,
        });
        return
      }
      if (msg.info.url) {
        download_url_list.value.push(msg.info.url);
      }
      all_download_count.value = msg.info.count;
      downloaded_count.value += 1;
      if (downloaded_count.value === all_download_count.value) {
        ElMessage({
          message: "已获取完成，下载地址已复制到剪贴板",
          type: "success",
          center: true,
        });
        navigator.clipboard.writeText(download_url_list.value.join("\n"));
      }
    }
  });
});

async function getDownloadFileUrl() {
  startToDownloadFile();
}

async function switchGlobalListener(flag) {
  const message = {
    greeting: "switch_listener",
    flag: flag,
  };
  globalListener.value = flag;
  await storageHandle.set("global_listener", flag ? 1 : 0);
  ElMessage({
    message: flag ? "开启监听" : "关闭监听",
    type: "success",
    center: true,
  });
  sendMessageToAllTabs(message);
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
