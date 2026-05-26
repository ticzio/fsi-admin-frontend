<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import moment from 'moment'
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

const formatDate = (dateTime: string | null | undefined): string => {
  if (dateTime) {
    return moment.utc(dateTime, ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss']).local().format('DD-MM-YYYY hh:mm a')
  }
  return ''
}

const formattedUpdatedAt = computed(() => formatDate(localMission.value.updated_at))

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
          :modelValue="formattedUpdatedAt"
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
