<script setup lang="ts">
import { ref, onMounted } from 'vue'
//components
import InputRif from '@/components/common/InputRif.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
//composables
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useRoute } from 'vue-router'
import { useRedirect } from '@/composables/useRedirect'
import { useLogger } from '@/composables/useLogger'
import { useMasters } from '@/composables/Masters/useMasters'

//constants
import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'

//functions Helpers
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'

const store = useStore()
const route = useRoute()
const swal = useSwal()
const swalToast = useSwalToast()
const { isRedirecting, redirectMessage, redirectToList } = useRedirect()
const logger = useLogger()

// Masters composable para states y cities
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

// DATA COMPANY START
const companyForm = ref<any>({
  business_name: '',
  trade_name: '',
  rif: '',
  address: '',
  phone: '',
  email: '',
  id_city: null,
  updated_at: '',
  created_at: '',
})

const selectedState = ref<any>(null)
const selectedCity = ref<any>(null)
// DATA COMPANY END

// var errors
const errors = ref<any>([])
const phoneError = ref('')

const getCompany = async () => {
  const url = `${URLS.company.prefix}/${route.params.id_company}`

  try {
    const response = await store.dispatch('getData', {
      url,
    })
    if (response.code == 200) {
      logger.logRequest(url, {}, response)
      const data = response.data

      store.dispatch('utils/setIsItem', data.business_name || data.trade_name || '')
      companyForm.value = {
        business_name: data.business_name || '',
        trade_name: data.trade_name || '',
        rif: data.rif || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        id_city: data.id_city || null,
        updated_at: data.updated_at || '',
        created_at: data.created_at || '',
      }

      // Si tiene ciudad, cargar el estado y la ciudad
      if (data.city && data.city.id_state) {
        // Buscar y seleccionar el estado
        const stateFound = states.value.find((s: any) => s.id === data.city.id_state)
        if (stateFound) {
          selectedState.value = stateFound
        }
        // Cargar las ciudades del estado
        await loadCitiesByState(data.city.id_state)
        // Seleccionar la ciudad
        const cityFound = cities.value.find((c: any) => c.id === data.city.id)
        if (cityFound) {
          selectedCity.value = cityFound
        }
      }
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    throw error
  }
}

const loadCitiesByState = async (stateId: number) => {
  await getCities(stateId)
}

const updateCompany = async () => {
  errors.value = []
  isLoading.value = true

  if (!companyForm.value.business_name?.trim())
    errors.value.push('Debes ingresar el nombre del negocio')
  if (!companyForm.value.trade_name?.trim()) errors.value.push('Debes ingresar el nombre comercial')
  if (!companyForm.value.rif?.trim()) errors.value.push('Debes ingresar el RIF')
  if (!companyForm.value.phone?.trim()) errors.value.push('Debes ingresar el teléfono')
  if (phoneError.value) errors.value.push(phoneError.value)

  const normalizedEmail = normalizeEmail(companyForm.value.email)
  if (!normalizedEmail) {
    errors.value.push('Debes ingresar el correo')
  } else if (!isValidEmail(normalizedEmail)) {
    errors.value.push('El correo no tiene un formato válido')
  }

  if (!selectedCity.value) {
    errors.value.push('Debes seleccionar una ciudad')
  }
  if (!companyForm.value.address?.trim()) errors.value.push('Debes ingresar la dirección')

  if (errors.value.length > 0) {
    swalToast.showFormErrors(errors.value)
    isLoading.value = false
    return
  }

  try {
    const payload = {
      id_city: (selectedCity.value as any).id,
      email: normalizedEmail,
      address: companyForm.value.address,
      phone: companyForm.value.phone,
      rif: companyForm.value.rif,
      trade_name: companyForm.value.trade_name,
      business_name: companyForm.value.business_name,
    }

    const response = await store.dispatch('updateData', {
      url: URLS.company.update,
      id: route.params.id_company,
      data: payload,
    })

    logger.logRequest(URLS.company.update, payload, response)

    if (response.code == 200) {
      const result = await swal.showConfirm(
        '¡Compañia Actualizada exitosamente!',
        '¿Dónde deseas ir ahora?',
        {
          icon: 'success',
          confirmButtonText: 'Ir al listado',
          cancelButtonText: 'Permanecer en la vista',
          showCancelButton: true,
        }
      )
      if (result) {
        store.dispatch('utils/setIsUpdating', true)
        redirectToList('Empresas')
      } else {
        getCompany()
      }
    } else if (response.code == 400) {
      swal.showConfirm('Ha ocurrido un error', 'Error al actualizar los datos de la empresa', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    }
  } catch (error: any) {
    logger.logRequest(URLS.company.update, '', error)
    swalToast.showError(`${ERROR.errorUpdate} para la empresa`)
  } finally {
    isLoading.value = false
  }
}

const onPhoneError = (msg: string) => {
  phoneError.value = msg || ''
}

const onStateChange = async () => {
  selectedCity.value = null
  if ((selectedState.value as any)?.id) {
    await getCities((selectedState.value as any).id)
  } else {
    clearCities()
  }
}

onMounted(async () => {
  // Primero cargar estados para que estén disponibles al precargar la empresa
  try {
    await getStates()
  } catch {
    swalToast.showError('Error al cargar estados')
  }

  try {
    await getCompany()
    store.dispatch('utils/setIsGetting', true)
  } catch {
    swalToast.showError('Error al cargar empresa')
  }
})
</script>

<template>
  <div class="container mb-5 mt-4">
    <LoadingOverlay v-if="isRedirecting" :message="redirectMessage" />
    <!-- Form -->
    <div class="row">
      <!-- Botón actualizar -->
      <div class="mb-3 d-flex justify-content-between align-items-center border-bottom pb-3">
        <DateTimeBadges
          :created-at="companyForm?.created_at"
          :updated-at="companyForm?.updated_at"
        />
        <button :class="BUTTONS.update.class" @click="updateCompany" :disabled="isLoading">
          <i :class="BUTTONS.update.icon"></i>
          <span class="ms-1">{{ isLoading ? 'Actualizando...' : 'Actualizar empresa' }}</span>
        </button>
      </div>
      <div class="col-12">
        <h5 class="mb-3 fw-bold">Información de la Empresa</h5>

        <div class="row g-3 mb-3">
          <!-- Nombre del negocio -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Nombre del negocio</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
              placeholder="Ingresar nombre del negocio"
              v-model="companyForm.business_name"
            />
          </div>

          <!-- Nombre comercial -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Nombre comercial</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
              placeholder="Ingresar nombre comercial"
              v-model="companyForm.trade_name"
            />
          </div>

          <!-- RIF -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">RIF</label>
            <InputRif v-model="companyForm.rif" />
          </div>

          <!-- Teléfono -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Teléfono</label>
            <VenePhone v-model="companyForm.phone" @error="onPhoneError" />
          </div>

          <!-- Estado -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Estado</label>
            <MultiselectCustom
              v-model="selectedState"
              :options="states"
              placeholder="Seleccionar estado"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapState"
              :custom-description-map="customDescriptionMapState"
              @select="onStateChange"
            />
          </div>

          <!-- Ciudad -->
          <div class="col-12 col-md-6">
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

          <!-- Dirección -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Dirección</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
              placeholder="Ingresar dirección"
              v-model="companyForm.address"
            />
          </div>

          <!-- Correo -->
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Correo</label>
            <input
              type="email"
              class="form-control border-radius-left border-radius-right"
              placeholder="Ingresar correo"
              v-model="companyForm.email"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
