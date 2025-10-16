<template>
    <section class="masters-view">
        <!-- <h1>{{ $t('pages.masters.title') }}</h1> -->

        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else class="masters-grid">
            <MastersListComponent :masters="mastersStore.getItemsList" :withActions="authStore.isAdmin" @edit="handleEdit"
                @delete="handleDelete" />
        </div>
    </section>
</template>
  
<script setup>
import { computed, onMounted } from 'vue'
import { useMastersStore } from '@/stores/masters'
import { useAuthStore } from '@/stores/auth'
import { useGeneralStore } from '@/stores/general'
import { useRouter } from 'vue-router'




import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'
import MastersListComponent from '@/components/MastersListComponent.vue'

const mastersStore = useMastersStore()
const authStore = useAuthStore()
const generalStore = useGeneralStore()
const router = useRouter()

const isEditing = computed(() => !!route.params.id)



onMounted(async () => {
    await mastersStore.loadItemsList()
})

function handleEdit(master) {
    router.push({ name: 'EditMaster', params: { id: master.id } })
}

function handleDelete(masterId) {
    mastersStore.deleteItem(masterId)
}
</script>
  
<style scoped lang="scss">
// .masters-view {
//     padding: 2rem 1rem;
//     max-width: 1200px;
//     margin: 0 auto;

//     h1 {
//         font-size: 2rem;
//         text-align: center;
//         margin-bottom: 2rem;
//     }

//     .masters-grid {
//         display: grid;
//         gap: 1.5rem;

//         @media (min-width: 600px) {
//             grid-template-columns: repeat(2, 1fr);
//         }

//         @media (min-width: 900px) {
//             grid-template-columns: repeat(3, 1fr);
//         }
//     }
// }
</style>
  