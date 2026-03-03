<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'

const props = defineProps<{
  modelValue: boolean
  socialForm: {
    instagram_link: string | null
    facebook_link: string | null
    tiktok_link: string | null
    youtube_link: string | null
  }
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const swalToast = useSwalToast()
const swal = useSwal()
const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const initialState = ref<any>({})

const closeModal = () => {
  emit('update:modelValue', false)
}

const normalize = (val: string | null | undefined) => val?.toString().trim() || ''

const hasAnyLink = computed(() => {
  return (
    !!normalize(props.socialForm.instagram_link) ||
    !!normalize(props.socialForm.facebook_link) ||
    !!normalize(props.socialForm.tiktok_link) ||
    !!normalize(props.socialForm.youtube_link)
  )
})

const hasChanges = computed(() => {
  return (
    normalize(props.socialForm.instagram_link) !== normalize(initialState.value.instagram_link) ||
    normalize(props.socialForm.facebook_link) !== normalize(initialState.value.facebook_link) ||
    normalize(props.socialForm.tiktok_link) !== normalize(initialState.value.tiktok_link) ||
    normalize(props.socialForm.youtube_link) !== normalize(initialState.value.youtube_link)
  )
})

const handleAccept = async () => {
  if (hasChanges.value) {
    emit('save')
  }
  closeModal()
}

const copyToClipboard = async (text: string | null) => {
  if (!text) {
    swalToast.showError('No hay contenido para copiar')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    swalToast.showSuccess('Copiado al portapapeles')
  } catch (err) {
    swalToast.showError('Error al copiar al portapapeles')
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      // Guardar estado inicial al abrir el modal (clonar valores actuales)
      initialState.value = {
        instagram_link: props.socialForm.instagram_link
          ? String(props.socialForm.instagram_link)
          : '',
        facebook_link: props.socialForm.facebook_link ? String(props.socialForm.facebook_link) : '',
        tiktok_link: props.socialForm.tiktok_link ? String(props.socialForm.tiktok_link) : '',
        youtube_link: props.socialForm.youtube_link ? String(props.socialForm.youtube_link) : '',
      }
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
      emit('update:modelValue', false)
    })
  }
})
</script>

<template>
  <div class="modal fade" ref="modalElement" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold">
            <i class="bi bi-share-fill me-2 text-primary"></i>Redes Sociales
          </h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body pt-3">
          <p class="text-muted small mb-4">
            Ingresa los enlaces de las redes sociales del concesionario.
          </p>

          <div class="mb-3">
            <label class="form-label d-flex align-items-center mb-1">
              <i class="bi bi-instagram me-2 text-danger"></i>Instagram
            </label>
            <div class="input-group">
              <input
                type="text"
                class="form-control border-radius-left"
                placeholder="https://instagram.com/..."
                v-model="props.socialForm.instagram_link"
              />
              <button
                class="btn btn-outline-secondary border-radius-right"
                type="button"
                @click="copyToClipboard(props.socialForm.instagram_link)"
                title="Copiar"
              >
                <i class="bi bi-clipboard"></i>
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label d-flex align-items-center mb-1">
              <i class="bi bi-facebook me-2 text-primary"></i>Facebook
            </label>
            <div class="input-group">
              <input
                type="text"
                class="form-control border-radius-left"
                placeholder="https://facebook.com/..."
                v-model="props.socialForm.facebook_link"
              />
              <button
                class="btn btn-outline-secondary border-radius-right"
                type="button"
                @click="copyToClipboard(props.socialForm.facebook_link)"
                title="Copiar"
              >
                <i class="bi bi-clipboard"></i>
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label d-flex align-items-center mb-1">
              <i class="bi bi-tiktok me-2 text-dark"></i>TikTok
            </label>
            <div class="input-group">
              <input
                type="text"
                class="form-control border-radius-left"
                placeholder="https://tiktok.com/@..."
                v-model="props.socialForm.tiktok_link"
              />
              <button
                class="btn btn-outline-secondary border-radius-right"
                type="button"
                @click="copyToClipboard(props.socialForm.tiktok_link)"
                title="Copiar"
              >
                <i class="bi bi-clipboard"></i>
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label d-flex align-items-center mb-1">
              <i class="bi bi-youtube me-2 text-danger"></i>YouTube
            </label>
            <div class="input-group">
              <input
                type="text"
                class="form-control border-radius-left"
                placeholder="https://youtube.com/..."
                v-model="props.socialForm.youtube_link"
              />
              <button
                class="btn btn-outline-secondary border-radius-right"
                type="button"
                @click="copyToClipboard(props.socialForm.youtube_link)"
                title="Copiar"
              >
                <i class="bi bi-clipboard"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer border-top-0 pt-0">
          <button type="button" class="btn btn-primary rounded-pill px-4" @click="handleAccept">
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-radius-left {
  border-top-left-radius: 50rem !important;
  border-bottom-left-radius: 50rem !important;
}
.border-radius-right {
  border-top-right-radius: 50rem !important;
  border-bottom-right-radius: 50rem !important;
}
.input-group .form-control:focus {
  z-index: 3;
}
</style>
