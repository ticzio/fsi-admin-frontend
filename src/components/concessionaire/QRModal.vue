<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQRCode } from '@/composables/useQRCode'

interface Props {
  modelValue: boolean
  code?: string | null
  concessionaireName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { generateDataURL } = useQRCode()
const qrDataUrl = ref<string>('')
const isGenerating = ref<boolean>(false)
const hasError = ref<boolean>(false)

const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const generateQR = async () => {
  if (!props.code) {
    hasError.value = true
    return
  }

  isGenerating.value = true
  hasError.value = false

  try {
    qrDataUrl.value = await generateDataURL(props.code, {
      width: 500,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
  } catch (error) {
    console.error('Error generating QR for modal:', error)
    hasError.value = true
  } finally {
    isGenerating.value = false
  }
}

const downloadQR = () => {
  if (!qrDataUrl.value) return

  const link = document.createElement('a')
  const fileName = props.concessionaireName
    ? `QR_${props.concessionaireName.replace(/\s+/g, '_')}.png`
    : `QR_Concesionario_${props.code}.png`

  link.href = qrDataUrl.value
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      generateQR()
    }
  },
)

watch(() => props.code, generateQR)
</script>

<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    @click.self="show = false"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">
            <i class="bi bi-qr-code me-2"></i>
            Código QR del Concesionario
          </h5>
          <button type="button" class="btn-close" @click="show = false" aria-label="Close"></button>
        </div>

        <!-- Body -->
        <div class="modal-body text-center">
          <!-- Loading State -->
          <div
            v-if="isGenerating"
            class="qr-container d-flex align-items-center justify-content-center"
          >
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Generando QR...</span>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="hasError" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Error al generar el código QR. Por favor, intente nuevamente.
          </div>

          <!-- QR Code Display -->
          <div v-else class="qr-container">
            <img :src="qrDataUrl" alt="Código QR" class="qr-modal-image" />
            <p v-if="concessionaireName" class="mt-3 mb-0 text-muted">
              {{ concessionaireName }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 justify-content-center">
          <button
            v-if="!hasError && !isGenerating"
            @click="downloadQR"
            class="btn btn-success rounded-pill px-4"
          >
            <i class="bi bi-download me-2"></i>
            Descargar QR
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="show" class="modal-backdrop fade show"></div>
</template>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.qr-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.qr-modal-image {
  max-width: 100%;
  width: 400px;
  height: auto;
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  background-color: white;
}

.modal-header {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
}

@media (max-width: 576px) {
  .qr-modal-image {
    width: 100%;
  }

  .modal-dialog {
    margin: 0.5rem;
  }
}
</style>
