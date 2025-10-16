<template>
    <section class="thank-you">
        <div class="thank-you__content">
            <h1>{{ $t(titleKey) }}</h1>
            <p>{{ $t('pages.thankYou.thankYouMessage') }}</p>

            <div class="thank-you__links">
                <RouterLink to="/" class="btn">{{ $t('pages.thankYou.goHome') }}</RouterLink>
                <RouterLink :to="{ name: 'UserDashboard' }" class="btn">{{ $t('pages.thankYou.goCabinet') }}</RouterLink>
            </div>
        </div>
    </section>
</template>

  
<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const mode = route.query.mode || 'new'

const titleKey = computed(() => {
    return mode === 'rebook'
        ? 'pages.thankYou.rebookSuccessTitle'
        : 'pages.thankYou.newBookingSuccessTitle'
})
</script>
  
  
<style lang="scss" scoped>
.thank-you {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    background-color: rgba(0, 0, 0, 0.3);
    text-align: center;
    padding: 2rem;

    &__content {
        background: white;
        padding: 2rem 3rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        max-width: 500px;
        width: 100%;
    }

    h1 {
        color: #2e7d32;
        margin-bottom: 0.5rem;
    }

    p {
        margin: 1rem 0 2rem;
        color: #555;
    }

    &__links {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;

        .btn {
            display: inline-block;
            padding: 0.8rem 1.5rem;
            border-radius: 30px;
            text-decoration: none;
            transition: background-color 0.3s ease-in-out;
            color: #000;
            border: 2px solid #00cec8;

            &:hover {
                background: #00cec8;
                color: #fff;
            }

            &--secondary {
                background: #777;

                &:hover {
                    background: #555;
                }
            }
        }
    }
}
</style>
  