<template>
    <DateStep :selected-master="{ id: masterId }" :isForMaster="true" @date-selected="onDateSelected"
        @appointment-selected="onAppointmentSelected" />
</template>
  
<script setup>
import { defineProps, defineEmits } from 'vue'
import DateStep from '@/components/Booking/DateStep.vue'

const props = defineProps({
    masterId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['date-selected', 'appointment-selected'])

function onDateSelected(date) {
    emit('date-selected', date)
}
function onAppointmentSelected(appt) {
    emit('appointment-selected', appt)
}
</script>
  

<style lang="scss" scoped></style>