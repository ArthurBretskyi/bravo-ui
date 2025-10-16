<template>
    <section class="user-dashboard">
        <h1 class="user-dashboard__title">{{ $t('pages.userDashboard.title') }}</h1>

        <div v-if="!authStore.user" class="card">
            <p>{{ $t('pages.userDashboard.notLoggedIn') }}</p>
        </div>

        <template v-else>
            <!-- PROFILE -->
            <div class="card">
                <h2>{{ $t('pages.userDashboard.profile.title') }}</h2>

                <form @submit.prevent="saveProfile" class="profile-form">
                    <div class="grid">
                        <label>
                            <span>{{ $t('pages.userDashboard.profile.firstName') }}</span>
                            <input v-model="editableProfile.firstName" :disabled="!isEditingProfile" />
                        </label>
                        <label>
                            <span>{{ $t('pages.userDashboard.profile.lastName') }}</span>
                            <input v-model="editableProfile.lastName" :disabled="!isEditingProfile" />
                        </label>
                        <label>
                            <span>{{ $t('pages.userDashboard.profile.email') }}</span>
                            <input v-model="editableProfile.email" disabled />
                        </label>
                        <label>
                            <span>{{ $t('pages.userDashboard.profile.phone') }}</span>
                            <input v-model="editableProfile.phone" :disabled="!isEditingProfile" />
                        </label>
                    </div>

                    <div class="actions">
                        <button type="button" @click="toggleEditProfile" v-if="!isEditingProfile">
                            {{ $t('pages.userDashboard.profile.edit') }}
                        </button>
                        <button type="submit" v-else>
                            {{ $t('pages.userDashboard.profile.save') }}
                        </button>
                        <button type="button" class="ghost" v-if="isEditingProfile" @click="cancelEditProfile">
                            {{ $t('buttons.cancel') }}
                        </button>
                    </div>
                </form>
            </div>

            <!-- BOOKINGS -->
            <div class="card">
                <h2>{{ $t('pages.userDashboard.bookings.title') }}</h2>

                <div v-if="isLoadingBookings">{{ $t('pages.userDashboard.bookings.loading') }}</div>
                <div v-else-if="!bookings.length">{{ $t('pages.userDashboard.bookings.empty') }}</div>

                <table v-else class="bookings-table">
                    <thead>
                        <tr>
                            <th>{{ $t('pages.userDashboard.bookings.datetime') }}</th>
                            <th>{{ $t('pages.userDashboard.bookings.service') }}</th>
                            <th>{{ $t('pages.userDashboard.bookings.master') }}</th>
                            <th>{{ $t('pages.userDashboard.bookings.price') }}</th>
                            <th>{{ $t('pages.userDashboard.bookings.duration') }}</th>
                            <th>{{ $t('pages.userDashboard.bookings.status') }}</th>
                            <th>{{ $t('pages.userDashboard.bookings.actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="b in sortedBookings" :key="b.id">
                            <td>{{ formatDateTime(b.start) }}</td>
                            <td>
                                {{ serviceName(b.serviceId) }}
                                <span v-if="b.selectedServices || b.selectedConsumables" class="btn-details"
                                    @click="openDetails(b)">
                                    {{ $t('pages.userDashboard.bookings.details') }}
                                </span>
                            </td>

                            <td>{{ masterName(b.masterId) }}</td>
                            <td>
                                <span v-if="b.requiresConfirmation">
                                    {{ $t('pages.userDashboard.bookings.requiresConfirmationNote') }}
                                </span>
                                <span v-else>
                                    <template v-if="b.additionalCost && b.additionalCost > 0">
                                        {{ b.price }} + {{ b.additionalCost }} = <strong>{{ b.finalPrice }}</strong> грн
                                    </template>
                                    <template v-else>
                                        {{ b.finalPrice || b.price || '—' }} грн
                                    </template>
                                </span>
                            </td>
                            <td>
                                <span v-if="b.requiresConfirmation">
                                    {{ $t('pages.userDashboard.bookings.requiresConfirmationNote') }}
                                </span>
                                <span v-else>
                                    {{ b.duration ? b.duration + ' ' + $t('components.booking.minutes') : '—' }}
                                </span>
                            </td>

                            <td>
                                <!-- статус -->
                                <span class="badge" :class="`st-${b.status}`">
                                    {{ $t(`statuses.${b.status}`) }}
                                </span>
                            </td>
                            <td class="row-actions">
                                <button class="ghost" @click="rebook(b)">
                                    {{ $t('pages.userDashboard.bookings.edit') }}
                                </button>
                                <button class="danger" @click="cancelBooking(b)" :disabled="b.status === 'cancelled'">
                                    {{ $t('pages.userDashboard.bookings.cancel') }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- DELETE -->
            <div class="delete-account">
                <h2 class="delete-title">{{ $t('pages.userDashboard.deleteAccount.deleteTitle') }}</h2>
                <!-- Якщо email+пароль → показуємо поле вводу -->
                <div v-if="authProvider === 'password'" class="delete-section">
                    <label for="password">{{ $t('pages.userDashboard.deleteAccount.confirmPassword') }}</label>
                    <input type="password" v-model="passwordInput" id="password"
                        :placeholder="$t('pages.userDashboard.deleteAccount.passwordPlaceholder')" />
                </div>

                <button class="danger" @click="confirmDeleteAccount">
                    {{ $t('pages.userDashboard.deleteAccount.confirmButton') }}
                </button>
            </div>
        </template>
    </section>
    <ServiceDetailsModal v-if="showDetailsModal" :booking="selectedBooking" @close="showDetailsModal = false" />
</template>

  
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import db from '@/firebase-config'
import { useAuthStore } from '@/stores/auth'
import { useAppointmentsStore } from '@/stores/appointments'
import { toast } from 'vue3-toastify'

const { t, locale, availableLocales } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const appointmentsStore = useAppointmentsStore()

import ServiceDetailsModal from '@/components/ServiceDetailsModal.vue'

// --- Profile state
const passwordInput = ref('')
const authProvider = computed(() => authStore.user?.providerData?.[0]?.providerId || '')
const isEditingProfile = ref(false)
const editableProfile = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
})

// --- Bookings state
const bookings = ref([])
const isLoadingBookings = ref(false)

// --- Dictionaries (service/master names)
const servicesById = ref({})
const mastersById = ref({})

const locales = availableLocales
const currentLocale = ref(locale.value)

// Load initial data
onMounted(async () => {
    if (!authStore.user) return

    // Load profile from users/{uid}
    await loadProfile()

    // Load bookings for user
    await loadBookings()
})

async function loadProfile() {
    try {
        const uid = authStore.user.uid
        const snap = await getDoc(doc(db, 'users', uid))
        const userDoc = snap.exists() ? snap.data() : {}
        editableProfile.value = {
            firstName: userDoc.firstName || '',
            lastName: userDoc.lastName || '',
            email: userDoc.email || authStore.user.email || '',
            phone: userDoc.phone || '',
        }
    } catch (e) {
        console.error(e)
        toast.error(t('errors.loadProfile'))
    }
}

async function loadBookings() {
    try {
        isLoadingBookings.value = true
        const uid = authStore.user.uid
        const list = await appointmentsStore.fetchByUser(uid)
        bookings.value = Array.isArray(list) ? list : []

        // fetch dictionaries once per unique id
        await hydrateDictionaries(bookings.value)
    } catch (e) {
        console.error(e)
        toast.error(t('errors.loadBookings'))
    } finally {
        isLoadingBookings.value = false
    }
}

async function hydrateDictionaries(items) {
    const uniqueServiceIds = [...new Set(items.map(i => i.serviceId).filter(Boolean))]
    const uniqueMasterIds = [...new Set(items.map(i => i.masterId).filter(Boolean))]

    // services
    await Promise.all(uniqueServiceIds.map(async id => {
        if (!servicesById.value[id]) {
            const snap = await getDoc(doc(db, 'services', id))
            servicesById.value[id] = snap.exists() ? (snap.data().title || '—') : '—'
        }
    }))

    // masters
    await Promise.all(uniqueMasterIds.map(async id => {
        if (!mastersById.value[id]) {
            const snap = await getDoc(doc(db, 'masters', id))
            if (snap.exists()) {
                const d = snap.data()
                mastersById.value[id] = [d.firstName, d.lastName].filter(Boolean).join(' ') || '—'
            } else {
                mastersById.value[id] = '—'
            }
        }
    }))
}

const sortedBookings = computed(() =>
    [...bookings.value].sort((a, b) => (b.start?.getTime() || 0) - (a.start?.getTime() || 0))
)

function formatDateTime(dateObj) {
    if (!dateObj) return '—'
    try {
        return new Intl.DateTimeFormat(currentLocale.value || 'uk', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(dateObj)
    } catch {
        return dateObj.toLocaleString()
    }
}

function serviceName(id) {
    return servicesById.value[id] || '—'
}

function hasDetails(booking) {
    return booking.selectedServices || booking.selectedConsumables || booking.duration
}

const selectedBooking = ref(null)
const showDetailsModal = ref(false)

function openDetails(booking) {
    selectedBooking.value = booking
    showDetailsModal.value = true
}


function masterName(id) {
    return mastersById.value[id] || '—'
}

// --- Profile editing
function toggleEditProfile() {
    isEditingProfile.value = true
}
function cancelEditProfile() {
    isEditingProfile.value = false
    loadProfile()
}
async function saveProfile() {
    try {
        const uid = authStore.user.uid
        const payload = {
            firstName: editableProfile.value.firstName?.trim() || '',
            lastName: editableProfile.value.lastName?.trim() || '',
            phone: editableProfile.value.phone?.trim() || '',
            email: editableProfile.value.email?.trim() || authStore.user.email || '',
            updatedAt: new Date().toISOString(),
        }
        await authStore.updateUserProfile(uid, payload)
        isEditingProfile.value = false
        toast.success(t('toast.profileSaved'))
    } catch (e) {
        console.error(e)
        toast.error(t('errors.saveProfile'))
    }
}

// --- Bookings actions
async function cancelBooking(b) {
    if (!b?.id) return
    const ok = confirm(t('confirm.cancelBooking'))
    if (!ok) return
    try {
        await appointmentsStore.cancelAppointment(b.id)
        toast.success(t('toast.bookingCancelled'))
        await loadBookings()
    } catch (e) {
        console.error(e)
        toast.error(t('errors.cancelBooking'))
    }
}

// “Редагувати”: стартуємо нове бронювання з тими ж service/master
async function rebook(booking) {
    if (!booking?.serviceId || !booking?.masterId) {
        toast.error(t('errors.rebookInvalid'))
        return
    }

    try {
        const serviceSnap = await getDoc(doc(db, 'services', booking.serviceId))
        const serviceObj = serviceSnap.exists() ? { id: booking.serviceId, ...serviceSnap.data() } : null

        const masterSnap = await getDoc(doc(db, 'masters', booking.masterId))
        const masterObj = masterSnap.exists() ? { id: booking.masterId, ...masterSnap.data() } : null

        if (!serviceObj || !masterObj) {
            toast.error(t('errors.rebookInvalid'))
            return
        }

        // Просто передаємо oldBookingId
        router.push({
            name: 'Booking',
            query: {
                mode: 'rebook',
                oldBookingId: booking.id,
                phone: booking.phone || ''
            },
            state: { selectedService: serviceObj, selectedMaster: masterObj }
        })

    } catch (err) {
        console.error(err)
        toast.error(t('errors.rebookInvalid'))
    }
}

async function confirmDeleteAccount() {
    const ok = confirm(t('confirm.deleteAccount'))
    if (!ok) return
    try {
        if (authProvider.value === 'password') {
            if (!passwordInput.value) {
                toast.error(t('errors.passwordRequired'))
                return
            }
            await authStore.deleteAccountAndUserDoc(passwordInput.value)
        } else {
            await authStore.deleteAccountAndUserDoc()
        }
        toast.success(t('toast.accountDeleted'))
        router.push({ name: 'Home' })
    } catch (e) {
        if (e?.message === 'requires-recent-login') {
            toast.error(t('errors.recentLogin'))
        } else {
            console.error(e)
            toast.error(t('errors.deleteAccount'))
        }
    }
}
</script>
  
<style scoped lang="scss">
.user-dashboard {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;

    &__title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 2rem;
        text-align: center;
    }

    .card {
        background: #fff;
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        margin-bottom: 1rem;
        color: #000;
    }

    .profile-form .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
    }

    label span {
        display: block;
        font-size: .9rem;
        margin-bottom: .25rem;
        color: #333;
    }

    input,
    select {
        width: 100%;
        padding: .6rem .75rem;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        outline: none;
    }

    .actions,
    .settings-row {
        margin-top: 1rem;
        display: flex;
        gap: .5rem;
        flex-wrap: wrap;
        align-items: center;
    }


    .bookings-table {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
            text-align: left;
            padding: .75rem;
            border-bottom: 1px solid #f1f5f9;
        }

        .row-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
    }

    .badge {
        padding: .25rem .5rem;
        border-radius: 8px;
        font-size: .85rem;

        &.st-pending {
            background: #fef3c7;
        }

        &.st-confirmed {
            background: #d1fae5;
        }

        &.st-cancelled {
            background: #fee2e2;
        }
    }

    .delete-account {
        display: flex;
        flex-direction: column;
        row-gap: .625rem;
    }

    .delete-section {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        align-self: start;
        row-gap: .3125rem;
    }

    .delete-section input {
        width: 100%;
        padding: 0.6rem;
        border-radius: 6px;
        border: 1px solid #000;
    }

    button {
        align-self: start;
    }

}

.btn-details {
    display: inline-block;
    position: relative;
    text-decoration: none;
    font-size: 14px;
    color: #562b00;
    margin-block-start: 8px;
    padding-bottom: 4px;
    transition: color 0.3s ease;
    cursor: pointer;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0%;
        height: 2px;
        background-color: #00CEC8;
        transition: width 0.3s ease;
    }

    &:hover {

        &::after {
            width: 100%;
        }
    }
}
</style>
  