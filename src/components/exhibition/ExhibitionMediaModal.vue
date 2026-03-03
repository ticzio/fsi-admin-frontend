<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { Modal } from 'bootstrap'
import ImageUploader from '@/components/common/ImageUploader.vue'

const props = defineProps<{
  show: boolean
  isSaving: boolean
  imageData: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', payload: any): void
}>()

// Ref del modal
const modalRef = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

// Formulario
const imageForm = ref({
  url_image: null as File | null,
  active: 1, // Por defecto activo
})

const isEditMode = computed(() => !!props.imageData)

// Resetear formulario
const resetForm = () => {
  imageForm.value = {
    url_image: null,
    active: 1,
  }
}

// Llenar formulario en modo edición
const fillForm = () => {
  if (props.imageData) {
    imageForm.value = {
      // En edición las imágenes ya existen como URL, por lo que los Files son null hasta que el usuario suba algo nuevo
      url_image: null,
      active: props.imageData.active ?? props.imageData.status ?? 1,
    }
  } else {
    resetForm()
  }
}

const handleSave = () => {
  if (!isEditMode.value && !imageForm.value.url_image) {
    // Si es creación, validar que haya imagen
    // useSwalToast() se podría usar aquí, pero preferimos que el validador principal esté en la vista o composable
    // Lanzamos el error temporal
    alert('Debes seleccionar una imagen principal')
    return
  }

  const formDataObj = new FormData()

  if (imageForm.value.url_image) {
    formDataObj.append('url_image', imageForm.value.url_image)
  }

  emit('saved', formDataObj)
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
      fillForm()
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
    aria-labelledby="modalMediaLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-primary text-white border-0 py-3">
          <h5 class="modal-title fw-semibold" id="modalMediaLabel">
            <i class="bi" :class="isEditMode ? 'bi-pencil-square' : 'bi-image-fill'"></i>
            <span class="ms-2">{{ isEditMode ? 'Editar Multimedia' : 'Nueva Multimedia' }}</span>
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
            <!-- Uploader de Imagen Principal -->
            <div class="col-12">
              <label class="form-label fw-semibold text-dark">
                <i class="bi bi-image me-1 text-primary"></i>
                Imagen<span class="text-danger" v-if="!isEditMode">*</span>
              </label>
              <div v-if="isEditMode && props.imageData?.url_image" class="mb-3">
                <small class="text-muted d-block mb-2">Imagen actual:</small>
                <div class="text-center bg-light rounded border p-2 mb-2">
                  <img
                    :src="props.imageData.url_image"
                    alt="Actual"
                    class="img-fluid rounded"
                    style="max-height: 250px; object-fit: contain"
                  />
                </div>
              </div>
              <ImageUploader
                v-model="imageForm.url_image"
                accepted-formats="image/png, image/jpeg, image/jpg, image/webp"
                :max-size-m-b="5"
                placeholder="Haz click o arrastra una imagen aquí"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 py-3">
          <button
            class="btn btn-primary rounded-pill px-4"
            @click="handleSave"
            :disabled="isSaving"
          >
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

/* Switch styling for better appearance */
.form-check-input:checked {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}
.form-check-input {
  width: 3em !important;
  height: 1.5em !important;
  cursor: pointer;
}
</style>
