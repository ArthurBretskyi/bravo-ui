<template>
  <main class="home">
    <section class="hero-content" aria-label="Main promo content">
      <h1 class="title">{{ $t('pages.home.slogan') }}</h1>
      <nav class="hero-nav" aria-label="Hero navigation">
        <router-link :to="{ name: 'Services' }">{{ $t('services') }}</router-link>
        <router-link :to="bookingRoute" class="home__booking-link">
          {{ bookingLabel }}
        </router-link> <router-link :to="{ name: 'Gallery' }">{{ $t('pages.home.gallery') }}</router-link>
      </nav>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'


const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const { t } = useI18n()


const bookingRoute = computed(() => {
  const role = user.value?.role
  if (role === 'admin' || role === 'master') {
    return { name: 'AdminBooking' } // 🔹 для адміна/майстра
  }
  return { name: 'Booking' } // 🔹 для звичайного користувача
})

const bookingLabel = computed(() => {
  const role = user.value?.role
  if (role === 'admin' || role === 'master') {
    return t('pages.home.bookingForStaff') // 🔹 "Записати"
  }
  return t('pages.home.booking') // 🔹 "Записатись"
})
</script>

<style scoped lang="scss">
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px); // якщо хедер ~80px
  color: #fff;
  text-align: center;
  padding: 2rem;

  .hero-content {
    max-width: 960px;

    .title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      animation: fadeInDown 1s ease-out;
    }

    .hero-nav {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1.5rem;

      a {
        color: white;
        text-decoration: none;
        font-weight: bold;
        padding: 0.5rem 1.5rem;
        border: 2px solid #00CEC8;
        border-radius: 30px;
        transition: background-color 0.3s, color 0.3s;

        &:hover {
          background-color: white;
          color: #000;
          border: 2px solid #fff;

        }
      }
    }
  }

  @media (max-width: 768px) {
    .hero-content .title {
      font-size: 2.2rem;
    }
  }
}

// Анімації
@keyframes fadeInDown {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }


}
</style>
