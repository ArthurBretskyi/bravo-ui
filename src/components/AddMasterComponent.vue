<template>
    <div class="add-master">
        <div class="add-master__wrapper">
            <h2 class="add-master__title">{{ isEditMode ? t('pages.addMaster.editTitle') : t('pages.addMaster.title') }}
            </h2>

            <form class="add-master__form" @submit.prevent="handleSubmit">
                <input v-model="form.firstName" :placeholder="t('pages.addMaster.firstName')" class="add-master__input"
                    required />
                <input v-model="form.lastName" :placeholder="t('pages.addMaster.lastName')" class="add-master__input"
                    required />

                <select v-model="form.specialization" class="add-master__input" required>
                    <option value="">{{ t('pages.addMaster.specialization') }}</option>
                    <option value="hairdresser">Hairdresser/Colorist</option>
                    <option value="makeup_artist">Makeup Artist</option>
                    <option value="manicurist">Manicurist</option>
                    <option value="masseur">Masseur</option>
                </select>

                <input v-model="form.phone" :placeholder="t('pages.addMaster.phone')" class="add-master__input" required />

                <!-- Вибір користувача для ролі master -->
                <select v-if="!isEditMode && !route.query.userId" v-model="form.userId" class="add-master__input" required>
                    <option value="">{{ t('pages.addMaster.selectUser') }}</option>
                    <option v-for="user in usersList" :key="user.id" :value="user.id">
                        {{ user.email }}
                    </option>
                </select>


                <input type="file" accept="image/*" class="add-master__file" @change="handleFileChange" />
                <p v-if="localError" class="add-master__error">{{ localError }}</p>
                <p v-if="hasError" class="add-master__error">{{ t('error.messages.smth_wrong') }}</p>

                <img v-if="photoPreview" :src="photoPreview" class="add-master__preview" />

                <div class="add-master__services">
                    <label class="add-master__label">{{ t('pages.addMaster.selectServices') }}</label>
                    <div class="add-master__checkbox-group">
                        <label v-for="service in servicesStore.getItemsList" :key="service.id" class="add-master__checkbox">
                            <input type="checkbox" :value="service.id" v-model="form.services" />
                            {{ service.title }}
                        </label>
                    </div>
                </div>

                <button type="submit" class="add-master__btn">
                    {{ isLoading
                        ? (isEditMode ? t('pages.addMaster.updating') : t('pages.addMaster.submitting'))
                        : (isEditMode ? t('pages.addMaster.update') : t('pages.addMaster.submit'))
                    }}
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
import { useMastersStore } from '@/stores/masters'
import { useServicesStore } from '@/stores/services'
import LoadingComponent from '@/components/LoadingComponent.vue'
import { doc, updateDoc, getDocs, getDoc, collection } from 'firebase/firestore'
import db from '@/firebase-config'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const generalStore = useGeneralStore()
const mastersStore = useMastersStore()
const servicesStore = useServicesStore()
const { generalApiOperation, isLoading, hasError } = generalStore

const masterId = route.params.id || null
const isEditMode = computed(() => !!masterId)

const form = ref({
    firstName: '',
    lastName: '',
    specialization: '',
    phone: '',
    photoUrl: '',
    services: [],
    userId: '' // для нового майстра
})

const localError = ref(null)
const photoFile = ref(null)
const photoPreview = ref(null)
const usersList = ref([])

onMounted(async () => {
    if (route.query.userId) {
        form.value.userId = route.query.userId

        // підтягуємо дані юзера
        const userRef = doc(db, 'users', route.query.userId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
            const userData = userSnap.data()
            form.value.firstName = userData.firstName || ''
            form.value.lastName = userData.lastName || ''
            form.value.phone = userData.phone || ''
        }
    }

    // Завантажуємо список користувачів лише якщо потрібно
    if (!isEditMode.value && !form.value.userId) {
        const usersSnap = await getDocs(collection(db, 'users'))
        usersList.value = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    }

    if (isEditMode.value) {
        const data = await mastersStore.loadItemById(masterId)
        if (data) {
            form.value = {
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                specialization: data.specialization || '',
                phone: data.phone || '',
                photoUrl: data.photoUrl || '',
                services: data.services || [],
                userId: data.userId || ''
            }
            photoPreview.value = data.photoUrl
        }
    }

    servicesStore.loadItemsList()
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
    formData.append('folder', 'masters')

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
                await mastersStore.updateItem(masterId, form.value)
            } else {
                if (!photoFile.value) {
                    localError.value = t('validation.photoRequired')
                    return
                }

                // 1. Додаємо майстра у колекцію masters
                await mastersStore.addItem({ ...form.value, createdAt: new Date().toISOString() })

                // 2. Оновлюємо користувача у users, щоб роль стала master
                if (form.value.userId) {
                    const userRef = doc(db, 'users', form.value.userId)
                    await updateDoc(userRef, {
                        role: 'master',
                        phone: form.value.phone,
                        photoUrl: form.value.photoUrl
                    })
                }

            }

            router.push({ name: 'Admin' })
        }
    })
}
</script>
  

  
<style scoped lang="scss">
.add-master {
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


    .add-master__services {
        margin-top: 1.5rem;

        .add-master__label {
            font-weight: bold;
            display: block;
            margin-bottom: 0.5rem;
            color: #444;
        }

        .add-master__checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }

        .add-master__checkbox {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            background: #f9f9f9;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            border: 1px solid #ddd;
            cursor: pointer;
            user-select: none;
            color: #444;

            input[type="checkbox"] {
                cursor: pointer;
            }
        }
    }






}
</style>
  