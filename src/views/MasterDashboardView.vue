<template>
    <section class="master-dashboard" v-if="user">
        <h2 class="master-dashboard__title">{{ $t('pages.MasterDashboard.greeting', {
            name: userData?.firstName || user.email
        }) }}</h2>

        <MasterDateStep v-if="masterDocId" :selectedMaster="{ id: masterDocId, ...masterDocData }" :masterId="masterDocId"
            :isForMaster="true" @date-selected="handleDateChange" @appointment-selected="openAppointment" />


        <MasterAppointment v-if="selectedAppointment" :appointment="selectedAppointment"
            @status-changed="(id, status, extra) => appointmentsStore.updateStatus(id, status, extra)"
            @close="selectedAppointment = null" />

    </section>

    <p v-else>{{ $t('pages.MasterDashboard.loading') }}...</p>
</template>
  
<script setup>
import { ref, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppointmentsStore } from '@/stores/appointments'
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'
import db from '@/firebase-config'
import MasterDateStep from '@/components/MasterDashboardComponents/MasterDateStep.vue'
import MasterAppointment from '@/components/MasterDashboardComponents/MasterAppointment.vue'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const appointmentsStore = useAppointmentsStore()
const user = ref(null)
const userData = ref(null)
const masterDocId = ref(null)
const masterDocData = ref(null)


const selectedAppointment = ref(null)

function openAppointment(appt) {
    selectedAppointment.value = appt
}

// Підтягуємо користувача з authStore
watchEffect(async () => {
    if (authStore.user) {
        user.value = authStore.user
        const userDocRef = doc(db, "users", user.value.uid)
        const snap = await getDoc(userDocRef)
        if (snap.exists()) {
            userData.value = snap.data()
        }

        // шукаємо документ у masters
        const q = query(collection(db, "masters"), where("userId", "==", user.value.uid))
        const mastersSnap = await getDocs(q)
        if (!mastersSnap.empty) {
            const d = mastersSnap.docs[0]
            masterDocId.value = d.id
            masterDocData.value = d.data()
        }
    }
})

async function handleDateChange(date) {
    // Тут можна завантажувати записи для обраної дати
}

async function updateStatus(appointmentId, newStatus) {
    if (!user.value) return
    try {
        await appointmentsStore.updateStatus(appointmentId, newStatus)
    } catch (err) {
        toast.error("⚠️ " + (err.message || "Failed to update appointment status"))
    }
}
</script>
  
<style lang="scss" scoped>
.master-dashboard {
    padding: 2rem;


    &__title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 2rem;
        text-align: center;
    }
}
</style>
  