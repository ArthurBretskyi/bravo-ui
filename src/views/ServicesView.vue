<template>
    <section class="services-view">
        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else class="services-view__grid">
            <ServicesListComponent :services="servicesStore.getItemsList" :withActions="authStore.isAdmin"
                :mode="authStore.isAdmin ? 'admin' : 'user'" context="browse" @edit="handleEdit" @delete="handleDelete"
                @order="handleOrder" />

        </div>
    </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useServicesStore } from '@/stores/services'
import { useAuthStore } from '@/stores/auth'
import { useGeneralStore } from '@/stores/general'

import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'
import ServicesListComponent from '@/components/ServicesListComponent.vue'

const router = useRouter()
const servicesStore = useServicesStore()
const authStore = useAuthStore()
const generalStore = useGeneralStore()

onMounted(async () => {
    await servicesStore.loadItemsList()
})

function handleEdit(service) {
    router.push({ name: 'EditService', params: { id: service.id } })
}

function handleDelete(serviceId) {
    servicesStore.deleteItem(serviceId)
}

function handleOrder(service) {
    router.push({ name: 'Booking', query: { serviceId: service.id } })
}
</script>


<style scoped lang="scss">
.services-view {
    padding: 2rem 1rem;
    max-width: 1200px;
    margin: 0 auto;

    &__grid {
        display: grid;
        gap: 1.5rem;

        // @media (min-width: 600px) {
        //     grid-template-columns: repeat(2, 1fr);
        // }

        // @media (min-width: 900px) {
        //     grid-template-columns: repeat(3, 1fr);
        // }
    }
}
</style>
