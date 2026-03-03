<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import { BUTTONS } from '@/const/buttonConst'
import defaultProfileImage from '@/assets/images/default-profile.png'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  drivers: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'save'])

const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const selectedDriver = ref<any>(null)
const selectedVehicle = ref<any>(null)
const vehicles = ref([]) // Empty for now as requested

const close = () => {
  emit('update:show', false)
}

const save = () => {
  emit('save', {
    driver: selectedDriver.value,
    vehicle: selectedVehicle.value,
  })
  close()
}

// Reset fields when modal opens
watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedDriver.value = null
      selectedVehicle.value = null
      modalInstance?.show()
    } else {
      modalInstance?.hide()
    }
  },
)

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
    modalElement.value.addEventListener('hidden.bs.modal', () => {
      emit('update:show', false)
    })
  }
})
</script>

<template>
  <div
    class="modal fade"
    ref="modalElement"
    id="assignDriverModal"
    tabindex="-1"
    aria-labelledby="assignDriverModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold" id="assignDriverModalLabel">Asignación de Vehículo</h5>
          <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <label class="form-label fw-bold">Conductor</label>
                  <MultiselectCustom
                    v-model="selectedDriver"
                    :options="drivers"
                    placeholder="Seleccionar conductor"
                    label-key="name"
                    :show-icons="true"
                    :show-descriptions="true"
                    description-prop="dni"
                    custom-default-icon="bi bi-person-circle"
                    helper-type="custom"
                  />
                  <div class="mt-3" v-if="selectedDriver">
                    <div class="d-flex align-items-center mb-3">
                      <img
                        :src="selectedDriver.client?.url_image || defaultProfileImage"
                        class="rounded-circle object-fit-cover shadow-sm me-3"
                        width="50"
                        height="50"
                        alt="Perfil"
                      />
                      <div>
                        <h6 class="mb-0 fw-bold">{{ selectedDriver.name }}</h6>
                        <small class="text-muted d-block">{{
                          selectedDriver.client?.email || 'Sin correo'
                        }}</small>
                      </div>
                    </div>

                    <div class="row g-2 small">
                      <div class="col-6">
                        <span class="text-muted d-block">Identificación:</span>
                        <span class="fw-medium">{{
                          selectedDriver.client?.dni || 'No registrado'
                        }}</span>
                      </div>
                      <div class="col-6">
                        <span class="text-muted d-block">Teléfono:</span>
                        <span class="fw-medium">{{
                          selectedDriver.client?.phone || 'No registrado'
                        }}</span>
                      </div>
                      <div class="col-6" v-if="selectedDriver.client?.birthday">
                        <span class="text-muted d-block">Fecha Nacimiento:</span>
                        <span class="fw-medium">{{ selectedDriver.client.birthday }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <label class="form-label fw-bold">Vehículo</label>
                  <MultiselectCustom
                    v-model="selectedVehicle"
                    :options="vehicles"
                    placeholder="Seleccionar vehículo"
                    label-key="plate"
                    :show-icons="true"
                    :show-descriptions="true"
                    description-prop="model"
                    custom-default-icon="bi bi-car-front-fill"
                    helper-type="custom"
                  />
                  <div class="mt-3" v-if="selectedVehicle">
                    <p class="mb-1"><strong>Vehículo:</strong></p>
                    <p class="text-muted small">{{ selectedVehicle }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer border-top-0 pt-0">
          <button type="button" :class="BUTTONS.new.class + ' px-4'" @click="save">Asignar</button>
        </div>
      </div>
    </div>
  </div>
</template>
