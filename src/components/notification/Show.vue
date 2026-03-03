<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps<{
  show: boolean
  notificationData: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Ref del modal
const modalRef = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

// Formulario de solo lectura
const form = ref({
  type_notification_name: '',
  title: '',
  message: '',
  client_name: '',
  cities_names: [] as string[],
})

// Variables para condicionales
const showClientSearch = computed(() => {
  return (
    props.notificationData?.id_type_notification === 2 ||
    props.notificationData?.type_notification?.id === 2
  )
})

const showCitySelect = computed(() => {
  return (
    props.notificationData?.id_type_notification === 3 ||
    props.notificationData?.type_notification?.id === 3
  )
})

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

// Cargar datos de la notificación cuando se abre el modal
const loadNotificationData = () => {
  if (props.notificationData) {
    form.value.type_notification_name =
      props.notificationData.type_notification?.name || 'No especificado'
    form.value.title = props.notificationData.title || ''
    form.value.message = props.notificationData.message || ''

    if (showClientSearch.value && props.notificationData.client) {
      form.value.client_name = props.notificationData.client.full_name || 'No especificado'
    } else {
      form.value.client_name = ''
    }

    if (showCitySelect.value && props.notificationData.cities) {
      form.value.cities_names = props.notificationData.cities.map((c: any) => c.name)
    } else {
      form.value.cities_names = []
    }
  }
}

// Controlar apertura/cierre del modal
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      loadNotificationData()
      modalInstance?.show()
    } else {
      modalInstance?.hide()
    }
  },
)

// Volver a cargar los datos si cambia la notificación seleccionada mientras el modal está abierto
watch(
  () => props.notificationData,
  () => {
    if (props.show) {
      loadNotificationData()
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
    aria-labelledby="modalShowNotificationLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-primary text-white border-0 py-3">
          <h5 class="modal-title fw-semibold" id="modalShowNotificationLabel">
            <i class="bi bi-eye-fill me-2"></i>
            Detalles de Notificación
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <div class="row g-4">
            <!-- Selector de Tipo de Notificación -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-tag-fill me-1 text-primary"></i>
                Tipo de notificación
              </label>
              <input
                type="text"
                class="form-control bg-light text-muted border-radius-left border-radius-right"
                v-model="form.type_notification_name"
                disabled
              />
            </div>

            <!-- Client Search Section (id:2) -->
            <div v-if="showClientSearch" class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-person-fill me-1 text-primary"></i>
                Cliente seleccionado
              </label>
              <input
                type="text"
                class="form-control bg-light text-muted border-radius-left border-radius-right"
                v-model="form.client_name"
                disabled
              />
            </div>

            <!-- City Selection (id:3) -->
            <div v-if="showCitySelect" class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-building me-1 text-primary"></i>
                Ciudades seleccionadas
              </label>
              <div class="d-flex flex-wrap gap-2">
                <span
                  v-for="(city, index) in form.cities_names"
                  :key="index"
                  class="badge bg-secondary"
                >
                  {{ city }}
                </span>
                <span v-if="form.cities_names.length === 0" class="text-muted"
                  >Ninguna ciudad seleccionada</span
                >
              </div>
            </div>

            <!-- Título -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-fonts me-1 text-primary"></i>
                Título
              </label>
              <input
                type="text"
                class="form-control bg-light text-muted border-radius-left border-radius-right"
                v-model="form.title"
                disabled
              />
            </div>

            <!-- Mensaje -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-chat-left-text-fill me-1 text-primary"></i>
                Mensaje
              </label>
              <textarea
                class="form-control bg-light text-muted rounded-4"
                v-model="form.message"
                rows="4"
                disabled
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 py-3">
          <button class="btn btn-secondary rounded-pill px-4" @click="closeModal">Cerrar</button>
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
