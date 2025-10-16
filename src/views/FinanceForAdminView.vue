<template>
    <section class="finance-admin">
        <!-- Якщо майстер ще не вибраний -->
        <div v-if="!route.params.masterId" class="finance-admin__masters">
            <h2 class="finance-admin__title">
                {{ $t('pages.financeForAdmin.title') }}
            </h2>

            <LoadingComponent v-if="generalStore.isLoading" />
            <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

            <MastersListComponent v-else :masters="mastersStore.getItemsList" mode="select" :withActions="false"
                @select="goToMasterFinance" />
        </div>

        <!-- Якщо обраний майстер -->
        <div v-else class="finance-admin__dashboard">
            <AdminMasterFinance :master-id="route.params.masterId" />
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

import AdminMasterFinance from '@/views/AdminMasterFinance.vue'

const generalStore = useGeneralStore()
const mastersStore = useMastersStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
    await mastersStore.loadItemsList()
})

function goToMasterFinance(master) {
    router.push({ name: 'FinanceForAdmin', params: { masterId: master.id } })
}


</script>

<style scoped lang="scss">
.finance-admin {
    &__masters {
        padding: 1rem;
    }

    &__title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }

    &__dashboard {
        padding: 1rem;
    }


}
</style>
