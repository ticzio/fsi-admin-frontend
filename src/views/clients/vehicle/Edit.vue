<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import VehicleInfoForm from '@/components/common/Vehicle/VehicleInfoForm.vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useLogger } from '@/composables/useLogger'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import { BUTTONS } from '@/const/buttonConst'

const route = useRoute()
const store = useStore()
const logger = useLogger()
const swalToast = useSwalToast()
const swal = useSwal()

const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const isUpdating = ref(false)

// Vehicle data from nested object
const vehicleData = ref<any>(null)

// Client-Vehicle level fields (first level of JSON)
const clientVehicleId = ref<number | null>(null)
const ownerFullName = ref('')
const ownershipStartDate = ref('')
const purchaseDate = ref('')
const lastMileageUpdate = ref('')
const currentMileage = ref<number | null>(null)

// Vehicle type fields (resolved from IDs)
const typeBrakeName = ref('N/A')
const typeEngineName = ref('N/A')
const typeTransmissionName = ref('N/A')
const vehicleModelName = ref('N/A')
const vehicleName = ref('N/A')

// Image fields
const selectedDniImage = ref<File | null>(null)
const selectedDrivingLicenseImage = ref<File | null>(null)
const selectedRegistrationCertificateImage = ref<File | null>(null)
const initialDniImageUrl = ref<string | null>(null)
const initialDrivingLicenseImageUrl = ref<string | null>(null)
const initialRegistrationCertificateImageUrl = ref<string | null>(null)

// Fetch type name by ID
const getTypeBrake = async (id: number) => {
  try {
    const url = `${URLS.typeBrake.prefix}/${id}`
    const response = await store.dispatch('getData', { url })
    if (response.code === 200) {
      typeBrakeName.value = response.data.name || 'N/A'
    }
  } catch (error) {
    console.error('Error fetching type brake:', error)
  }
}

const getTypeEngine = async (id: number) => {
  try {
    const url = `${URLS.typeEngine.prefix}/${id}`
    const response = await store.dispatch('getData', { url })
    if (response.code === 200) {
      typeEngineName.value = response.data.name || 'N/A'
    }
  } catch (error) {
    console.error('Error fetching type engine:', error)
  }
}

const getTypeTransmission = async (id: number) => {
  try {
    const url = `${URLS.typeTransmission.prefix}/${id}`
    const response = await store.dispatch('getData', { url })
    if (response.code === 200) {
      typeTransmissionName.value = response.data.name || 'N/A'
    }
  } catch (error) {
    console.error('Error fetching type transmission:', error)
  }
}

const getVehicleModel = async (id: number) => {
  try {
    const url = `${URLS.vehicleModel.prefix}/${id}`
    const response = await store.dispatch('getData', { url })
    if (response.code === 200) {
      vehicleName.value = response.data.name || 'N/A'
      vehicleModelName.value = response.data.type_vehicle.name || 'N/A'
    }
  } catch (error) {
    console.error('Error fetching vehicle model:', error)
  }
}

const getVehicle = async () => {
  const idFromRoute = route.params.id_client

  if (!idFromRoute) {
    swalToast.showError('No se encontró el ID del cliente')
    return
  }

  const url = `${URLS.clientVehicle.prefix}/${idFromRoute}`
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url,
    })

    if (response.code === 200) {
      logger.logRequest(url, {}, response)
      const data = response.data

      // Store client-vehicle ID
      clientVehicleId.value = data.id

      // First level fields
      ownerFullName.value = data.owner_full_name || ''
      ownershipStartDate.value = data.ownership_start_date
        ? data.ownership_start_date.split('T')[0]
        : ''
      purchaseDate.value = data.purchase_date ? data.purchase_date.split('T')[0] : ''
      lastMileageUpdate.value = data.last_mileage_update
        ? data.last_mileage_update.split('T')[0]
        : ''
      currentMileage.value = data.current_mileage || null

      // Image URLs
      initialDniImageUrl.value = data.url_dni || null
      initialDrivingLicenseImageUrl.value = data.url_driving_license || null
      initialRegistrationCertificateImageUrl.value = data.url_registration_certificate || null

      // Nested vehicle data
      vehicleData.value = data.vehicle || null

      // Fetch type names from IDs (check both first level and nested vehicle)
      const idTypeBrake = data.id_type_brake || data.vehicle?.id_type_brake
      const idTypeEngine = data.id_type_engine || data.vehicle?.id_type_engine
      const idTypeTransmission = data.id_type_transmission || data.vehicle?.id_type_transmission
      const idVehicleModel = data.id_vehicle_model || data.vehicle?.id_vehicle_model

      if (idTypeBrake) await getTypeBrake(idTypeBrake)
      if (idTypeEngine) await getTypeEngine(idTypeEngine)
      if (idTypeTransmission) await getTypeTransmission(idTypeTransmission)
      if (idVehicleModel) await getVehicleModel(idVehicleModel)

      store.dispatch('utils/setIsGetting', true)
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    swalToast.showError(`${ERROR.errorGetRegister} vehículo`)
  } finally {
    isLoading.value = false
  }
}

const updateClientVehicle = async () => {
  const formData = new FormData()

  formData.append('owner_full_name', ownerFullName.value)
  if (ownershipStartDate.value) formData.append('ownership_start_date', ownershipStartDate.value)
  if (purchaseDate.value) formData.append('purchase_date', purchaseDate.value)
  if (lastMileageUpdate.value) formData.append('last_mileage_update', lastMileageUpdate.value)
  if (currentMileage.value !== null)
    formData.append('current_mileage', String(currentMileage.value))

  if (selectedDniImage.value) {
    formData.append('url_dni', selectedDniImage.value)
  }
  if (selectedDrivingLicenseImage.value) {
    formData.append('url_driving_license', selectedDrivingLicenseImage.value)
  }
  if (selectedRegistrationCertificateImage.value) {
    formData.append('url_registration_certificate', selectedRegistrationCertificateImage.value)
  }

  isUpdating.value = true
  try {
    const response = await store.dispatch('updateData', {
      url: URLS.clientVehicle.update,
      id: clientVehicleId.value,
      data: formData,
    })

    if (response.code === 200 || response.code === 201) {
      logger.logRequest(
        URLS.clientVehicle.update,
        { id: clientVehicleId.value, data: formData },
        response,
      )
      swal.showSuccess('Datos del vehículo actualizados exitosamente')
      store.dispatch('utils/setIsUpdating', true)
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.clientVehicle.update,
      { id: clientVehicleId.value, data: formData },
      error,
    )
    swalToast.showError(`${ERROR.errorUpdate} datos del vehículo`)
  } finally {
    isUpdating.value = false
  }
}

onMounted(async () => {
  await getVehicle()
})
</script>

<template>
  <div class="mb-5 mt-4">
    <div class="container position-relative">
      <LoadingOverlay v-if="isLoading" message="Cargando datos del vehículo" />

      <div v-if="!isLoading">
        <div v-if="vehicleData">
          <VehicleInfoForm
            :vehicle-data="vehicleData"
            :vehicle-name="vehicleName"
            :vehicle-model-name="vehicleModelName"
            :type-engine-name="typeEngineName"
            :type-transmission-name="typeTransmissionName"
            :type-brake-name="typeBrakeName"
            :vehicle-count="1"
          />

          <!-- Ownership Info (Editable) -->
          <div class="mb-4">
            <h5 class="mb-3">Información del Propietario</h5>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Nombre completo del propietario</label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Nombre del propietario"
                  v-model="ownerFullName"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Kilometraje actual</label>
                <input
                  type="number"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Kilometraje"
                  v-model="currentMileage"
                />
              </div>
            </div>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Fecha de inicio de propiedad</label>
                <input
                  type="date"
                  class="form-control border-radius-left border-radius-right"
                  v-model="ownershipStartDate"
                />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Fecha de compra</label>
                <input
                  type="date"
                  class="form-control border-radius-left border-radius-right"
                  v-model="purchaseDate"
                />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Fecha del ultimo kilometraje</label>
                <input
                  type="date"
                  class="form-control border-radius-left border-radius-right"
                  v-model="lastMileageUpdate"
                />
              </div>
            </div>
          </div>

          <!-- Documents -->
          <div class="mb-4">
            <h5 class="mb-3">Documentos</h5>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Foto de la Cédula</label>
                <ImageUploader
                  v-model="selectedDniImage"
                  @update:model-value="selectedDniImage = $event"
                  :round="false"
                  :initialImageUrl="initialDniImageUrl"
                  :inputDisabled="false"
                />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Foto del Carnet de Conducir</label>
                <ImageUploader
                  v-model="selectedDrivingLicenseImage"
                  @update:model-value="selectedDrivingLicenseImage = $event"
                  :round="false"
                  :initialImageUrl="initialDrivingLicenseImageUrl"
                  :inputDisabled="false"
                />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Certificado de Registro</label>
                <ImageUploader
                  v-model="selectedRegistrationCertificateImage"
                  @update:model-value="selectedRegistrationCertificateImage = $event"
                  :round="false"
                  :initialImageUrl="initialRegistrationCertificateImageUrl"
                  :inputDisabled="false"
                />
              </div>
            </div>
          </div>

          <!-- Update Button -->
          <div class="d-flex justify-content-end">
            <button
              :class="BUTTONS.update.class"
              @click="updateClientVehicle"
              :disabled="isUpdating"
            >
              <i :class="BUTTONS.update.icon"></i>
              {{ isUpdating ? 'Actualizando...' : 'Actualizar datos' }}
            </button>
          </div>
        </div>

        <div v-else class="card border-0 shadow-sm rounded-4 empty-state p-5 text-center">
          <div class="card-body">
            <i class="bi bi-car-front display-1 text-muted mb-3"></i>
            <h4 class="fw-semibold text-muted">Sin vehículo asignado</h4>
            <p class="text-muted mb-0">Este cliente no tiene un vehículo asociado.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-control:focus {
  box-shadow: none;
  border-color: #86b7fe;
}
</style>
