<script setup>
import Nav from '@/popup/components/nav/nav.vue'
</script>

<template>
  <div class="M-entry">
    <Nav />
    <router-view style="margin-top: 80px" />
  </div>
</template>

<style scoped lang="scss">
.M-entry {
  display: flex;
  flex-direction: column;
  height: 100%;

  .main-container {
    position: relative;
    flex: 1;
  }
}
</style>
