<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import VenePhone from '@/components/common/VenePhone.vue'
import InputRif from '@/components/common/InputRif.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import CustomLocation from '@/components/common/CustomLocation.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
import SocialMediaModal from '@/components/concessionaire/SocialMediaModal.vue'
import QRPreview from '@/components/concessionaire/QRPreview.vue'
import QRModal from '@/components/concessionaire/QRModal.vue'
import ScheduleModal from '@/components/concessionaire/ScheduleModal.vue'

import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useRedirect } from '@/composables/useRedirect'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { useDayScheduleModel } from '@/composables/useDayScheduleModel'
import { URLS } from '@/const/api'
import { BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'
import { normalizeEmail, isValidEmail } from '@/utils/funcEmails'
import { buildGoogleMapsSearchUrl } from '@/utils/funcLocation'

const route = useRoute()
const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()
const { isRedirecting, redirectMessage, redirectToList, redirectToDetails } = useRedirect()
const logger = useLogger()
const { updateIconMaps } = useMultiselectIcons()

const isUpdate = ref<boolean>(false)
const showSocialModal = ref<boolean>(false)
const showQRModal = ref<boolean>(false)
const showScheduleModal = ref<boolean>(false)
const isMobile = computed(() => store.getters.isMobile)

// DATA CONCESSIONAIRE START
const concessionaireForm = ref<any>({
  id: null,
  code: '',
  business_name: '',
  trade_name: '',
  rif: '',
  address: '',
  description_services: '',
  phone: '',
  email: '',
  id_city: null,
  latitude: '',
  longitude: '',
  instagram_link: '',
  facebook_link: '',
  tiktok_link: '',
  youtube_link: '',
  created_at: '',
  updated_at: '',
})

const selectedCity = ref<any>(null)
const customIconMapCity = ref<Record<string, string>>({})
const customDescriptionMapCity = ref<Record<string, string>>({})
const cities = ref<any[]>([])

const selectedImage = ref<File | null>(null)
const initialImageUrl = ref<string | null>(null)

//DATA TABLE CONCESSIONAIRE END

//DATA TABLE CONCESSIONAIRE END

const { hasSchedules, getDaySchedules } = useDayScheduleModel()

// Para manejar la URL y coordenadas en la vista de edición
const googleMapsUrl = ref<string>('')
const extractedCoords = ref<{ latitude: string; longitude: string }>({
  latitude: '',
  longitude: '',
})

const centerPhoneError = ref('')
const errors = ref<any[]>([])

const hasSocialLinks = computed(() => {
  return (
    !!concessionaireForm.value.instagram_link ||
    !!concessionaireForm.value.facebook_link ||
    !!concessionaireForm.value.youtube_link
  )
})

const completionPercentage = computed(() => {
  // 1. General Info (50%)
  const generalFields = [
    concessionaireForm.value.business_name,
    concessionaireForm.value.trade_name,
    concessionaireForm.value.rif,
    concessionaireForm.value.phone,
    concessionaireForm.value.email,
    concessionaireForm.value.address,
    concessionaireForm.value.description_services,
    selectedCity.value,
  ]
  const filledGeneral = generalFields.filter((field) => !!field).length
  const generalScore = (filledGeneral / generalFields.length) * 50

  // 2. Social Media (15%)
  const socialScore = hasSocialLinks.value ? 15 : 0

  // 3. Schedules (35%)
  const scheduleScore = hasSchedules.value ? 35 : 0

  return Math.round(generalScore + socialScore + scheduleScore)
})

// ==================== FUNCIONES DE CARGA DE DATOS ====================

const getConcessionaire = async () => {
  const url = `${URLS.concessionaire.prefix}/${route.params.id_concessionaire}`

  try {
    const response = await store.dispatch('getData', {
      url,
    })

    if (response.code === 200) {
      logger.logRequest(url, {}, response)
      const data = response.data
      store.dispatch('utils/setIsItem', data.business_name || data.trade_name)
      concessionaireForm.value = {
        id: data.id,
        code: data.code || '',
        business_name: data.business_name || '',
        trade_name: data.trade_name || '',
        rif: data.rif || '',
        address: data.address || '',
        description_services: data.description_services || '',
        phone: data.phone || '',
        email: data.email || '',
        id_city: data.id_city || null,
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        instagram_link: data.instagram_link || '',
        facebook_link: data.facebook_link || '',
        tiktok_link: data.tiktok_link || '',
        youtube_link: data.youtube_link || '',
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
      }

      // Cargar coordenadas
      extractedCoords.value.latitude = data.latitude || ''
      extractedCoords.value.longitude = data.longitude || ''
      googleMapsUrl.value = buildGoogleMapsSearchUrl(data.latitude, data.longitude).url

      // Cargar ciudad si existe
      if (data.city) {
        selectedCity.value = data.city
      }

      // Cargar imagen si existe
      if (data.url_logo) {
        initialImageUrl.value = data.url_logo
      }
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    throw error
  }
}

const getCities = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.city.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.city.getAll, {}, response)
      cities.value = response.data || []

      updateIconMaps(
        customIconMapCity,
        customDescriptionMapCity,
        response.data,
        ICONS_MULTISELECT.city,
        {
          dataKey: 'name',
          descriptionPrefix: 'Ciudad:',
        },
      )
    }
  } catch (error: any) {
    logger.logRequest(URLS.city.getAll, {}, error)
    throw error
  }
}

// ==================== FUNCIONES DE ACTUALIZACIÓN ====================

const updateConcessionaire = async () => {
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

  isUpdate.value = true
  try {
    // Usar FormData para enviar imagen junto con los datos
    const formData = new FormData()
    formData.append('id', String(concessionaireForm.value.id))
    if (selectedCity.value?.id) {
      formData.append('id_city', String(selectedCity.value.id))
    }
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
    // Agregar imagen si se seleccionó una nueva
    if (selectedImage.value) {
      formData.append('url_logo', selectedImage.value)
    }
    formData.append('instagram_link', concessionaireForm.value.instagram_link || '')
    formData.append('facebook_link', concessionaireForm.value.facebook_link || '')
    formData.append('tiktok_link', concessionaireForm.value.tiktok_link || '')
    formData.append('youtube_link', concessionaireForm.value.youtube_link || '')

    const response = await store.dispatch('updateData', {
      url: URLS.concessionaire.update,
      id: route.params.id_concessionaire,
      data: formData,
    })

    logger.logRequest(URLS.concessionaire.update, formData, response)

    if (response.code === 200 || response.code === 201) {
      const result = await swal.showConfirm(
        'Concesionario actualizado exitosamente!',
        '¿Dónde deseas ir ahora?',
        {
          icon: 'success',
          confirmButtonText: 'Ir al listado',
          cancelButtonText: 'Permanecer en la vista',
          showCancelButton: true,
        },
      )
      if (result) {
        store.dispatch('utils/setIsUpdating', true)
        redirectToList('Concesionarios')
      } else {
        getConcessionaire()
      }
    } else if (response.code === 409) {
      swalToast.showError(response.alert || 'El email ya está registrado')
    } else {
      swal.showConfirm('Ha ocurrido un error', 'Error al actualizar los datos del concesionario', {
        icon: 'error',
        confirmButtonText: 'Aceptar',
      })
    }
  } catch (error: any) {
    logger.logRequest(URLS.concessionaire.update, '', error)
    if (error.code === 409) {
      swalToast.showError(error.alert || 'El email ya está registrado')
    } else {
      swalToast.showError(`${ERROR.errorUpdate || ERROR.errorCreate} para el concesionario`)
    }
  } finally {
    isUpdate.value = false
  }
}

const updateSocialMedia = async () => {
  try {
    const formData = new FormData()
    formData.append('id', String(route.params.id_concessionaire))
    formData.append('instagram_link', concessionaireForm.value.instagram_link || '')
    formData.append('facebook_link', concessionaireForm.value.facebook_link || '')
    formData.append('tiktok_link', concessionaireForm.value.tiktok_link || '')
    formData.append('youtube_link', concessionaireForm.value.youtube_link || '')

    const response = await store.dispatch('updateData', {
      url: URLS.concessionaire.update,
      id: route.params.id_concessionaire,
      data: formData,
    })

    if (response.code === 200 || response.code === 201) {
      swalToast.showSuccess('Redes sociales actualizadas correctamente')
    } else {
      swalToast.showError('Error al actualizar redes sociales')
    }
  } catch (error) {
    logger.logRequest(URLS.concessionaire.update, '', error)
    swalToast.showError('Error al actualizar redes sociales')
  }
}

const onCoordsExtracted = (coords: { latitude: string; longitude: string } | null) => {
  if (coords) {
    extractedCoords.value.latitude = coords.latitude
    extractedCoords.value.longitude = coords.longitude
    googleMapsUrl.value = buildGoogleMapsSearchUrl(coords.latitude, coords.longitude).url
  } else {
    extractedCoords.value.latitude = ''
    extractedCoords.value.longitude = ''
  }
}

const onCenterPhoneError = (msg: string) => {
  centerPhoneError.value = msg || ''
}

// ==================== LIFECYCLE ====================

onMounted(async () => {
  const [citiesResult, concessionaireResult, schedulesResult] = await Promise.allSettled([
    getConcessionaire(),
    getCities(),
    getDaySchedules(),
  ])

  if (citiesResult.status === 'rejected') {
    swalToast.showError('Error al cargar ciudades')
  }
  if (concessionaireResult.status === 'fulfilled') {
    store.dispatch('utils/setIsGetting', true)
  } else {
    swalToast.showError('Error al cargar concesionario')
  }
  if (schedulesResult.status === 'rejected') {
    swalToast.showError('Error al cargar horarios')
  }

  // Verificar si no tiene horarios y mostrar alerta
  if (!hasSchedules.value) {
    setTimeout(() => {
      swal.showConfirm(
        'Atención',
        'Este concesionario aún no tiene horarios asignados. Es importante definirlos para la correcta operación.',
        {
          icon: 'warning',
          confirmButtonText: 'Entendido',
          showCancelButton: false,
        },
      )
    }, 500)
  }
})
</script>

<template>
  <div class="container mb-5 mt-4 position-relative">
    <LoadingOverlay v-if="isRedirecting" :message="redirectMessage" />
    <div class="mb-2 d-flex justify-content-between align-items-center border-bottom pb-3">
      <span class="badge bg-secondary fs-6">CÓDIGO: {{ concessionaireForm.code }}</span>
      <DateTimeBadges
        :created-at="concessionaireForm.created_at"
        :updated-at="concessionaireForm.updated_at"
      />
      <button
        :class="BUTTONS.update.class"
        data-title="Actualizar Centro"
        data-tooltip-pos="left"
        @click="updateConcessionaire"
      >
        <i :class="BUTTONS.update.icon"></i>
        <span class="ms-1" v-if="!isMobile">{{
          isUpdate ? 'Actualizando...' : 'Actualizar concesionario'
        }}</span>
      </button>
    </div>
    <div class="col-12 col-md-12 d-flex justify-content-start gap-4 mb-4 align-items-center">
      <!-- Botón de Horarios -->
      <div class="position-relative">
        <button
          class="btn rounded-3 d-flex align-items-center gap-2"
          :class="hasSchedules ? 'btn-outline-success' : 'btn-outline-danger'"
          @click="showScheduleModal = true"
        >
          <i class="bi bi-calendar-event"></i>
          Ver horarios
        </button>
        <span
          v-if="!hasSchedules"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
        >
          <i class="bi bi-exclamation-lg"></i>
        </span>
      </div>

      <!-- Botón de Redes Sociales -->
      <div class="position-relative">
        <button
          class="btn rounded-3 d-flex align-items-center gap-2"
          :class="hasSocialLinks ? 'btn-outline-success' : 'btn-outline-danger'"
          @click="showSocialModal = true"
        >
          <i class="bi bi-share-fill"></i>
          <span>Redes sociales</span>
        </button>
        <span
          v-if="!hasSocialLinks"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
        >
          <i class="bi bi-exclamation-lg"></i>
        </span>
      </div>

      <!-- Círculo de Progreso -->
      <div class="d-flex align-items-center gap-2 ms-auto">
        <span class="fw-bold text-muted">Completado:</span>
        <div
          class="position-relative d-flex justify-content-center align-items-center"
          style="width: 50px; height: 50px"
        >
          <svg class="w-100 h-100 transform-rotate-90" viewBox="0 0 36 36">
            <!-- Background Circle -->
            <path
              class="text-gray-200"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e6e6e6"
              stroke-width="3"
            />
            <!-- Progress Circle -->
            <path
              class="text-primary"
              :stroke-dasharray="`${completionPercentage}, 100`"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              :stroke="completionPercentage === 100 ? '#198754' : '#0d6efd'"
              stroke-width="3"
            />
          </svg>
          <span
            class="position-absolute small fw-bold"
            :class="completionPercentage === 100 ? 'text-success' : 'text-primary'"
          >
            {{ completionPercentage }}%
          </span>
        </div>
      </div>
    </div>

    <SocialMediaModal
      v-model="showSocialModal"
      :socialForm="concessionaireForm"
      @save="updateSocialMedia"
    />
    <!-- Datos principales del centro -->
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
          :initialImageUrl="initialImageUrl"
          :inputDisabled="false"
          :pasteBehavior="'container'"
        />

        <!-- QR Preview Component -->
        <div class="mt-4">
          <QRPreview
            :code="concessionaireForm.code ? String(concessionaireForm.code) : null"
            @openModal="showQRModal = true"
          />
        </div>
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
              class="form-control border-radius-left border-radius-right"
              placeholder="Nombre del negocio"
              v-model="concessionaireForm.business_name"
            />
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Nombre comercial</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
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
            <label class="form-label mb-1 text-indent">Ciudad</label>
            <MultiselectCustom
              v-model="selectedCity"
              :options="cities"
              placeholder="Seleccionar ciudad"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapCity"
              :custom-description-map="customDescriptionMapCity"
            />
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Email</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
              placeholder="Email"
              v-model="concessionaireForm.email"
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Dirección</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
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
              @coordinates-extracted="onCoordsExtracted"
              label="Ubicación"
              :placeholder="'Pega la URL de Google Maps o usa la existente'"
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label mb-1 text-indent">Longitud</label>
            <input
              type="text"
              class="form-control border-radius-left border-radius-right"
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
              class="form-control border-radius-left border-radius-right"
              placeholder="Latitud"
              v-model="extractedCoords.latitude"
            />
          </div>
          <div class="col-12 mb-3 h-100 d-flex flex-column">
            <label class="form-label mb-2 fw-bold fs-5">Descripción de los servicios:</label>
            <textarea
              class="form-control rounded-4 h-100 flex-grow-1"
              placeholder="Escribir descripción de los servicios del concesionario..."
              rows="3"
              v-model="concessionaireForm.description_services"
              style="resize: none"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Modal -->
    <QRModal
      v-model="showQRModal"
      :code="concessionaireForm.code ? String(concessionaireForm.code) : null"
      :concessionaire-name="concessionaireForm.trade_name || concessionaireForm.business_name"
    />

    <ScheduleModal
      v-model="showScheduleModal"
      :concessionaire-id="String(route.params.id_concessionaire)"
      @saved="getDaySchedules"
    />
  </div>
</template>
