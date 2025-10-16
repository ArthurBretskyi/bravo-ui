<template>
    <section class="appointments-admin">
        <!-- Якщо ми ще не вибрали майстра -->
        <div v-if="!route.params.masterId" class="appointments-admin__masters">
            <h2 class="appointments-admin__title">
                {{ $t('pages.appointmentsForAdmin.title') }}
            </h2>

            <LoadingComponent v-if="generalStore.isLoading" />
            <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

            <MastersListComponent v-else :masters="mastersStore.getItemsList" mode="select" :withActions="false"
                @select="goToMasterCalendar" />
        </div>

        <!-- Якщо обраний конкретний майстер -->
        <div v-else class="appointments-admin__dashboard">
            <button class="btn back-btn" @click="goBackToMasters">
                ← {{ $t('buttons.backToMasters') }}
            </button>

            <AdminMasterDashboard :master-id="route.params.masterId" />
        </div>
    </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGeneralStore } from '@/stores/general'
import { useMastersStore } from '@/stores/masters'
import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'
import MastersListComponent from '@/components/MastersListComponent.vue'
import AdminMasterDashboard from '@/views/AdminMasterDashboard.vue'

const generalStore = useGeneralStore()
const mastersStore = useMastersStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
    await mastersStore.loadItemsList()
})

function goToMasterCalendar(master) {
    router.push({ name: 'AdminMasterDashboard', params: { masterId: master.id } })
}

function goBackToMasters() {
    router.push({ name: 'AppointmentsForAdmin' })
}
</script>

  
<style scoped lang="scss">
.appointments-admin {
    padding: 1rem;

    &__title {
        margin-bottom: 1rem;
    }

    .back-btn {
        margin-bottom: 1rem;
    }
}
</style>
  