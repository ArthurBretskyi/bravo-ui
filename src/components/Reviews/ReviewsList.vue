<template>
    <section class="reviews-list">
        <ReviewCard v-for="review in reviews" :key="review.id" :review="review" />

        <p v-if="!reviews || reviews.length === 0" class="reviews-list__empty">
            {{ $t('pages.Reviews.List.noReviews') }}
        </p>
    </section>
</template>
  
<script setup>
import { defineProps } from 'vue'
import ReviewCard from '@/components/Reviews/ReviewCard.vue'

const props = defineProps({
    reviews: {
        type: Array,
        required: true,
    },
})
</script>
  
<style scoped lang="scss">
.reviews-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 15px;
    border-radius: 12px;
    background-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 8px 20px #31313114;

    &__empty {
        text-align: center;
        color: #888;
        font-style: italic;
    }
}

@media (min-width: 768px) {
    .reviews-list {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1200px) {
    .reviews-list {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
  