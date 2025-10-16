<template>
    <section class="gallery-view">
        <!-- Loader -->
        <LoadingComponent v-if="generalStore.isLoading" />

        <!-- Error -->
        <ErrorComponent v-else-if="generalStore.errorMessage && galleryStore.getItemsList.length === 0"
            :message="generalStore.errorMessage?.message || generalStore.errorMessage" />

        <!-- Контент галереї -->
        <div v-else class="gallery">
            <h2 class="gallery__title">{{ $t('pages.gallery.title') }}</h2>

            <div v-if="allUrls.length === 0" class="no-images">
                <p>{{ $t('pages.gallery.noImages') || 'Немає зображень' }}</p>
            </div>

            <div v-else class="masonry">
                <div v-for="(url, index) in allUrls" :key="index" class="masonry-item" @click="openLightbox(index)">
                    <img :src="url.trim()" :alt="`Gallery ${index + 1}`" loading="lazy" />
                </div>
            </div>

            <!-- Lightbox -->
            <teleport to="body">
                <div v-if="lightbox.open" class="lightbox" @click.self="closeLightbox">
                    <button class="close-btn" @click="closeLightbox">&times;</button>
                    <img :src="allUrls[lightbox.index]?.trim()" />
                </div>
            </teleport>
        </div>
    </section>
</template>
  
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGeneralStore } from '@/stores/general'
import { useGalleryStore } from '@/stores/gallery'

import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'

const generalStore = useGeneralStore()
const galleryStore = useGalleryStore()

const lightbox = ref({ open: false, index: 0 })
const openLightbox = (index) => (lightbox.value = { open: true, index })
const closeLightbox = () => (lightbox.value.open = false)

// Нормалізуємо всі можливі варіанти збереження зображень
const allUrls = computed(() => {
    const list = galleryStore.getItemsList ?? []
    const urls = []

    for (const doc of list) {
        // випадок: документ має поле 'urls' (array)
        if (doc?.urls && Array.isArray(doc.urls)) {
            doc.urls.forEach((u) => {
                if (typeof u === 'string' && u.trim().length) urls.push(u.trim())
            })
            continue
        }

        // випадок: документ має поле 'url' (single)
        if (doc?.url && typeof doc.url === 'string') {
            urls.push(doc.url.trim())
            continue
        }

        // випадок: doc може бути DocumentSnapshot-like: { data: { urls: [...] } }
        if (doc?.data) {
            const d = typeof doc.data === 'function' ? doc.data() : doc.data
            if (d?.urls && Array.isArray(d.urls)) {
                d.urls.forEach((u) => typeof u === 'string' && urls.push(u.trim()))
                continue
            }
            if (d?.url && typeof d.url === 'string') {
                urls.push(d.url.trim())
                continue
            }
        }

        // Якщо структура інша — намагатимемося пройтися по ключах і знайти рядки із https
        for (const key of Object.keys(doc || {})) {
            const value = doc[key]
            if (typeof value === 'string' && value.trim().startsWith('http')) {
                urls.push(value.trim())
            }
            if (Array.isArray(value)) {
                value.forEach((v) => typeof v === 'string' && v.trim().startsWith('http') && urls.push(v.trim()))
            }
        }
    }

    return urls
})

// Завантаження
onMounted(async () => {
    try {
        await galleryStore.loadItemsList()
    } catch (err) {
        console.error('Error loading gallery:', err)
    }
})
</script>
  
<style lang="scss" scoped>
.gallery {
    padding: 3rem 1rem;

    &__title {
        text-align: center;
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 2rem;
    }
}

.no-images {
    text-align: center;
    opacity: 0.7;
    margin: 2rem 0;
}

.masonry {
    column-count: 3;
    column-gap: 1rem;

    .masonry-item {
        break-inside: avoid;
        margin-bottom: 1rem;
        cursor: pointer;

        img {
            width: 100%;
            border-radius: 1rem;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;

            &:hover {
                transform: scale(1.05);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
            }
        }
    }
}

@media (max-width: 1024px) {
    .masonry {
        column-count: 2;
    }
}

@media (max-width: 600px) {
    .masonry {
        column-count: 1;
    }
}

/* Lightbox */
.lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.25s ease;

    img {
        max-width: 90%;
        max-height: 90%;
        border-radius: 1rem;
    }

    .close-btn {
        position: absolute;
        top: 2rem;
        right: 2rem;
        background: transparent;
        border: none;
        font-size: 3rem;
        color: #fff;
        cursor: pointer;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0
    }

    to {
        opacity: 1
    }
}
</style>
  