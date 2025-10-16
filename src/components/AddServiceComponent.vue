<template>
    <div class="add-service">
        <div class="add-service__wrapper">
            <h2 class="add-service__title">
                {{ isEditMode ? $t('pages.addService.titleEdit') : $t('pages.addService.titleAdd') }}
            </h2>

            <form class="add-service__form" @submit.prevent="handleSubmit">
                <input v-model="form.title" :placeholder="$t('form.title')" class="add-service__input" required />
                <textarea v-model="form.description" :placeholder="$t('form.description')" class="add-service__input"
                    required />
                <input v-model="form.price" type="number" :placeholder="$t('form.price')" class="add-service__input"
                    required />
                <input v-model="form.duration" type="number" :placeholder="$t('form.duration')" class="add-service__input"
                    required />
                <input v-model="form.category" :placeholder="$t('form.category')" class="add-service__input" required />
                <label class="add-service__checkbox">
                    <input type="checkbox" v-model="form.requiresConfirmation" />
                    {{ $t('form.requiresConfirmation') }}
                </label>


                <input type="file" accept="image/*" class="add-service__file" @change="handleFileChange" />
                <p v-if="localError" class="add-service__error">{{ localError }}</p>
                <p v-if="hasError" class="add-service__error">{{ $t('error.messages.smth_wrong') }}</p>

                <img v-if="photoPreview" :src="photoPreview" class="add-service__preview" />

                <button type="submit" class="add-service__btn">
                    {{ isLoading
                        ? (isEditMode ? $t('form.updating') : $t('form.submitting'))
                        : (isEditMode ? $t('form.update') : $t('form.submit')) }}
                </button>

                <LoadingComponent v-if="isLoading" />
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGeneralStore } from '@/stores/general'
import { useServicesStore } from '@/stores/services'
import LoadingComponent from '@/components/LoadingComponent.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const generalStore = useGeneralStore()
const servicesStore = useServicesStore()
const { generalApiOperation, isLoading, hasError } = generalStore

const serviceId = route.params.id || null
const isEditMode = computed(() => !!serviceId)

const form = ref({
    title: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    photoUrl: '',
    requiresConfirmation: false
})

const localError = ref(null)
const photoFile = ref(null)
const photoPreview = ref(null)

onMounted(async () => {
    if (isEditMode.value) {
        const data = await servicesStore.loadItemById(serviceId)
        if (data) {
            form.value = {
                title: data.title || '',
                description: data.description || '',
                price: data.price || '',
                duration: data.duration || '',
                category: data.category || '',
                photoUrl: data.photoUrl || ''
            }
            photoPreview.value = data.photoUrl
        }
    }
})

function handleFileChange(event) {
    const file = event.target.files[0]
    if (file) {
        photoFile.value = file
        photoPreview.value = URL.createObjectURL(file)
    }
}

async function uploadToCloudinary(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', 'services')

    const response = await fetch(import.meta.env.VITE_CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Cloudinary upload failed')
    return data.secure_url
}

async function handleSubmit() {
    localError.value = null

    await generalApiOperation({
        operation: async () => {
            if (photoFile.value) {
                const imageUrl = await uploadToCloudinary(photoFile.value)
                form.value.photoUrl = imageUrl
            }

            if (isEditMode.value) {
                await servicesStore.updateItem(serviceId, form.value)
            } else {
                if (!photoFile.value) {
                    localError.value = t('validation.photoRequired')
                    return
                }
                await servicesStore.addItem({ ...form.value, createdAt: new Date().toISOString() })
            }

            router.push({ name: 'Admin' })
        }
    })
}
</script>

  
<style scoped lang="scss">
.add-service {
    display: flex;
    justify-content: center;
    padding: 2rem;

    &__wrapper {
        width: 100%;
        max-width: 500px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
        padding: 2rem;
    }

    &__title {
        text-align: center;
        margin-bottom: 1.5rem;
        color: #444;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__input {
        padding: 0.75rem;
        border-radius: 6px;
        border: 1px solid #ccc;
        font-size: 1rem;
    }

    &__file {
        margin-top: 0.5rem;
    }

    &__preview {
        max-height: 150px;
        object-fit: cover;
        margin-top: 1rem;
        border-radius: 6px;
    }

    &__btn {
        background: #444;
        color: #fff;
        padding: 0.75rem;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;

        &:disabled {
            background: #aaa;
            cursor: not-allowed;
        }
    }

    &__error {
        color: red;
        font-size: 0.9rem;
    }
}
</style>
  