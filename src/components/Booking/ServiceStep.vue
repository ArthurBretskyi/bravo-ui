<template>
  <section class="service-step">
    <h2 class="service-step__title">
      {{ $t('components.booking.chooseService') }}
    </h2>

    <LoadingComponent v-if="isLoading" />

    <ServicesListComponent v-else-if="services.length" :services="services" :selectedServiceId="selectedService?.id"
      mode="user" context="booking" @select="handleSelect" />
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useServicesStore } from '@/stores/services'
import ServicesListComponent from '@/components/ServicesListComponent.vue'
import LoadingComponent from '@/components/LoadingComponent.vue'

const emit = defineEmits(['selectService'])

const props = defineProps({
  selectedService: {
    type: Object,
    default: null,
  },
})

const servicesStore = useServicesStore()
const isLoading = ref(false)
const services = computed(() => servicesStore.getItemsList)

onMounted(async () => {
  isLoading.value = true
  await servicesStore.loadItemsList()
  isLoading.value = false
})

function handleSelect(service) {
  emit('selectService', service)
}
</script>


  
<style scoped lang="scss">
.service-step {
  padding: 2rem 1rem;

  &__title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }
}
</style>
  