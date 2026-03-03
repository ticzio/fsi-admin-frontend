<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { Modal } from 'bootstrap'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { useMasters } from '@/composables/Masters/useMasters'

import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'

const props = defineProps<{
  show: boolean
  notificationData: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()
const logger = useLogger()
const { updateIconMaps, clearIconMaps } = useMultiselectIcons()

// Masters composable para cities
const { cities, customIconMapCity, customDescriptionMapCity, getCities } = useMasters()

// Ref del modal
const modalRef = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

// Estados
const isUpdating = ref(false)
const isSearchingClients = ref(false)

// Datos del maestro
const typeNotifications = ref<any[]>([])

// Mapas para multiselect de tipos de notificación
const customIconMapTypeNotifications = ref<Record<string, string>>({})
const customDescriptionMapTypeNotifications = ref<Record<string, string>>({})

// Client search
const searchQuery = ref('')
const clients = ref<any[]>([])
const selectedClient = ref<any>(null)
const customIconMapClient = ref<Record<string, string>>({})
const customDescriptionMapClient = ref<Record<string, string>>({})

// City selection for id:3
const selectedCities = ref<any[]>([])

// Formulario
const form = ref({
  id_type_notification: null as any,
  title: '',
  message: '',
})

// Computed properties for conditional display
const showTitleAndMessage = computed(() => {
  return form.value.id_type_notification !== null
})

const showClientSearch = computed(() => {
  return form.value.id_type_notification?.id === 2
})

const showCitySelect = computed(() => {
  return form.value.id_type_notification?.id === 3
})

// Obtener tipos de notificación (maestro)
const getTypeNotifications = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeNotification.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.typeNotification.getAll, {}, response)
      typeNotifications.value = response.data?.data || response.data || []
      // Actualizar mapas de iconos y descripciones
      clearIconMaps(customIconMapTypeNotifications, customDescriptionMapTypeNotifications)
      updateIconMaps(
        customIconMapTypeNotifications,
        customDescriptionMapTypeNotifications,
        typeNotifications.value,
        ICONS_MULTISELECT.notification,
        { dataKey: 'name', descriptionPrefix: 'Tipo de notificación:' },
      )
    }
  } catch (error: any) {
    logger.logRequest(URLS.typeNotification.getAll, {}, error)
  }
}

// Buscar clientes por Cédula o nombre
const searchClients = async () => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    swalToast.showError('Debes ingresar una cédula o nombre para buscar')
    return
  }

  isSearchingClients.value = true
  try {
    const response = await store.dispatch('getData', {
      url: URLS.client.getAll,
      params: {
        query: searchQuery.value.trim(),
      },
    })

    if (response.code === 200) {
      logger.logRequest(URLS.client.getAll, { query: searchQuery.value.trim() }, response)
      const clientsData = response.data?.data || response.data || []

      if (clientsData.length === 0) {
        swalToast.showError('No se encontraron clientes')
        clients.value = []
        return
      }

      // El backend ya devuelve full_name, solo asignamos directamente
      clients.value = clientsData

      // Actualizar mapas de iconos y descripciones para clientes usando full_name como key
      clearIconMaps(customIconMapClient, customDescriptionMapClient)
      const iconMap: Record<string, string> = {}
      const descriptionMap: Record<string, string> = {}

      clients.value.forEach((client: any) => {
        iconMap[client.full_name] = 'bi bi-person-fill'
        descriptionMap[client.full_name] = `Cédula: ${client.dni || 'N/A'}`
      })

      Object.assign(customIconMapClient.value, iconMap)
      Object.assign(customDescriptionMapClient.value, descriptionMap)

      // Debug logs
      console.log('Clients loaded:', clients.value)
      console.log('Icon Map:', customIconMapClient.value)
      console.log('Description Map:', customDescriptionMapClient.value)
    }
  } catch (error: any) {
    logger.logRequest(URLS.client.getAll, { query: searchQuery.value.trim() }, error)
    swalToast.showError(`${ERROR.errorGet} clientes`)
    clients.value = []
  } finally {
    isSearchingClients.value = false
  }
}

// Actualizar notificación
const updateNotification = async () => {
  // Validaciones
  if (!form.value.id_type_notification) {
    swalToast.showError('Debes seleccionar un tipo de notificación')
    return
  }

  // Validación específica para tipo de notificación con id:2 (cliente)
  if (form.value.id_type_notification.id === 2 && !selectedClient.value) {
    swalToast.showError('Debes seleccionar un cliente')
    return
  }

  // Validación específica para tipo de notificación con id:3 (ciudades)
  if (form.value.id_type_notification.id === 3 && selectedCities.value.length === 0) {
    swalToast.showError('Debes seleccionar al menos una ciudad')
    return
  }

  if (!form.value.title || form.value.title.trim() === '') {
    swalToast.showError('Debes ingresar un título')
    return
  }
  if (!form.value.message || form.value.message.trim() === '') {
    swalToast.showError('Debes ingresar un mensaje')
    return
  }

  isUpdating.value = true
  try {
    const payload: any = {
      id_type_notification: form.value.id_type_notification.id,
      title: form.value.title.trim(),
      message: form.value.message.trim(),
    }

    // Agregar id_client si el tipo de notificación es 2
    if (form.value.id_type_notification.id === 2 && selectedClient.value) {
      payload.id_client = selectedClient.value.id
    }

    // Agregar id_cities si el tipo de notificación es 3
    if (form.value.id_type_notification.id === 3 && selectedCities.value.length > 0) {
      payload.id_cities = selectedCities.value.map((city: any) => city.id)
    }

    const response = await store.dispatch('updateData', {
      url: URLS.notification.update,
      id: props.notificationData?.id,
      data: payload,
    })

    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.notification.update, payload, response)
      swal.showSuccess('Notificación actualizada exitosamente')
      resetForm()
      emit('saved')
      emit('close')
    }
  } catch (error: any) {
    logger.logRequest(URLS.notification.update, { id: props.notificationData?.id }, error)
    swalToast.showError(`${ERROR.errorUpdate} notificación`)
  } finally {
    isUpdating.value = false
  }
}

// Resetear formulario
const resetForm = () => {
  form.value = {
    id_type_notification: null,
    title: '',
    message: '',
  }
  searchQuery.value = ''
  clients.value = []
  selectedClient.value = null
  selectedCities.value = []
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

// Cargar datos de la notificación cuando se abre el modal
const loadNotificationData = async () => {
  if (props.notificationData) {
    // Buscar el tipo de notificación en la lista
    form.value.id_type_notification =
      typeNotifications.value.find(
        (t: any) =>
          t.id === props.notificationData.id_type_notification ||
          t.id === props.notificationData.type_notification?.id,
      ) || null

    form.value.title = props.notificationData.title || ''
    form.value.message = props.notificationData.message || ''

    // Cargar cliente si existe (id:2)
    if (form.value.id_type_notification?.id === 2 && props.notificationData.client) {
      const client = props.notificationData.client
      // El backend ya devuelve full_name
      clients.value = [client]
      selectedClient.value = client

      // Actualizar mapas de iconos para el cliente usando full_name como key
      customIconMapClient.value[client.full_name] = 'bi bi-person-fill'
      customDescriptionMapClient.value[client.full_name] = `Cédula: ${client.dni || 'N/A'}`
    }

    // Cargar ciudades si existen (id:3)
    if (form.value.id_type_notification?.id === 3 && props.notificationData.cities) {
      if (cities.value.length === 0) {
        await getCities()
      }
      selectedCities.value = props.notificationData.cities
    }
  }
}

// Controlar apertura/cierre del modal
watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      if (typeNotifications.value.length === 0) {
        await getTypeNotifications()
      }
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

// Cargar ciudades cuando se selecciona el tipo de notificación con id:3
watch(
  () => form.value.id_type_notification,
  async (newVal) => {
    if (newVal?.id === 3 && cities.value.length === 0) {
      await getCities()
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
    aria-labelledby="modalEditNotificationLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-primary text-white border-0 py-3">
          <h5 class="modal-title fw-semibold" id="modalEditNotificationLabel">
            <i class="bi bi-pencil-square me-2"></i>
            Editar Notificación
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
            <!-- Selector de Tipo de Notificación -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-tag-fill me-1 text-primary"></i>
                Tipo de notificación <span class="text-danger">*</span>
              </label>
              <MultiselectCustom
                v-model="form.id_type_notification"
                :options="typeNotifications"
                label="name"
                track-by="id"
                placeholder="Seleccionar tipo de notificación"
                helper-type="custom"
                :custom-icon-map="customIconMapTypeNotifications"
                :custom-description-map="customDescriptionMapTypeNotifications"
              />
            </div>

            <!-- Client Search Section (id:2) -->
            <div v-if="showClientSearch" class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-search me-1 text-primary"></i>
                Buscar cliente <span class="text-danger">*</span>
              </label>
              <div class="row g-2">
                <!-- Search Input -->
                <div class="col-md-5">
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      v-model="searchQuery"
                      placeholder="Buscar por cédula o nombre"
                      @keyup.enter="searchClients"
                    />
                    <button
                      class="btn btn-primary"
                      type="button"
                      @click="searchClients"
                      :disabled="isSearchingClients"
                    >
                      <i :class="isSearchingClients ? 'bi bi-hourglass-split' : 'bi bi-search'"></i>
                    </button>
                  </div>
                </div>

                <!-- Client Multiselect -->
                <div class="col-md-7">
                  <MultiselectCustom
                    v-if="clients.length > 0"
                    v-model="selectedClient"
                    :options="clients"
                    label="full_name"
                    track-by="id"
                    placeholder="Seleccionar cliente"
                    helper-type="custom"
                    :custom-icon-map="customIconMapClient"
                    :custom-description-map="customDescriptionMapClient"
                  />
                  <div
                    v-else
                    class="form-control bg-light text-muted"
                    style="height: 40px; display: flex; align-items: center"
                  >
                    Realiza una búsqueda para seleccionar un cliente
                  </div>
                </div>
              </div>
            </div>

            <!-- City Selection (id:3) -->
            <div v-if="showCitySelect" class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-building me-1 text-primary"></i>
                Ciudades <span class="text-danger">*</span>
              </label>
              <MultiselectCustom
                v-model="selectedCities"
                :options="cities"
                label="name"
                track-by="id"
                placeholder="Seleccionar ciudades"
                helper-type="custom"
                :multiple="true"
                :custom-icon-map="customIconMapCity"
                :custom-description-map="customDescriptionMapCity"
              />
            </div>

            <!-- Título -->
            <div v-if="showTitleAndMessage" class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-fonts me-1 text-primary"></i>
                Título <span class="text-danger">*</span>
              </label>
              <input
                type="text"
                class="form-control border-radius-left border-radius-right"
                v-model="form.title"
                placeholder="Ingrese el título de la notificación"
              />
            </div>

            <!-- Mensaje -->
            <div v-if="showTitleAndMessage" class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-chat-left-text-fill me-1 text-primary"></i>
                Mensaje <span class="text-danger">*</span>
              </label>
              <textarea
                class="form-control rounded-4"
                v-model="form.message"
                placeholder="Ingrese el mensaje de la notificación"
                rows="4"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 py-3">
          <button
            class="btn btn-primary rounded-pill px-4"
            @click="updateNotification"
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

<style>
/* Fix z-index and overflow for multiselect dropdown in modal - MUST BE UNSCOPED */
.modal-body {
  overflow: visible !important;
}

.modal-content {
  overflow: visible !important;
}

.multiselect__content-wrapper {
  z-index: 10000 !important;
  position: absolute !important;
}

.multiselect__content {
  z-index: 10000 !important;
}
</style>
