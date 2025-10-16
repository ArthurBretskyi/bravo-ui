<template>
    <section class="contacts-view">

        <LoadingComponent v-if="generalStore.isLoading" />
        <ErrorComponent v-else-if="generalStore.errorMessage" :message="generalStore.errorMessage" />
        <template v-else>

            <h2 class="contacts-view__title">{{ $t('pages.contacts.title') }}</h2>

            <div class="contacts-view__info">
                <div class="info-item">
                    <strong>{{ $t('pages.contacts.address') }}: </strong>
                    <p>Проспект Лісовий 23-Б, Київ</p>
                </div>
                <div class="info-item">
                    <strong>{{ $t('pages.contacts.phones') }}: </strong>
                    <a href="tel:+380631913461">(063) 191-34-61</a>
                    <a href="tel:+380506739644">(050) 673-96-44</a>
                </div>
                <div class="info-item"><strong>{{ $t('pages.contacts.workSchedule') }}: </strong>
                    <p>09:00 - 20:00</p>
                </div>
            </div>

            <!-- Google Map з маркером -->
            <div class="contacts-view__map">
                <iframe :title="$t('pages.contacts.mapTitle')"
                    src="https://www.google.com/maps?q=Проспект+Лісовий+23-Б,+Київ&output=embed" width="100%" height="400"
                    style="border:0;" allowfullscreen="" loading="lazy">
                </iframe>
            </div>
        </template>
    </section>
</template>
  
<script setup>
import LoadingComponent from '@/components/LoadingComponent.vue'
import ErrorComponent from '@/components/ErrorComponent.vue'
import { useGeneralStore } from '@/stores/general'

const generalStore = useGeneralStore()

</script>
  
<style lang="scss" scoped>
.contacts-view {
    padding: 2rem;
    text-align: center;

    &__title {
        font-size: 2rem;
        margin-bottom: 1.5rem;
    }

    &__info {
        display: flex;
        flex-direction: column;
        row-gap: .8rem;
        margin-bottom: 2rem;
        font-size: 1.2rem;
        padding: 15px;
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 8px 20px #31313114;

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }


        p {
            color: #d7c7c7;
        }

        a {
            color: #d7c7c7;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    &__map {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
}
</style>
  