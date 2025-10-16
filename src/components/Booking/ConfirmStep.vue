<template>
    <section class="confirm-step">
        <h2 class="confirm-step__title">
            {{ $t('components.booking.confirmTitle') }}
        </h2>

        <div class="confirm-step__details">
            <!-- Сервіс -->
            <div>
                <strong>{{ $t('components.booking.service') }}:</strong>
                <span>{{ selectedService?.title }}</span>
            </div>

            <!-- Майстер -->
            <div>
                <strong>{{ $t('components.booking.master') }}:</strong>
                <span>{{ selectedMaster?.firstName }} {{ selectedMaster?.lastName }}</span>
            </div>

            <!-- Дата/час -->
            <div>
                <strong>{{ $t('components.booking.dateTime') }}:</strong>
                <span>{{ formattedDate }}</span>
            </div>

            <!-- Якщо потрібне уточнення -->
            <template v-if="selectedService?.requiresConfirmation">
                <div class="confirm-step__note">
                    <em>
                        {{ $t('components.booking.confirmStep.requiresConfirmationMessage') }}
                    </em>
                </div>
            </template>

            <!-- Якщо ціна та тривалість відомі -->
            <template v-else>
                <div>
                    <strong>{{ $t('components.booking.price') }}:</strong>
                    <span>{{ selectedService?.price }} ₴</span>
                </div>

                <div>
                    <strong>{{ $t('components.booking.duration') }}:</strong>
                    <span>{{ selectedService?.duration }} {{ $t('components.booking.minutes') }}</span>
                </div>
            </template>
        </div>
    </section>
</template>
  
<script setup>
import { computed } from 'vue'

const props = defineProps({
    selectedService: { type: Object, required: true },
    selectedMaster: { type: Object, required: true },
    selectedDateTime: { type: Object, required: true }
})

const formattedDate = computed(() => {
    if (!props.selectedDateTime?.start) return ''
    const start = new Date(props.selectedDateTime.start)
    return start.toLocaleString('uk-UA', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })
})
</script>
  
<style scoped lang="scss">
.confirm-step {
    &__title {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    &__details {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: #f8f8f8;
        padding: 1rem;
        border-radius: 8px;
        color: #000;
        // width: 60%;

        div {
            display: flex;
            justify-content: space-between;
            font-size: 1rem;

            strong {
                font-weight: 600;
            }
        }
    }

    .confirm-step__note {
        margin-top: 0.5rem;
        color: #b45309;
        /* приємний коричнево-помаранчевий акцент */
        font-style: italic;
    }
}
</style>
  