<script setup lang="ts">
import { ref, onMounted, reactive, inject, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import UserForm from '@/components/Users/UserForm.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useClients, type ClientInterface } from '@/composables/Models/useClients'
import { useSwalToast } from '@/composables/useSwalToast'

const route = useRoute()
const { getClient, saveClient } = useClients()
const swalToast = useSwalToast()
const isLoading = ref(false)

const targetClient = inject<Ref<ClientInterface | null>>('targetClient')


const form = reactive({
  url_image: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  ci: '',
  born_date: '',
  gender: '',
  id_type_city: '' as string | number,
  type_level: null as any,
  point_level: 0,
  password: '',
  password_confirmation: '',
})

const fetchUserData = async () => {
  if (targetClient?.value) {
    populateForm(targetClient.value)
    return
  }

  isLoading.value = true
  const data = await getClient(route.params.id as string)
  if (data) {
    populateForm(data)
  }
  isLoading.value = false
}

const populateForm = (data: ClientInterface) => {
  form.url_image = (data.url_image as string) || ''
  form.first_name = data.first_name || ''
  form.last_name = data.last_name || ''
  form.email = data.email || ''
  form.phone = data.phone || ''
  form.ci = String(data.ci || '')
  form.born_date = data.born_date ? data.born_date.replace(/\//g, '-') : ''
  form.gender = data.gender || ''
  form.id_type_city = data.id_type_city || ''
  form.type_level = data.type_level || null
  form.point_level = data.point_level || 0
}

watch(
  () => targetClient?.value,
  (newClient) => {
    if (newClient) {
      populateForm(newClient)
    }
  },
  { immediate: true },
)

const updateClient = async () => {
  if (!form.first_name || !form.last_name || !form.email) {
    swalToast.showError('Por favor, completa los campos obligatorios.')
    return
  }
  
  isLoading.value = true
  const clientData = {
    ...form,
    id: route.params.id as string,
  }
  
  await saveClient(clientData as any, true, route.params.id as string)
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
      <UserForm :form="form" :is-edit="true" />
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
