<template>
    <div class="overlay" @click.self="$emit('close')">
        <div class="modal">
            <button class="close-btn" @click="$emit('close')">×</button>
            <h2 class="modal__title">{{ $t('components.serviceDetailsModal.title') }}</h2>

            <!-- Послуги -->
            <div v-if="booking.selectedServices?.length" class="modal__section">
                <ul class="modal__list">
                    <li v-for="s in booking.selectedServices" :key="s">
                        {{ s }}
                        <span v-if="booking.selectedLengths?.[s]">
                            — {{ booking.selectedLengths[s] }}
                        </span>
                    </li>
                </ul>
            </div>

            <!-- Витратні матеріали -->
            <div v-if="checkedConsumables.length" class="modal__section">
                <h3 class="modal__subtitle">{{ $t('components.serviceDetailsModal.additionalСonsumables') }}</h3>
                <ul class="modal__list">
                    <li v-for="[name, c] in checkedConsumables" :key="name">
                        {{ name }} — {{ c.grams }} г
                    </li>
                </ul>
            </div>

            <!-- Коментар майстра -->
            <div v-if="booking.comment" class="modal__section">
                <h3 class="modal__subtitle">{{ $t('components.serviceDetailsModal.commentFromMaster') }}</h3>
                <p>{{ booking.comment }}</p>
            </div>
        </div>
    </div>
</template>
  
<script setup>
import { computed } from 'vue'

const props = defineProps({
    booking: { type: Object, required: true }
})

const checkedConsumables = computed(() =>
    Object.entries(props.booking.selectedConsumables || {}).filter(([_, c]) => c && c.checked)
)
</script>
  
  
<style lang="scss" scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    row-gap: .5rem;
    color: #000;
    background: #fff;
    border-radius: 20px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    text-align: center;
    position: relative;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);

    &__title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        text-align: center;
    }

    &__section {
        margin-bottom: 1rem;
    }

    &__subtitle {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    &__list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
            padding: 0.3rem 0;
            border-bottom: 1px solid #eee;
        }
    }

    &__actions {
        text-align: center;
        margin-top: 1.5rem;

        .btn {
            padding: 0.6rem 1.2rem;
        }
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
</style>
  