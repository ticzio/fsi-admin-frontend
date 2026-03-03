<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import { useCustomCalendarModel } from '@/composables/useCustomCalendarModel'
import type { IAppointment } from '@/interfaces/calendar'

// Composable para obtener detalles del appointment
const { getAppointmentDetails, isLoading: isLoadingDetails } = useCustomCalendarModel()

// Estado local para los datos enriquecidos del vehículo
const enrichedVehicleData = ref<{
  license_plate?: string
  type_fuel?: string
  vin?: string
  vehicle_model?: {
    name: string
    type_vehicle?: { name: string }
    brand?: { name: string }
  }
  type_transmission?: { name: string }
  type_engine?: { name: string }
  type_brake?: { name: string }
} | null>(null)

interface ServiceHistoricalData {
  id: number
  code: string
  id_client: number
  id_client_vehicle: number
  id_concessionaire: number
  id_appointment: number
  id_service_concessionaire: number
  id_user_validator: number | null
  service_date: string
  current_mileage: number
  notes: string
  invoice_number: string
  qr_code_scanned: string
  check_qr_readed: number
  points_awarded: string
  review: string
  active: number
  id_type_service_status: number | null
  created_at: string
  updated_at: string
  client?: {
    id: number
    code: string
    first_name: string
    last_name: string
    full_name: string
    email: string
    phone: string
    url_image: string | null
  }
  client_vehicle?: {
    id: number
    code: string
    current_mileage: number
    vehicle?: {
      id: number
      license_plate: string
      type_fuel: string
      vin: string
      vehicle_model?: {
        name: string
        type_vehicle?: { name: string }
        brand?: { name: string }
      }
      type_transmission?: { name: string }
      type_engine?: { name: string }
      type_brake?: { name: string }
    }
  }
  concessionaire?: {
    id: number
    code: string
    business_name: string
    trade_name: string
    rif: string
    address: string
    phone: string
    email: string
    url_logo: string | null
  }
  appointment?: {
    id: number
    id_client_vehicle?: number
    appointment_date: string
    notes: string
    mileage: number | null
    client_vehicle?: {
      id: number
      vehicle?: {
        id: number
        license_plate: string
        type_fuel: string
        vin: string
        vehicle_model?: {
          name: string
          type_vehicle?: { name: string }
          brand?: { name: string }
        }
        type_transmission?: { name: string }
        type_engine?: { name: string }
        type_brake?: { name: string }
      }
    }
  }
  service_concessionaire?: {
    id: number
    code: string
    id_concessionaire: number
    id_service_type: number
    is_available: number
    value_points: string
    active: number
    created_at: string
    updated_at: string
    service_type?: {
      id: number
      name: string
      description?: string
      duration?: number
    }
  }
}

const props = defineProps<{
  show: boolean
  serviceData: ServiceHistoricalData | null
}>()

const emit = defineEmits(['close'])

const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'No disponible'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const displayValue = (value: any, fallback: string = 'No disponible'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  return String(value)
}

const closeModal = (): void => {
  modalInstance?.hide()
  emit('close')
}

// Función para cargar los detalles enriquecidos del vehículo desde el appointment
const loadEnrichedVehicleData = async () => {
  if (!props.serviceData?.appointment) return

  // Crear un objeto IAppointment temporal para usar con getAppointmentDetails
  const appointmentForEnrichment: IAppointment = {
    id: props.serviceData.appointment.id,
    id_client: props.serviceData.id_client,
    id_client_vehicle:
      props.serviceData.appointment.id_client_vehicle || props.serviceData.id_client_vehicle,
    id_concessionaire: props.serviceData.id_concessionaire,
    id_service_concessionaire: props.serviceData.id_service_concessionaire,
    id_appointment_status: 1,
    appointment_date: props.serviceData.appointment.appointment_date,
    notes: props.serviceData.appointment.notes || '',
    date: props.serviceData.service_date,
    active: 1,
    created_at: props.serviceData.created_at,
    updated_at: props.serviceData.updated_at,
    service_concessionaire: props.serviceData.service_concessionaire,
  }

  await getAppointmentDetails(appointmentForEnrichment)

  // Guardar los datos enriquecidos del vehículo
  if (appointmentForEnrichment.client_vehicle?.vehicle) {
    enrichedVehicleData.value = appointmentForEnrichment.client_vehicle.vehicle
  }
}

watch(
  () => props.show,
  async (newValue) => {
    if (newValue && modalInstance) {
      modalInstance.show()
      // Cargar datos enriquecidos del vehículo cuando se muestra el modal
      enrichedVehicleData.value = null
      await loadEnrichedVehicleData()
    } else if (!newValue && modalInstance) {
      modalInstance.hide()
      enrichedVehicleData.value = null
    }
  },
)

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
    modalElement.value.addEventListener('hidden.bs.modal', () => {
      emit('close')
    })
  }
})
</script>

<template>
  <div
    class="modal fade"
    ref="modalElement"
    tabindex="-1"
    aria-labelledby="serviceHistoricalDetailModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content rounded-4">
        <div class="modal-header bg-primary">
          <h5 class="modal-title text-white" id="serviceHistoricalDetailModalLabel">
            <i class="bi bi-clock-history me-2"></i>Detalle del Historial de Servicio
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>

        <div class="modal-body">
          <div v-if="!serviceData" class="placeholder-glow">
            <div class="d-flex gap-3 mb-4">
              <div class="flex-grow-1">
                <div class="placeholder col-8 rounded-pill mb-3" style="height: 28px"></div>
                <div class="placeholder col-10 rounded-pill mb-2"></div>
                <div class="placeholder col-9 rounded-pill"></div>
              </div>
            </div>
          </div>

          <div v-if="serviceData">
            <!-- Información del Servicio -->
            <div class="section-card mb-4">
              <div class="section-header">
                <i class="bi bi-wrench-adjustable-circle text-primary me-2"></i>
                <h6 class="mb-0">
                  Información del Servicio -
                  <span class="fw-bold">Codigo: {{ displayValue(serviceData.code) }}</span>
                </h6>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Fecha de Servicio</span>
                    <span class="info-value">{{ formatDate(serviceData.service_date) }}</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Kilometraje</span>
                    <span class="info-value"
                      >{{ displayValue(serviceData.current_mileage) }} km</span
                    >
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Kilómetros de beneficios</span>
                    <span class="info-value text-success fw-bold">{{
                      Math.trunc(Number(serviceData.points_awarded))
                    }}</span>
                  </div>
                </div>

                <div class="col-12" v-if="serviceData.notes">
                  <div class="info-item">
                    <span class="info-label">Notas</span>
                    <span class="info-value">{{ displayValue(serviceData.notes) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del Cliente -->
            <div class="section-card mb-4">
              <div class="section-header">
                <i class="bi bi-person-circle text-primary me-2"></i>
                <h6 class="mb-0">Información del Cliente</h6>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Nombre Completo</span>
                    <span class="info-value">{{
                      displayValue(serviceData.client?.full_name)
                    }}</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ displayValue(serviceData.client?.email) }}</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">{{ displayValue(serviceData.client?.phone) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del Vehículo -->
            <div class="section-card mb-4" v-if="serviceData.client_vehicle">
              <div class="section-header">
                <i class="bi bi-car-front-fill text-primary me-2"></i>
                <h6 class="mb-0">Información del Vehículo</h6>
                <span v-if="isLoadingDetails" class="ms-2">
                  <span class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </span>
                </span>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-4">
                  <div class="info-item">
                    <span class="info-label">Kilometraje Actual</span>
                    <span class="info-value"
                      >{{ displayValue(serviceData.client_vehicle.current_mileage) }} km</span
                    >
                  </div>
                </div>

                <!-- Datos enriquecidos del vehículo -->
                <template v-if="enrichedVehicleData">
                  <div class="col-md-4" v-if="enrichedVehicleData.license_plate">
                    <div class="info-item">
                      <span class="info-label">Placa</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.license_plate)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.vin">
                    <div class="info-item">
                      <span class="info-label">VIN</span>
                      <span class="info-value text-muted" style="font-size: 0.85rem">{{
                        displayValue(enrichedVehicleData.vin)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.vehicle_model?.brand?.name">
                    <div class="info-item">
                      <span class="info-label">Marca</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.vehicle_model?.brand?.name)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.vehicle_model?.name">
                    <div class="info-item">
                      <span class="info-label">Modelo</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.vehicle_model?.name)
                      }}</span>
                    </div>
                  </div>
                  <div
                    class="col-md-4"
                    v-if="enrichedVehicleData.vehicle_model?.type_vehicle?.name"
                  >
                    <div class="info-item">
                      <span class="info-label">Tipo de Vehículo</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.vehicle_model?.type_vehicle?.name)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.type_fuel">
                    <div class="info-item">
                      <span class="info-label">Tipo de Combustible</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.type_fuel)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.type_transmission?.name">
                    <div class="info-item">
                      <span class="info-label">Transmisión</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.type_transmission?.name)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.type_engine?.name">
                    <div class="info-item">
                      <span class="info-label">Motor</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.type_engine?.name)
                      }}</span>
                    </div>
                  </div>
                  <div class="col-md-4" v-if="enrichedVehicleData.type_brake?.name">
                    <div class="info-item">
                      <span class="info-label">Frenos</span>
                      <span class="info-value">{{
                        displayValue(enrichedVehicleData.type_brake?.name)
                      }}</span>
                    </div>
                  </div>
                </template>

                <!-- Loading state para datos del vehículo -->
                <template v-else-if="isLoadingDetails">
                  <div class="col-md-4 placeholder-glow">
                    <div class="info-item">
                      <span class="info-label">Placa</span>
                      <span class="placeholder col-8 rounded"></span>
                    </div>
                  </div>
                  <div class="col-md-4 placeholder-glow">
                    <div class="info-item">
                      <span class="info-label">Modelo</span>
                      <span class="placeholder col-10 rounded"></span>
                    </div>
                  </div>
                  <div class="col-md-4 placeholder-glow">
                    <div class="info-item">
                      <span class="info-label">Marca</span>
                      <span class="placeholder col-6 rounded"></span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Información del Concesionario -->
            <div class="section-card mb-4" v-if="serviceData.concessionaire">
              <div class="section-header">
                <i class="bi bi-building text-primary me-2"></i>
                <h6 class="mb-0">Información del Concesionario</h6>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Nombre Comercial</span>
                    <span class="info-value">{{
                      displayValue(serviceData.concessionaire.trade_name)
                    }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Razón Social</span>
                    <span class="info-value">{{
                      displayValue(serviceData.concessionaire.business_name)
                    }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">{{
                      displayValue(serviceData.concessionaire.phone)
                    }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{
                      displayValue(serviceData.concessionaire.email)
                    }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <div class="info-item">
                    <span class="info-label">Dirección</span>
                    <span class="info-value">{{
                      displayValue(serviceData.concessionaire.address)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información de la Cita -->
            <div class="section-card mb-4" v-if="serviceData.appointment">
              <div class="section-header">
                <i class="bi bi-calendar-check text-primary me-2"></i>
                <h6 class="mb-0">Información de la Cita</h6>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Fecha de Cita</span>
                    <span class="info-value">{{
                      formatDate(serviceData.appointment.appointment_date)
                    }}</span>
                  </div>
                </div>
                <div class="col-md-6" v-if="serviceData.appointment.mileage">
                  <div class="info-item">
                    <span class="info-label">Kilometraje Reportado</span>
                    <span class="info-value"
                      >{{ displayValue(serviceData.appointment.mileage) }} km</span
                    >
                  </div>
                </div>
                <div class="col-12" v-if="serviceData.appointment.notes">
                  <div class="info-item">
                    <span class="info-label">Notas de la Cita</span>
                    <span class="info-value">{{
                      displayValue(serviceData.appointment.notes)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tipo de Servicio -->
            <div class="section-card" v-if="serviceData.service_concessionaire">
              <div class="section-header">
                <i class="bi bi-gear-fill text-primary me-2"></i>
                <h6 class="mb-0">Tipo de Servicio</h6>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Servicio</span>
                    <span class="info-value">{{
                      displayValue(serviceData.service_concessionaire.service_type?.name)
                    }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item">
                    <span class="info-label">Kilómetros de beneficios</span>
                    <span class="info-value">{{
                      Math.trunc(Number(serviceData.service_concessionaire.value_points))
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  border: none;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
}

.modal-header {
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
  border-radius: 1rem 1rem 0 0;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
}

.section-card {
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.section-header h6 {
  font-weight: 600;
  color: #343a40;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.95rem;
  color: #212529;
  font-weight: 500;
}
</style>
