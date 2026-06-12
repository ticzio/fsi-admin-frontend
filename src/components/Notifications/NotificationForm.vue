<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'

import { useCities } from '@/composables/Models/useCities'
import { useLevels } from '@/composables/Models/useLevels'
import { provideFormValidation } from '@/composables/useFormValidation'

const emit = defineEmits(['close', 'submit'])

const { isFormValid } = provideFormValidation()

const targetOptions = [
  { id: 'general', name: 'General' },
  { id: 'ciudad', name: 'Ciudad' },
  { id: 'niveles', name: 'Niveles' },
]

const form = ref<any>({
  title: '',
  description: '',
  message: '',
  type: 'info',
  audience: null,
})

const dynamicOptions = ref<any[]>([])
const selectedDynamicOption = ref<any>(null)
const isLoadingOptions = ref(false)

const { getCities } = useCities()
const { getLevels } = useLevels()

watch(
  () => form.value.audience,
  async (newVal: any) => {
    dynamicOptions.value = []
    selectedDynamicOption.value = null

    if (!newVal) return

    if (newVal.id === 'ciudad') {
      isLoadingOptions.value = true
      try {
        const cities = await getCities()
        dynamicOptions.value = cities.map((c: any) => ({ id: c.id, name: c.name }))
      } catch (error) {
        console.error(error)
      } finally {
        isLoadingOptions.value = false
      }
    } else if (newVal.id === 'niveles') {
      isLoadingOptions.value = true
      try {
        const response = await getLevels()
        dynamicOptions.value = response.data.map((l: any) => ({ id: l.id, name: l.name }))
      } catch (error) {
        console.error(error)
      } finally {
        isLoadingOptions.value = false
      }
    }
  },
)

const isSubmitting = ref(false)

const handleSubmit = async () => {
  const content = form.value.description || form.value.message
  if (!form.value.title || !content || !form.value.audience) {
    return
  }

  if (
    (form.value.audience.id === 'ciudad' || form.value.audience.id === 'niveles') &&
    !selectedDynamicOption.value
  ) {
    return
  }

  isSubmitting.value = true

  const payload: any = {
    title: form.value.title,
    message: content,
    description: content,
  }

  if (form.value.audience.id === 'ciudad') {
    payload.id_type_city = selectedDynamicOption.value.id
  } else if (form.value.audience.id === 'niveles') {
    payload.id_level = selectedDynamicOption.value.id
  }

  // Simulate API call for good UX (spinner)
  setTimeout(() => {
    isSubmitting.value = false
    emit('submit', payload)

    // Limpiar campos del formulario
    form.value.title = ''
    form.value.description = ''
    form.value.message = ''
    form.value.audience = null
    selectedDynamicOption.value = null
    dynamicOptions.value = []
  }, 800)
}

const handleCancel = () => {
  emit('close')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="notification-form px-1 py-2">
    <div class="row g-4">
      <div class="col-12">
        <MultiselectCustom
          label="Audiencia (Dirigido a) *"
          v-model="form.audience"
          :options="targetOptions"
          placeholder="Seleccionar audiencia..."
          :show-icons="false"
          :show-descriptions="false"
          :rules="[(v) => !!v || 'Debes seleccionar a quién va dirigido']"
        />
      </div>

      <div v-if="form.audience?.id === 'ciudad' || form.audience?.id === 'niveles'" class="col-12">
        <MultiselectCustom
          :label="form.audience.id === 'ciudad' ? 'Seleccionar Ciudad *' : 'Seleccionar Nivel *'"
          v-model="selectedDynamicOption"
          :options="dynamicOptions"
          :placeholder="form.audience.id === 'ciudad' ? 'Buscar ciudad...' : 'Buscar nivel...'"
          :loading="isLoadingOptions"
          :show-icons="false"
          :show-descriptions="false"
          :rules="[
            (v) =>
              !!v ||
              `Debes seleccionar ${form.audience.id === 'ciudad' ? 'una ciudad' : 'un nivel'}`,
          ]"
        />
      </div>

      <div class="col-12">
        <BaseInput
          id="notif-title"
          label="Título de la Notificación *"
          v-model="form.title"
          placeholder="Ej: Mantenimiento programado de plataforma"
          :rules="[
            (v) => !!v || 'El título es un campo obligatorio',
            (v) => (v && v.length <= 100) || 'El título no puede exceder los 100 caracteres',
          ]"
        />
      </div>

      <div class="col-12">
        <BaseTextarea
          id="notif-desc"
          label="Mensaje descriptivo *"
          v-model="form.description"
          placeholder="Detalla aquí el contenido del mensaje que recibirán los usuarios..."
          :rows="5"
          :rules="[
            (v) => !!v || !!form.message || 'La descripción o mensaje es un campo obligatorio',
            (v) => (v && v.length <= 256) || 'El mensaje no puede exceder los 256 caracteres',
          ]"
        />
      </div>
    </div>

    <div class="d-flex flex-column flex-sm-row justify-content-end gap-3 mt-5 pt-4 border-top">
      <button
        type="submit"
        class="btn btn-primary px-5 py-2 fw-semibold rounded-pill shadow-sm submit-btn w-100 w-sm-auto tracking-wide"
        :disabled="isSubmitting || !isFormValid"
      >
        <LoadingSpinner v-if="isSubmitting" class="me-2" />
        <i v-else class="bi bi-send-fill me-2 fs-6"></i>
        {{ isSubmitting ? 'Enviando...' : 'Enviar notificación' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.notification-form {
  color: #1f2937;
}

.cancel-btn {
  background-color: #f3f4f6;
  border-color: #f3f4f6;
  color: #4b5563;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

.submit-btn {
  background-color: #2563eb;
  border-color: #2563eb;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow:
    0 6px 12px -2px rgba(37, 99, 235, 0.25),
    0 3px 6px -2px rgba(37, 99, 235, 0.1) !important;
}

.submit-btn:active {
  transform: translateY(0);
}

.tracking-wide {
  letter-spacing: 0.025em;
}

@media (min-width: 576px) {
  .w-sm-auto {
    width: auto !important;
  }
}
</style>
