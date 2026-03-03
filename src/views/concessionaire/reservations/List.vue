<script setup lang="ts">
import { ref, computed, onMounted } from 'vue' // Changed to ref, computed, onMounted from 'vue' (no change) but ensure imports are correct

import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useLogger } from '@/composables/useLogger'
import CustomCalendar from '@/components/common/CustomCalendar.vue'
import type { IAppointment } from '@/interfaces/calendar'
import ReservationDetailModal from './ReservationDetailModal.vue'
import { URLS } from '@/const/api'
import { useCustomCalendarModel } from '@/composables/useCustomCalendarModel'

// Composables básico
const store = useStore()
const route = useRoute()
const router = useRouter()
const swalToast = useSwalToast()
const swal = useSwal()
const logger = useLogger()

const isMobile = computed(() => store.getters.isMobile)
const idConcessionaire = computed(() => route.params.id_concessionaire as string)

// Usar el composable del modelo
const {
  appointments,
  isLoading,
  initialCalendarDate,
  getAppointments,
  getAppointmentDetails,
  mapStatusToColor,
  getAppointmentById,
} = useCustomCalendarModel()

const showReservationModal = ref(false)
const selectedReservation = ref<IAppointment | null>(null)
const isCalendarLoading = ref(false) // New state for calendar only

const handleCalendarEditEvent = async (event: IAppointment) => {
  // 1. Mostrar modal inmediatamente con datos básicos
  selectedReservation.value = { ...event }
  showReservationModal.value = true

  // 2. Cargar detalles adicionales
  await getAppointmentDetails(selectedReservation.value)
}

const handleCancelReservation = async () => {
  if (!selectedReservation.value) return

  const result = await swal.showConfirm(
    '¿Estás seguro de cancelar la reservación?',
    'Esta acción cambiará el estado de la reservación a Cancelada.',
    {
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener',
    },
  )

  if (!result) return

  try {
    isLoading.value = true
    const payload = {
      id_appointment_status: 2, // Status 2 = Rechazada/Cancelada
    }

    const response = await store.dispatch('updateData', {
      url: 'appointment/reject_appointment',
      id: selectedReservation.value.id,
      data: payload,
    })

    if (response.code === 200 || response.code === 201) {
      logger.logRequest('appointment/reject_appointment', payload, response)
      swal.showSuccess('Reservación cancelada exitosamente')
      showReservationModal.value = false
      getAppointments(idConcessionaire.value)
    }
  } catch (error: any) {
    logger.logRequest('appointment/reject_appointment', selectedReservation.value, error)
    swalToast.showError('Error al cancelar la reservación')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    // 1. Cargar calendario en paralelo (sin bloquear el modal)
    const loadCalendar = async () => {
      if (idConcessionaire.value) {
        isCalendarLoading.value = true
        try {
          await getAppointments(idConcessionaire.value, false)
        } finally {
          isCalendarLoading.value = false
        }
      }
    }

    // 2. Gestionar apertura de modal (independiente del calendario)
    const loadModal = async () => {
      const appointmentId = route.query.appointment_id
      if (appointmentId) {
        // Usamos isLoading general para el modal si se desea, o manejamos uno local
        // Aquí usaremos isLoading del composable para que el spinner del modal (si lo usa) funcione,
        // o para bloquear la UI "globalmente" solo durante la carga inicial del modal, que es rápida.
        // Pero idealmente solo el modal debería mostrar carga.
        // Dado que el usuario quiere rapidez, evitamos isLoading global masivo.

        // No activamos isLoading global para que no bloquee toda la pantalla si hay un overlay global
        const appointment = await getAppointmentById(appointmentId as string, false)
        if (appointment) {
          selectedReservation.value = appointment
          // Mostramos el modal
          showReservationModal.value = true
          // Cargamos detalles ya con el modal abierto (si se quiere "instantáneo")
          // O esperamos detalles rápido (suele ser rápido).
          // Para "más rápido", cargamos detalles PERO mostramos modal.
          await getAppointmentDetails(appointment, false)
        }
      }
    }

    // Ejecutar ambos "hilos"
    await Promise.all([loadCalendar(), loadModal()])
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div class="container-fluid py-3">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-12">
        <CustomCalendar
          :events="appointments"
          :initial-date="initialCalendarDate"
          :loading="isCalendarLoading"
          @edit-event="handleCalendarEditEvent"
          @refresh-calendar="getAppointments(idConcessionaire)"
        />

        <ReservationDetailModal
          v-model="showReservationModal"
          :reservation="selectedReservation"
          :loading="isLoading"
          @cancel="handleCancelReservation"
          @close="showReservationModal = false"
          @update:id_appointment_status="
            selectedReservation = { ...selectedReservation!, id_appointment_status: $event }
          "
          @update:notes="selectedReservation = { ...selectedReservation!, notes: $event }"
        />
      </div>
    </div>
  </div>
</template>
