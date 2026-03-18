<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OperatorForm from '@/components/Operators/OperatorForm.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useRoute, useRouter } from 'vue-router'
import { useSwalToast } from '@/composables/useSwalToast'
import { useUsers } from '@/composables/Models/useUsers'

const route = useRoute()
const router = useRouter()
const swalToast = useSwalToast()
const { loading, getUser, saveUser } = useUsers()
const form = ref<any>({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role_id: null,
  url_image: '',
  password: '',
  password_confirmation: '',
})

const roleOptions = ref<any[]>([])

const handleSubmit = async () => {
  try {
    const payload = {
      ...form.value,
      id_type_rol_user: 3,
      id_pharmacy: route.params.id_pharmacy,
    }
    const success = await saveUser(payload, true, route.params.id as string)
    if (success) {
      router.push({ name: 'Operadores de la Farmacia' })
    }
  } catch (error) {
    console.error('Error al actualizar:', error)
  }
}

onMounted(async () => {
  if (route.params.id) {
    const data = await getUser(route.params.id as string)
    if (data) {
      form.value = {
        ...form.value,
        ...data,
        password: '',
        password_confirmation: '',
      }
    }
  }
})
</script>

<template>
  <div class="bg-white p-4 rounded-4 border shadow-sm position-relative">
    <LoadingOverlay v-if="loading" />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold text-primary">Información General del Operador</h5>
      <button
        class="btn btn-primary px-4 rounded-3 d-flex align-items-center gap-2"
        @click="handleSubmit"
        :disabled="loading"
      >
        <i class="bi bi-save"></i>
        Guardar Cambios
      </button>
    </div>

    <OperatorForm :form="form" :roleOptions="roleOptions" />
  </div>
</template>
