<script setup>
// 在popup页面调试content script，仅用于开发环境，build前记得要注释掉。
// import '@/content'
</script>

<template>
  <router-view />
</template>

<style lang="scss">
body {
  position: relative;
  width: 580px;
  height: 510px;
}
</style>
