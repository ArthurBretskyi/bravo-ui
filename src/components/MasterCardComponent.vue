<template>
    <div class="master-card">
        <img v-if="master.photoUrl" :src="master.photoUrl" alt="master photo" class="master-card__photo" />
        <div class="master-card__info">
            <h3 class="master-card__name">
                {{ master.firstName }} {{ master.lastName }}
            </h3>
            <p class="master-card__specialization">
                {{ $t(`specializations.${master.specialization.toLowerCase()}`) }}
            </p>
            <p class="master-card__phone">
                <font-awesome-icon icon="fa-solid fa-phone" class="phone-icon" />
                {{ master.phone }}
            </p>
        </div>

        <div class="master-card__actions">
            <template v-if="mode === 'admin'">
                <button @click="$emit('edit', master)" class="edit-btn">
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" />
                    <!-- {{ $t('components.masterCard.edit') }} -->
                </button>
                <button @click="$emit('delete', master.id)" class="delete-btn">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                    <!-- {{ $t('components.masterCard.delete') }} -->
                </button>
            </template>


            <template v-else-if="mode === 'user'">
                <button @click="$emit('select', master)" class="select-btn">
                    {{ $t('components.masterCard.select') }}
                </button>
            </template>

            <template v-else-if="mode === 'select'">
                <button @click="$emit('select', master)" class="select-btn">
                    {{ $t('components.masterCard.choose') }}
                </button>
            </template>
        </div>
    </div>
</template>
  
<script setup>
const props = defineProps({
    master: {
        type: Object,
        required: true,
    },
    mode: {
        type: String,
        default: 'admin', // 'admin' | 'user' | 'select'
    },
})

defineEmits(['edit', 'delete', 'select'])
</script>
  
  
  
<style scoped lang="scss">
.master-card {
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

    &__photo {
        width: 100%;
        height: 180px;
        object-fit: cover;
    }

    &__info {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-grow: 1;
        gap: 0.6rem;
        color: #444;
        // margin-top: 5px;
        padding: 16px;
    }

    &__name {
        font-size: 1.5rem;
        text-align: center;
        color: #562b00;
    }

    &__specialization {
        font-size: 1rem;
        color: #838282;
    }

    &__phone {
        font-size: 1.2rem;
        color: #444;

        .phone-icon {
            color: #00CEC8;

        }
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
    }

    // }

    // @media (min-width: 600px) {
    //     .master-card {
    //         flex-direction: row;
    //         text-align: left;

    //         &__photo {
    //             flex: 0 0 150px;
    //             max-height: none;
    //         }

    //         &__info {
    //             flex: 1;
    //             padding: 0 1rem;
    //         }

    //         &__actions {
    //             flex-direction: column;
    //             justify-content: center;
    //         }
    //     }
}
</style>
  