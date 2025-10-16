<template>
    <section class="service-details">
        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />

        <div v-else-if="service">
            <!-- Заголовок -->
            <!-- <h1 class="service-details__title">{{ $t('pages.serviceDetails.mainTitle') }}</h1> -->
            <h1 class="service-details__title">{{ service.title }}</h1>
            <p class="service-details__description">{{ service.description }}</p>

            <!-- Categories -->
            <div v-for="(category, cIndex) in service.categories" :key="cIndex" class="service-details__category">

                <div v-if="authStore.role === 'user' && mode === 'service'">
                    <!-- User → таблиця -->
                    <h2 class="service-details__category-title">{{ category.title }}</h2>

                    <table class="service-details__table">
                        <thead>
                            <tr>
                                <th>{{ $t('pages.serviceDetails.serviceName') }}</th>
                                <th v-for="length in lengthOrder" :key="length">{{ length }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(option, oIndex) in category.options" :key="oIndex">
                                <td>{{ option.service }}</td>
                                <td v-for="length in lengthOrder" :key="length">
                                    <!-- Якщо опція має багаторівневі ціни -->
                                    <span v-if="option.prices">{{ option.prices[length] || '-' }} грн</span>

                                    <!-- Якщо тільки одна ціна -->
                                    <span v-else-if="length === '1а Довжина'">{{ option.price || '-' }} грн</span>

                                    <!-- Інакше порожньо -->
                                    <span v-else>-</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else>
                    <!-- Admin/Master → чекбокси -->
                    <div v-for="(option, oIndex) in category.options" :key="oIndex" class="service-option">
                        <label>
                            <input type="checkbox" v-model="selectedServices" :value="option.service" />
                            {{ option.service }}
                        </label>

                        <!-- Length choices -->
                        <div v-if="selectedServices.includes(option.service)" class="service-lengths">
                            <template v-if="option.prices">
                                <label v-for="length in lengthOrder" :key="length">
                                    <input type="radio" :name="`length-${option.service}`" :value="length"
                                        v-model="selectedLengths[option.service]"
                                        :disabled="!option.prices[length] || option.prices[length] === '-'" />
                                    {{ length }} ({{ option.prices[length] || '-' }} грн)
                                </label>
                            </template>

                            <template v-else>
                                <span>{{ option.price }} грн</span>
                            </template>
                        </div>

                    </div>
                </div>
            </div>

            <!-- Consumables -->
            <div v-for="(consumableCategory, ccIndex) in service.additionalConsumables" :key="ccIndex"
                class="service-details__category">
                <h3>{{ consumableCategory.title }}</h3>

                <div v-for="(option, oIndex) in consumableCategory.options" :key="oIndex" class="consumable-option">
                    <!-- User (тільки в service mode) -->
                    <span v-if="authStore.role === 'user' && mode === 'service'">
                        {{ option.service }} — {{ option.pricePerGram }} грн/г
                    </span>

                    <!-- Admin/Master OR appointment mode -->
                    <template v-else>
                        <label>
                            <input type="checkbox" v-model="selectedConsumables[option.service].checked" />
                            {{ option.service }} ({{ option.pricePerGram }} ₴/г)
                        </label>
                        <input v-if="selectedConsumables[option.service].checked" type="number" min="1"
                            v-model.number="selectedConsumables[option.service].grams" placeholder="г" />
                    </template>
                </div>
            </div>

            <!-- Duration -->
            <div class="service-details__duration">
                <label v-if="authStore.role === 'user' && mode === 'service'">
                    {{ $t('pages.serviceDetails.duration') }}: {{ service.duration }} хв
                </label>

                <label v-else>
                    {{ $t('pages.serviceDetails.duration') }}:
                    <input type="number" v-model.number="duration" min="10" />
                    хв
                </label>
            </div>

            <!-- Save -->
            <button v-if="authStore.role !== 'user'" class="service-details__save" @click="saveService">
                {{ $t('buttons.save') }}
            </button>

            <!-- Note for user -->
            <p v-if="authStore.role === 'user' && mode === 'service'" class="service-details__note">
                {{ $t('pages.serviceDetails.contactAdminNote') }}
            </p>
        </div>
    </section>
</template>
  
<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue3-toastify'

/* --- FIREBASE --- */
import { doc, getDoc } from 'firebase/firestore'
import db from '@/firebase-config'

import { useServicesStore } from '@/stores/services'
import { useAppointmentsStore } from '@/stores/appointments'
import { useAuthStore } from '@/stores/auth'
import { useGeneralStore } from '@/stores/general'

import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const servicesStore = useServicesStore()
const appointmentsStore = useAppointmentsStore()
const authStore = useAuthStore()
const generalStore = useGeneralStore()

const props = defineProps({
    mode: { type: String, default: 'service' }, // 'service' | 'appointment'
    appointmentId: { type: String, default: null }
})

const service = ref(null)
const selectedServices = ref([])
const selectedLengths = ref({})
const selectedConsumables = ref({})
const duration = ref(180)

// беремо з props або query
const mode = computed(() => route.query.mode || props.mode)
const appointmentId = computed(() => route.query.appointmentId || props.appointmentId)

const lengthOrder = ["1а Довжина", "2а Довжина", "3а Довжина", "4а Довжина", "5а Довжина"]

// ---- normalizeDate helper ----
// Підтримує: Firestore Timestamp (toDate), об'єкт з seconds/nanoseconds,
// число (ms), рядок ISO, Date
const normalizeDate = (val) => {
    if (!val && val !== 0) return null
    // Firestore Timestamp (has toDate method)
    if (val?.toDate && typeof val.toDate === 'function') return val.toDate()
    // plain object like { seconds: number, nanoseconds: number }
    if (val?.seconds != null) {
        const secs = Number(val.seconds)
        const nanos = Number(val.nanoseconds || 0)
        return new Date(secs * 1000 + Math.floor(nanos / 1e6))
    }
    // number -> treated as ms since epoch
    if (typeof val === 'number') return new Date(val)
    // string -> ISO or other date-parsable string
    if (typeof val === 'string') return new Date(val)
    if (val instanceof Date) return val
    // fallback
    try {
        return new Date(val)
    } catch (e) {
        return null
    }
}

onMounted(async () => {
    const serviceId = route.params.serviceId
    if (serviceId) {
        await servicesStore.loadItemById(serviceId)
        service.value = servicesStore.getCurrentItem

        // Init consumables state
        if (service.value?.additionalConsumables) {
            service.value.additionalConsumables.forEach(cat => {
                cat.options.forEach(opt => {
                    selectedConsumables.value[opt.service] = { checked: false, grams: 0 }
                })
            })
        }

        duration.value = Number(service.value.duration) || 180
    }
})

async function saveService() {
    try {
        // appointment mode
        if (mode.value === 'appointment' && appointmentId.value) {
            // підтягуємо поточний апоінтмент з БД, щоб коректно взяти start
            const refDoc = doc(db, 'appointments', appointmentId.value)
            const snap = await getDoc(refDoc)
            if (!snap.exists()) {
                toast.error(t('toast.notFound') || 'Appointment not found')
                return
            }
            const app = snap.data()

            // нормалізуємо старт (будь-який формат)
            const startDate = normalizeDate(app.start)
            if (!startDate) {
                toast.error('Invalid appointment start date')
                return
            }

            // новий end — старт + duration (хвилини)
            const newEnd = new Date(startDate.getTime() + Number(duration.value) * 60000)

            const updatedData = {
                selectedServices: selectedServices.value,
                selectedLengths: selectedLengths.value,
                selectedConsumables: selectedConsumables.value,
                duration: duration.value,
                // зберігаємо end як Date (Firestore SDK перетворить при записі)
                end: newEnd,
                requiresConfirmation: false,
                status: 'confirmed',
                price: calculatePrice(),
            }

            await appointmentsStore.updateAppointment(appointmentId.value, updatedData)

            toast.success(t('toast.toastService') || 'Послугу обрано ✅')
            if (authStore.user?.role === 'master') {
                await router.push({ name: 'MasterDashboard' })
            } else if (authStore.user?.role === 'admin') {
                await router.push({ name: 'AppointmentsForAdmin' })
            } else {
                await router.push({ name: 'Home' })
            }
            return
        }

        // service mode → оновлюємо шаблон послуги
        if (!service.value?.id) return
        const updatedData = {
            ...service.value,
            selectedServices: selectedServices.value,
            selectedLengths: selectedLengths.value,
            selectedConsumables: selectedConsumables.value,
            duration: duration.value,
        }
        await servicesStore.updateItem(service.value.id, updatedData)

        toast.success(t('toast.saved') || 'Збережено успішно ✅')
        generalStore.setMessage('Збережено успішно!')
    } catch (err) {
        console.error('saveService error:', err)
        // якщо помилка прав доступу у Firestore — покажемо зрозуміле повідомлення
        if (err?.code === 'permission-denied' || /permission/i.test(err?.message || '')) {
            toast.error('Немає прав для оновлення. Перевір правила Firestore або авторизацію.')
        } else {
            toast.error(err.message || 'Помилка при збереженні')
        }
    }
}

function calculatePrice() {
    let total = 0

    for (const serviceName of selectedServices.value) {
        const option = service.value.categories
            .flatMap(c => c.options)
            .find(o => o.service === serviceName)

        if (!option) continue

        if (option.prices && selectedLengths.value[serviceName]) {
            total += option.prices[selectedLengths.value[serviceName]] || 0
        } else if (option.price) {
            total += Number(option.price) || 0
        }
    }

    // матеріали
    for (const [key, val] of Object.entries(selectedConsumables.value)) {
        if (val.checked && val.grams > 0) {
            const option = service.value.additionalConsumables
                .flatMap(c => c.options)
                .find(o => o.service === key)
            if (option) total += (option.pricePerGram || 0) * val.grams
        }
    }
    return total
}
</script>


  
  
<style scoped lang="scss">
.service-details {
    padding: 2rem;

    &__title {
        font-size: 2rem;
        margin-bottom: 2rem;
    }

    &__image {
        max-width: 500px;
        margin-bottom: 1rem;
        border-radius: 8px;
    }



    &__category {
        margin-bottom: 2rem;
    }

    &__table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;

        th,
        td {
            border: 1px solid #ccc;
            padding: 0.5rem;
            text-align: center;
        }

        .service-titles {
            font-size: 18px;
            font-weight: 500;
            color: #fff;
        }

        th {
            background: #562b00;
        }

        select {
            padding: 5px 30px 5px 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
        }
    }

    &__note {
        margin-top: 2rem;
        font-style: italic;
        color: #666;
    }

    .service-details__note {
        font-size: 1.5rem;
        font-weight: 600;
        color: rgb(60, 233, 227);
    }

    .service-details__save {
        margin-block-start: 10px;
    }
}
</style>
  