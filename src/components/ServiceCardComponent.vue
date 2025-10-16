<template>
    <div class="service-card">
        <img v-if="service.photoUrl" :src="service.photoUrl" :alt="service.title" class="service-card__image" />

        <div class="service-card__content">
            <h3 class="service-card__title">{{ service.title }}</h3>
            <p class="service-card__description">{{ service.description }}</p>

        </div>
        <div class="service-card__actions" @click.stop>
            <!-- ADMIN -->
            <template v-if="mode === 'admin'">
                <button @click="$emit('edit', service)" class="edit-btn">
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" />
                    <!-- {{ $t('components.serviceCard.edit') }} -->
                </button>
                <button @click="$emit('delete', service.id)" class="delete-btn">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                    <!-- {{ $t('components.serviceCard.delete') }} -->
                </button>
                <button @click="goToDetails(service.id)" class="details-btn">
                    {{ $t('components.serviceCard.details') }}
                </button>
            </template>

            <!-- MASTER -->
            <template v-else-if="mode === 'master'">
                <button @click="goToDetails(service.id)" class="details-btn">
                    {{ $t('components.serviceCard.details') }}
                </button>
            </template>

            <!-- USER -->
            <template v-else-if="mode === 'user'">
                <template v-if="context === 'browse'">
                    <button @click="goToDetails(service.id)" class="details-btn">
                        {{ $t('components.serviceCard.details') }}
                    </button>
                </template>
                <template v-else-if="context === 'booking'">
                    <button @click="$emit('select', service)" class="select-btn">
                        {{ $t('components.serviceCard.select') }}
                    </button>
                </template>
            </template>
        </div>
    </div>
</template>
  
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps({
    service: {
        type: Object,
        required: true,
    },
    mode: {
        type: String,
        default: 'user', // 'admin' | 'master' | 'user'
    },
    context: {
        type: String,
        default: 'browse', // для mode === 'user': 'browse' | 'booking'
    },
})


function goToDetails(serviceId) {
    router.push(`/services/${serviceId}`)
}

defineEmits(['edit', 'delete', 'select'])


</script>
  
  
<style scoped lang="scss">
.service-card {
    background: #eaeaea;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6);
    }

    &__image {
        width: 100%;
        height: 180px;
        object-fit: cover;
    }

    &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-grow: 1;
        gap: 0.6rem;
        color: #444;
        // margin-top: 5px;
        padding: 16px;
    }

    &__title {
        font-size: 1.2rem;
        text-align: center;
        color: #562b00;
    }

    &__description {
        font-size: 0.9rem;
        color: #666;
        text-align: center;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__actions {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        padding-inline-start: 16px;
        padding-inline-end: 16px;
        padding-block-end: 16px;

        button {
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            border: 2px solid #00CEC8;
            background-color: #fff;

            &:hover {
                background-color: #00CEC8;
                color: #fff;

            }
        }

        .edit-btn {
            color: #666;

            &:hover {
                background-color: #00CEC8;
                color: #fff;
                border: 2px solid #00CEC8;
            }
        }

        .delete-btn {
            color: #666;

            &:hover {
                background-color: #00CEC8;
                color: #fff;
                border: 2px solid #00CEC8;
            }
        }

        .details-btn {
            background-color: #f1eeee;
            color: #562b00;
        }

        .select-btn {
            background-color: #00CEC8;
            color: #fff;
        }
    }
}
</style>
  