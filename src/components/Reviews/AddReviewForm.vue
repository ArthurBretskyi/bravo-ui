<template>
    <form class="add-review-form" @submit.prevent="submitReview">
        <div class="form-group">
            <label>{{ $t('pages.Reviews.Form.selectRating') }}</label>
            <select v-model="rating" required>
                <option disabled value="">⭐ ⭐ ⭐ ⭐ ⭐</option>
                <option v-for="n in 5" :key="n" :value="n" class="option">{{ n }} ⭐</option>
            </select>
        </div>

        <div class="form-group">
            <label>{{ $t('pages.Reviews.Form.text') }}</label>
            <textarea v-model="text" required></textarea>
        </div>

        <!-- Локальне повідомлення -->
        <p v-if="localError" class="form-error">{{ localError }}</p>

        <button type="submit" class="btn-submit">
            {{ $t('pages.Reviews.Form.submit') }}
        </button>
    </form>
</template>
  
<script setup>
import { ref } from 'vue'
import { useReviewsStore } from '@/stores/reviews'
import { useAuthStore } from '@/stores/auth'

const reviewsStore = useReviewsStore()
const authStore = useAuthStore()

const rating = ref('')
const text = ref('')
const localError = ref(null)

const submitReview = async () => {
    const currentUser = authStore.user

    if (!currentUser) {
        localError.value = 'Please log in to leave a review'
        return
    }

    await reviewsStore.addItem({
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userPhoto: currentUser.photoURL || null,
        serviceId: null,
        masterId: null,
        rating: Number(rating.value),
        text: text.value.trim(),
        createdAt: new Date().toISOString(),
    })

    rating.value = ''
    text.value = ''
}

</script>
  
<style scoped lang="scss">
.add-review-form {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .form-group {
        display: flex;
        flex-direction: column;
        padding: 15px;
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 8px 20px #31313114;

        label {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 0.5rem;
        }

        select {
            width: 30%;
            padding: 0.5rem;
            border-radius: 6px;
            border: 1px solid #ccc;
            font-size: 1rem;
            cursor: pointer;
        }

        .option {
            font-size: 18px;
            color: #00CEC8;
        }

        textarea {
            width: 100%;
            height: 120px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background-color: #f9f9f9;
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
            resize: vertical;
            transition: border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }

        textarea:focus {
            border-color: #007bff;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
            outline: none;
        }

        textarea::placeholder {
            color: #00CEC8;
        }
    }

    .form-error {
        color: red;
        font-size: 0.9rem;
        margin: 0;
        align-self: start;
    }

    .btn-submit {
        color: #000;
        font-weight: bold;
        padding: 0.5rem 1.5rem;
        border: 2px solid #00CEC8;
        border-radius: 30px;
        transition: background-color 0.3s, color 0.3s;
        align-self: end;

        &:hover {
            background-color: #00CEC8;
            color: #fff;
            border: 2px solid #00CEC8;
        }
    }
}
</style>
  