<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import moment from 'moment'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'
import { useMissions } from '@/composables/Models/useMissions'

const props = defineProps<{
  mission: any
}>()

const { updateMissionImage, updateMission, loading } = useMissions()

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
    // Primero actualizar la imagen si hay archivo seleccionado
    if (selectedFile.value) {
      const imageSuccess = await updateMissionImage(props.mission.id, selectedFile.value)
      if (!imageSuccess) return false
    }

    // Luego actualizar los campos según el type
    const dataToUpdate: any = {}

    if (localMission.value.type === 'quantity_date') {
      dataToUpdate.title = localMission.value.title
      dataToUpdate.invoice_quantity = localMission.value.invoice_quantity
      dataToUpdate.start_date = localMission.value.start_date
      dataToUpdate.end_date = localMission.value.end_date
    } else if (localMission.value.type === 'quantity') {
      dataToUpdate.invoice_quantity = localMission.value.invoice_quantity
    } else if (localMission.value.type === 'mount') {
      dataToUpdate.invoice_mount = localMission.value.invoice_mount
    }

    // Si hay datos para actualizar (type no vacío), enviarlos
    if (Object.keys(dataToUpdate).length > 0) {
      const success = await updateMission(props.mission.id, dataToUpdate)
      return success
    }

    // Si no hay datos para actualizar (type vacío), considerar éxito
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
    <DateTimeBadges :updatedAt="localMission.updated_at" :hideCreatedAt="true" class="mb-4"/>
    
    <div class="row g-3">
      <div class="col-12 mb-3">
        <label class="form-label fw-bold">Imagen de la Misión</label>
        <ImageUploader
          :initialImageUrl="localMission.url_image"
          @update:modelValue="handleImageUpdate"
          :inputDisabled="loading"
        />
      </div>

      <!-- CASO 1: quantity_date -->
      <template v-if="localMission.type === 'quantity_date'">
        <div class="col-md-6">
          <BaseInput v-model="localMission.title" id="mission-title" label="Título" />
        </div>

        <div class="col-md-6">
          <BaseInput
            v-model="localMission.invoice_quantity"
            id="mission-invoice-quantity"
            label="Cantidad de Facturas"
            type="number"
          />
        </div>

        <div class="col-md-6">
          <BaseInput
            v-model="localMission.start_date"
            id="mission-start-date"
            label="Fecha de Inicio"
            type="date"
          />
        </div>

        <div class="col-md-6">
          <BaseInput
            v-model="localMission.end_date"
            id="mission-end-date"
            label="Fecha de Fin"
            type="date"
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
      </template>

      <!-- CASO 2: quantity -->
      <template v-else-if="localMission.type === 'quantity'">
        <div class="col-md-6">
          <BaseInput v-model="localMission.title" id="mission-title" label="Título" disabled />
        </div>

        <div class="col-md-6">
          <BaseInput
            v-model="localMission.invoice_quantity"
            id="mission-invoice-quantity"
            label="Cantidad de Facturas"
            type="number"
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
      </template>

      <!-- CASO 3: mount -->
      <template v-else-if="localMission.type === 'mount'">
        <div class="col-md-6">
          <BaseInput v-model="localMission.title" id="mission-title" label="Título" disabled />
        </div>

        <div class="col-md-6">
          <BaseInput
            v-model="localMission.invoice_mount"
            id="mission-invoice-mount"
            label="Monto de Factura"
            type="number"
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
      </template>

      <!-- CASO 4: type vacío o null -->
      <template v-else>
        <div class="col-md-6">
          <BaseInput v-model="localMission.title" id="mission-title" label="Título" disabled />
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
      </template>
    </div>
  </div>
</template>
