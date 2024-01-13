<template>
  <div class="P-login-section">
    <el-row class="login-row" align="middle">
      <el-col id="tt" class="login-panel" :span="24">
        <div class="main-div">
          <div class="sub-div">
            <h2 class="desc-text-main">
              <span class="login-font g-unselect"
                >使用您的 AsyncTest 账号登陆 AsyncFetcher</span
              >
            </h2>
          </div>
          <div class="desc-div">
            <span class="sub-span"
              ><span
                ><div class="sub-desc-div g-unselect">
                  禅道账号同样可以登录，但我们不会保留您禅道的鉴权信息，请放心使用。您也可以使用Ast的独立账号密码体系，相关信息可以联系管理员。
                </div></span
              ></span
            >
          </div>
          <div class="info">
            <div class="username-title">
              <span class="bold-style g-unselect">用户名</span>
            </div>
            <div class="username-input-div">
              <input
                v-model="username"
                class="input-special"
                placeholder="禅道账号"
                spellcheck="false"
                type="text"
              />
            </div>
            <div class="username-title">
              <span class="bold-style g-unselect">密码</span>
            </div>
            <div class="username-input-div">
              <input
                v-model="password"
                @input="onPasswordChange"
                class="input-special"
                placeholder="禅道密码"
                spellcheck="false"
                type="password"
                @keyup.enter="enter"
              />
            </div>

            <div class="submit-btn">
              <button
                type="submit"
                role="button"
                :disabled="canSubmitBtn"
                class="btn-special"
                :style="{ cursor: canSubmitBtn ? 'pointer' : 'not-allowed' }"
              >
                <span
                  @click="enter"
                  class="span-special"
                  :style="{
                    cursor: canSubmitBtn ? 'pointer' : 'not-allowed',
                    color: canSubmitBtn
                      ? 'rgb(255, 255, 255)'
                      : 'rgb(128, 234, 167)'
                  }"
                  >登录</span
                >
              </button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    <div class="banner" v-if="showNews">
      <a
        ><span>News: </span>监听模块更新：新增监听 XHR 接口、自定义重发功能 -
        2024-01-04</a
      >
      <button @click="showNews = false">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          class="close"
        >
          <path
            d="M18.9,10.9h-6v-6c0-0.6-0.4-1-1-1s-1,0.4-1,1v6h-6c-0.6,0-1,0.4-1,1s0.4,1,1,1h6v6c0,0.6,0.4,1,1,1s1-0.4,1-1v-6h6c0.6,0,1-0.4,1-1S19.5,10.9,18.9,10.9z"
          ></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequests } from '@/api'
import { storageHandle } from '@/api/storage'
import { ElMessage, ElNotification } from 'element-plus'
import { sendMessageToAllTabs } from '@/common/js/utils.js'
const router = useRouter()
const username = ref('')
const password = ref('')
const canSubmitBtn = ref(false)
const showNews = ref(true)

onMounted(async () => {
  const result = await storageHandle.get('user')
  if (result) {
    const _data = JSON.parse(result)
    username.value = _data.username
    password.value = _data.password
    canSubmitBtn.value = true
  }
})

const onLogin = () => {
  if (checking()) {
    apiRequests.signIn({
      // 如果上传文件，则设置formData为true，这里暂时不用。
      // formData: true,
      data: {
        username: username.value,
        password: password.value
      },
      success: async (res) => {
        if (res.result === 1) {
          res.data.password = password.value
          await storageHandle.set('user', JSON.stringify(res.data))
          await storageHandle.set('isLogin', 1)
          await storageHandle.set('global_listener', 1)
          ElNotification({
            title: '您正在使用AsyncTest账号体系！',
            message: h('i', { style: 'color: #009879' }, '登录成功!'),
            position: 'bottom-right'
          })
          const message = {
            greeting: 'switch_listener',
            flag: true
          }
          sendMessageToAllTabs(message)
          router.push('/setting')
        } else if (res.result === 0) {
          ElMessage({
            message: res.msg,
            type: 'warning'
          })
          await storageHandle.set('global_listener', 0)
          await storageHandle.set('isLogin', 0)
        }
      },
      fail: () => {
        ElMessage({
          message: '登录异常',
          type: 'warning'
        })
      }
    })
  }
}

function onPasswordChange(item) {
  changeSubmitBtnStatus()
}

function checking() {
  if (username.value.length === 0 || password.value.length === 0) {
    ElMessage({
      message: '账号密码不能为空',
      type: 'warning'
    })
    return false
  }
  return true
}

function changeSubmitBtnStatus() {
  if (password.value.length > 0) {
    canSubmitBtn.value = true
  } else {
    canSubmitBtn.value = false
  }
}

function enter() {
  onLogin()
}
</script>

<style scoped lang="scss">
.banner {
  margin-top: auto;
  position: relative;
  z-index: 30;
  box-sizing: border-box;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  line-height: 30px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(
    90deg,
    rgba(66, 184, 131, 1) 0%,
    rgba(39, 179, 137, 1) 19%,
    #ff6a6a 100%
  );
  button {
    position: absolute;
    right: 0;
    top: 0;
    cursor: pointer;
    background-color: transparent;
    background-image: none;
    border: 0;
    line-height: inherit;
    color: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
    margin-right: 5px;
    .close {
      width: 20px;
      height: 20px;
      fill: #fff;
      transform: rotate(45deg);
    }
  }
}
.info {
  margin-left: 40px;
  margin-right: 40px;
  margin-top: 30px;
  .submit-btn {
    display: flex;
    flex-flow: row nowrap;
    width: 100%;
    -webkit-box-pack: justify;
    justify-content: space-between;
    margin-top: 30px;

    .btn-special {
      position: relative;
      display: grid;
      background: transparent;
      border: 0px;
      width: 100%;
      padding: 0px;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      .span-special {
        background: rgb(0, 214, 75);
        border-radius: 1.5rem;
        border: 2px solid white;
        box-sizing: border-box;
        display: flex;
        -webkit-box-pack: center;
        justify-content: center;
        -webkit-box-align: center;
        align-items: center;
        font-family: inherit;
        text-align: center;
        letter-spacing: 0.01em;
        padding: 0px 1rem;
        height: 3rem;
        max-height: 3rem;
        font-size: 1.125rem;
        font-weight: 500;
        line-height: 1.5rem;
        transition-property: transform;
        transition-duration: 80ms;
        transition-timing-function: cubic-bezier(0, 0.3, 1, 0.5);
      }
    }
  }
  .username-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0.6rem 0.5rem 0.5rem;
  }
  .username-input-div {
    width: 100%;
    .input-special {
      width: inherit;
      outline: none;
      box-sizing: border-box;
      min-height: 50px;
      border: none;
      background-color: rgb(244, 244, 244);
      appearance: none;
      -webkit-box-align: center;
      font-family: inherit;
      border-radius: 1rem;
      letter-spacing: 0.01em;
      box-sizing: border-box;
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.5rem;
      caret-color: rgb(0, 214, 75);
      border: 2px solid rgb(244, 244, 244);
      background-color: rgb(244, 244, 244);
      width: 100%;
      color: rgb(51, 51, 51);
      padding: 0px 1rem;
    }
    .input-special:focus {
      outline: none;
      border: 2px solid rgb(0, 214, 75);
      background: rgb(255, 255, 255);
    }
  }
}
.g-unselect {
  -webkit-user-select: none;
  -moz-user-select: none;
}
.main-div {
  position: relative;
  z-index: 2;
  // background-color: white;
  // height: 300px;
  width: 100%;
  border-radius: 30px;
  text-align: left;

  .sub-div {
    h2 {
      margin: 0;
      color: white;
    }
    padding-top: 25px;
    font-size: 0.5rem;
    z-index: 2;
    margin-bottom: 15px;
    margin-left: 40px;
    margin-right: 20px;
    .desc-text-main {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 2.2rem;
    }
  }
  .desc-div {
    width: 80%;
    margin-left: 40px;
    margin-right: 20px;
    .sub-span {
      display: block;
      color: gray;
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.5rem;
      word-break: break-word;
      .sub-desc-div {
        a {
          color: white;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }
      }
    }
  }
}
.P-login-section {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  bottom: 0;
  width: 100%;
  background: #4bb8e5;
  height: 100%;
  // width: 100%;
  // min-width: 1140px;
  background-size: 100% 100%;
  background-color: rgb(0, 214, 75);
  background-image: radial-gradient(
      closest-side,
      rgb(211, 169, 160),
      rgba(235, 105, 78, 0)
    ),
    radial-gradient(closest-side, rgba(0, 214, 75, 1), rgba(0, 214, 75, 0)),
    radial-gradient(
      closest-side,
      rgba(254, 234, 131, 1),
      rgba(254, 234, 131, 0)
    ),
    radial-gradient(closest-side, rgba(84, 255, 159, 1), rgba(84, 255, 159, 0)),
    radial-gradient(
      closest-side,
      rgba(248, 192, 147, 1),
      rgba(248, 192, 147, 0)
    );
  background-size: 130vmax 130vmax, 80vmax 80vmax, 90vmax 90vmax,
    110vmax 110vmax, 90vmax 90vmax;
  background-position: -80vmax -80vmax, 60vmax -30vmax, 10vmax 10vmax,
    -30vmax -10vmax, 50vmax 50vmax;
  background-repeat: no-repeat;
  animation: 4s movement linear infinite;
}

// .P-login-section::before {
//   z-index: 0;
//   content: '';
//   display: block;
//   position: fixed;
//   width: 100%;
//   height: 100%;
//   top: 0;
//   left: 0;
//   backdrop-filter: blur(10px);
//   -webkit-backdrop-filter: blur(10px);
// }
@keyframes movement {
  0%,
  100% {
    background-size: 130vmax 130vmax, 80vmax 80vmax, 90vmax 90vmax,
      110vmax 110vmax, 90vmax 90vmax;
    background-position: -80vmax -80vmax, 60vmax -30vmax, 10vmax 10vmax,
      -30vmax -10vmax, 50vmax 50vmax;
  }
  25% {
    background-size: 100vmax 100vmax, 90vmax 90vmax, 100vmax 100vmax,
      90vmax 90vmax, 60vmax 60vmax;
    background-position: -60vmax -90vmax, 50vmax -40vmax, 0vmax -20vmax,
      -40vmax -20vmax, 40vmax 60vmax;
  }
  50% {
    background-size: 80vmax 80vmax, 110vmax 110vmax, 80vmax 80vmax,
      60vmax 60vmax, 80vmax 80vmax;
    background-position: -50vmax -70vmax, 40vmax -30vmax, 10vmax 0vmax,
      20vmax 10vmax, 30vmax 70vmax;
  }
  75% {
    background-size: 90vmax 90vmax, 90vmax 90vmax, 100vmax 100vmax,
      90vmax 90vmax, 70vmax 70vmax;
    background-position: -50vmax -40vmax, 50vmax -30vmax, 20vmax 0vmax,
      -10vmax 10vmax, 40vmax 60vmax;
  }
}
</style>
