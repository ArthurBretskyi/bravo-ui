<template>
    <section class="reviews-view">
        <!-- Loader -->
        <LoadingComponent v-if="generalStore.isLoading" />

        <!-- Error -->
        <ErrorComponent v-else-if="generalStore.errorMessage && reviewsStore.getItemsList.length === 0"
            :message="generalStore.errorMessage?.message || generalStore.errorMessage" />

        <!-- Якщо все ок -->
        <div v-else>
            <h2 class="reviews-view__title">{{ $t('pages.Reviews.title') }}</h2>

            <!-- Форма додавання -->
            <AddReviewForm />

            <!-- Список відгуків -->
            <ReviewsList :reviews="reviewsStore.getItemsList" />
        </div>
    </section>
</template>
  
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useReviewsStore } from '@/stores/reviews'
import { useGeneralStore } from '@/stores/general'

import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'
import ReviewsList from '@/components/Reviews/ReviewsList.vue'
import AddReviewForm from '@/components/Reviews/AddReviewForm.vue'

const reviewsStore = useReviewsStore()
const generalStore = useGeneralStore()

onMounted(async () => {
    await reviewsStore.subscribeToItemsList()
})

onUnmounted(() => {
    reviewsStore.unsubscribeFromItemsList()
})
</script>
  
<style scoped lang="scss">
.reviews-view {
    padding: 2rem 1rem;
    max-width: 900px;
    margin: 0 auto;

    &__title {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 2rem;
        font-weight: bold;
    }
}
</style>
  
  