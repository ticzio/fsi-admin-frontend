<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import { useDayScheduleModel } from '@/composables/useDayScheduleModel'

const props = defineProps<{
  modelValue: boolean
  concessionaireId?: string
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const { days, concessionaireSchedule, getDaySchedules, updateDaySchedule } = useDayScheduleModel()

const isLoading = ref(false)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSave = async () => {
  isLoading.value = true
  const code = await updateDaySchedule(props.concessionaireId)
  isLoading.value = false
  if (code === 200 || code === 201) {
    emit('saved')
    closeModal()
  }
}

watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      modalInstance?.show()
      // Cargar horarios al abrir el modal
      await getDaySchedules(props.concessionaireId)
    } else {
      modalInstance?.hide()
    }
  },
)

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
    modalElement.value.addEventListener('hidden.bs.modal', () => {
      emit('update:modelValue', false)
    })
  }
})
</script>

<template>
  <div class="modal fade" ref="modalElement" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold">
            <i class="bi bi-clock me-2 text-primary"></i>Gestión de Horarios
          </h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body pt-3">
          <p class="text-muted small mb-4">Configura los horarios de atención del concesionario.</p>

          <div class="container-fluid px-0">
            <div
              v-for="day in days"
              :key="day"
              class="row gx-2 pb-3 mb-2 align-items-center border-bottom"
            >
              <div class="col-4 text-start m-0 d-flex align-items-center">
                <label class="fw-bold">{{ day }}</label>
              </div>
              <div class="col-4">
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light border-0">De</span>
                  <input
                    v-model="concessionaireSchedule[day].open_time"
                    type="time"
                    class="form-control rounded-end"
                    placeholder="Hora inicio"
                  />
                </div>
              </div>
              <div class="col-4">
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light border-0">Hasta</span>
                  <input
                    v-model="concessionaireSchedule[day].close_time"
                    type="time"
                    class="form-control rounded-end"
                    placeholder="Hora fin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer border-top-0 pt-0">
          <button
            type="button"
            class="btn btn-primary rounded-pill px-4"
            @click="handleSave"
            :disabled="isLoading"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Guardar Horarios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ajustes para inputs de tipo time */
input[type='time'] {
  cursor: pointer;
}
</style>
