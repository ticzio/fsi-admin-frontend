<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import { useServiceHistoricalModel } from '@/composables/useServiceHistoricalModel'
import { useCookies } from '@/composables/useCookies'
import { useStore } from 'vuex'
import { URLS } from '@/const/api'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'saved'])

const store = useStore()
const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const { getCookie } = useCookies()
const idConcessionaire = computed(
  () => getCookie('changan_concessionaire_id_concessionaire') as string,
)

const { isLoading, serviceHistoricalForm, resetForm, saveServiceHistorical } =
  useServiceHistoricalModel()

// ── Client DNI search ─────────────────────────────────────────────────────────
const dniInput = ref('')
const isSearching = ref(false)
const searchError = ref('')
const foundClients = ref<any[]>([]) // lista de clientes únicos encontrados
const selectedClient = ref<any>(null) // cliente seleccionado del multiselect
const clientVehicles = ref<any[]>([]) // vehículos del cliente seleccionado
const selectedVehicle = ref<any>(null)
const allRecords = ref<any[]>([]) // todos los registros crudos de clientVehicle

// ── Concessionaire services ───────────────────────────────────────────────────
const concessionaireServices = ref<any[]>([])
const selectedService = ref<any>(null)

const fetchConcessionaireServices = async () => {
  if (!idConcessionaire.value) return
  try {
    const response = await store.dispatch('getData', {
      url: URLS.concessionaireService.getAll,
      params: { id_concessionaire: idConcessionaire.value },
    })
    if (response.code === 200) {
      const raw = response.data?.data ?? response.data ?? []
      concessionaireServices.value = raw.map((s: any) => ({
        ...s,
        name: s.service_type?.name,
      }))
    }
  } catch (e) {
    console.error('Error al cargar servicios del concesionario', e)
  }
}

const searchClient = async () => {
  const dni = dniInput.value.trim()
  if (!dni) return

  isSearching.value = true
  searchError.value = ''
  foundClients.value = []
  selectedClient.value = null
  clientVehicles.value = []
  selectedVehicle.value = null
  allRecords.value = []
  serviceHistoricalForm.value.id_client = null
  serviceHistoricalForm.value.id_client_vehicle = null

  try {
    const response = await store.dispatch('getData', {
      url: URLS.clientVehicle.getAll,
      params: { query: dni, active: null },
    })

    if (response.code === 200) {
      const records: any[] = response.data?.data ?? response.data ?? []
      if (records.length === 0) {
        searchError.value = 'No se encontró ningún cliente con esa búsqueda.'
        return
      }

      // Guardar todos los registros para filtrar luego por cliente
      allRecords.value = records

      // Deduplicar clientes por id_client
      const seen = new Set<number>()
      foundClients.value = records
        .filter((cv: any) => {
          if (seen.has(cv.id_client)) return false
          seen.add(cv.id_client)
          return true
        })
        .map((cv: any) => ({
          ...cv.client,
          id_client: cv.id_client,
          full_label:
            `${cv.client?.first_name ?? ''} ${cv.client?.last_name ?? ''} – C.I. ${cv.client?.dni ?? ''}`.trim(),
        }))

      // Si solo hay un cliente, seleccionarlo automáticamente
      if (foundClients.value.length === 1) {
        selectFoundClient(foundClients.value[0])
      }
    } else {
      searchError.value = 'Error al buscar el cliente.'
    }
  } catch (e) {
    console.error(e)
    searchError.value = 'Ocurrió un error al buscar el cliente.'
  } finally {
    isSearching.value = false
  }
}

// Cuando el usuario elige un cliente del multiselect
const selectFoundClient = (client: any) => {
  selectedClient.value = client
  selectedVehicle.value = null
  serviceHistoricalForm.value.id_client = client.id_client
  serviceHistoricalForm.value.id_client_vehicle = null

  // Filtrar vehículos del cliente seleccionado
  clientVehicles.value = allRecords.value
    .filter((cv: any) => cv.id_client === client.id_client)
    .map((cv: any) => ({
      ...cv,
      vehicle_label: cv.vehicle?.license_plate
        ? `${cv.vehicle.license_plate}${cv.vehicle.vehicle_model?.name ? ' – ' + cv.vehicle.vehicle_model.name : ''}`
        : `Vehículo #${cv.id}`,
    }))
}

// Watch para sincronizar cuando el multiselect cambia
watch(selectedClient, (val) => {
  if (val) selectFoundClient(val)
  else {
    clientVehicles.value = []
    selectedVehicle.value = null
    serviceHistoricalForm.value.id_client = null
    serviceHistoricalForm.value.id_client_vehicle = null
  }
})

// Select vehicle card
const selectVehicle = (cv: any) => {
  selectedVehicle.value = cv
  serviceHistoricalForm.value.id_client_vehicle = cv.id
}

// Sync service selection
watch(selectedService, (val) => {
  serviceHistoricalForm.value.id_service_concessionaire = val ? val.id : null
  // Auto-rellenar kilómetros de beneficios desde el servicio seleccionado
  serviceHistoricalForm.value.points_awarded = val
    ? String(Math.trunc(Number(val.value_points)))
    : ''
})

// ── Modal lifecycle ───────────────────────────────────────────────────────────
const resetClientSearch = () => {
  dniInput.value = ''
  searchError.value = ''
  foundClients.value = []
  selectedClient.value = null
  clientVehicles.value = []
  selectedVehicle.value = null
  selectedService.value = null
  allRecords.value = []
}

const closeModal = () => {
  emit('close')
}

const handleSave = async () => {
  if (!serviceHistoricalForm.value.id_concessionaire && idConcessionaire.value) {
    serviceHistoricalForm.value.id_concessionaire = Number(idConcessionaire.value)
  }
  // id_appointment siempre es 0 desde este modal
  serviceHistoricalForm.value.id_appointment = 0

  // Forzar entero en Kilómetros de beneficios
  if (serviceHistoricalForm.value.points_awarded !== '') {
    serviceHistoricalForm.value.points_awarded = String(
      Math.trunc(Number(serviceHistoricalForm.value.points_awarded)),
    )
  }

  const code = await saveServiceHistorical()
  if (code === 200 || code === 201) {
    emit('saved')
    closeModal()
  }
}

watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      resetForm()
      resetClientSearch()
      // Asignar fecha de hoy automáticamente
      serviceHistoricalForm.value.service_date = new Date().toISOString().split('T')[0]
      if (idConcessionaire.value) {
        serviceHistoricalForm.value.id_concessionaire = Number(idConcessionaire.value)
      }
      await fetchConcessionaireServices()
      modalInstance?.show()
    } else {
      modalInstance?.hide()
    }
  },
)

onMounted(async () => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
    modalElement.value.addEventListener('hidden.bs.modal', () => {
      emit('close')
    })
  }
  await fetchConcessionaireServices()
})
</script>

<template>
  <div
    class="modal fade"
    ref="modalElement"
    tabindex="-1"
    aria-hidden="true"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold">
            <i class="bi bi-tools me-2 text-primary"></i>Registrar un Servicio en el Historial
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
            :disabled="isLoading"
          ></button>
        </div>

        <div class="modal-body pt-3">
          <p class="text-muted small mb-2">
            Ingresa los datos para registrar un servicio en el historial.
          </p>

          <form @submit.prevent="handleSave" class="row g-3">
            <!-- Búsqueda por cédula + Multiselect de clientes (misma fila) ─── -->
            <div class="col-12">
              <label class="form-label fw-bold small">Buscar cliente *</label>
              <div class="row g-2 align-items-start">
                <!-- Input de búsqueda -->
                <div class="col-md-5">
                  <div class="input-group">
                    <input
                      v-model="dniInput"
                      type="text"
                      class="form-control"
                      placeholder="Cédula o nombre"
                      @keyup.enter="searchClient"
                      :disabled="isSearching"
                    />
                    <button
                      type="button"
                      class="btn btn-primary"
                      @click="searchClient"
                      :disabled="isSearching || !dniInput.trim()"
                    >
                      <span
                        v-if="isSearching"
                        class="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <i v-else class="bi bi-search"></i>
                    </button>
                  </div>
                </div>

                <!-- Multiselect de clientes encontrados -->
                <div class="col-md-7">
                  <MultiselectCustom
                    v-if="foundClients.length > 0"
                    v-model="selectedClient"
                    :options="foundClients"
                    label="full_label"
                    label-key="full_label"
                    track-by="id_client"
                    placeholder="Seleccionar cliente"
                    helper-type="custom"
                    :show-icons="false"
                  />
                  <div
                    v-else
                    class="form-control bg-light text-muted d-flex align-items-center"
                    style="height: 40px"
                  >
                    <i class="bi bi-person me-2"></i>
                    <span class="small">Realiza una búsqueda para ver los clientes</span>
                  </div>
                </div>
              </div>

              <p v-if="searchError" class="text-danger small mt-1 mb-0">
                <i class="bi bi-exclamation-circle me-1"></i>{{ searchError }}
              </p>
            </div>

            <!-- Servicio del concesionario ───────────────────────────────── -->
            <div class="col-12">
              <label class="form-label fw-bold small">Tipo de Servicio *</label>
              <MultiselectCustom
                v-model="selectedService"
                :options="concessionaireServices"
                placeholder="Seleccionar servicio"
                label-key="name"
                track-by="id"
                :show-icons="true"
                :show-descriptions="false"
                helper-type="custom"
                :custom-default-icon="ICONS_MULTISELECT.services"
              />
            </div>

            <!-- Vehículo del cliente ─────────────────────────────────────── -->
            <div v-if="selectedClient" class="col-12">
              <label class="form-label fw-bold small">Vehículo *</label>

              <!-- Sin vehículos -->
              <div v-if="clientVehicles.length === 0" class="vehicle-card vehicle-card--empty">
                <i class="bi bi-car-front fs-3 text-muted mb-2"></i>
                <p class="mb-0 text-muted small">Este cliente no tiene vehículos registrados.</p>
              </div>

              <!-- Cards de vehículos -->
              <div v-else class="d-flex flex-wrap gap-2">
                <div
                  v-for="cv in clientVehicles"
                  :key="cv.id"
                  class="vehicle-card"
                  :class="{ 'vehicle-card--selected': selectedVehicle?.id === cv.id }"
                  @click="selectVehicle(cv)"
                >
                  <!-- Imagen del vehículo -->
                  <div class="vehicle-card__img-wrap mb-2">
                    <img
                      v-if="cv.vehicle?.vehicle_model_image?.url_image"
                      :src="cv.vehicle.vehicle_model_image.url_image"
                      alt="Imagen del vehículo"
                      class="vehicle-card__img"
                    />
                    <div v-else class="vehicle-card__img-placeholder">
                      <i class="bi bi-car-front fs-2 text-muted"></i>
                    </div>
                  </div>

                  <!-- Encabezado: placa -->
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-car-front-fill text-primary fs-5"></i>
                    <span class="fw-bold fs-6">{{ cv.vehicle?.license_plate ?? 'Sin placa' }}</span>
                  </div>

                  <!-- VIN -->
                  <p v-if="cv.vehicle?.vin" class="mb-1 small text-muted">
                    <span class="fw-semibold text-body">VIN:</span> {{ cv.vehicle.vin }}
                  </p>

                  <!-- Combustible -->
                  <p v-if="cv.vehicle?.type_fuel" class="mb-1 small text-muted">
                    <i class="bi bi-fuel-pump me-1"></i>{{ cv.vehicle.type_fuel }}
                  </p>

                  <!-- Color -->
                  <div
                    v-if="cv.vehicle?.vehicle_model_image?.type_color"
                    class="d-flex align-items-center gap-1 small text-muted"
                  >
                    <span
                      class="color-swatch"
                      :style="{ background: cv.vehicle.vehicle_model_image.type_color.hex_color }"
                    ></span>
                    {{ cv.vehicle.vehicle_model_image.type_color.name }}
                  </div>

                  <div v-if="selectedVehicle?.id === cv.id" class="vehicle-card__check">
                    <i class="bi bi-check-circle-fill text-primary"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resto del formulario ─────────────────────────────────────── -->
            <div class="col-md-6">
              <label class="form-label fw-bold small">Kilometraje</label>
              <input
                v-model="serviceHistoricalForm.current_mileage"
                type="number"
                class="form-control"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold small">Kilómetros de beneficio Otorgados</label>
              <input
                v-model="serviceHistoricalForm.points_awarded"
                type="number"
                class="form-control"
                min="0"
                step="1"
                disabled
                :placeholder="selectedService ? '' : 'Se llenará al seleccionar un servicio'"
              />
            </div>

            <div class="col-12">
              <label class="form-label fw-bold small">Notas</label>
              <textarea
                v-model="serviceHistoricalForm.notes"
                class="form-control"
                rows="3"
              ></textarea>
            </div>
          </form>
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
            Confirmar servicio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vehicle-card {
  position: relative;
  flex: 1 1 180px;
  border: 2px solid #dee2e6;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  background: #fff;
}

.vehicle-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.vehicle-card--selected {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
  background: #f0f5ff;
}

.vehicle-card--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  cursor: default;
  background: #f8f9fa;
  border-style: dashed;
}

.vehicle-card--empty:hover {
  border-color: #dee2e6;
  box-shadow: none;
}

.vehicle-card__check {
  position: absolute;
  top: 0.4rem;
  right: 0.6rem;
  font-size: 1rem;
}

.color-swatch {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.vehicle-card__img-wrap {
  width: 100%;
  height: 150px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
}

.vehicle-card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.25rem;
}

.vehicle-card__img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
