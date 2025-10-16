<template>
    <section class="admin-master-finance">
        <LoadingComponent v-if="isLoadingMaster" />

        <div v-else>
            <h2 class="admin-master-finance__title">
                {{ $t('pages.AdminMasterFinance.title', { name: master?.firstName || '' }) }}
            </h2>

            <!-- 📅 Календар -->
            <MasterDateStep :master-id="props.masterId" :isForMaster="true" @finance-calculated="updateFinance"
                @appointment-selected="openAppointment" />

            <!-- 🔹 Попап з деталями замовлення -->
            <MasterAppointment v-if="selectedAppointment" :appointment="selectedAppointment" :readonly="true"
                @close="selectedAppointment = null" />

            <!-- 💰 Дохід салону -->
            <div class="finance-summary salon">
                <h3>{{ $t('pages.AdminMasterFinance.salonIncome') }}</h3>
                <ul>
                    <li>{{ $t('pages.AdminMasterFinance.dailyIncome') }}: {{ dailySalonIncome }} грн</li>
                    <li>{{ $t('pages.AdminMasterFinance.weeklyIncome') }}: {{ weeklySalonIncome }} грн</li>
                    <li>{{ $t('pages.AdminMasterFinance.monthlyIncome') }}: {{ monthlySalonIncome }} грн</li>
                </ul>
            </div>

            <!-- 🟢 Чистий прибуток салону -->
            <div class="finance-summary salon-net">
                <h3>{{ $t('pages.AdminMasterFinance.salonNetIncome') }}</h3>
                <ul>
                    <li>{{ $t('pages.AdminMasterFinance.dailyIncome') }}: {{ dailySalonNetIncome }} грн</li>
                    <li>{{ $t('pages.AdminMasterFinance.weeklyIncome') }}: {{ weeklySalonNetIncome }} грн</li>
                    <li>{{ $t('pages.AdminMasterFinance.monthlyIncome') }}: {{ monthlySalonNetIncome }} грн</li>
                </ul>
            </div>

            <!-- 💰 Зарплата майстра -->
            <div class="finance-summary master">
                <h3>{{ $t('pages.AdminMasterFinance.masterSalary', { name: master?.firstName || '' }) }}</h3>
                <ul>
                    <li>{{ $t('pages.AdminMasterFinance.dailyIncome') }}: {{ dailySalary }} грн</li>
                    <li>{{ $t('pages.AdminMasterFinance.weeklyIncome') }}: {{ weeklySalary }} грн</li>
                    <li>{{ $t('pages.AdminMasterFinance.monthlyIncome') }}: {{ monthlySalary }} грн</li>
                </ul>
            </div>
        </div>

        <button class="btn back-btn" @click="goBackToMasters">
            ← {{ $t('pages.AdminMasterFinance.backToMasters') }}
        </button>
    </section>
</template>
  
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMastersStore } from '@/stores/masters'
import MasterDateStep from '@/components/MasterDashboardComponents/MasterDateStep.vue'
import MasterAppointment from '@/components/MasterDashboardComponents/MasterAppointment.vue'
import LoadingComponent from '@/components/LoadingComponent.vue'

const router = useRouter()
const props = defineProps({ masterId: { type: String, required: true } })
const mastersStore = useMastersStore()

const master = ref(null)
const isLoadingMaster = ref(false)

const dailySalary = ref(0)
const weeklySalary = ref(0)
const monthlySalary = ref(0)

const dailySalonIncome = ref(0)
const weeklySalonIncome = ref(0)
const monthlySalonIncome = ref(0)

const dailySalonNetIncome = ref(0)
const weeklySalonNetIncome = ref(0)
const monthlySalonNetIncome = ref(0)

const selectedAppointment = ref(null)

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

function updateFinance({
    daily, weekly, monthly,
    dailySalon, weeklySalon, monthlySalon,
    dailySalonNet, weeklySalonNet, monthlySalonNet
}) {
    // Зарплата майстра
    dailySalary.value = daily
    weeklySalary.value = weekly
    monthlySalary.value = monthly

    // Валовий дохід салону
    dailySalonIncome.value = dailySalon || 0
    weeklySalonIncome.value = weeklySalon || 0
    monthlySalonIncome.value = monthlySalon || 0

    // Чистий дохід салону
    dailySalonNetIncome.value = dailySalonNet || 0
    weeklySalonNetIncome.value = weeklySalonNet || 0
    monthlySalonNetIncome.value = monthlySalonNet || 0
}

function goBackToMasters() {
    router.push({ name: 'FinanceForAdmin' })
}
</script>
  
<style scoped lang="scss">
.admin-master-finance {
    &__title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }

    .finance-summary {
        margin-top: 1.5rem;
        padding: 1rem;
        border-radius: 8px;
        color: #000;

        h3 {
            margin-bottom: 0.5rem;
        }

        ul {
            list-style: none;
            padding: 0;

            li {
                margin: 0.25rem 0;
            }
        }

        &.salon {
            background: #ffeaa7;
        }

        &.salon-net {
            background: #b3a7ff;
        }

        &.master {
            background: #55efc4;
        }
    }

    .back-btn {
        margin-block-start: 1rem;
    }
}
</style>
  