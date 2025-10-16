<template>
    <section class="step-client-data">
        <div class="step-client-data__wrapper">
            <h2 class="step-client-data__title">{{ $t('components.booking.clientData.title') }}</h2>
            <form @submit.prevent="saveClient" class="step-client-data__form">
                <input v-model="firstName" :placeholder="$t('components.booking.clientData.Form.firstName')" required
                    class="step-client-data__input" />
                <input v-model="lastName" :placeholder="$t('components.booking.clientData.Form.lastName')"
                    class="step-client-data__input" />
                <input v-model="phone" :placeholder="$t('components.booking.clientData.Form.phone')" required
                    class="step-client-data__input" />
                <input v-model="email" :placeholder="$t('components.booking.clientData.Form.email')" type="email"
                    class="step-client-data__input" />
                <button type="submit" class="btn-primary">
                    {{ $t('buttons.continue') }}
                </button>
            </form>
        </div>
    </section>
</template>
  
<script setup>
import { ref } from 'vue'
const emit = defineEmits(['clientSaved'])

const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const email = ref('')

function saveClient() {
    emit('clientSaved', { firstName: firstName.value, lastName: lastName.value, phone: phone.value, email: email.value })
}
</script>

<style lang="scss" scoped>
.step-client-data {
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
        color: #000;
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

    .btn-primary {
        align-self: end;
    }

}
</style>