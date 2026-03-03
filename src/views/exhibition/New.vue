<script setup lang="ts">
import { ref, onMounted } from 'vue'
//components
import titleSection from '@/components/common/titleSection.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
//composables
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useRouter } from 'vue-router'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'

//constants
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'

const store = useStore()
const router = useRouter()
const swal = useSwal()
const swalToast = useSwalToast()
const logger = useLogger()
const { updateIconMaps, clearIconMaps } = useMultiselectIcons()

const isLoading = ref<boolean>(false)
const isLoadingMasters = ref<boolean>(false)
const isRedirecting = ref<boolean>(false)
const redirectMessage = ref<string>('')

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

// Maestros (selects)
const vehicleModels = ref<any[]>([])
const selectedVehicleModel = ref<any>(null)
const customIconMapVehicleModel = ref<Record<string, string>>({})
const customDescriptionMapVehicleModel = ref<Record<string, string>>({})

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

// Obtener modelos de vehículos
const getVehicleModels = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.vehicleModel.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.vehicleModel.getAll, {}, response)
      vehicleModels.value = response.data?.data || response.data || []

      clearIconMaps(customIconMapVehicleModel, customDescriptionMapVehicleModel)
      updateIconMaps(
        customIconMapVehicleModel,
        customDescriptionMapVehicleModel,
        vehicleModels.value,
        ICONS_MULTISELECT.vehicleModel,
        { dataKey: 'name', descriptionPrefix: 'Modelo:' },
      )

      vehicleModels.value.forEach((model: any) => {
        const name = model?.name
        if (!name) return
        customDescriptionMapVehicleModel.value[name] = model.year
          ? `Año ${model.year}`
          : 'Modelo de vehículo'
      })
    }
  } catch (error: any) {
    logger.logRequest(URLS.vehicleModel.getAll, {}, error)
    swalToast.showError(`${ERROR.errorGet} modelos de vehículos`)
  }
}

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
  isLoadingMasters.value = true
  try {
    await Promise.all([
      getVehicleModels(),
      getTransmissions(),
      getEngines(),
      getBrakes(),
      getTypesVehicle(),
    ])
  } finally {
    isLoadingMasters.value = false
  }
}

// Guardar modelo de vehículo
const saveVehicleModel = async (): Promise<number | null> => {
  const payload = {
    name: vehicleModelForm.value.name,
    description: vehicleModelForm.value.description,
    year: vehicleModelForm.value.year,

    id_type_vehicle: selectedTypeVehicle.value?.id,
  }

  try {
    const response = await store.dispatch('createData', {
      url: URLS.vehicleModel.save,
      data: payload,
    })
    if (response.code === 201 || response.code === 200) {
      logger.logRequest(URLS.vehicleModel.save, payload, response)
      return response.data?.id || response.id
    }
    logger.logRequest(URLS.vehicleModel.save, payload, response)
    return null
  } catch (error: any) {
    logger.logRequest(URLS.vehicleModel.save, payload, error)
    return null
  }
}

// Guardar exhibición
const saveExhibitionData = async (idVehicleModel: number): Promise<number | null> => {
  const basePayload = {
    id_vehicle_model: idVehicleModel,
    id_type_transmission: selectedTransmission.value?.id,
    id_type_engine: selectedEngine.value?.id,
    id_type_brake: selectedBrake.value?.id,
    type_fuel: exhibitionForm.value.type_fuel,
    description: exhibitionForm.value.description,
  }

  const formData = new FormData()
  Object.entries(basePayload).forEach(([key, value]) => {
    formData.append(key, String(value ?? ''))
  })
  if (exhibitionFile.value) {
    formData.append('url_file', exhibitionFile.value)
  }

  try {
    const response = await store.dispatch('createData', {
      url: URLS.exhibition.save,
      data: formData,
    })
    if (response.code === 201 || response.code === 200) {
      logger.logRequest(URLS.exhibition.save, basePayload, response)
      return response.data?.id || response.id
    }
    logger.logRequest(URLS.exhibition.save, basePayload, response)
    return null
  } catch (error: any) {
    logger.logRequest(URLS.exhibition.save, basePayload, error)
    return null
  }
}

// Guardar todo (modelo + exhibición)
const saveExhibition = async () => {
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
    // 1. Primero crear el modelo de vehículo
    const vehicleModelId = await saveVehicleModel()

    if (!vehicleModelId) {
      swal.showConfirm('Ha ocurrido un error', 'Error al guardar el modelo de vehículo', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
      return
    }

    // 2. Luego crear la exhibición con el id del modelo
    const exhibitionId = await saveExhibitionData(vehicleModelId)

    if (exhibitionId) {
      const result = await swal.showConfirm(
        '¡Vehículo de exhibición guardado exitosamente!',
        '¿Dónde deseas ir ahora?',
        {
          icon: 'success',
          confirmButtonText: 'Ver detalles',
          cancelButtonText: 'Ir al listado',
          showCancelButton: true,
        },
      )

      store.dispatch('utils/setIsCreating', true)

      if (result) {
        // Ir a los detalles de la exhibición
        isRedirecting.value = true
        redirectMessage.value = 'Redirigiendo a los detalles...'
        setTimeout(() => {
          router.replace(`/exhibition/edit/${exhibitionId}/${vehicleModelId}/detail-exhibition`)
        }, 700)
      } else {
        // Ir al listado
        isRedirecting.value = true
        redirectMessage.value = 'Redirigiendo al listado...'
        setTimeout(() => {
          router.replace({ name: 'Exhibiciones' })
        }, 700)
      }
    } else {
      swal.showConfirm('Ha ocurrido un error', 'Error al guardar la exhibición', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    }
  } catch (error: any) {
    logger.logRequest('saveExhibition', {}, error)
    swalToast.showError(`${ERROR.errorCreate} vehículo de exhibición`)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMasters()
})
</script>

<template>
  <DashboardLayout>
    <!-- Overlay de redirección -->
    <LoadingOverlay v-if="isRedirecting" :message="redirectMessage" />

    <div class="container mb-5 mt-4">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.exhibition.new"
        :description="TITLE_SECTION_COMPONENT.exhibition.newDescription"
      />

      <!-- Loading maestros -->
      <LoadingOverlay v-if="isLoadingMasters" message="Cargando datos..." />

      <div v-else class="row">
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

                <!-- Tipo de combustible -->
                <div class="col-12 col-md-4">
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

                <div class="row mt-3">
                  <!-- Descripción -->
                  <div class="col-12 col-md-6">
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

                  <div class="col-12 col-md-6">
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
                </div>

                <!-- Imagen/Archivo -->
                <div class="col-12">
                  <label class="form-label mb-1 text-indent fw-medium"> Archivo </label>
                  <ImageUploader
                    v-model="exhibitionFile"
                    accepted-formats="image/png, image/jpeg, image/jpg"
                    :max-size-m-b="5"
                    placeholder="haz click para subir un archivo"
                  />
                </div>
              </div>

              <!-- Botones de acción -->
              <div class="d-flex justify-content-end align-items-center gap-2 border-top pt-4 mt-4">
                <button :class="BUTTONS.new.class" @click="saveExhibition" :disabled="isLoading">
                  <i :class="isLoading ? 'bi bi-hourglass-split' : BUTTONS.new.icon"></i>
                  <span class="ms-1">{{ isLoading ? 'Guardando...' : 'Guardar Vehículo' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
