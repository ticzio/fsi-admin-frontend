<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { ICONS_MULTISELECT } from '@/const/multiselectConst'

import { BUTTONS } from '@/const/buttonConst'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

const props = defineProps<{
  show: boolean
  idVehicleModel: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()
const logger = useLogger()
const { updateIconMaps, clearIconMaps } = useMultiselectIcons()

// Ref del modal
const modalRef = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

// Estados
const isSaving = ref(false)

// Datos del maestro
const typeColors = ref<any[]>([])

// Formulario para imagen
const imageForm = ref({
  url_image: null as File | null,
  url_background_mobile: null as File | null,
  url_background_tablet: null as File | null,
})
const selectedColor = ref<any>(null)

// Maps para el multiselect
const customIconMapColor = ref<Record<string, string>>({})
const customDescriptionMapColor = ref<Record<string, string>>({})

// Obtener tipos de colores (maestro)
const getTypeColors = async () => {
  try {
    const response = await store.dispatch('getData', {
      url: URLS.typeColor.getAll,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.typeColor.getAll, {}, response)
      typeColors.value = response.data?.data || response.data || []
      clearIconMaps(customIconMapColor, customDescriptionMapColor)
      updateIconMaps(
        customIconMapColor,
        customDescriptionMapColor,
        typeColors.value,
        ICONS_MULTISELECT.services,
        { dataKey: 'name', descriptionPrefix: 'Color:' },
      )
      typeColors.value.forEach((color: any) => {
        const name = color?.name
        if (!name) return
        customDescriptionMapColor.value[name] = color.hex_color || color.hex || 'Color disponible'
      })
    }
  } catch (error: any) {
    logger.logRequest(URLS.typeColor.getAll, {}, error)
  }
}

// Guardar imagen del modelo de vehículo
const saveImage = async () => {
  // Validaciones
  if (!selectedColor.value) {
    swalToast.showError('Debes seleccionar un color para la imagen')
    return
  }
  if (!imageForm.value.url_image) {
    swalToast.showError('Debes seleccionar una imagen')
    return
  }

  isSaving.value = true
  try {
    // Crear FormData para enviar el archivo
    const formDataObj = new FormData()
    formDataObj.append('id_vehicle_model', props.idVehicleModel || '')
    formDataObj.append('id_type_color', selectedColor.value.id)
    formDataObj.append('url_image', imageForm.value.url_image)
    if (imageForm.value.url_background_mobile) {
      formDataObj.append('url_background_mobile', imageForm.value.url_background_mobile)
    }
    if (imageForm.value.url_background_tablet) {
      formDataObj.append('url_background_tablet', imageForm.value.url_background_tablet)
    }

    const response = await store.dispatch('createData', {
      url: URLS.vehicleModelImage.save,
      data: formDataObj,
    })

    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.vehicleModelImage.save, Object.fromEntries(formDataObj), response)
      swal.showSuccess('Imagen guardada exitosamente')
      resetForm()
      emit('saved')
      emit('close')
    }
  } catch (error: any) {
    logger.logRequest(URLS.vehicleModelImage.save, {}, error)
    swalToast.showError(`${ERROR.errorCreate} imagen`)
  } finally {
    isSaving.value = false
  }
}

// Resetear formulario
const resetForm = () => {
  imageForm.value.url_image = null
  imageForm.value.url_background_mobile = null
  imageForm.value.url_background_tablet = null
  selectedColor.value = null
}

// Cerrar modal
const closeModal = () => {
  if (modalInstance) {
    modalInstance.hide()
  }
}

// Inicializar modal de Bootstrap
onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value, {
      backdrop: 'static',
      keyboard: false,
    })

    // Escuchar evento de cierre del modal
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      resetForm()
      emit('close')
    })
  }
})

// Limpiar al desmontar
onBeforeUnmount(() => {
  if (modalInstance) {
    modalInstance.dispose()
  }
})

// Controlar apertura/cierre del modal
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (typeColors.value.length === 0) {
        getTypeColors()
      }
      modalInstance?.show()
    } else {
      modalInstance?.hide()
    }
  },
)
</script>

<template>
  <!-- Modal Bootstrap -->
  <div
    ref="modalRef"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="modalNewImageLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-primary text-white border-0 py-3">
          <h5 class="modal-title fw-semibold" id="modalNewImageLabel">
            <i class="bi bi-image-fill me-2"></i>
            Nueva Imagen
          </h5>
          <button
            type="button"
            class="btn-close btn-close-white"
            @click="closeModal"
            :disabled="isSaving"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <div class="row g-4">
            <!-- Selector de Color -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-palette me-1 text-primary"></i>
                Color asociado <span class="text-danger">*</span>
              </label>
              <MultiselectCustom
                v-model="selectedColor"
                :options="typeColors"
                placeholder="Seleccionar color"
                helper-type="custom"
                variant="primary"
                :custom-icon-map="customIconMapColor"
                :custom-description-map="customDescriptionMapColor"
              />
              <!-- Preview del color -->
              <div v-if="selectedColor" class="mt-2">
                <span class="badge bg-light text-dark border px-3 py-2">
                  <span class="d-inline-flex align-items-center gap-2">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <span
                      class="rounded-circle border border-2 d-inline-block"
                      :style="{
                        width: '16px',
                        height: '16px',
                        backgroundColor: selectedColor.hex_color || selectedColor.hex || '#ffffff',
                      }"
                    ></span>
                    <span>{{ selectedColor.name }}</span>
                    <small v-if="selectedColor.hex_color || selectedColor.hex" class="text-muted">
                      {{ selectedColor.hex_color || selectedColor.hex }}
                    </small>
                  </span>
                </span>
              </div>
            </div>

            <!-- Uploader de Imagen Principal -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-image me-1 text-primary"></i>
                Imagen Principal <span class="text-danger">*</span>
              </label>
              <ImageUploader
                v-model="imageForm.url_image"
                accepted-formats="image/png, image/jpeg, image/jpg, image/webp"
                :max-size-m-b="5"
                placeholder="Haz click o arrastra una imagen aquí"
              />
            </div>

            <!-- Uploader de Background Mobile -->
            <div class="col-md-6">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-phone me-1 text-primary"></i>
                Fondo Mobile
              </label>
              <ImageUploader
                v-model="imageForm.url_background_mobile"
                accepted-formats="image/png, image/jpeg, image/jpg, image/webp"
                :max-size-m-b="5"
                placeholder="Imagen para móvil"
              />
            </div>

            <!-- Uploader de Background Tablet -->
            <div class="col-md-6">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-tablet me-1 text-primary"></i>
                Fondo Tablet
              </label>
              <ImageUploader
                v-model="imageForm.url_background_tablet"
                accepted-formats="image/png, image/jpeg, image/jpg, image/webp"
                :max-size-m-b="5"
                placeholder="Imagen para tablet"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 py-3">
          <button class="btn btn-primary rounded-pill px-4" @click="saveImage" :disabled="isSaving">
            <i :class="isSaving ? 'bi bi-hourglass-split' : 'bi bi-check-lg'"></i>
            <span class="ms-1">{{ isSaving ? 'Guardando...' : 'Guardar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  border-radius: 1rem !important;
}

.modal-header {
  border-top-left-radius: 1rem !important;
  border-top-right-radius: 1rem !important;
}
</style>
