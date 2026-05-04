<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import BaseQuillEditor from '@/components/common/BaseQuillEditor.vue'
import type { BenefitInterface } from '@/composables/Models/useBenefits'

const props = defineProps<{
  initialData?: BenefitInterface | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: BenefitInterface): void
  (e: 'cancel'): void
}>()

const formData = ref<BenefitInterface>({
  id: '',
  id_level: '',
  body: '',
})

const error = ref('')

const initForm = () => {
  if (props.initialData) {
    formData.value = { ...props.initialData }
  } else {
    formData.value = {
      id: '',
      id_level: '',
      body: '',
    }
  }
}

onMounted(() => {
  initForm()
})

watch(() => props.initialData, () => {
  initForm()
})

const handleSubmit = () => {
  if (!formData.value.body || formData.value.body === '<p><br></p>') {
    error.value = 'El contenido del beneficio es obligatorio'
    return
  }
  error.value = ''
  emit('submit', formData.value)
}
</script>

<template>
  <div class="benefit-form">
    <div class="mb-4">
      <BaseQuillEditor
        v-model="formData.body"
        label="Descripción del Beneficio"
        placeholder="Escribe los detalles del beneficio aquí..."
        :error="error"
        toolbar="essential"
      />
    </div>

    <div class="d-flex justify-content-end gap-2 mt-4">
      <button
        type="button"
        class="btn btn-light rounded-3 px-4"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="btn btn-success rounded-3 px-4 d-flex align-items-center text-white gap-2"
        @click="handleSubmit"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ initialData?.id ? 'Actualizar Beneficio' : 'Crear Beneficio' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.benefit-form {
  min-height: 250px;
}
</style>
