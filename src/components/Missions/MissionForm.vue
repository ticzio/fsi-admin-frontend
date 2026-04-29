<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import { useMissions } from '@/composables/Models/useMissions'

const props = defineProps<{
  mission: any
}>()

const { updateMissionImage, loading } = useMissions()

const localMission = ref({ ...props.mission })
const selectedFile = ref<File | null>(null)

watch(
  () => props.mission,
  (newVal) => {
    localMission.value = { ...newVal }
    selectedFile.value = null
  },
  { deep: true },
)

const handleImageUpdate = (file: File | null) => {
  selectedFile.value = file
}

const handleSubmit = async () => {
  if (props.mission?.id) {
    if (selectedFile.value) {
      const success = await updateMissionImage(props.mission.id, selectedFile.value)
      return success
    }
    // Si no hay archivo seleccionado, lo consideramos éxito para permitir cerrar el modal
    return true
  }
  return false
}

defineExpose({
  handleSubmit,
})

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="mission-form">
    <div class="row g-3">
      <div class="col-12 mb-3">
        <label class="form-label fw-bold">Imagen de la Misión</label>
        <ImageUploader
          :initialImageUrl="localMission.url_image"
          @update:modelValue="handleImageUpdate"
          :inputDisabled="loading"
        />
      </div>

      <div class="col-md-6">
        <BaseInput v-model="localMission.title" id="mission-title" label="Título" disabled />
      </div>

      <div class="col-md-6">
        <BaseInput
          v-model="localMission.goal_quantity"
          id="mission-goal"
          label="Cantidad Objetivo"
          type="number"
          disabled
        />
      </div>

      <div class="col-md-6">
        <BaseInput
          v-model="localMission.win_points"
          id="mission-points"
          label="Puntos a Ganar"
          type="number"
          disabled
        />
      </div>

      <div class="col-md-6">
        <BaseInput
          :modelValue="formatDate(localMission.updated_at)"
          id="mission-updated"
          label="Última Actualización"
          disabled
        />
      </div>

      <div class="col-12">
        <BaseTextarea
          v-model="localMission.description"
          id="mission-description"
          label="Descripción"
          disabled
          rows="3"
        />
      </div>
    </div>
  </div>
</template>
