<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'

import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

const props = defineProps<{
  show: boolean
  idConcessionaire: string
  serviceData: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()

// Ref del modal
const modalRef = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

// Estados
const isUpdating = ref(false)

// Datos del maestro
const typeServices = ref<any[]>([])

// Formulario
const form = ref({
  id_service_type: null as any,
  is_available: true,
  value_points: 0,
})

// Obtener tipos de servicio (maestro)
const getTypeServices = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeService.getAll,
    })
    if (response.code === 200) {
      typeServices.value = response.data?.data || response.data || []
    }
  } catch (error: any) {
    console.error('Error al obtener tipos de servicio:', error)
  }
}

// Actualizar servicio
const updateService = async () => {
  // Validaciones
  if (!form.value.id_service_type) {
    swalToast.showError('Debes seleccionar un tipo de servicio')
    return
  }
  if (!form.value.value_points || form.value.value_points <= 0) {
    swalToast.showError('El valor en Kilómetros de beneficios debe ser mayor a 0')
    return
  }

  isUpdating.value = true
  try {
    const payload = {
      id_concessionaire: props.idConcessionaire,
      id_service_type: form.value.id_service_type.id,
      is_available: form.value.is_available ? 1 : 0,
      value_points: Math.trunc(form.value.value_points),
    }

    const response = await store.dispatch('updateData', {
      url: URLS.concessionaireService.update,
      id: props.serviceData?.id,
      data: payload,
    })

    if (response.code === 200 || response.code === 201) {
      swal.showSuccess('Servicio actualizado exitosamente')
      resetForm()
      emit('saved')
      emit('close')
    }
  } catch (error: any) {
    console.error('Error al actualizar servicio:', error)
    swalToast.showError(`${ERROR.errorUpdate} servicio`)
  } finally {
    isUpdating.value = false
  }
}

// Resetear formulario
const resetForm = () => {
  form.value = {
    id_service_type: null,
    is_available: true,
    value_points: 0,
  }
}

// Cerrar modal
const closeModal = () => {
  if (modalInstance) {
    modalInstance.hide()
  }
}

// Inicializar modal de Bootstrap
onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value, {
      backdrop: 'static',
      keyboard: false,
    })

    // Escuchar evento de cierre del modal
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      resetForm()
      emit('close')
    })
  }
})

// Limpiar al desmontar
onBeforeUnmount(() => {
  if (modalInstance) {
    modalInstance.dispose()
  }
})

// Cargar datos del servicio cuando se abre el modal
const loadServiceData = () => {
  if (props.serviceData) {
    // Buscar el tipo de servicio en la lista
    form.value.id_service_type =
      typeServices.value.find(
        (s: any) =>
          s.id === props.serviceData.id_service_type || s.id === props.serviceData.type_service?.id,
      ) || null

    form.value.is_available = Boolean(props.serviceData.is_available)
    form.value.value_points = Math.trunc(Number(props.serviceData.value_points) || 0)
  }
}

// Controlar apertura/cierre del modal
watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      if (typeServices.value.length === 0) {
        await getTypeServices()
      }
      loadServiceData()
      modalInstance?.show()
    } else {
      modalInstance?.hide()
    }
  },
)
</script>

<template>
  <!-- Modal Bootstrap -->
  <div
    ref="modalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="modalEditServiceLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-primary text-white border-0 py-3">
          <h5 class="modal-title fw-semibold" id="modalEditServiceLabel">
            <i class="bi bi-pencil-square me-2"></i>
            Editar Servicio
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="closeModal"
            :disabled="isUpdating"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <div class="row g-4">
            <!-- Selector de Tipo de Servicio -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-tools me-1 text-primary"></i>
                Tipo de servicio <span class="text-danger">*</span>
              </label>
              <MultiselectCustom
                v-model="form.id_service_type"
                :options="typeServices"
                label="name"
                track-by="id"
                placeholder="Seleccionar tipo de servicio"
              />
            </div>

            <!-- Valor en Kilómetros de beneficios -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-star-fill me-1 text-primary"></i>
                Valor en Kilómetros de beneficios
              </label>
              <input
                type="number"
                class="form-control border-radius-left border-radius-right"
                v-model.number="form.value_points"
                placeholder="Ingrese el valor en Kilómetros de beneficios"
                min="1"
                step="1"
                @input="form.value_points = Math.trunc(form.value_points)"
              />
            </div>

            <!-- Disponible -->
            <div class="col-12">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="isAvailableSwitchEdit"
                  v-model="form.is_available"
                />
                <label class="form-check-label fw-semibold" for="isAvailableSwitchEdit">
                  <i class="bi bi-check-circle me-1 text-success"></i>
                  Disponible
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 py-3">
          <button
            class="btn btn-primary rounded-pill px-4"
            @click="updateService"
            :disabled="isUpdating"
          >
            <i :class="isUpdating ? 'bi bi-hourglass-split' : 'bi bi-check-lg'"></i>
            <span class="ms-1">{{ isUpdating ? 'Actualizando...' : 'Actualizar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  border-radius: 1rem !important;
}

.modal-header {
  border-top-left-radius: 1rem !important;
  border-top-right-radius: 1rem !important;
}
</style>
