<template>
    <section class="booking-view">

        <ErrorComponent v-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else>
            <component :is="currentStepComponent" v-bind="currentStepProps" @clientSaved="handleClientSaved"
                @phoneSaved="handlePhoneSaved" @selectService="handleServiceSelect" @selectMaster="handleMasterSelect"
                @selectDateTime="handleDateSelect" />

            <!-- 🔽 навігацію ховаємо на кроці 0 -->
            <div v-if="step !== 0" class="booking-navigation">
                <button v-if="step > 1" @click="step--">
                    {{ $t('buttons.back') }}
                </button>
                <button v-if="step < 4 && isStepValid" @click="step++">
                    {{ $t('buttons.next') }}
                </button>
                <button v-else-if="step === 4" @click="confirmBooking">
                    {{ $t('buttons.confirm') }}
                </button>
            </div>
        </div>
    </section>
</template>
  
<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useGeneralStore } from '@/stores/general'
import { useAppointmentsStore } from '@/stores/appointments'
import ErrorComponent from "@/components/ErrorComponent.vue"

// Кроки
import StepUserPhone from '@/components/Booking/StepUserPhone.vue'
import ServiceStep from '@/components/Booking/ServiceStep.vue'
import MasterStep from '@/components/Booking/MasterStep.vue'
import DateStep from '@/components/Booking/DateStep.vue'
import ConfirmStep from '@/components/Booking/ConfirmStep.vue'
import StepClientData from '@/components/Booking/StepClientData.vue'


import { toast } from 'vue3-toastify'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import db from '@/firebase-config'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const generalStore = useGeneralStore()
const appointmentsStore = useAppointmentsStore()
const authStore = useAuthStore()

const step = ref(0)
const selectedService = ref(null)
const selectedMaster = ref(null)
const selectedDateTime = ref(null)
const userPhone = ref(null)
const oldBookingId = ref(null)


// const currentStepIndex = ref(0)
const steps = ['ServiceStep', 'MasterStep', 'DateStep', 'PhoneStep', 'ConfirmStep']

const isAdminOrMasterMode = computed(() => {
    const role = authStore.user?.role
    return route.query.mode === 'adminBooking' || ['admin', 'master'].includes(role)
})

const clientData = ref(null)

const isSplitMode = computed(() => route.query.mode === 'split')


function handleClientSaved(data) {
    clientData.value = data
    step.value = 1
}



onMounted(async () => {
    if (route.query.mode === 'rebook') {
        // Спробуємо підхопити повні об’єкти з state
        const state = window.history.state || {}
        if (state.selectedService && state.selectedMaster) {
            selectedService.value = state.selectedService
            selectedMaster.value = state.selectedMaster
        } else {
            // fallback: якщо state не передався, завантажуємо з Firestore по ID
            if (route.query.serviceId) {
                const serviceSnap = await getDoc(doc(db, 'services', route.query.serviceId))
                if (serviceSnap.exists()) {
                    selectedService.value = { id: route.query.serviceId, ...serviceSnap.data() }
                }
            }
            if (route.query.masterId) {
                const masterSnap = await getDoc(doc(db, 'masters', route.query.masterId))
                if (masterSnap.exists()) {
                    selectedMaster.value = { id: route.query.masterId, ...masterSnap.data() }
                }
            }
        }

        userPhone.value = route.query.phone || ''
        oldBookingId.value = route.query.oldBookingId || null
        step.value = 3 // одразу DateStep
    }


    // 🆕 режим split (розбити час)
    if (route.query.mode === 'split' && route.query.parentId) {
        const parentSnap = await getDoc(doc(db, 'appointments', route.query.parentId))
        if (parentSnap.exists()) {
            const parent = parentSnap.data()

            const masterSnap = await getDoc(doc(db, 'masters', parent.masterId))
            const serviceSnap = await getDoc(doc(db, 'services', parent.serviceId))
            if (masterSnap.exists()) selectedMaster.value = { id: parent.masterId, ...masterSnap.data() }
            if (serviceSnap.exists()) selectedService.value = { id: parent.serviceId, ...serviceSnap.data() }

            // межі доступного часу (для DateStep)
            route.query.splitStart = parent.start.toDate ? parent.start.toDate().toISOString() : parent.start
            route.query.splitEnd = parent.end.toDate ? parent.end.toDate().toISOString() : parent.end


            // 🟢 замість step.value = 3 → спочатку вводимо дані клієнта
            step.value = 0
        }
    }
})


const currentStepComponent = computed(() => {
    if (isAdminOrMasterMode.value) {
        switch (step.value) {
            case 0: return StepClientData
            case 1: return ServiceStep
            case 2: return MasterStep
            case 3: return DateStep
            case 4: return ConfirmStep
            default: return ServiceStep
        }
    } else {
        switch (step.value) {
            case 0: return StepUserPhone
            case 1: return ServiceStep
            case 2: return MasterStep
            case 3: return DateStep
            case 4: return ConfirmStep
            default: return ServiceStep
        }
    }
})


const currentStepProps = computed(() => {
    switch (step.value) {
        case 0: return {}
        case 1: return {}
        case 2: return { selectedService: selectedService.value }
        case 3:
            return {
                selectedService: selectedService.value,
                selectedMaster: selectedMaster.value,
                splitStart: route.query.splitStart || null,
                splitEnd: route.query.splitEnd || null,
            }
        case 4: return { selectedService: selectedService.value, selectedMaster: selectedMaster.value, selectedDateTime: selectedDateTime.value }
        default: return {}
    }
})

const isStepValid = computed(() => {
    switch (step.value) {
        case 1: return !!selectedService.value
        case 2: return !!selectedMaster.value
        case 3: return !!selectedDateTime.value
        default: return false
    }
})

// ⬇️ Після успішного збереження телефону
function handlePhoneSaved() {
    nextTick(() => {
        step.value = 1
    })
}

function handleServiceSelect(service) {
    selectedService.value = service
    selectedMaster.value = null
    selectedDateTime.value = null
    toast.success(t('toast.toastService') || 'Послугу обрано')
    step.value = 2
}

function handleMasterSelect(master) {

    // ⚠️ Зберігаємо userId як id для DateStep
    selectedMaster.value = {
        ...master,
        id: master.id,         // залишаємо id з колекції masters
        userId: master.userId  // окремо зберігаємо userId майстра
    }

    selectedDateTime.value = null
    toast.success(t('toast.toastMaster') || 'Майстра обрано')
    step.value = 3
}


function handleDateSelect(dateTime) {
    selectedDateTime.value = dateTime
}

async function confirmBooking() {
    try {
        const payload = {
            serviceId: selectedService.value.id,
            masterId: selectedMaster.value.id,
            dateTime: selectedDateTime.value,
            requiresConfirmation: !!selectedService.value.requiresConfirmation,
        }

        // 🟢 Якщо створює майстер/адмін — додаємо дані клієнта вручну
        if (isAdminOrMasterMode.value && clientData.value) {
            payload.firstName = clientData.value.firstName
            payload.lastName = clientData.value.lastName
            payload.phone = clientData.value.phone
            payload.email = clientData.value.email
            payload.userId = null // клієнт не авторизований
        } else {
            // 🟢 Звичайний користувач — беремо з authStore
            payload.userId = authStore.user?.uid
        }

        // 🟢 Якщо потрібне підтвердження
        if (selectedService.value.requiresConfirmation) {
            payload.status = 'pendingConfirmation'
            payload.price = null
            payload.duration = null
        }

        if (route.query.mode === 'split') {
            payload.parentAppointmentId = route.query.parentId
            payload.isSplit = true
        }


        let newBookingId

        // 🟢 Якщо режим rebook — переносимо бронювання
        if (route.query.mode === 'rebook' && oldBookingId.value) {
            const { newId } = await appointmentsStore.rebookAppointment(
                String(oldBookingId.value),
                payload
            )
            newBookingId = newId
            toast.success(t('toast.rebookSuccess') || 'Бронювання перенесено')
        } else {
            // 🟢 Інакше — стандартне створення бронювання
            newBookingId = await appointmentsStore.createAppointment(payload)
            toast.success(t('toast.success') || 'Бронювання створено')
        }

        // 🧹 Скидаємо стан
        step.value = isAdminOrMasterMode.value ? 0 : 1
        selectedService.value = null
        selectedMaster.value = null
        selectedDateTime.value = null
        clientData.value = null

        router.push({ name: 'ThankYou', query: { mode: route.query.mode || 'new' } })
    } catch (e) {
        console.error(e)
        toast.error(t('errors.bookingFailed') || 'Не вдалося завершити бронювання')
    }
}


</script>

<style lang="scss" scoped>
.booking-view {
    padding: 2rem;

}

.booking-navigation {
    display: flex;
    column-gap: 10px;
    margin-block-start: .625rem;

    button {
        color: #000;
        text-decoration: none;
        font-weight: bold;
        padding: 0.5rem 1.5rem;
        border: 2px solid #00CEC8;
        border-radius: 30px;
        transition: background-color 0.3s ease-in-out;
        cursor: pointer;

        &:hover {
            background-color: #00CEC8;
            color: #fff;
            border: 2px solid #00CEC8;

        }
    }
}
</style>