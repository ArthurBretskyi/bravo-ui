<template>
    <div class="master-step">
        <h2 class="master-step-title">{{ $t('components.booking.selectMasterTitle') }}</h2>

        <LoadingComponent v-if="isLoading" />
        <div v-else-if="filteredMasters.length" class="masters-list">

            <MasterCardComponent v-for="master in filteredMasters" :key="master.id" mode="select" :master="master"
                :class="{ selected: master.id === selectedMasterId }" @click="selectMaster(master)">
                <template #actions>
                    <button class="master-info-btn" @click.stop="selectMaster(master)">
                        {{ $t('buttons.select') }}
                    </button>
                </template>
            </MasterCardComponent>
        </div>

        <div v-else>
            <p>{{ t('components.booking.noMastersForService') }}</p>
        </div>
    </div>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMastersStore } from '@/stores/masters'
import { useI18n } from 'vue-i18n'
import LoadingComponent from '@/components/LoadingComponent.vue'
import MasterCardComponent from '@/components/MasterCardComponent.vue'

const props = defineProps({
    selectedService: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['selectMaster'])
const { t } = useI18n()
const mastersStore = useMastersStore()

const selectedMasterId = ref(null)
const isLoading = ref(false)

const filteredMasters = computed(() => {
    if (!props.selectedService) return []
    return mastersStore.getItemsList.filter(master =>
        master.services?.includes(props.selectedService.id)
    )
})

function selectMaster(master) {
    selectedMasterId.value = master.id
    emit('selectMaster', master)
}

onMounted(async () => {
    isLoading.value = true
    await mastersStore.loadItemsList()
    isLoading.value = false
})
</script>
  
  

<style lang="scss" scoped>
.master-step {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    row-gap: .9375rem;

}

.master-step-title {
    text-align: center;
    font-size: 32px;
}

.masters-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    /* border: 1px solid #eaeaea; */
    padding: 15px;
    border-radius: 12px;
    background-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 8px 20px #31313114;

}
</style>
