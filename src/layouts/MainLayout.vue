<template>
    <div class="layout-wrapper" :style="backgroundStyle">
        <HeaderComponent v-if="!['Register', 'Login'].includes(route.name)" />

        <!-- Home background окремо -->
        <div v-if="route.name === 'Home'" class="hero-background"></div>

        <div class="page-content">
            <router-view />
        </div>

        <FooterComponent v-if="!['Register', 'Login'].includes(route.name)" />
    </div>
</template>
  
<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HeaderComponent from '@/components/HeaderComponent.vue'
import FooterComponent from '@/components/FooterComponent.vue'

const route = useRoute()
const authStore = useAuthStore()

const bgImages = [
    new URL('@/assets/bg/bg11.jpg', import.meta.url).href,
    new URL('@/assets/bg/bg22.jpg', import.meta.url).href,
    new URL('@/assets/bg/bg33.jpg', import.meta.url).href
    // new URL('@/assets/bg/bg44.jpg', import.meta.url).href
]

const randomBg = ref('')

onMounted(async () => {
    if (authStore.currentUser?.uid) {
        await authStore.fetchUserRole(authStore.currentUser.uid)
    }

    // if (!['Home', 'Register', 'Login'].includes(route.name)) {
    //     const index = Math.floor(Math.random() * bgImages.length)
    //     randomBg.value = bgImages[index]
    // }
    watch(() => route.name, (newVal) => {
        if (!['Home', 'Register', 'Login'].includes(newVal)) {
            const index = Math.floor(Math.random() * bgImages.length)
            randomBg.value = bgImages[index]
        }
    })
})



const backgroundStyle = computed(() => {
    if (route.name === 'Home') return {}
    if (['Register', 'Login'].includes(route.name)) return {}
    return {
        background: `url(${randomBg.value}) center/cover no-repeat`,
        position: 'relative',
    }
})
</script>
  
<style scoped lang="scss">
.layout-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
    background-size: cover;
    background-position: center;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1;
        pointer-events: none;
    }
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: url('@/assets/hero-hair.jpg') center/cover no-repeat;
    z-index: 0;

    // &::before {
    //   content: '';
    //   position: absolute;
    //   inset: 0;
    //   background: rgba(0, 0, 0, 0.3);
    //   z-index: 1;
    //   pointer-events: none;
    // }
}

.page-content {
    flex: 1;
    position: relative;
    z-index: 2;
}
</style>
  