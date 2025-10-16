<template>
    <section class="date-step">
        <!-- показуємо тільки якщо не master -->
        <h2 v-if="!isForMaster" class="date-step__title">
            {{ viewMode === 'month' ? $t('components.booking.selectDate') : $t('components.booking.selectTime') }}
        </h2>

        <LoadingComponent v-if="isLoading" />

        <!-- Toolbar -->
        <div class="date-step__toolbar">
            <div class="left">
                <button @click="goPrev">{{ t('components.calendar.prev') || 'Назад' }}</button>
                <button @click="goToday">{{ t('components.calendar.today') || 'Сьогодні' }}</button>
                <button @click="goNext">{{ t('components.calendar.next') || 'Далі' }}</button>
            </div>
            <div class="center">
                <span class="date-step__title--month">{{ dateLabel }}</span>
            </div>
            <div class="right">
                <button :class="{ active: viewMode === 'month' }" @click="viewMode = 'month'">
                    {{ t('components.calendar.month') || 'Місяць' }}
                </button>
                <button :class="{ active: viewMode === 'day' }" @click="viewMode = 'day'">
                    {{ t('components.calendar.day') || 'День' }}
                </button>
            </div>
        </div>

        <!-- MONTH VIEW -->
        <div v-if="viewMode === 'month'" class="calendar">
            <div class="calendar__weekdays">
                <div v-for="wd in weekdays" :key="wd" class="calendar__weekday">{{ wd }}</div>
            </div>
            <div class="calendar__grid">
                <div v-for="day in flatMonthMatrix" :key="day.key" class="calendar__cell" :class="{
                    'is-today': day.isToday,
                    'is-outside': !day.isCurrentMonth,
                    'is-selected': day.isSelected
                }" @click="selectDate(day.date)">
                    <span class="calendar__date">{{ day.date.getDate() }}</span>
                </div>
            </div>
        </div>

        <!-- DAY VIEW -->
        <div v-if="viewMode === 'day'" class="day-view">
            <div class="day-view__slots">
                <!-- 🔹 Майстер -->
                <template v-if="isForMaster">
                    <div v-for="slot in filteredDaySlots" :key="slot.id" class="slot"
                        :class="{ 'slot--booked-master': slot.type === 'booked' }"
                        @click="slot.type === 'booked' && selectAppointment(slot)">
                        <div class="slot__time">{{ formatRange(slot.start, slot.end) }}</div>
                        <div class="slot__title">
                            <template v-if="slot.type === 'booked'">
                                {{ slot.serviceTitle }} – {{ slot.userName }}
                            </template>
                            <template v-else>
                                {{ t('components.booking.free') || 'Вільно' }}
                            </template>
                        </div>

                        <div class="slot__status" v-if="slot.type === 'booked'">
                            <span v-if="slot.requiresConfirmation">{{ $t('statuses.requiresConfirmation') }}</span>
                            <span v-else>{{ $t(`statuses.${slot.status}`) }}</span>
                        </div>

                        <!-- 🆕 Кнопка "Розбити час" тільки для booked -->
                        <button v-if="slot.type === 'booked'" class="split-btn" @click.stop="startSplitBooking(slot)">
                            {{ t('components.booking.splitTime') || 'Розбити час' }}
                        </button>

                    </div>
                </template>



                <!-- 🔹 Користувач -->
                <template v-else>
                    <template v-if="daySlots.length">
                        <div v-for="slot in daySlots" :key="slot.id" class="slot" :class="{
                            'slot--booked': slot.type === 'booked',
                            selected: selectedSlot && selectedSlot.start.getTime() === slot.start.getTime()
                        }" @click="slot.type === 'available' && selectSlot(slot)">
                            <div class="slot__time">{{ formatRange(slot.start, slot.end) }}</div>
                            <div class="slot__title">{{ slot.title }}</div>
                        </div>
                    </template>
                    <div v-else class="slots--empty">
                        {{ t('components.booking.noSlots') || 'Немає доступних слотів на цю дату' }}
                    </div>
                </template>
            </div>

            <!-- Показуємо тільки для майстра -->
            <div v-if="isForMaster && appointments.length" class="date-step__summary">
                <p><strong>Зарплата за день:</strong> {{ dailySalary }} грн</p>
            </div>
        </div>


        <div v-if="selectedSlot" class="date-step__selected">
            <p>{{ t('components.booking.selected') }}: {{ formatSelectedSlot }}</p>
        </div>
    </section>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppointmentsStore } from '@/stores/appointments'
import LoadingComponent from '@/components/LoadingComponent.vue'

const router = useRouter()

const props = defineProps({
    selectedMaster: { type: Object, default: null },
    selectedService: { type: Object, default: null },
    isForMaster: { type: Boolean, default: false },
    splitStart: { type: [String, Date], default: null },
    splitEnd: { type: [String, Date], default: null },
})

const emit = defineEmits(['selectDateTime', 'date-selected', 'appointment-selected', 'finance-calculated'])
const { t } = useI18n()
const appointmentsStore = useAppointmentsStore()

function startSplitBooking(slot) {
    router.push({
        name: 'Booking',
        query: {
            mode: 'split',
            parentId: slot.id,
        },
    })
}

// ----- STATE -----
const viewMode = ref('month')
const viewDate = ref(new Date())
const selectedDate = ref(null)
const selectedSlot = ref(null)
const availableSlots = ref([])
const bookedSlots = ref([])
const appointments = ref([]) // 🟢 для MasterDashboard
const appointmentsWeek = ref([])
const appointmentsMonth = ref([])
const isLoading = ref(false)


function selectAppointment(appt) {
    emit('appointment-selected', appt)
}


// ----- COMPUTED -----
const daySlots = computed(() => {
    if (props.isForMaster) {
        // генеруємо всі слоти
        const duration = props.selectedService?.duration || 60
        const slots = generateAvailableSlots(selectedDate.value, appointments.value, duration)

        // booked уже мають serviceName та clientName
        return [...slots, ...appointments.value].sort((a, b) => a.start - b.start)
    }

    // 🔹 користувач — як і було
    return [...availableSlots.value.map(s => ({ ...s, type: 'available' })),
    ...bookedSlots.value.map(s => ({ ...s, type: 'booked' }))]
        .sort((a, b) => a.start - b.start)
})


// ----- INIT -----
onMounted(() => {
    const def = new Date()
    selectedDate.value = def
    viewDate.value = new Date(def.getFullYear(), def.getMonth(), 1)
})

// ----- WATCHERS -----
watch([() => props.selectedMaster, () => props.selectedService, selectedDate], async ([master, service, date]) => {
    if (!date) return
    if (props.isForMaster) {
        await loadAppointmentsForMaster(date)
    } else {
        await loadAvailableSlotsAndBookings(date)
    }
    emit('date-selected', date)
}, { immediate: true })




// ----- LOAD SLOTS -----
async function loadAvailableSlotsAndBookings(date) {
    availableSlots.value = []
    bookedSlots.value = []
    isLoading.value = true
    try {
        const appointmentsData = await appointmentsStore.fetchByMasterAndDate(props.selectedMaster.id, {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate()
        })

        const duration = props.selectedService?.duration || 60

        const normalized = (appointmentsData || []).map(app => ({
            ...app,
            start: new Date(app.start),
            end: new Date(app.end)
        }))

        availableSlots.value = generateAvailableSlots(date, normalized, duration)
        bookedSlots.value = normalized.map(app => ({
            id: app.id,
            start: app.start,
            end: app.end,
            title: t('components.booking.booked')
        }))
    } catch (err) {
        console.error('Помилка завантаження слотів та записів:', err)
    } finally {
        isLoading.value = false
    }
}

// 🟢 нове — завантаження записів для майстра
// ----- LOAD APPOINTMENTS -----
async function loadAppointmentsForMaster(date) {
    appointments.value = []
    appointmentsWeek.value = []
    appointmentsMonth.value = []
    isLoading.value = true

    try {
        if (props.selectedMaster) {
            // 🔹 1. День — залишаємо старий метод
            const raw = await appointmentsStore.fetchByMasterAndDate(props.selectedMaster.id, {
                year: date.getFullYear(),
                month: date.getMonth(),
                day: date.getDate(),
            })

            appointments.value = (raw || []).map(app => normalizeAppointment(app))

            // 🔹 2. Тиждень — новий метод
            const weekStart = getStartOfWeek(date)
            const weekEnd = getEndOfWeek(date)
            const weekRaw = await appointmentsStore.fetchByMasterAndRange(
                props.selectedMaster.id,
                weekStart,
                weekEnd
            )
            appointmentsWeek.value = (weekRaw || []).map(app => normalizeAppointment(app))

            // 🔹 3. Місяць — новий метод
            const monthStart = getStartOfMonth(date)
            const monthEnd = getEndOfMonth(date)
            const monthRaw = await appointmentsStore.fetchByMasterAndRange(
                props.selectedMaster.id,
                monthStart,
                monthEnd
            )
            appointmentsMonth.value = (monthRaw || []).map(app => normalizeAppointment(app))
        }
    } catch (err) {
        console.error('Помилка завантаження записів майстра:', err)
    } finally {
        isLoading.value = false
    }
}

function normalizeAppointment(app) {
    const firstName =
        app.userFirstName || app.firstName || app.clientFirstName || ''
    const lastName =
        app.userLastName || app.lastName || app.clientLastName || ''
    // Якщо userId відсутній (тобто бронь створив адмін) — не тягнемо lastName з admin-профілю
    let userName = firstName || 'Невідомий клієнт'
    if (lastName && app.userId) {
        userName = `${firstName} ${lastName}`.trim()
    }

    return {
        id: app.id,
        start: app.start instanceof Date ? app.start : app.start.toDate(),
        end: app.end instanceof Date ? app.end : app.end.toDate(),
        serviceId: app.serviceId || null,
        masterId: app.masterId || null,
        serviceTitle: app.serviceName || 'Невідома послуга',
        userName, // ✅ тут тепер правильне ім’я клієнта
        userPhone: app.userPhone || app.phone || null,
        userEmail: app.userEmail || null,
        type: 'booked',
        status: app.status || 'pending',
        requiresConfirmation: !!app.requiresConfirmation,
        price: app.price || 0,
        additionalCost: app.additionalCost || 0,
        extraMasterBonus: app.extraMasterBonus || 0,
        comment: app.comment || '',
    }
}



// ----- MONTH GRID -----
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

const dateLabel = computed(() => {
    if (viewMode.value === 'month') {
        return viewDate.value.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })
    }
    if (selectedDate.value) {
        return selectedDate.value.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        })
    }
    return ''
})

const flatMonthMatrix = computed(() => {
    const first = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7
    const gridStart = addDays(first, -startOffset)
    const cells = []
    for (let i = 0; i < 42; i++) {
        const d = addDays(gridStart, i)
        cells.push({
            date: d,
            key: d.toISOString().slice(0, 10),
            isCurrentMonth: d.getMonth() === viewDate.value.getMonth(),
            isToday: sameDay(d, new Date()),
            isSelected: selectedDate.value ? sameDay(d, selectedDate.value) : false
        })
    }
    return cells
})

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
}
function addDays(date, n) {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    return d
}

// ----- NAV -----
function goPrev() {
    if (viewMode.value === 'month') {
        viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
    } else if (selectedDate.value) {
        selectedDate.value = addDays(selectedDate.value, -1)
    }
}
function goNext() {
    if (viewMode.value === 'month') {
        viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
    } else if (selectedDate.value) {
        selectedDate.value = addDays(selectedDate.value, 1)
    }
}
function goToday() {
    const now = new Date()
    if (viewMode.value === 'month') viewDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
    selectedDate.value = now
}

// ----- SELECT -----
function selectDate(date) {
    selectedDate.value = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    viewMode.value = 'day'
    selectedSlot.value = null
}

function selectSlot(slot) {
    selectedSlot.value = {
        start: new Date(slot.start),
        end: new Date(slot.end),
        title: slot.title
    }
    emit('selectDateTime', selectedSlot.value)
}

// ----- SLOTS GEN -----
function generateAvailableSlots(date, appointments, durationInMinutes) {
    const slots = []
    const startHour = 8
    const endHour = 21
    const step = 30 // мінімальний крок у хвилинах

    const busyRanges = appointments.map(app => ({
        start: app.start.getTime(),
        end: app.end.getTime()
    }))

    let slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0, 0).getTime()
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, 0, 0, 0).getTime()

    const splitMode = !!(props.splitStart && props.splitEnd)
    const splitStart = splitMode ? new Date(props.splitStart).getTime() : null
    const splitEnd = splitMode ? new Date(props.splitEnd).getTime() : null

    while (slotStart + durationInMinutes * 60000 <= dayEnd) {
        const slotEnd = slotStart + durationInMinutes * 60000

        // перевірка: чи вільний увесь інтервал
        let isBusy = busyRanges.some(b => slotStart < b.end && slotEnd > b.start)

        if (splitMode) {
            // якщо ми всередині дозволеного split-інтервалу
            const insideSplitRange = slotStart >= splitStart && slotEnd <= splitEnd
            if (insideSplitRange) {
                // майстру дозволено створювати навіть якщо busy
                isBusy = false
            }
        }

        if (!isBusy) {
            slots.push({
                id: slotStart.toString(),
                start: new Date(slotStart),
                end: new Date(slotEnd),
                title: t('components.booking.available')
            })
        }

        slotStart += step * 60000
    }

    return slots
}


// ----- FORMATTERS -----
const formatSelectedSlot = computed(() => {
    if (!selectedSlot.value) return ''
    return new Date(selectedSlot.value.start).toLocaleString('uk-UA', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })
})

function formatRange(start, end) {
    const s = new Date(start).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    const e = new Date(end).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    return `${s}–${e}`
}

function getStartOfWeek(date) {
    const d = new Date(date)
    const day = d.getDay() // 0 = Нд, 1 = Пн...
    const diff = (day === 0 ? -6 : 1) - day // щоб тиждень починався з Пн
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function getEndOfWeek(date) {
    const start = getStartOfWeek(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
}

function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}


const filteredDaySlots = computed(() => {
    if (!props.splitStart || !props.splitEnd) return daySlots.value

    const start = new Date(props.splitStart).getTime()
    const end = new Date(props.splitEnd).getTime()

    return daySlots.value.filter(slot => {
        const s = slot.start.getTime()
        const e = slot.end.getTime()
        return s >= start && e <= end
    })
})


// 🟢 підрахунок зарплати за день

const SALARY_RATE = 0.45
const EXTRA_RATE = 0.05

// 🔹 валовий дохід (price + additionalCost)
const dailySalon = computed(() =>
    appointments.value.filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.price || 0) + (a.additionalCost || 0), 0)
)
const weeklySalon = computed(() =>
    appointmentsWeek.value.filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.price || 0) + (a.additionalCost || 0), 0)
)
const monthlySalon = computed(() =>
    appointmentsMonth.value.filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.price || 0) + (a.additionalCost || 0), 0)
)

// 🔹 зарплата = 45% від price + 5% від additionalCost
const dailySalary = computed(() =>
    appointments.value.filter(a => a.status === 'completed')
        .reduce((sum, a) => {
            const base = (a.price || 0) * SALARY_RATE
            const extra = (a.additionalCost || 0) * EXTRA_RATE
            const bonus = a.extraMasterBonus || 0
            return sum + Math.round(base + extra + bonus)
        }, 0)
)
const weeklySalary = computed(() =>
    appointmentsWeek.value.filter(a => a.status === 'completed')
        .reduce((sum, a) => {
            const base = (a.price || 0) * SALARY_RATE
            const extra = (a.additionalCost || 0) * EXTRA_RATE
            const bonus = a.extraMasterBonus || 0
            return sum + Math.round(base + extra + bonus)
        }, 0)
)
const monthlySalary = computed(() =>
    appointmentsMonth.value.filter(a => a.status === 'completed')
        .reduce((sum, a) => {
            const base = (a.price || 0) * SALARY_RATE
            const extra = (a.additionalCost || 0) * EXTRA_RATE
            const bonus = a.extraMasterBonus || 0
            return sum + Math.round(base + extra + bonus)
        }, 0)
)

// 🔹 чистий прибуток салону
const dailySalonNet = computed(() => dailySalon.value - dailySalary.value)
const weeklySalonNet = computed(() => weeklySalon.value - weeklySalary.value)
const monthlySalonNet = computed(() => monthlySalon.value - monthlySalary.value)

const currentStepProps = computed(() => {
    switch (step.value) {
        case 0: return {}
        case 1: return {}
        case 2: return { selectedService: selectedService.value }
        case 3: return {
            selectedService: selectedService.value,
            selectedMaster: selectedMaster.value,
            splitStart: splitStart.value,
            splitEnd: splitEnd.value,
        }
        case 4: return {
            selectedService: selectedService.value,
            selectedMaster: selectedMaster.value,
            selectedDateTime: selectedDateTime.value
        }
        default: return {}
    }
})



// 🟢 Оновлений emit
watch([appointments, dailySalary, weeklySalary, monthlySalary, dailySalon, dailySalonNet, weeklySalon, weeklySalonNet, monthlySalon, monthlySalonNet], () => {
    emit('finance-calculated', {
        // ЗП майстра
        daily: dailySalary.value,
        weekly: weeklySalary.value,
        monthly: monthlySalary.value,
        // Дохід салону
        dailySalon: dailySalon.value,
        dailySalonNet: dailySalonNet.value,
        weeklySalon: weeklySalon.value,
        weeklySalonNet: weeklySalonNet.value,
        monthlySalon: monthlySalon.value,
        monthlySalonNet: monthlySalonNet.value
    })
}, { immediate: true })

</script>
  
<style scoped lang="scss">
.date-step {
    padding: 2rem;
    border-radius: 12px;
    background-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 8px 20px #31313114;

    &__title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 2rem;
        text-align: center;
    }

    &__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
        justify-content: space-between;
        margin-block-end: 1.5rem;

        .left,
        .right {
            display: flex;
            gap: .5rem;

            button {
                padding: .4rem .6rem;
                border: 1px solid #ddd;
                background: #fff;
                border-radius: .5rem;
                cursor: pointer;
            }

            .active {
                background: #f3e5f5;
                border-color: #d1c4e9;
            }
        }

        .center {
            text-align: center;

            .date-step__title--month {
                font-size: 24px;
                font-weight: 600;
                text-transform: capitalize;
            }
        }
    }

    .calendar {
        &__weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            font-size: 1.2rem;
            color: #81DACA;
            margin-bottom: .25rem;
        }

        &__weekday {
            text-align: center;
            padding: .25rem 0;
        }

        &__grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: .25rem;
            min-height: 380px;
        }

        &__cell {
            position: relative;
            background: #fff;
            border: 1px solid #eee;
            border-radius: .5rem;
            padding: .5rem;
            cursor: pointer;
            transition: box-shadow .15s ease-in-out, transform .05s ease-in-out;

            &:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
                transform: translateY(-1px);
            }

            &.is-today {
                border-color: #9effed;
                background-color: #a8f1e4;
            }

            &.is-selected {
                outline: 2px solid #8d6e63;
            }

            &.is-outside {
                background: #fafafa;
                color: #999;
            }

            @media (max-width: 400px) {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: .2rem;
            }
        }

        &__date {
            font-weight: 600;
            font-size: .95rem;
            color: #8d6e63;
        }
    }

    .day-view {
        &__slots {
            display: grid;
            gap: 0.5rem;
        }

        .slot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.6rem 0.8rem;
            border: 1px solid #eee;
            border-radius: 0.6rem;
            background: #fff;
            cursor: pointer;

            &.selected {
                border-color: #8d6e63;
                background: #f7f1ee;
            }

            &.slot--booked {
                cursor: pointer;
                background: #f5a4a4;
                border-color: #ddd;
                color: #888;
            }

            &.slot--booked-master {
                cursor: pointer;
                background: #81DACA;
                border-color: #ddd;
                color: #888;
            }

            &__time {
                font-weight: 600;
                color: #555;
            }

            &__title {
                color: #555;
            }
        }

        .slots--empty {
            padding: 0.8rem;
            color: #777;
        }
    }


    &__selected {
        margin-top: 1rem;

        p {
            font-weight: bold;
        }

        button {
            margin-top: .5rem;
            padding: .5rem 1rem;
            background-color: #a1887f;
            color: white;
            border: none;
            border-radius: .5rem;
            cursor: pointer;

            &:hover {
                background-color: #8d6e63;
            }
        }
    }

    .date-step__summary {
        margin-block-start: 15px;
    }
}
</style>
  