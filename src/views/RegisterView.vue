<template>
    <div class="register">
        <div class="register__wrapper">
            <h1 class="register__title on-hero ">{{ $t('pages.register.title') }}</h1>

            <p class="register__login-register login-register on-hero ">
                {{ $t('pages.register.alreadyHaveAccount') }}
                <router-link class="register__router-link" :to="{ name: 'Login' }">{{ $t('login') }}</router-link>
            </p>

            <form class="register__form" @submit.prevent="handleRegister">
                <input v-model="form.firstName" :placeholder="$t('pages.register.firstName')" class="register__input"
                    required />
                <input v-model="form.lastName" :placeholder="$t('pages.register.lastName')" class="register__input"
                    required />
                <input v-model="form.username" :placeholder="$t('pages.register.username')" class="register__input"
                    required />
                <input v-model="form.email" type="email" :placeholder="$t('pages.register.email')" class="register__input"
                    required />
                <input v-model="form.password" type="password" :placeholder="$t('pages.register.password')"
                    class="register__input" required />
                <input v-model="form.confirmPassword" type="password" :placeholder="$t('pages.register.confirmPassword')"
                    class="register__input" required />

                <p v-if="localError" class="register__error">{{ localError }}</p>
                <p v-if="hasError" class="register__error">{{ $t('error.messages.smth_wrong') }}</p>

                <button type="submit" class="register__btn">
                    {{ $t('pages.register.submit') }}
                </button>
            </form>

            <div class="register__divider on-hero ">{{ $t('pages.register.or') }}</div>

            <button class="register__btn register__btn--google" @click="handleGoogleSignIn">
                {{ $t('pages.register.google') }}
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
import ErrorComponent from '@/components/ErrorComponent.vue'

const { t } = useI18n()
const router = useRouter()

const form = ref({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
})

const localError = ref(null)

const authStore = useAuthStore()
const usersStore = useUsersStore()
const generalStore = useGeneralStore()

const { isLoading, hasError, generalApiOperation } = generalStore

const handleRegister = async () => {
    localError.value = null

    if (form.value.password !== form.value.confirmPassword) {
        localError.value = t('error.messages.passwords_not_match')
        return
    }

    await generalApiOperation({
        operation: async () => {
            const createdUser = await authStore.registerWithEmail(form.value.email, form.value.password)

            const userData = {
                uid: createdUser.uid,
                email: form.value.email,
                username: form.value.username,
                firstName: form.value.firstName,
                lastName: form.value.lastName,
                role: 'user',
                createdAt: new Date().toISOString(),
                permissions: {
                    isAdmin: false // або true — якщо хочеш автоматично дати права
                },
            }

            // ❗ Замість addItem —> додаємо з UID як ID документа
            await usersStore.addItemWithCustomId({ id: createdUser.uid, data: userData })

            router.push({ name: 'Home' })
        }
    })
}


const handleGoogleSignIn = async () => {
    localError.value = null

    await generalApiOperation({
        operation: async () => {
            const userCredential = await authStore.loginWithGoogleAccount()
            const user = userCredential

            const exists = await usersStore.checkUserExists(user.uid)
            if (!exists) {
                await usersStore.addItemWithCustomId({
                    id: user.uid,
                    data: {
                        uid: user.uid,
                        email: user.email,
                        username: user.displayName,
                        firstName: '',
                        lastName: '',
                        role: 'user',
                        createdAt: new Date().toISOString(),
                        permissions: {
                            isAdmin: false // або true — якщо хочеш автоматично дати права
                        },
                    },
                })
            }
            router.push({ name: 'Home' })
        }
    })
}
</script>

  
  
<style lang="scss" scoped>
.register {
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

    &__login-register {
        margin-bottom: 0.5rem;
        display: flex;
        column-gap: 10px;
        align-items: center;
    }

    &__router-link {
        text-decoration: none;
        color: #db4437;
        font-size: 18px;
        transition: color 0.5s ease;

        &:hover {
            color: #b03024;
        }

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
  