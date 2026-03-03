<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
//components
import InputRif from '@/components/common/InputRif.vue'
import titleSection from '@/components/common/titleSection.vue'
import VenePhone from '@/components/common/VenePhone.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
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
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'

//functions Helpers
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'

const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()
const { isRedirecting, redirectMessage, redirectToList, redirectToDetails } = useRedirect()
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
})

const selectedState = ref(null)
const selectedCity = ref(null)
// DATA COMPANY END

// var errors
const errors = ref<any>([])
const phoneError = ref('')

const handleStateChange = async () => {
  selectedCity.value = null
  if ((selectedState.value as any)?.id) {
    await getCities((selectedState.value as any).id)
  } else {
    clearCities()
  }
}

const saveCompany = async () => {
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

    const response = await store.dispatch('createData', {
      url: URLS.company.save,
      data: payload,
    })

    logger.logRequest(URLS.company.save, payload, response)

    if (response.code == 201) {
      const result = await swal.showConfirm(
        'Compañia guardada exitosamente!',
        '¿Dónde deseas ir ahora?',
        {
          icon: 'success',
          confirmButtonText: 'Ver detalles',
          cancelButtonText: 'Ir al listado',
          showCancelButton: true,
        }
      )

      if (result) {
        redirectToDetails(`/companies/edit/${response.data.id}/detail-company`)
      } else {
        redirectToList('Empresas')
      }
    } else if (response.code == 400) {
      swal.showConfirm('Ha ocurrido un error', 'Error al guardar los datos de la empresa', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    }
  } catch (error: any) {
    logger.logRequest(URLS.company.save, '', error)
    swalToast.showError(`${ERROR.errorCreate} para la empresa`)
  } finally {
    isLoading.value = false
  }
}

const onPhoneError = (msg: string) => {
  phoneError.value = msg || ''
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
    <div class="container mb-5 mt-4">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.company.new"
        :description="TITLE_SECTION_COMPONENT.company.newDescription"
      />

      <div class="row">
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
                @select="handleStateChange"
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

          <!-- Botón guardar -->
          <div class="d-flex justify-content-end align-items-center border-top pt-4 mt-4">
            <button :class="BUTTONS.new.class" @click="saveCompany" :disabled="isLoading">
              <i :class="BUTTONS.new.icon"></i>
              <span class="ms-1">{{ isLoading ? 'Guardando...' : 'Guardar empresa' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
