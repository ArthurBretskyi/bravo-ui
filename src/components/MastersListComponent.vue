<template>
    <div class="masters-list">
        <div v-if="masters && masters.length" class="masters-list__grid">
            <MasterCardComponent v-for="master in masters" :key="master.id" :master="master" :mode="mode"
                @edit="$emit('edit', master)" @delete="$emit('delete', master.id)" @select="$emit('select', master)" />
        </div>

        <p v-else class="masters-list__empty">
            {{ $t('pages.masters.noMasters') }}
        </p>
    </div>
</template>
    
<script setup>
import { defineProps, defineEmits } from 'vue'
import MasterCardComponent from '@/components/MasterCardComponent.vue'

const props = defineProps({
    masters: {
        type: Array,
        required: true,
    },
    mode: {
        type: String,
        default: 'admin', // 'admin' | 'user' | 'select'
    },
})

defineEmits(['edit', 'delete', 'select'])
</script>
  
  
<style lang="scss" scoped>
.masters-list {
    // padding: 2rem;

    &__title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
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
  