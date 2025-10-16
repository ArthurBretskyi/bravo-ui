<template>
    <teleport to="body">
        <div class="overlay">
            <div class="appointment-modal">
                <button class="close-btn" @click="$emit('close')">×</button>

                <h2 class="title">{{ appointment.serviceTitle }}</h2>

                <div class="details">
                    <p><strong>{{ $t('components.MasterAppoinment.client') }}:</strong> {{ appointment.userName }}</p>
                    <p><strong>{{ $t('components.MasterAppoinment.phone') }}:</strong> {{ appointment.userPhone ||
                        appointment.phone || '-' }}</p>
                    <p><strong>{{ $t('components.MasterAppoinment.time') }}:</strong> {{ formatRange(appointment.start,
                        appointment.end) }}</p>
                    <p>
                        <strong>{{ $t('components.MasterAppoinment.status') }}:</strong>
                        <span v-if="appointment.requiresConfirmation">{{ $t('statuses.requiresConfirmation') }}</span>
                        <span v-else>{{ $t(`statuses.${appointment.status}`) }}</span>
                    </p>

                    <!-- Ціна -->
                    <p v-if="appointment.additionalCost > 0">
                        <strong>{{ $t('components.MasterAppoinment.price') }}:</strong>
                        {{ appointment.price }} грн + {{ appointment.additionalCost }} грн =
                        <strong>{{ displayPrice }}</strong> грн
                    </p>
                    <p v-else>
                        <strong>{{ $t('components.MasterAppoinment.price') }}:</strong>
                        {{ displayPrice }} грн
                    </p>

                    <!-- Зарплата -->
                    <p>
                        <strong>{{ $t('components.MasterAppoinment.salary') }}:</strong>
                        {{
                            Math.round(
                                (appointment.price || 0) * 0.45 +
                                (appointment.additionalCost || 0) * 0.05 +
                                (appointment.extraMasterBonus || 0)
                            )
                        }} грн
                    </p>


                    <!-- Додаткові поля -->
                    <div class="field" v-if="!readonly">
                        <label for="additionalCost">{{ $t('components.MasterAppoinment.additionalCost') }}</label>
                        <div class="input-with-button">
                            <input id="additionalCost" type="number" v-model.number="additionalCost" min="0"
                                placeholder="0" />
                            <button class="btn small" @click="saveAdditionalCost">
                                {{ $t('components.MasterAppoinment.addAdditionalCost') }}
                            </button>
                        </div>
                    </div>

                    <div class="field" v-if="!readonly">
                        <label for="extraMasterBonus">{{ $t('components.MasterAppoinment.extraMasterBonus') }}</label>
                        <div class="input-with-button">
                            <input id="extraMasterBonus" type="number" v-model.number="extraMasterBonus" min="0"
                                placeholder="0" />
                            <button class="btn small" @click="saveExtraMasterBonus">
                                {{ $t('buttons.add') || 'Додати' }}
                            </button>
                        </div>
                    </div>

                    <!-- Коментар -->
                    <div class="field" v-if="!readonly">
                        <label for="comment">{{ $t('components.MasterAppoinment.comment') }}</label>
                        <textarea id="comment" v-model="comment" placeholder="Введіть коментар"></textarea>
                        <button class="btn small" @click="saveComment">
                            {{ $t('components.MasterAppoinment.addComment') }}
                        </button>
                    </div>

                    <!-- Збережений коментар -->
                    <div class="field" v-if="appointment.comment">
                        <label>{{ $t('components.MasterAppoinment.commentSaved') }}</label>
                        <p class="saved-comment">{{ appointment.comment }}</p>
                    </div>
                </div>

                <!-- Якщо потрібне уточнення -->
                <div class="actions" v-if="appointment.requiresConfirmation">
                    <RouterLink v-if="appointment.serviceId" class="btn-details" :to="{
                        name: 'ServiceDetails',
                        params: { serviceId: appointment.serviceId },
                        query: { mode: 'appointment', appointmentId: appointment.id }
                    }">
                        {{ $t('components.MasterAppoinment.confirmService') }}
                    </RouterLink>
                    <span v-else class="warning">
                        ⚠️ {{ $t('components.MasterAppoinment.noServiceLinked') }}
                    </span>
                </div>

                <!-- Якщо запис pending/active без уточнення -->
                <div class="actions" v-if="!readonly">
                    <button class="btn success" @click="changeStatus('completed')">
                        {{ $t('components.MasterAppoinment.markCompleted') }}
                    </button>
                    <button class="btn danger" @click="changeStatus('cancelled')">
                        {{ $t('components.MasterAppoinment.cancel') }}
                    </button>
                    <button class="btn info" @click="onRebook(appointment)">
                        {{ $t('components.MasterAppoinment.rebook') }}
                    </button>
                </div>
            </div>
        </div>
    </teleport>
</template>
  
<script setup>
import { useAppointmentsStore } from '@/stores/appointments'
import { useRouter } from 'vue-router'
import { defineProps, defineEmits, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue3-toastify'
import { doc, getDoc } from 'firebase/firestore'
import db from '@/firebase-config'

const router = useRouter()
const appointmentsStore = useAppointmentsStore()
const { t } = useI18n()

const props = defineProps({
    appointment: { type: Object, required: true },
    readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['status-changed', 'close'])

const additionalCost = ref(props.appointment.additionalCost || 0)
const comment = ref(props.appointment.comment || '')

const displayPrice = computed(() => {
    const base = props.appointment.price || 0
    const add = props.appointment.additionalCost || 0
    return base + add
})

async function saveAdditionalCost() {
    const cost = Number(additionalCost.value) || 0
    const final = (props.appointment.price || 0) + cost
    await appointmentsStore.updateItem(props.appointment.id, {
        additionalCost: cost,
        finalPrice: final
    })
    Object.assign(props.appointment, { additionalCost: cost, finalPrice: final })
    toast.success(t('toast.additionalCostSaved'))
}

const extraMasterBonus = ref(props.appointment.extraMasterBonus || 0)

// Збереження нового бонусу
async function saveExtraMasterBonus() {
    const bonus = Number(extraMasterBonus.value) || 0
    await appointmentsStore.updateItem(props.appointment.id, { extraMasterBonus: bonus })
    Object.assign(props.appointment, { extraMasterBonus: bonus })
    toast.success(t('toast.extraBonusSaved') || 'Додаткове нарахування збережено')
}


async function saveComment() {
    const text = (comment.value || '').trim()
    await appointmentsStore.updateItem(props.appointment.id, { comment: text })
    Object.assign(props.appointment, { comment: text })
    toast.success(t('toast.commentSaved'))
}

function changeStatus(newStatus) {
    if (props.readonly) return
    emit('status-changed', props.appointment.id, newStatus, {
        additionalCost: Number(additionalCost.value) || 0,
        comment: (comment.value || '').trim()
    })
    toast.success(t('toast.statusCompleted'))
}

function formatRange(start, end) {
    const s = new Date(start).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    const e = new Date(end).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    return `${s}–${e}`
}

async function onRebook(booking) {
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
        router.push({
            name: 'Booking',
            query: { mode: 'rebook', oldBookingId: booking.id, phone: booking.phone || '' },
            state: { selectedService: serviceObj, selectedMaster: masterObj }
        })
    } catch (err) {
        toast.error(t('errors.rebookInvalid'))
    }
}
</script>
  
  
<style lang="scss" scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    /* ✅ вирівнюємо зверху, не по центру */
    z-index: 1000;
    padding: 2rem 1rem;
    /* невеликий внутрішній відступ */
    overflow-y: auto;
    /* дозволяємо прокрутку, якщо модалка довга */
}


.appointment-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #000;
    background-color: rgba(250, 224, 199, 0.9);
    border-radius: 20px;
    padding: 2rem 1.5rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    position: relative;
}

.appointment-modal::-webkit-scrollbar {
    width: 6px;
}

.appointment-modal::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.title {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
}

.details {
    display: flex;
    flex-direction: column;
    row-gap: .5rem;
    text-align: left;
    margin-bottom: 1.5rem;

    p {
        display: flex;
        gap: .5rem;
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .input-with-button {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    label {
        font-weight: 600;
    }

    input,
    textarea {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 6px;
    }
}

.close-btn {
    position: absolute;
    right: 1rem;
    top: 1rem;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #000;
}

.btn-details {
    color: #000;
    text-decoration: none;
    font-weight: bold;
    padding: 0.5rem 1.5rem;
    border: 2px solid #00CEC8;
    border-radius: 30px;
    transition: background-color 0.3s, color 0.3s;
    margin-block-end: .5rem;

    &:hover {
        background-color: white;
        color: #000;
        border: 2px solid #fff;

    }
}

.actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
}

button {
    color: #000;
    text-decoration: none;
    font-weight: bold;
    padding: 0.5rem 1.5rem;
    border: 2px solid #00CEC8;
    border-radius: 30px;
    transition: background-color 0.3s, color 0.3s;

    &:hover {
        background-color: white;
        color: #000;
        border: 2px solid #fff;

    }
}
</style>
  