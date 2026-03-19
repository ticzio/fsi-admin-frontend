<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import OperatorForm from '@/components/Operators/OperatorForm.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useRoute } from 'vue-router'
import { useUsers } from '@/composables/Models/useUsers'

const route = useRoute()
const { saveUser } = useUsers()

const props = defineProps({
  operatorData: {
    type: Object,
    default: null,
  },
})

const isLoading = ref(false)
const form = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role_id: 3, // Rol de operador por defecto
  id_pharmacy: null,
  url_image: '',
  password: '',
  password_confirmation: '',
})

const fillForm = (data: any) => {
  if (!data) return

  form.value = {
    id: data.id || null,
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    email: data.email || '',
    phone: data.phone || '',
    role_id: 3, // Siempre forzar a 3 en este módulo
    id_pharmacy: data.id_pharmacy || null,
    url_image: data.url_image || '',
    password: '',
    password_confirmation: '',
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  try {
    const dataToSave = {
      ...form.value,
      id_type_rol_user: 3, // Siempre 3 para operadores
    }
    const success = await saveUser(dataToSave as any, true, form.value.id!)
    if (success) {
      form.value.password = ''
      form.value.password_confirmation = ''
    }
  } catch (error) {
    console.error('Error al actualizar el operador:', error)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.operatorData,
  (newData) => {
    if (newData) {
      fillForm(newData)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  // Ya no es necesario cargar roles ni datos (se obtienen por props)
})
</script>

<template>
  <div class="bg-white p-4 rounded-4 border shadow-sm position-relative">
    <LoadingOverlay v-if="isLoading" />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold text-primary">Información General del Operador</h5>
      <button
        class="btn btn-primary px-4 rounded-3 d-flex align-items-center gap-2"
        @click="handleSubmit"
        :disabled="isLoading"
      >
        <i class="bi bi-save"></i>
        Guardar Cambios
      </button>
    </div>

    <OperatorForm :form="form" :roleOptions="[]" />
  </div>
</template>
