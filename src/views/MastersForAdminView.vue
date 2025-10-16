<template>
    <section class="masters-admin">
        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else class="masters-admin__wrapper">
            <div class="masters-admin__header">
                <h2>{{ $t('pages.admin.masters.title') }}</h2>
                <button class="add-btn" @click="goToAddMaster">
                    {{ $t('pages.admin.masters.add') }}
                </button>
            </div>

            <MastersListComponent :masters="mastersStore.getItemsList" :withActions="true" @edit="handleEdit"
                @delete="handleDelete" />
        </div>
    </section>
</template>
  
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMastersStore } from '@/stores/masters'
import { useGeneralStore } from '@/stores/general'
import MastersListComponent from '@/components/MastersListComponent.vue'
import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'

const mastersStore = useMastersStore()
const generalStore = useGeneralStore()
const router = useRouter()

onMounted(async () => {
    await mastersStore.loadItemsList()
})

function goToAddMaster() {
    router.push({ name: 'AddMaster' })
}

function handleEdit(master) {
    router.push({ name: 'EditMaster', params: { id: master.id } })
}

async function handleDelete(masterId) {
    await mastersStore.deleteItem(masterId)
}
</script>
  
<style scoped lang="scss">
.masters-admin {
    padding-block-end: 20px;
    padding-block-start: 20px;
    padding-inline-start: 40px;
    padding-inline-end: 40px;

    &__wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
            font-size: 1.5rem;
            font-weight: bold;
        }

        .add-btn {
            color: white;
            text-decoration: none;
            font-weight: bold;
            padding: 0.5rem 1.5rem;
            border: 2px solid #00CEC8;
            border-radius: 30px;
            transition: background-color 0.3s, color 0.3s;
            background-color: transparent;


            &:hover {
                background-color: white;
                color: #000;
                border: 2px solid #fff;

            }
        }
    }
}
</style>
  