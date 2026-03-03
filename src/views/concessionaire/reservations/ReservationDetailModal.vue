<template>
  <teleport to="body">
    <div
      :id="id"
      ref="modalEl"
      class="modal fade"
      tabindex="-1"
      aria-hidden="true"
      :aria-labelledby="`${id}-label`"
    >
      <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <div class="d-flex flex-column">
              <h5 :id="`${id}-label`" class="modal-title">Detalle de reservación</h5>
              <div class="small text-body-secondary">
                <span v-if="reservation?.id" class="me-2">#{{ reservation.id }}</span>
              </div>
            </div>

            <button type="button" class="btn-close" aria-label="Cerrar" @click="requestClose" />
          </div>

          <div class="modal-body">
            <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <span
                  class="badge"
                  :class="getStatusBadgeClass(reservation?.id_appointment_status)"
                  v-if="reservation?.appointment_status?.name"
                >
                  {{ reservation.appointment_status.name }}
                </span>
                <span
                  class="badge text-bg-info"
                  v-if="reservation?.service_concessionaire?.service_type?.name"
                >
                  {{ reservation.service_concessionaire.service_type.name }}
                </span>
              </div>

              <div class="text-end">
                <div class="fw-semibold" v-if="reservation?.concessionaire?.trade_name">
                  {{ reservation.concessionaire.trade_name }}
                </div>
                <div class="small text-body-secondary" v-if="reservation?.concessionaire?.address">
                  {{ reservation.concessionaire.address }}
                </div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-12 col-lg-6">
                <div class="card">
                  <div class="card-header d-flex align-items-center justify-content-between">
                    <span class="fw-semibold">Cliente</span>
                    <span class="small text-body-secondary" v-if="reservation?.client?.dni">
                      <span class="fw-bold">RIF:</span> {{ reservation.client.dni }}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="row g-2">
                      <div class="col-12">
                        <div class="fw-semibold">
                          Nombre completo: {{ reservation?.client?.full_name || '—' }}
                        </div>
                        <div class="small text-body-secondary">
                          <span class="fw-bold">Email:</span>
                          {{ reservation?.client?.email || '—' }}
                        </div>
                        <div class="small text-body-secondary">
                          <span class="fw-bold">Teléfono:</span>
                          {{ reservation?.client?.phone || '—' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-6">
                <div class="card">
                  <div class="card-header d-flex align-items-center justify-content-between">
                    <span class="fw-semibold">Servicio</span>
                  </div>
                  <div class="card-body">
                    <div class="row g-3">
                      <div
                        class="small text-body-secondary mt-1"
                        v-if="reservation?.service_concessionaire?.value_points"
                      >
                        <div class="fw-bold">
                          Nombre del servicio:
                          <span class="fw-bold text-dark">
                            {{
                              reservation?.service_concessionaire?.service_type?.name || 'Servicio'
                            }}
                          </span>
                        </div>
                        <span class="badge text-bg-success"
                          >{{
                            Math.trunc(Number(reservation?.service_concessionaire?.value_points))
                          }}
                          Kilómetros de beneficios</span
                        >
                      </div>
                      <div class="col-12 col-md-4">
                        <div class="small text-body-secondary">Fecha de la cita</div>
                        <div class="fw-semibold" v-format-date="reservation?.appointment_date">
                          {{ reservation?.appointment_date || '—' }}
                        </div>
                      </div>

                      <div class="col-12 col-md-4">
                        <div class="small text-body-secondary">Hora de la cita</div>
                        <div class="fw-semibold d-flex align-items-center gap-1">
                          <i class="bi bi-clock text-primary" style="font-size: 0.85rem"></i>
                          <span v-format-time:local="reservation?.appointment_date">—</span>
                        </div>
                      </div>

                      <div class="col-12 col-md-4">
                        <div class="small text-body-secondary">Concesionario</div>
                        <div class="fw-semibold">
                          {{ reservation?.concessionaire?.trade_name || '—' }}
                        </div>
                      </div>
                      <div class="col-12">
                        <!-- Extra service details if enriched -->
                        <div
                          v-if="reservation?.service_concessionaire?.service_type?.duration"
                          class="small text-body-secondary"
                        >
                          Duración:
                          {{ reservation.service_concessionaire.service_type.duration }} min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-6">
                <div class="card">
                  <div class="card-header d-flex align-items-center justify-content-between">
                    <span class="fw-semibold">Información del vehículo</span>
                    <span
                      class="small text-body-secondary"
                      v-if="reservation?.service_concessionaire?.code"
                    >
                      Código: {{ reservation.service_concessionaire.code }}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="row g-2">
                      <div class="col-12">
                        <div class="border rounded-3 p-2">
                          <div v-if="reservation?.client_vehicle?.vehicle" class="mb-2">
                            <div class="fw-bold">
                              <span class="text-body-secondary">VIN:</span>
                              {{ reservation.client_vehicle.vehicle.vin }}
                            </div>
                            <div class="fw-bold">
                              <span class="text-body-secondary">Placa:</span>
                              {{ reservation.client_vehicle.vehicle?.license_plate }}
                            </div>

                            <!-- Additional details fetched on demand -->
                            <div class="row g-2 mt-2 border-top pt-2">
                              <div
                                class="col-6"
                                v-if="reservation.client_vehicle.vehicle?.vehicle_model?.name"
                              >
                                <div class="small text-body-secondary">Vehículo</div>
                                <div class="fw-medium">
                                  {{ reservation.client_vehicle.vehicle.vehicle_model.name }}
                                </div>
                              </div>

                              <div
                                class="col-6"
                                v-if="
                                  reservation.client_vehicle.vehicle?.vehicle_model?.type_vehicle
                                "
                              >
                                <div class="small text-body-secondary">Modelo</div>
                                <div class="fw-medium">
                                  {{
                                    reservation.client_vehicle.vehicle.vehicle_model.type_vehicle
                                      .name
                                  }}
                                </div>
                              </div>
                              <div
                                class="col-6"
                                v-if="reservation.client_vehicle.vehicle?.type_transmission?.name"
                              >
                                <div class="small text-body-secondary">Transmisión</div>
                                <div class="fw-medium">
                                  {{ reservation.client_vehicle.vehicle.type_transmission.name }}
                                </div>
                              </div>
                              <div
                                class="col-6"
                                v-if="reservation.client_vehicle.vehicle?.type_engine?.name"
                              >
                                <div class="small text-body-secondary">Motor</div>
                                <div class="fw-medium">
                                  {{ reservation.client_vehicle.vehicle.type_engine.name }}
                                </div>
                              </div>
                              <div
                                class="col-6"
                                v-if="reservation.client_vehicle.vehicle?.type_brake?.name"
                              >
                                <div class="small text-body-secondary">Frenos</div>
                                <div class="fw-medium">
                                  {{ reservation.client_vehicle.vehicle.type_brake.name }}
                                </div>
                              </div>

                              <div
                                class="col-6"
                                v-if="reservation.client_vehicle.vehicle?.type_fuel"
                              >
                                <div class="small text-body-secondary">Tipo de combustible</div>
                                <div class="fw-medium">
                                  {{ reservation.client_vehicle.vehicle.type_fuel }}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="d-flex flex-wrap gap-2" v-if="reservation?.client_vehicle">
                            <span
                              class="badge text-bg-light border"
                              v-if="reservation?.client_vehicle?.vehicle_model?.brand?.name"
                            >
                              {{ reservation?.client_vehicle?.vehicle_model?.brand?.name }}
                            </span>
                            <span
                              class="badge text-bg-light border"
                              v-if="reservation?.client_vehicle?.vehicle_model?.name"
                            >
                              {{ reservation?.client_vehicle?.vehicle_model?.name }}
                            </span>
                          </div>
                          <div v-else class="text-body-secondary">Sin vehículo asignado</div>

                          <!-- Company Info -->
                          <div
                            v-if="reservation?.client_vehicle?.company"
                            class="mt-2 border-top pt-2"
                          >
                            <div class="text-body-secondary d-block fw-bold">
                              Pertenece a la empresa:
                              <span class="fw-bold text-dark">
                                {{ reservation.client_vehicle.company.business_name }}
                              </span>
                            </div>
                            <div class="text-body-secondary fw-bold">
                              RIF:
                              <span class="fw-bold text-dark">
                                {{ reservation.client_vehicle.company.rif }}
                              </span>
                            </div>

                            <div class="text-body-secondary fw-bold">
                              Dirección:
                              <span class="fw-bold text-dark">
                                {{ reservation.client_vehicle.company?.address }}
                              </span>
                            </div>
                            <div class="text-body-secondary fw-bold">
                              teléfono:
                              <span class="fw-bold text-dark">
                                {{ reservation.client_vehicle.company?.phone }}
                              </span>
                            </div>
                            <div class="text-body-secondary fw-bold">
                              Email:
                              <span class="fw-bold text-dark">
                                {{ reservation.client_vehicle.company?.email }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-6">
                <div class="card h-100">
                  <div class="card-header"><span class="fw-semibold">Administración</span></div>
                  <div class="card-body">
                    <div class="row g-3">
                      <div class="col-12">
                        <label class="form-label">Notas de la cita</label>
                        <textarea
                          class="form-control"
                          rows="6"
                          style="resize: none"
                          :value="reservation?.notes"
                          @input="emitNotesChange"
                        />
                      </div>
                      <div class="col-12" v-if="reservation?.id_appointment_status != 2">
                        <div class="d-grid gap-2">
                          <button
                            type="button"
                            class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                            :disabled="generatingService || loadingNotification === 'reminder'"
                            @click="
                              sendNotification(NOTIFICATION_TYPES.APPOINTMENT_REMINDER, 'reminder')
                            "
                          >
                            <span
                              v-if="loadingNotification === 'reminder'"
                              class="spinner-border spinner-border-sm"
                            />
                            <i v-else class="bi bi-bell"></i>
                            <span class="fw-medium">Enviar recordatorio al conductor</span>
                          </button>
                        </div>
                      </div>
                      <div class="col-12" v-if="reservation?.id_appointment_status != 2">
                        <button
                          type="button"
                          class="btn btn-primary d-flex align-items-center justify-content-center gap-2 w-100"
                          :disabled="generatingService"
                          @click="handleGenerateService"
                        >
                          <span v-if="generatingService" class="spinner-border spinner-border-sm" />
                          <i v-else class="bi bi-save"></i>
                          <span class="fw-medium">{{
                            generatingService ? 'Guardando...' : 'Confirmar servicio'
                          }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              v-if="reservation?.id_appointment_status != 2"
              type="button"
              class="btn btn-outline-danger me-auto"
              :disabled="loading"
              @click="emitCancel"
            >
              Cancelar cita
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { Modal } from 'bootstrap'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { IAppointment } from '@/interfaces/calendar'
import apiClient from '@/services/apiClient'
import { useSwal } from '@/composables/useSwal'
import { NOTIFICATION_TYPES } from '@/const/notificationConst'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    reservation: IAppointment | null
    loading?: boolean
    id?: string
  }>(),
  {
    loading: false,
    id: 'reservation-detail-modal',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'update:notes', value: string): void
}>()

const modalEl = ref<HTMLElement | null>(null)
const modal = ref<Modal | null>(null)
const generatingService = ref(false)
const loadingNotification = ref<string | null>(null)

const { showSuccess, showError, showConfirm } = useSwal()

const id = computed(() => props.id)
const loading = computed(() => props.loading)
const reservation = computed(() => props.reservation)

const getStatusBadgeClass = (statusId: number | undefined) => {
  switch (Number(statusId)) {
    case 1:
      return 'text-bg-primary'
    case 2:
      return 'text-bg-danger'
    case 3:
      return 'text-bg-success'
    default:
      return 'text-bg-primary'
  }
}

const requestClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const emitCancel = () => emit('cancel')

const emitNotesChange = (ev: Event) => {
  const value = (ev.target as HTMLTextAreaElement).value
  emit('update:notes', value)
}

const handleGenerateService = async () => {
  if (!reservation.value?.id) {
    showError('No se puede crear el servicio: falta el ID de la cita.')
    return
  }

  const confirmedService = await showConfirm(
    '¿Está seguro?',
    'A continuación se generará un servicio ejecutado partiendo de esta cita, ¿está seguro de generarlo?',
  )

  if (!confirmedService) return

  // Ask about sending notification
  const confirmedNotification = await showConfirm(
    '¿Enviar confirmación?',
    '¿Desea enviar una notificación al usuario de que su servicio ha sido confirmado?',
    {
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    },
  )

  if (confirmedNotification) {
    // Send notification silently (or simply log error if fails, to not block service generation)
    // We reuse sendNotification but maybe we don't want to show success alert here to avoid double alerts?
    // sendNotification shows success alert. Let's keep it for now as per instructions.
    await sendNotification(NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION, 'confirmation')
  }

  generatingService.value = true
  try {
    await apiClient.post('service_historical/generate-service', {
      id_appointment: reservation.value.id,
      notes: reservation.value.notes || '',
    })
    showSuccess('Servicio creado exitosamente.')
    requestClose()
  } catch (error) {
    // El interceptor de apiClient ya maneja los errores
  } finally {
    generatingService.value = false
  }
}

const sendNotification = async (type: string, loadingKey: string) => {
  if (!reservation.value?.id) {
    showError('No se puede enviar la notificación: falta el cliente.')
    return
  }

  loadingNotification.value = loadingKey
  try {
    await apiClient.post('notification/notify_user', {
      id: reservation.value?.id,
      type,
    })
    showSuccess('Notificación enviada exitosamente.')
  } catch (error) {
    // El interceptor de apiClient ya maneja los errores
  } finally {
    loadingNotification.value = null
  }
}

onMounted(() => {
  if (!modalEl.value) return

  modal.value = new Modal(modalEl.value, {
    backdrop: 'static',
    keyboard: false,
    focus: true,
  })

  modalEl.value.addEventListener('hidden.bs.modal', () => {
    emit('update:modelValue', false)
  })
})

onBeforeUnmount(() => {
  modal.value?.hide()
  modal.value?.dispose()
  modal.value = null
})

watch(
  () => props.modelValue,
  (open) => {
    if (!modal.value) return
    if (open) modal.value.show()
    else modal.value.hide()
  },
  { immediate: true },
)
</script>
