<template>
    <div class="services-list">

        <!-- Title -->
        <h2 v-if="mode === 'admin' && context === 'browse'" class="services-list__title">
            {{ $t('pages.services.adminTitle') }}
        </h2>
        <h2 v-else-if="mode === 'user' && context === 'browse'" class="services-list__title">
            {{ $t('pages.services.userTitle') }}
        </h2>
        <!-- коли context === 'booking' → тайтл не показуємо взагалі -->

        <div v-if="services && services.length" class="services-list__grid">
            <ServiceCardComponent v-for="service in services" :key="service.id" :service="service" :mode="mode"
                :context="context" :isSelected="selectedServiceId === service.id" @select="$emit('select', service)"
                @edit="$emit('edit', service)" @delete="$emit('delete', service.id)" />
        </div>

        <p v-else class="services-list__empty">
            {{ $t('pages.services.noServices') }}
        </p>
    </div>
</template>
  
<script setup>
import ServiceCardComponent from '@/components/ServiceCardComponent.vue'

const props = defineProps({
    services: {
        type: Array,
        default: () => [],
    },
    selectedServiceId: {
        type: String,
        default: '',
    },
    mode: {
        type: String,
        default: 'user', // 'user' | 'admin' | 'master'
    },
    context: {
        type: String,
        default: 'browse', // для user: 'browse' | 'booking'
    },
})

defineEmits(['edit', 'delete', 'select'])
</script>
  
  

<style lang="scss" scoped>
.services-list {

    &__title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 2rem;
        text-align: center;
    }

    &__description {
        font-size: 1rem;
        color: #777;
        margin-bottom: 2rem;
        text-align: center;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        padding: 15px;
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 8px 20px #31313114;

        @media (max-width: 900px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 600px) {
            grid-template-columns: auto;
        }

    }

    &__empty {
        text-align: center;
        font-style: italic;
        color: #999;
        margin-top: 2rem;
    }
}
</style>
