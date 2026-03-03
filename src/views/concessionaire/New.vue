<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
//components
import InputRif from '@/components/common/InputRif.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import CustomLocation from '@/components/common/CustomLocation.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
//composables
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useRedirect } from '@/composables/useRedirect'
import { useLogger } from '@/composables/useLogger'
import { useMasters } from '@/composables/Masters/useMasters'

//constants
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

//functions Helpers
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'

const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const swal = useSwal()
const swalToast = useSwalToast()
const { isRedirecting, redirectMessage, redirectToList, redirectToDetails } = useRedirect()
const logger = useLogger()

// Masters composable para states, cities
const {
  states,
  customIconMapState,
  customDescriptionMapState,
  getStates,
  cities,
  customIconMapCity,
  customDescriptionMapCity,
  getCities,
  clearCities,
} = useMasters()

const isLoading = ref<boolean>(false)

// DATA CONCESSIONAIRE START
const concessionaireForm = ref<any>({
  business_name: '',
  trade_name: '',
  rif: '',
  address: '',
  description_services: '',
  phone: '',
  email: '',
  id_city: null,
})
const showQRModal = ref<boolean>(false)
const selectedImage = ref<File | null>(null)
const googleMapsUrl = ref('')
// Siempre mantenemos el objeto de coordenadas (aunque vacío) para mostrar los inputs
const extractedCoords = ref<{ latitude: string; longitude: string }>({
  latitude: '',
  longitude: '',
})
const selectedState = ref(null)
const selectedCity = ref(null)

//DATA TABLE CONCESSIONAIRE END

// var errors
const errors = ref<any>([])
const errorCoord = ref('')
const centerPhoneError = ref('')

const handleStateChange = async () => {
  selectedCity.value = null
  if ((selectedState.value as any)?.id) {
    await getCities((selectedState.value as any).id)
  } else {
    clearCities()
  }
}

const saveConcessionaire = async () => {
  // Validaciones de datos del concesionario
  errors.value = []

  if (!concessionaireForm.value.business_name?.trim())
    errors.value.push('Debes ingresar el nombre del negocio del concesionario')
  if (!concessionaireForm.value.trade_name?.trim())
    errors.value.push('Debes ingresar el nombre comercial del concesionario')
  if (!concessionaireForm.value.rif?.trim())
    errors.value.push('Debes ingresar el RIF del concesionario')
  if (!concessionaireForm.value.phone?.trim())
    errors.value.push('Debes ingresar el teléfono del concesionario')
  if (centerPhoneError.value) errors.value.push(centerPhoneError.value)

  const normalizedConcessionaireEmail = normalizeEmail(concessionaireForm.value.email)
  if (!normalizedConcessionaireEmail) {
    errors.value.push('Debes ingresar el correo del concesionario')
  } else if (!isValidEmail(normalizedConcessionaireEmail)) {
    errors.value.push('El correo del concesionario no tiene un formato válido')
  }

  if (!selectedCity.value) {
    errors.value.push('Debes seleccionar una ciudad para el concesionario')
  }
  if (!concessionaireForm.value.address?.trim())
    errors.value.push('Debes ingresar la dirección del concesionario')

  if (!concessionaireForm.value.description_services?.trim())
    errors.value.push('Debes ingresar la descripción de los servicios del concesionario')

  if (errors.value.length > 0) {
    swalToast.showFormErrors(errors.value)
    return
  }

  // Usar FormData para enviar imagen junto con los datos
  const formData = new FormData()
  formData.append('id_city', String((selectedCity.value as any).id))
  formData.append('email', normalizedConcessionaireEmail)
  formData.append('address', concessionaireForm.value.address)
  formData.append('description_services', concessionaireForm.value.description_services)
  formData.append('phone', concessionaireForm.value.phone)
  formData.append('rif', concessionaireForm.value.rif)
  formData.append('trade_name', concessionaireForm.value.trade_name)
  formData.append('business_name', concessionaireForm.value.business_name)
  if (extractedCoords.value.longitude) {
    formData.append('longitude', extractedCoords.value.longitude)
  }
  if (extractedCoords.value.latitude) {
    formData.append('latitude', extractedCoords.value.latitude)
  }
  // Agregar imagen si existe
  if (selectedImage.value) {
    formData.append('url_logo', selectedImage.value)
  }

  isLoading.value = true
  try {
    const response = await store.dispatch('createData', {
      url: URLS.concessionaire.save,
      data: formData,
    })

    logger.logRequest(URLS.concessionaire.save, formData, response)

    if (response.code == 201) {
      const result = await swal.showConfirm(
        'Concesionario guardado exitosamente!',
        '¿Dónde deseas ir ahora?',
        {
          icon: 'success',
          confirmButtonText: 'Ver detalles',
          cancelButtonText: 'Ir al listado',
          showCancelButton: true,
        },
      )

      if (result) {
        redirectToDetails(`/concessionaire/edit/${response.data.id}/detail-concessionaire`)
      } else {
        redirectToList('Concesionarios')
      }
    } else if (response.code == 409) {
      swalToast.showError(response.alert || 'El email ya está registrado')
      return
    } else if (response.code == 400) {
      swal.showConfirm(
        'Ha ocurrido un error',
        'Error al guardar los datos primarios del concesionario',
        {
          icon: 'error',
          confirmButtonText: 'Aceptar',
        },
      )
      return
    }
  } catch (error: any) {
    logger.logRequest(URLS.concessionaire.save, formData, error)
    if (error.code === 409) {
      swalToast.showError(error.alert || 'El email ya está registrado')
    } else {
      swalToast.showError(`${ERROR.errorCreate} para el concesionario`)
    }
  } finally {
    isLoading.value = false
  }
}

const handleCoordinates = (coords: { latitude: string; longitude: string } | null) => {
  if (coords) {
    extractedCoords.value.latitude = coords.latitude
    extractedCoords.value.longitude = coords.longitude
    errorCoord.value = ''
  } else {
    // Si se limpia el input de URL, limpiamos las coordenadas (manteniendo el objeto)
    extractedCoords.value.latitude = ''
    extractedCoords.value.longitude = ''
    errorCoord.value = 'No se pudieron extraer las coordenadas. Revisa la URL.'
  }
}

// La función onError ahora usa el toast
const onCenterPhoneError = (msg: string) => {
  centerPhoneError.value = msg || ''
}

onMounted(() => {
  getStates()
})

watch(selectedState, () => {
  handleStateChange()
})
</script>

<template>
  <DashboardLayout>
    <LoadingOverlay v-if="isRedirecting" :message="redirectMessage" />
    <titleSection
      :title="TITLE_SECTION_COMPONENT.concessionaire.new"
      :description="TITLE_SECTION_COMPONENT.concessionaire.newDescription"
    />
    <!-- El resto de tu template permanece exactamente igual -->

    <div class="container mb-5 mt-4 position-relative">
      <!-- Sección principal: Logo + Información general -->
      <div class="row align-items-start mb-4 mt-1 g-4">
        <!-- Logo -->
        <div
          class="col-12 col-md-4 col-lg-3 d-flex flex-column justify-content-center align-items-center"
        >
          <label class="mb-2 fs-5 fw-bold">Banner del concesionario:</label>
          <ImageUploader
            v-model="selectedImage"
            @update:model-value="selectedImage = $event"
            :round="false"
            :initialImageUrl="null"
            :inputDisabled="false"
            :pasteBehavior="'container'"
          />
        </div>

        <!-- Información general -->
        <div class="col-12 col-md-8 col-lg-9">
          <h5 class="mb-3 fw-bold">Información general</h5>

          <!-- Primera fila de datos principales -->
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label mb-1 text-indent">Nombre del negocio</label>
              <input
                type="text"
                class="form-control rounded-3"
                placeholder="Nombre del negocio"
                v-model="concessionaireForm.business_name"
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label mb-1 text-indent">Nombre comercial</label>
              <input
                type="text"
                class="form-control rounded-3"
                placeholder="Nombre comercial"
                v-model="concessionaireForm.trade_name"
              />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label mb-1 text-indent">RIF</label>
              <InputRif v-model="concessionaireForm.rif" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label mb-1 text-indent">Teléfono</label>
              <VenePhone v-model="concessionaireForm.phone" @error="onCenterPhoneError" />
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label mb-1 text-indent">Estado</label>
              <MultiselectCustom
                v-model="selectedState"
                :options="states"
                placeholder="Seleccionar estado"
                helper-type="custom"
                variant="primary"
                :custom-icon-map="customIconMapState"
                :custom-description-map="customDescriptionMapState"
                @select="handleStateChange"
              />
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label mb-1 text-indent">Ciudad</label>
              <MultiselectCustom
                v-model="selectedCity"
                :options="cities"
                placeholder="Seleccionar ciudad"
                helper-type="custom"
                variant="primary"
                :custom-icon-map="customIconMapCity"
                :custom-description-map="customDescriptionMapCity"
                :disabled="!selectedState"
              />
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label mb-1 text-indent">Email</label>
              <input
                type="text"
                class="form-control rounded-3"
                placeholder="Email"
                v-model="concessionaireForm.email"
              />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label mb-1 text-indent">Dirección</label>
              <input
                type="text"
                class="form-control rounded-3"
                placeholder="Dirección"
                v-model="concessionaireForm.address"
              />
            </div>
          </div>

          <!-- Ubicación -->
          <div class="row g-3 mt-1">
            <div class="col-12">
              <CustomLocation
                v-model="googleMapsUrl"
                @coordinates-extracted="handleCoordinates"
                label="Ubicación"
                :placeholder="'Pega la URL de Google Maps o usa la existente'"
              />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label mb-1 text-indent">Longitud</label>
              <input
                type="text"
                class="form-control rounded-3"
                readonly
                placeholder="Longitud"
                v-model="extractedCoords.longitude"
              />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label mb-1 text-indent">Latitud</label>
              <input
                type="text"
                readonly
                class="form-control rounded-3"
                placeholder="Latitud"
                v-model="extractedCoords.latitude"
              />
            </div>
            <div class="col-12 mb-3 h-100 d-flex flex-column">
              <label class="form-label mb-2 fw-bold fs-5">Descripción de los servicios:</label>
              <textarea
                class="form-control rounded-3 h-100 flex-grow-1"
                placeholder="Escribir descripción de los servicios del concesionario..."
                rows="3"
                v-model="concessionaireForm.description_services"
                style="resize: none"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón Guardar -->
      <div class="row mt-4 mb-5">
        <div class="col-12 d-flex justify-content-end">
          <button
            class="btn btn-dark d-flex align-items-center gap-2 px-4 py-2"
            :disabled="isLoading"
            @click="saveConcessionaire"
          >
            <LoadingSpinner v-if="isLoading" />
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
