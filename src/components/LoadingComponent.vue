<template>
    <div class="loading-container">
        <font-awesome-icon :icon="['fas', 'spinner']" size="6x" spin class="icon" />
    </div>
</template>
  
<script setup></script>
  
<style lang="scss" scoped>
.loading-container {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    height: 100vh;
    width: 100vw;
    background: rgba(255, 255, 255, 0.8);

    .icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }
}
</style>