<template>
    <section class="admin-master-dashboard">
        <!-- Локальний лоадер -->
        <LoadingComponent v-if="isLoadingMaster" />

        <div v-else>
            <h2 class="admin-master-dashboard__title">
                {{ $t('pages.AdminMasterDashboard.title', { name: master?.firstName || '' }) }}
            </h2>


            <!-- Календар працює одразу -->
            <MasterDateStep :master-id="props.masterId" :isForMaster="true" @date-selected="handleDateChange"
                @appointment-selected="openAppointment" />

            <MasterAppointment v-if="selectedAppointment" :appointment="selectedAppointment" @status-changed="updateStatus"
                @close="selectedAppointment = null" />
        </div>
    </section>
</template>
  
<script setup>
import { ref, onMounted } from 'vue'
import { useMastersStore } from '@/stores/masters'
import MasterDateStep from '@/components/MasterDashboardComponents/MasterDateStep.vue'
import MasterAppointment from '@/components/MasterDashboardComponents/MasterAppointment.vue'
import LoadingComponent from '@/components/LoadingComponent.vue'
import { toast } from 'vue3-toastify'

const props = defineProps({ masterId: { type: String, required: true } })
const mastersStore = useMastersStore()

const master = ref(null)
const selectedAppointment = ref(null)
const isLoadingMaster = ref(false)

async function loadMaster(id) {
    if (!id) return
    try {
        isLoadingMaster.value = true
        await mastersStore.loadItemById(id)
        master.value = mastersStore.getCurrentItem
    } finally {
        isLoadingMaster.value = false
    }
}

onMounted(() => loadMaster(props.masterId))

function openAppointment(appt) {
    selectedAppointment.value = appt
}

async function handleDateChange(date) {
    // await appointmentsStore.fetchByMasterAndDate(props.masterId, date)
}

async function updateStatus(id, status, extra) {
    try {
        await appointmentsStore.updateStatus(id, status, extra)
        toast.success('✅ Статус оновлено')
        selectedAppointment.value = null
    } catch (err) {
        toast.error('⚠️ ' + (err.message || 'Не вдалося оновити статус'))
    }
}
</script>
  
  
  
<style scoped>
.not-found {
    margin-top: 1rem;
    color: #888;
}
</style>
  
  