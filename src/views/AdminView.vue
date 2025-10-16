<template>
    <div class="admin-view">
        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else-if="isAdmin" class="admin-panel">
            <h1 class="admin-panel__title">{{ $t('pages.admin.title') }}</h1>

            <nav class="admin-panel__menu">
                <router-link class="admin-panel__link" to="/admin/users">
                    <font-awesome-icon class="icon" icon="fa-solid fa-user" />
                    {{ $t('pages.admin.usersLink') }}
                </router-link>
                <router-link class="admin-panel__link" to="/admin/masters">
                    <font-awesome-icon class="icon" icon="fa-solid fa-scissors" />
                    {{ $t('pages.admin.mastersLink') }}
                </router-link>
                <!-- <router-link class="admin-panel__btn" to="/add-service">
                    {{ $t('pages.admin.addService') }}
                </router-link>
                <router-link class="admin-panel__btn" to="/services">
                    {{ $t('pages.admin.manageServices') }}
                </router-link> -->
                <router-link class="admin-panel__link" to="/admin/appointments">
                    <font-awesome-icon class="icon" icon="fa-solid fa-calendar-days" />
                    {{ $t('pages.admin.appointments') }}
                </router-link>
                <router-link class="admin-panel__link" to="/admin/finance">
                    <font-awesome-icon class="icon" icon="fa-solid fa-sack-dollar" />
                    {{ $t('pages.admin.finance') }}
                </router-link>
            </nav>
        </div>

        <div v-else class="admin-panel__unauthorized">
            <p>{{ $t('pages.admin.noAccess') }}</p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGeneralStore } from '@/stores/general'

import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'

const authStore = useAuthStore()
const generalStore = useGeneralStore()

// 🔐 Перевірка доступу
const isAdmin = computed(() => authStore.isAdmin)
</script>

<style scoped lang="scss">
.admin-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;


    &__title {
        font-size: 2rem;
        margin-bottom: 2rem;
    }

    &__menu {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 400px;
        padding: 15px;
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 8px 20px #31313114;
    }

    &__link {
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

        .icon {
            color: #562b00;
            font-size: 18px;
            margin-inline-end: 8px;
        }


    }

    &__unauthorized {
        text-align: center;
        padding: 2rem;
        font-size: 1.2rem;
        color: red;
    }


}
</style>
