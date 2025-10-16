<template>
    <div class="login">
        <div class="login__wrapper">
            <h1 class="login__title on-hero">{{ $t('pages.login.title') }}</h1>

            <form class="login__form" @submit.prevent="handleLogin">
                <input v-model="form.email" type="email" :placeholder="$t('pages.login.email')" class="login__input"
                    required />
                <input v-model="form.password" type="password" :placeholder="$t('pages.login.password')"
                    class="login__input" required />

                <p v-if="localError" class="login__error">{{ localError }}</p>
                <p v-if="hasError" class="login__error">{{ $t('error.messages.smth_wrong') }}</p>

                <button type="submit" class="login__btn">
                    {{ $t('pages.login.submit') }}
                </button>
            </form>

            <div class="login__divider on-hero">{{ $t('pages.login.or') }}</div>

            <button class="login__btn login__btn--google" @click="handleGoogleSignIn">
                {{ $t('pages.login.google') }}
            </button>

            <LoadingComponent v-if="isLoading" />
        </div>
    </div>
</template>
  
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useGeneralStore } from '@/stores/general'

import LoadingComponent from '@/components/LoadingComponent.vue'

const { t } = useI18n()
const router = useRouter()

const form = ref({
    email: '',
    password: '',
})

const localError = ref(null)

const authStore = useAuthStore()
const usersStore = useUsersStore()
const generalStore = useGeneralStore()
const { isLoading, hasError, generalApiOperation } = generalStore

const handleLogin = async () => {
    localError.value = null

    await generalApiOperation({
        operation: async () => {
            const user = await authStore.loginWithEmail(form.value.email, form.value.password)

            const exists = await usersStore.checkUserExists(user.uid)
            if (!exists) {
                localError.value = t('pages.login.user_not_found')
                await authStore.logout()
                return
            }
            await authStore.fetchUserRole(user.uid)
            router.push({ name: 'Home' })
        },
    })
}

const handleGoogleSignIn = async () => {
    localError.value = null

    await generalApiOperation({
        operation: async () => {
            const user = await authStore.loginWithGoogleAccount()

            // 🔒 UID з Firebase Auth
            const uid = user?.uid
            if (!uid) {
                throw new Error('Google login failed')
            }

            const exists = await usersStore.checkUserExists(uid)

            if (!exists) {
                const userData = {
                    uid,
                    email: user.email || '',
                    username: user.displayName || '',
                    firstName: '',
                    lastName: '',
                    createdAt: new Date().toISOString(),
                }

                await usersStore.addItemWithCustomId({ id: uid, data: userData })
            }
            await authStore.fetchUserRole(uid)
            router.push({ name: 'Home' })
        }
    })
}

</script>
  
<style lang="scss" scoped>
.login {
    display: flex;
    justify-content: center;
    padding: 2rem;

    &__wrapper {
        width: 100%;
        max-width: 400px;
        background: #fff;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    }

    &__title {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__input {
        padding: 0.75rem;
        border: 1px solid #ccc;
        border-radius: 5px;
    }

    &__btn {
        padding: 0.75rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;

        &--google {
            background-color: #db4437;
        }
    }

    &__error {
        color: red;
        font-size: 0.9rem;
        text-align: center;
    }

    &__divider {
        text-align: center;
        margin: 1rem 0;
        font-weight: bold;
    }
}
</style>
  