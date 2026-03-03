<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useQRCode } from '@/composables/useQRCode'

interface Props {
  code?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'openModal'): void
}>()

const { generateDataURL } = useQRCode()
const qrDataUrl = ref<string>('')
const hasError = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const defaultImage = '/src/assets/images/changan_imagen_default.png'

const generateQR = async () => {
  if (!props.code) {
    hasError.value = true
    return
  }

  isLoading.value = true
  hasError.value = false

  try {
    qrDataUrl.value = await generateDataURL(props.code, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
  } catch (error) {
    console.error('Error generating QR preview:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

watch(() => props.code, generateQR, { immediate: true })

onMounted(() => {
  generateQR()
})
</script>

<template>
  <div class="qr-preview-container">
    <label class="mb-2 fs-5 fw-bold">Vista previa del QR:</label>

    <!-- Loading State -->
    <div v-if="isLoading" class="qr-preview-box d-flex align-items-center justify-content-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError || !props.code" class="qr-preview-box">
      <img :src="defaultImage" alt="QR no disponible" class="default-image" />
    </div>

    <!-- QR Preview -->
    <div v-else class="qr-preview-box">
      <img :src="qrDataUrl" alt="Vista previa del QR" class="qr-image" />
    </div>

    <!-- Action Button -->
    <div class="mt-3">
      <button
        v-if="!hasError && props.code"
        @click="emit('openModal')"
        class="btn btn-primary w-100 rounded-3"
      >
        <i class="bi bi-qr-code me-2"></i>
        Ver y descargar QR
      </button>
      <div v-else class="alert alert-warning text-center p-2 mb-0" role="alert">
        <small>
          <i class="bi bi-exclamation-triangle me-1"></i>
          El QR no está disponible en este momento, por favor comuníquese con soporte
        </small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-preview-container {
  width: 100%;
}

.qr-preview-box {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  overflow: hidden;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}

.default-image {
  width: 70%;
  height: 70%;
  object-fit: contain;
  opacity: 0.6;
}

.alert-warning {
  font-size: 0.85rem;
  border-radius: 8px;
}
</style>
