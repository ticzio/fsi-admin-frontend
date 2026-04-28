<template>
  <div class="h-100 p-3 bg-white rounded-3 shadow-sm border d-flex flex-column">
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 rounded-3 mb-4 gap-3"
    >
      <DateTimeBadges :createdAt="pharmacy?.created_at" :updatedAt="pharmacy?.updated_at" />
      <div class="d-flex flex-column align-items-end">
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-primary rounded-3 position-relative"
            :disabled="loading"
            @click="handleOpenModal"
          >
            <i class="bi bi-calendar-event me-2"></i>
            <span class="d-none d-md-inline">Agregar Horarios</span>
            <span class="d-md-none">Horarios</span>
            <span
              v-if="!hasSchedule"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            >
              !
            </span>
          </button>
          <button
            type="button"
            :class="BUTTONS.delete.class"
            :disabled="loading"
            @click="handleDelete"
          >
            <i :class="BUTTONS.delete.icon"></i>
            <span class="d-none d-md-inline">{{ BUTTONS.delete.title }}</span>
            <span class="d-md-none">Eliminar</span>
          </button>
        </div>
        <div v-if="!hasSchedule" class="text-danger mt-2 small fw-bold">
          <i class="bi bi-exclamation-triangle me-1"></i>
          Esta farmacia no tiene ningún horario cargado
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSave" class="flex-grow-1">
      <GeneralInfoStep :form="form" />
      <div :class="['d-flex justify-content-end gap-2 mt-4', { 'sticky-bottom': isMobile }]">
        <button type="submit" :class="BUTTONS.save.class" :disabled="loading || !isFormValid">
          <LoadingSpinner v-if="loading" />
          <i v-else :class="BUTTONS.save.icon"></i>
          {{ BUTTONS.save.title }}
        </button>
      </div>
    </form>

    <!-- Modal para gestionar horarios -->
    <Modal id="scheduleModal" ref="modalRef" title="Gestionar Horarios" size="lg">
      <ScheduleStep :form="form" />
      <template #footer>
        <button type="button" class="btn btn-outline-secondary rounded-3" data-bs-dismiss="modal">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-dark rounded-3"
          :disabled="loading || !isFormValid"
          @click="handleSaveSchedule"
        >
          <LoadingSpinner v-if="loading" class="me-2" />

          <i v-else class="bi bi-save me-2"></i>
          Guardar Horarios
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePharmacy } from '@/composables/Models/usePharmacy'
import { BUTTONS } from '@/const/buttonConst'
import GeneralInfoStep from '@/components/Pharmacies/GeneralInfoStep.vue'
import ScheduleStep from '@/components/Pharmacies/ScheduleStep.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
import Modal from '@/components/common/Modal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { provideFormValidation } from '@/composables/useFormValidation'
import { useStore } from 'vuex'

const route = useRoute()
const router = useRouter()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const { getPharmacy, savePharmacy, savePharmacySchedule, deletePharmacy, pharmacy, loading } =
  usePharmacy()
const { isFormValid } = provideFormValidation()

const modalRef = ref<any>(null)

// Minimal state to satisfy the component props
const form = reactive({
  name: '',
  code: '',
  phone: '',
  id_type_city: null,
  description: '',
  ubication: '',
  url_google_map: '',
  url_image: '',
  lat: '',
  lon: '',
  url_instagram: '',
  url_whatsapp: '',
  opening_week: '',
  close_week: '',
  opening_saturday: '',
  close_saturday: '',
  opening_sunday: '',
  close_sunday: '',
})

const hasSchedule = computed(() => {
  return (
    form.opening_week ||
    form.close_week ||
    form.opening_saturday ||
    form.close_saturday ||
    form.opening_sunday ||
    form.close_sunday
  )
})


onMounted(async () => {

  const data = await getPharmacy(route.params.id_pharmacy as string)
  if (data) {
    Object.assign(form, data)
    if (data.type_city) {
      form.id_type_city = data.type_city
    }
  }
})

const handleSave = async () => {
  const success = await savePharmacy(form as any, true, route.params.id_pharmacy as string)
  if (success && pharmacy.value) {
    Object.assign(form, pharmacy.value)
    if (pharmacy.value.type_city) {
      form.id_type_city = pharmacy.value.type_city
    }
  }
}

const handleDelete = async () => {
  if (pharmacy.value) {
    const success = await deletePharmacy(pharmacy.value)
    if (success) {
      router.push('/pharmacy')
    }
  }
}

const handleOpenModal = () => {
  modalRef.value?.openModal()
}

const handleSaveSchedule = async () => {
  const success = await savePharmacySchedule(form, route.params.id_pharmacy as string)
  if (success) {
    if (pharmacy.value) {
      Object.assign(form, pharmacy.value)
    }
    modalRef.value?.closeModal()
  }
}
</script>
