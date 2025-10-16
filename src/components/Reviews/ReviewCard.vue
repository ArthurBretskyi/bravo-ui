<template>
    <div class="review-card">
        <!-- Основна інформація -->
        <div class="review-card__header">
            <img v-if="review.userPhoto" :src="review.userPhoto" class="review-card__avatar" />
            <div>
                <h3 class="review-card__name">{{ review.userName }}</h3>
                <div class="review-card__rating">
                    <span v-for="n in 5" :key="n" class="star" :class="{ active: n <= review.rating }">★</span>
                </div>
            </div>
        </div>

        <p class="review-card__text">{{ review.text }}</p>
        <small class="review-card__date">{{ new Date(review.createdAt).toLocaleDateString() }}</small>

        <!-- Відповідь адміністрації -->
        <div v-if="review.answer" class="review-card__answer">
            <strong>{{ $t('components.reviewReply.title') }}:</strong>
            <p>{{ review.answer.text }}</p>
            <small>{{ new Date(review.answer.createdAt).toLocaleDateString() }}</small>
        </div>

        <!-- Кнопка для адміна -->
        <div v-else-if="authStore.isAdmin" class="review-card__admin">
            <button v-if="!showAnswerForm" @click="showAnswerForm = true" class="btn-reply">
                {{ $t('buttons.replyReview') }}
            </button>

            <div v-else class="answer-form">
                <textarea v-model="answerText" placeholder="Напишіть відповідь..." />
                <button @click="submitAnswer" class="btn-submit">{{ $t('buttons.confirm') }}</button>
                <button @click="cancelAnswer" class="btn-cancel">{{ $t('buttons.cancel') }}</button>
            </div>
        </div>
    </div>
</template>
  
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReviewsStore } from '@/stores/reviews'

const props = defineProps({
    review: {
        type: Object,
        required: true,
    },
})

const authStore = useAuthStore()
const reviewsStore = useReviewsStore()

const showAnswerForm = ref(false)
const answerText = ref('')

const submitAnswer = async () => {
    if (!answerText.value.trim()) return
    await reviewsStore.updateItem(props.review.id, {
        answer: {
            text: answerText.value.trim(),
            adminId: authStore.user?.uid,
            createdAt: new Date().toISOString(),
        },
    })
    showAnswerForm.value = false
    answerText.value = ''
}

const cancelAnswer = () => {
    showAnswerForm.value = false
    answerText.value = ''
}
</script>
  
<style scoped lang="scss">
.review-card {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    background: #fff;
    color: #000;

    &__header {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    &__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 0.75rem;
    }

    &__name {
        font-weight: bold;
        margin: 0;
    }

    &__rating {
        color: gold;
        font-size: 1rem;

        .star {
            opacity: 0.3;

            &.active {
                opacity: 1;
            }
        }
    }

    &__text {
        margin: 0.5rem 0;
    }

    &__date {
        font-size: 0.8rem;
        color: #777;
    }

    &__answer {
        margin-top: 1rem;
        padding: 0.75rem;
        border-left: 3px solid #00cec8;
        background: #f9f9f9;
        border-radius: 6px;
    }

    &__admin {
        margin-top: 1rem;

        .btn-reply,
        .btn-submit,
        .btn-cancel {
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 0.5rem;
        }

        .btn-reply {
            background: #00cec8;
            border: none;
            color: #fff;
            font-weight: bold;
        }

        .btn-submit {
            background: #28a745;
            border: none;
            color: #fff;
        }

        .btn-cancel {
            background: #dc3545;
            border: none;
            color: #fff;
        }

        .answer-form {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            textarea {
                width: 100%;
                min-height: 80px;
                padding: 0.5rem;
                border-radius: 6px;
                border: 1px solid #ccc;
                resize: vertical;
            }
        }
    }
}
</style>
  