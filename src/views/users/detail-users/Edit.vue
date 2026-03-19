<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import UserForm from '@/components/Users/UserForm.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useClients } from '@/composables/Models/useClients'
import { useSwalToast } from '@/composables/useSwalToast'

const route = useRoute()
const { getClient, saveClient } = useClients()
const swalToast = useSwalToast()
const isLoading = ref(false)

const roleOptions = ref([
  { id: 1, name: 'Administrador' },
  { id: 2, name: 'Cliente' },
  { id: 3, name: 'Soporte' },
])

const form = reactive({
  url_image: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role_id: null as any,
  password: '',
  password_confirmation: '',
})

const fetchUserData = async () => {
  isLoading.value = true
  const data = await getClient(route.params.id as string)
  if (data) {
    form.url_image = data.url_image || ''
    form.first_name = data.first_name || ''
    form.last_name = data.last_name || ''
    form.email = data.email || ''
    form.phone = data.phone || ''
    form.role_id = data.id_type_rol || null
  }
  isLoading.value = false
}

const updateClient = async () => {
  if (!form.first_name || !form.last_name || !form.email || !form.role_id) {
    swalToast.showError('Por favor, completa los campos obligatorios.')
    return
  }
  
  isLoading.value = true
  const clientData = {
    ...form,
    id: route.params.id as string,
    id_type_rol_user: form.role_id
  }
  
  await saveClient(clientData, true, route.params.id as string)
  isLoading.value = false
}

onMounted(() => {
  fetchUserData()
})
</script>

<template>
  <div class="position-relative">
    <LoadingOverlay v-if="isLoading" />
    <form @submit.prevent="updateClient">
      <UserForm :form="form" :roleOptions="roleOptions" :is-edit="true" />
      <div class="mt-4 d-flex justify-content-end">
        <button type="submit" class="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-save-fill"></i>
          Guardar Cambios
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
