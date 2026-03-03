<script setup lang="ts">
import { ref, onMounted } from 'vue'
//components
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
//composables
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useRouter, useRoute } from 'vue-router'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'

//constants
import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'

const store = useStore()
const router = useRouter()
const route = useRoute()
const swal = useSwal()
const swalToast = useSwalToast()
const logger = useLogger()
const { updateIconMaps, clearIconMaps } = useMultiselectIcons()

const isLoading = ref<boolean>(false)
const isLoadingData = ref<boolean>(true)

// IDs para el update
const exhibitionId = ref<string | null>(null)
const vehicleModelId = ref<number | null>(null)

// Formulario de modelo de vehículo
const vehicleModelForm = ref({
  name: '',
  description: '',
  year: null as number | null,
})

// Formulario de exhibición
const exhibitionForm = ref({
  type_fuel: '',
  description: '',
})

// Archivo adjunto
const exhibitionFile = ref<File | null>(null)
const originalFileUrl = ref<string | null>(null)

const transmissions = ref<any[]>([])
const selectedTransmission = ref<any>(null)
const customIconMapTransmission = ref<Record<string, string>>({})
const customDescriptionMapTransmission = ref<Record<string, string>>({})

const engines = ref<any[]>([])
const selectedEngine = ref<any>(null)
const customIconMapEngine = ref<Record<string, string>>({})
const customDescriptionMapEngine = ref<Record<string, string>>({})

const brakes = ref<any[]>([])
const selectedBrake = ref<any>(null)
const customIconMapBrake = ref<Record<string, string>>({})
const customDescriptionMapBrake = ref<Record<string, string>>({})

const typesVehicle = ref<any[]>([])
const selectedTypeVehicle = ref<any>(null)
const customIconMapTypeVehicle = ref<Record<string, string>>({})
const customDescriptionMapTypeVehicle = ref<Record<string, string>>({})

// Errores
const errors = ref<string[]>([])

// Obtener tipos de transmisión
const getTransmissions = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeTransmission.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.typeTransmission.getAll, {}, response)
      transmissions.value = response.data?.data || response.data || []
      clearIconMaps(customIconMapTransmission, customDescriptionMapTransmission)
      updateIconMaps(
        customIconMapTransmission,
        customDescriptionMapTransmission,
        transmissions.value,
        ICONS_MULTISELECT.transmission,
        { dataKey: 'name', descriptionPrefix: 'Tipo de transmisión:' },
      )
    }
  } catch (error: any) {
    logger.logRequest(URLS.typeTransmission.getAll, {}, error)
    swalToast.showError(`${ERROR.errorGet} tipos de transmisión`)
  }
}

// Obtener tipos de motor
const getEngines = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeEngine.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.typeEngine.getAll, {}, response)
      engines.value = response.data?.data || response.data || []
      clearIconMaps(customIconMapEngine, customDescriptionMapEngine)
      updateIconMaps(
        customIconMapEngine,
        customDescriptionMapEngine,
        engines.value,
        ICONS_MULTISELECT.engine,
        {
          dataKey: 'name',
          descriptionPrefix: 'Tipo de motor:',
        },
      )
    }
  } catch (error: any) {
    logger.logRequest(URLS.typeEngine.getAll, {}, error)
    swalToast.showError(`${ERROR.errorGet} tipos de motor`)
  }
}

// Obtener tipos de freno
const getBrakes = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeBrake.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.typeBrake.getAll, {}, response)
      brakes.value = response.data?.data || response.data || []
      clearIconMaps(customIconMapBrake, customDescriptionMapBrake)
      updateIconMaps(
        customIconMapBrake,
        customDescriptionMapBrake,
        brakes.value,
        ICONS_MULTISELECT.brake,
        {
          dataKey: 'name',
          descriptionPrefix: 'Tipo de freno:',
        },
      )
    }
  } catch (error: any) {
    logger.logRequest(URLS.typeBrake.getAll, {}, error)
    swalToast.showError(`${ERROR.errorGet} tipos de freno`)
  }
}

// Obtener tipos de vehículo
const getTypesVehicle = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeVehicle.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.typeVehicle.getAll, {}, response)
      typesVehicle.value = response.data?.data || response.data || []
      clearIconMaps(customIconMapTypeVehicle, customDescriptionMapTypeVehicle)
      updateIconMaps(
        customIconMapTypeVehicle,
        customDescriptionMapTypeVehicle,
        typesVehicle.value,
        ICONS_MULTISELECT.typeVehicle,
        { dataKey: 'name', descriptionPrefix: 'Tipo de vehículo:' },
      )
    }
  } catch (error: any) {
    logger.logRequest(URLS.typeVehicle.getAll, {}, error)
    swalToast.showError(`${ERROR.errorGet} tipos de vehículo`)
  }
}

// Cargar todos los maestros
const loadMasters = async () => {
  try {
    await Promise.all([getTransmissions(), getEngines(), getBrakes(), getTypesVehicle()])
  } catch (error) {
    logger.logRequest('loadMasters', {}, error)
  }
}

// Obtener datos de la exhibición
const getExhibition = async () => {
  isLoadingData.value = true
  try {
    const url = `${URLS.exhibition.prefix}/${exhibitionId.value}`
    const response = await store.dispatch('getData', {
      url,
    })

    if (response.code === 200 && response.data) {
      logger.logRequest(url, {}, response)
      const exhibition = response.data

      // Guardar IDs
      vehicleModelId.value = exhibition.vehicle_model?.id || exhibition.id_vehicle_model

      // Cargar datos del modelo de vehículo
      vehicleModelForm.value.name = exhibition.vehicle_model?.name || ''
      vehicleModelForm.value.description = exhibition.vehicle_model?.description || ''
      vehicleModelForm.value.year = exhibition.vehicle_model?.year || null

      // Cargar datos de la exhibición
      exhibitionForm.value.type_fuel = exhibition.type_fuel || ''
      exhibitionForm.value.description = exhibition.description || ''
      originalFileUrl.value = exhibition.url_file || null

      // Seleccionar valores en los selects después de cargar maestros
      await loadMasters()

      // Asignar selects
      selectedTypeVehicle.value =
        typesVehicle.value.find(
          (t: any) =>
            t.id === exhibition.vehicle_model?.id_type_vehicle ||
            t.id === exhibition.vehicle_model?.type_vehicle?.id,
        ) || null

      selectedTransmission.value =
        transmissions.value.find(
          (t: any) =>
            t.id === exhibition.id_type_transmission || t.id === exhibition.type_transmission?.id,
        ) || null

      selectedEngine.value =
        engines.value.find(
          (e: any) => e.id === exhibition.id_type_engine || e.id === exhibition.type_engine?.id,
        ) || null

      selectedBrake.value =
        brakes.value.find(
          (b: any) => b.id === exhibition.id_type_brake || b.id === exhibition.type_brake?.id,
        ) || null

      // Notificar al Orchestrator que los datos se cargaron
      store.dispatch('utils/setIsItem', exhibition.vehicle_model?.name || '')
      store.dispatch('utils/setIsGetting', true)
    }
  } catch (error: any) {
    logger.logRequest(`${URLS.exhibition.prefix}/${exhibitionId.value}`, {}, error)
    swalToast.showError(`${ERROR.errorGet} exhibición`)
  } finally {
    isLoadingData.value = false
  }
}

// Actualizar modelo de vehículo
const updateVehicleModel = async (): Promise<boolean> => {
  const payload = {
    name: vehicleModelForm.value.name,
    description: vehicleModelForm.value.description,
    year: vehicleModelForm.value.year,
    id_type_vehicle: selectedTypeVehicle.value?.id,
  }

  try {
    const response = await store.dispatch('updateData', {
      url: URLS.vehicleModel.update,
      id: vehicleModelId.value,
      data: payload,
    })
    logger.logRequest(URLS.vehicleModel.update, payload, response)
    return response.code === 201 || response.code === 200
  } catch (error: any) {
    logger.logRequest(URLS.vehicleModel.update, payload, error)
    return false
  }
}

// Actualizar exhibición
const updateExhibitionData = async (): Promise<boolean> => {
  const basePayload = {
    id_vehicle_model: vehicleModelId.value,
    id_type_transmission: selectedTransmission.value?.id,
    id_type_engine: selectedEngine.value?.id,
    id_type_brake: selectedBrake.value?.id,
    type_fuel: exhibitionForm.value.type_fuel,
    description: exhibitionForm.value.description,
  }

  try {
    let response
    if (exhibitionFile.value) {
      // Hay archivo -> FormData
      const formData = new FormData()
      Object.entries(basePayload).forEach(([key, value]) => {
        formData.append(key, String(value ?? ''))
      })
      formData.append('url_file', exhibitionFile.value)

      response = await store.dispatch('updateData', {
        url: URLS.exhibition.update,
        id: exhibitionId.value,
        data: formData,
      })
    } else {
      // Sin archivo -> JSON normal
      response = await store.dispatch('updateData', {
        url: URLS.exhibition.update,
        id: exhibitionId.value,
        data: basePayload,
      })
    }

    logger.logRequest(URLS.exhibition.update, basePayload, response)
    return response.code === 201 || response.code === 200
  } catch (error: any) {
    logger.logRequest(URLS.exhibition.update, basePayload, error)
    return false
  }
}

// Actualizar todo (modelo + exhibición)
const updateExhibition = async () => {
  errors.value = []
  isLoading.value = true

  // Validaciones del modelo de vehículo
  if (!vehicleModelForm.value.name?.trim()) {
    errors.value.push('Debes ingresar el nombre del vehículo')
  }
  if (!vehicleModelForm.value.year) {
    errors.value.push('Debes ingresar el año del vehículo')
  }
  if (!selectedTypeVehicle.value) {
    errors.value.push('Debes seleccionar un tipo de vehículo')
  }
  if (!vehicleModelForm.value.description?.trim()) {
    errors.value.push('Debes ingresar la descripción del vehículo')
  }

  // Validaciones de la exhibición
  if (!selectedTransmission.value) {
    errors.value.push('Debes seleccionar un tipo de transmisión')
  }
  if (!selectedEngine.value) {
    errors.value.push('Debes seleccionar un tipo de motor')
  }
  if (!selectedBrake.value) {
    errors.value.push('Debes seleccionar un tipo de freno')
  }
  if (!exhibitionForm.value.description?.trim()) {
    errors.value.push('Debes ingresar la descripción de la exhibición')
  }

  if (errors.value.length > 0) {
    swalToast.showFormErrors(errors.value)
    isLoading.value = false
    return
  }

  try {
    // 1. Primero actualizar el modelo de vehículo
    const vehicleModelUpdated = await updateVehicleModel()

    if (!vehicleModelUpdated) {
      swal.showConfirm('Ha ocurrido un error', 'Error al actualizar el modelo de vehículo', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
      return
    }

    // 2. Luego actualizar la exhibición
    const exhibitionUpdated = await updateExhibitionData()

    if (exhibitionUpdated) {
      swal.showSuccess('Vehículo de exhibición actualizado exitosamente!')
      store.dispatch('utils/setIsUpdating', true)
      router.push({ name: 'Exhibiciones' })
    } else {
      swal.showConfirm('Ha ocurrido un error', 'Error al actualizar la exhibición', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    }
  } catch (error: any) {
    logger.logRequest('updateExhibition', {}, error)
    swalToast.showError(`${ERROR.errorUpdate} vehículo de exhibición`)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  exhibitionId.value = route.params.id_exhibition as string
  if (exhibitionId.value) {
    getExhibition()
  } else {
    swalToast.showError('No se encontró el ID de la exhibición')
    router.push({ name: 'Exhibiciones' })
  }
})
</script>

<template>
  <div class="container mb-5 mt-4">
    <!-- Loading datos -->
    <LoadingOverlay v-if="isLoadingData" message="Cargando datos..." />

    <div v-if="!isLoadingData" class="row">
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4">
            <h5 class="mb-4 fw-bold">
              <i class="bi bi-car-front me-2 text-primary"></i>
              Información del Vehículo
            </h5>

            <div class="row g-3 mb-4">
              <!-- Nombre del Vehículo -->
              <div class="col-12 col-md-4">
                <label class="form-label mb-1 text-indent fw-medium">
                  Nombre del Vehículo <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Ej: Changan CS55 Plus"
                  v-model="vehicleModelForm.name"
                />
              </div>

              <!-- Año del Vehículo -->
              <div class="col-12 col-md-4">
                <label class="form-label mb-1 text-indent fw-medium">
                  Año <span class="text-danger">*</span>
                </label>
                <input
                  type="number"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Ej: 2024"
                  min="1900"
                  max="2100"
                  v-model="vehicleModelForm.year"
                />
              </div>

              <div class="col-4 col-md-4">
                <label class="form-label mb-1 text-indent fw-medium"> Tipo de combustible </label>
                <input
                  type="text"
                  class="form-control border-radius-left border-radius-right"
                  placeholder="Ej: Gasolina"
                  v-model="exhibitionForm.type_fuel"
                />
              </div>

              <!-- Tipo de Vehículo -->
              <div class="col-12 col-md-6">
                <label class="form-label mb-1 text-indent fw-medium">
                  Tipo de Vehículo <span class="text-danger">*</span>
                </label>
                <MultiselectCustom
                  v-model="selectedTypeVehicle"
                  :options="typesVehicle"
                  placeholder="Seleccionar tipo"
                  helper-type="custom"
                  variant="primary"
                  :custom-icon-map="customIconMapTypeVehicle"
                  :custom-description-map="customDescriptionMapTypeVehicle"
                />
              </div>

              <!-- Tipo de Transmisión -->
              <div class="col-12 col-md-6">
                <label class="form-label mb-1 text-indent fw-medium">
                  Tipo de Transmisión <span class="text-danger">*</span>
                </label>
                <MultiselectCustom
                  v-model="selectedTransmission"
                  :options="transmissions"
                  placeholder="Seleccionar transmisión"
                  helper-type="custom"
                  variant="primary"
                  :custom-icon-map="customIconMapTransmission"
                  :custom-description-map="customDescriptionMapTransmission"
                />
              </div>

              <!-- Tipo de Motor -->
              <div class="col-12 col-md-6">
                <label class="form-label mb-1 text-indent fw-medium">
                  Tipo de Motor <span class="text-danger">*</span>
                </label>
                <MultiselectCustom
                  v-model="selectedEngine"
                  :options="engines"
                  placeholder="Seleccionar motor"
                  helper-type="custom"
                  variant="primary"
                  :custom-icon-map="customIconMapEngine"
                  :custom-description-map="customDescriptionMapEngine"
                />
              </div>

              <!-- Tipo de Freno -->
              <div class="col-12 col-md-6">
                <label class="form-label mb-1 text-indent fw-medium">
                  Tipo de Freno <span class="text-danger">*</span>
                </label>
                <MultiselectCustom
                  v-model="selectedBrake"
                  :options="brakes"
                  placeholder="Seleccionar freno"
                  helper-type="custom"
                  variant="primary"
                  :custom-icon-map="customIconMapBrake"
                  :custom-description-map="customDescriptionMapBrake"
                />
              </div>

              <!-- Descripción -->

              <div class="row mt-3">
                <div class="col-6 col-md-6">
                  <label class="form-label mb-1 text-indent fw-medium">
                    Descripción de la exhibición<span class="text-danger">*</span>
                  </label>
                  <textarea
                    class="form-control rounded-4"
                    rows="4"
                    placeholder="Ingrese una descripción detallada de la exhibición..."
                    v-model="exhibitionForm.description"
                    style="resize: none"
                  ></textarea>
                </div>

                <div class="col-6 col-md-6">
                  <label class="form-label mb-1 text-indent fw-medium">
                    Descripción del vehículo<span class="text-danger">*</span>
                  </label>
                  <textarea
                    class="form-control rounded-4"
                    rows="4"
                    placeholder="Ingrese una descripción detallada del vehículo..."
                    v-model="vehicleModelForm.description"
                    style="resize: none"
                  ></textarea>
                </div>
              </div>

              <div class="row"></div>
              <!-- Tipo de combustible -->

              <!-- Imagen/Archivo -->
              <div class="col-12">
                <label class="form-label mb-1 text-indent fw-medium"> Archivo </label>
                <ImageUploader
                  v-model="exhibitionFile"
                  :initial-image-url="originalFileUrl"
                  accepted-formats="image/png, image/jpeg, image/jpg"
                  :max-size-m-b="5"
                  placeholder="haz click para subir un archivo"
                />
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="d-flex justify-content-end align-items-center gap-2 border-top pt-4 mt-4">
              <button :class="BUTTONS.update.class" @click="updateExhibition" :disabled="isLoading">
                <i :class="isLoading ? 'bi bi-hourglass-split' : BUTTONS.update.icon"></i>
                <span class="ms-1">{{
                  isLoading ? 'Actualizando...' : 'Actualizar Vehículo'
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
