<template>
    <section class="users-admin">
        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else class="users-admin__wrapper">
            <h2>{{ $t('pages.admin.users.title') }}</h2>

            <!-- 🖥️ TABLE (desktop) -->
            <table class="users-admin__table">
                <thead>
                    <tr>
                        <th>{{ $t('pages.admin.users.name') }}</th>
                        <th>Email</th>
                        <th>{{ $t('pages.admin.users.phone') }}</th>
                        <th>{{ $t('pages.admin.users.role') }}</th>
                        <th>{{ $t('pages.admin.users.actions') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="u in usersStore.getItemsList" :key="u.id">
                        <td>{{ u.firstName }} {{ u.lastName }}</td>
                        <td>{{ u.email }}</td>
                        <td>{{ u.phone || '-' }}</td>
                        <td>
                            <select v-model="u.role" @change="updateRole(u)">
                                <option value="user">User</option>
                                <option value="master">Master</option>
                                <option value="admin">Admin</option>
                            </select>
                        </td>
                        <td>
                            <div class="actions">
                                <button v-if="u.role === 'user'"
                                    @click="router.push({ name: 'AddMaster', query: { userId: u.id } })">
                                    Створити майстра
                                </button>
                                <button v-if="u.id !== authStore.user?.uid" @click="removeUser(u)">
                                    {{ $t('pages.admin.users.delete') }}
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- 📱 CARDS (mobile) -->
            <div class="users-admin__cards">
                <div v-for="u in usersStore.getItemsList" :key="u.id" class="user-card">
                    <p><strong>{{ $t('pages.admin.users.name') }}:</strong> {{ u.firstName }} {{ u.lastName }}</p>
                    <p><strong>Email:</strong> {{ u.email }}</p>
                    <p><strong>{{ $t('pages.admin.users.phone') }}:</strong> {{ u.phone || '-' }}</p>

                    <div class="user-card__role">
                        <label>{{ $t('pages.admin.users.role') }}:</label>
                        <select v-model="u.role" @change="updateRole(u)">
                            <option value="user">User</option>
                            <option value="master">Master</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div class="user-card__actions">
                        <button v-if="u.role === 'user'"
                            @click="router.push({ name: 'AddMaster', query: { userId: u.id } })">
                            Створити майстра
                        </button>
                        <button v-if="u.id !== authStore.user?.uid" @click="removeUser(u)">
                            {{ $t('pages.admin.users.delete') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useGeneralStore } from '@/stores/general'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'

const usersStore = useUsersStore()
const generalStore = useGeneralStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
    usersStore.loadItemsList()
})

async function updateRole(user) {
    try {
        await usersStore.updateItem(user.id, { role: user.role })
    } catch (e) {
        console.error('Failed to update role:', e)
    }
}

async function removeUser(user) {
    if (user.id === authStore.user?.uid) {
        generalStore.setErrorMessage('Ви не можете видалити самого себе')
        return
    }

    if (confirm(`Видалити ${user.firstName} ${user.lastName}?`)) {
        try {
            await usersStore.deleteItem(user.id)
        } catch (e) {
            console.error('Failed to delete user:', e)
        }
    }
}
</script>

<style scoped lang="scss">
.users-admin {
    padding: 20px 40px;

    h2 {
        margin-bottom: 30px;
    }

    /* 🖥️ TABLE */
    &__table {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
            padding: 10px;
            border: 1px solid #ddd;
        }

        th {
            background-color: rgba(196, 164, 132, 0.7);
            color: #fff;
            text-align: left;
        }

        select {
            padding: 5px 30px 5px 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
        }

        .actions {
            display: flex;
            gap: 8px;
        }
    }

    /* 📱 CARDS */
    &__cards {
        display: none;
        flex-direction: column;
        gap: 16px;
    }

    .user-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        background: #d5d4d4;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        p {
            margin: 6px 0;
        }

        &__role {
            margin: 10px 0;

            label {
                font-weight: bold;
                margin-right: 8px;
            }
        }

        &__actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        select {
            padding: 5px 30px 5px 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
        }

    }

    /* 📱 Перемикаємо вигляд */
    @media (max-width: 768px) {
        &__table {
            display: none;
        }

        &__cards {
            display: flex;
        }
    }
}
</style>
