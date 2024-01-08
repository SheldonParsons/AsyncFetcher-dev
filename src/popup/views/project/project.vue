<template>
  <div>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-divider content-position="left">您已加入的项目</el-divider>
      </el-col>
    </el-row>
    <el-row v-for="item in projectList" class="other">
      <el-col :offset="1" :span="22">
        <el-card shadow="always" class="other-card">
          <span>{{ item.name }}</span
          ><SenderIcon @click="setProject" class="other-icon"></SenderIcon>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiRequests } from '@/api'
import { auth_and_get_headers } from '@/common/js/utils.js'
import SenderIcon from '@/common/svg/senderIcon.vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const projectList = ref({})

onMounted(async () => {
  apiRequests.getOwnerProject({
    // 如果上传文件，则设置formData为true，这里暂时不用。
    // formData: true,
    headers: await auth_and_get_headers(router),
    success: async (res) => {
      projectList.value = res.results
    },
    fail: () => {}
  })
})

function setProject() {
  ElMessage({
    message: '绑定项目，暂未开放，敬请期待！',
    type: 'success',
    center: true
  })
}
</script>
<style lang="scss">
.other-card {
  .el-card__body {
    display: flex;
    justify-content: left;
    align-items: center;
    text-align: center;
  }
  font-size: 14px;
}
</style>
<style scoped lang="scss">
.other-icon {
  margin-left: auto;
  margin-right: 20px;
  cursor: pointer;
}
.other:not(:first-child) {
  margin-top: 20px;
}
.other:last-child {
  margin-bottom: 20px;
}
</style>
