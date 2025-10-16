<template>
    <section class="step-user-phone">
        <h2 class="step-user-phone__title">{{ $t('components.booking.phoneStep.title') }}</h2>

        <div class="step-user-phone__content">
            <p class="content-text">{{ $t('components.booking.phoneStep.description') }}</p>

            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label for="phone">{{ $t('components.booking.phoneStep.label') }}</label>
                    <input id="phone" type="tel" v-model="phone"
                        :placeholder="$t('components.booking.phoneStep.placeholder')" required :disabled="isSaving" />
                </div>

                <button type="submit" class="btn-primary" :disabled="!isValid || isSaving || saved">
                    {{ $t('buttons.continue') }}
                </button>
            </form>
        </div>
    </section>
</template>
  
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { doc, updateDoc } from 'firebase/firestore'
import db from '@/firebase-config'
import { toast } from 'vue3-toastify'

const emit = defineEmits(['phoneSaved'])
const { t } = useI18n()
const authStore = useAuthStore()

const phone = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
const saved = ref(false)

const phonePattern = /^\+?[0-9\s\-()]{9,20}$/
const isValid = computed(() => phonePattern.test(phone.value || ''))

function validate() {
    errorMessage.value = isValid.value
        ? ''
        : (t('components.booking.phoneStep.invalid') || 'Введіть, будь ласка, коректний номер телефону')
}

onMounted(async () => {
    const uid = authStore.user?.uid
    if (!uid) return
    // Підвантаження телефону через updateDoc або store, якщо потрібно
    // phone.value = ...
})

// Скидаємо saved при зміні номера
watch(phone, () => {
    saved.value = false
})

const handleSubmit = async () => {
    validate()
    if (!isValid.value) {
        toast.error(errorMessage.value)
        return
    }

    const uid = authStore.user?.uid
    if (!uid) {
        toast.error(t('error.messages.authRequired') || 'Потрібна авторизація')
        return
    }

    try {
        isSaving.value = true
        const userRef = doc(db, 'users', uid)
        await updateDoc(userRef, { phone: phone.value })

        toast.success(t('toast.phoneSaved') || 'Номер телефону збережено')
        saved.value = true
        emit('phoneSaved') // 🔹 повідомляємо батька, щоб перейти на наступний крок
    } catch (err) {
        console.error('❌ Failed to save phone:', err)
        toast.error(t('error.messages.smth_wrong') || 'Сталася помилка. Спробуйте ще раз')
    } finally {
        isSaving.value = false
    }
}
</script>
  
<style scoped lang="scss">
.step-user-phone {
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    text-align: center;

    gap: 1.25rem;

    &__title {
        font-size: 2rem;
        margin-bottom: 1.5rem;
    }

    &__content {
        display: flex;
        flex-direction: column;
        gap: 32px;
        align-items: center;
        padding: 2rem;
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 8px 20px #31313114;
    }

    .content-text {
        font-size: 1.2rem;
    }

    .form-group {
        margin-bottom: 1rem;
        text-align: left;


        label {
            display: block;
            margin-bottom: 0.5rem;
        }

        input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 8px;
        }
    }

    .btn-primary {
        color: #000;
        text-decoration: none;
        font-weight: bold;
        padding: 0.5rem 1.5rem;
        border: 2px solid #00CEC8;
        border-radius: 30px;
        transition: background-color 0.3s ease-in-out;
        cursor: pointer;

        &:hover {
            background-color: #00CEC8;
            color: #fff;
            border: 2px solid #00CEC8;

        }
    }
}
</style>
  