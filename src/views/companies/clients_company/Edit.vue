<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ClientForm from '@/components/Client/ClientForm.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useSwal } from '@/composables/useSwal'
import { useRouter, useRoute } from 'vue-router'
import { useSwalToast } from '@/composables/useSwalToast'
import { useStore } from 'vuex'
import { useLogger } from '@/composables/useLogger'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

const router = useRouter()
const route = useRoute()
const store = useStore()
const swalToast = useSwalToast()
const swal = useSwal()
const logger = useLogger()

const isLoading = ref(false)
const isUpdating = ref(false)
const isUpdatingPassword = ref(false)
const clientVehicleId = ref<number | null>(null)

const clientForm = ref({
  id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  dni: '',
  birthday: '',
  created_at: '',
  updated_at: '',
  url_image: null as string | null,
  id_city: null as number | null,
})

const updateClient = async (formData: FormData) => {
  isUpdating.value = true

  try {
    const result = await store.dispatch('updateData', {
      url: URLS.client.update,
      id: clientForm.value.id,
      data: formData,
    })

    if (result.code == 200 || result.code == 201) {
      logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: formData }, result)
      swal.showSuccess('Cliente actualizado exitosamente.')
      store.dispatch('utils/setIsUpdating', true)
      router.push({ name: 'Clientes de la Empresa' })
    } else if (result.code == 409) {
      logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: formData }, result)
      const email = formData.get('email')
      swalToast.showError(`Correo: ${email} ya está en uso.`)
    }
  } catch (error: any) {
    logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: formData }, error)
    swalToast.showError(`${ERROR.errorUpdate} cliente`)
  } finally {
    isUpdating.value = false
  }
}

const updatePassword = async (payload: { password: string }) => {
  isUpdatingPassword.value = true
  try {
    const response = await store.dispatch('updateData', {
      url: URLS.client.update,
      id: clientForm.value.id,
      data: payload,
    })

    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: payload }, response)
      swalToast.showSuccess('Contraseña actualizada exitosamente')
    }
  } catch (error: any) {
    logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: payload }, error)
    swalToast.showError(`${ERROR.errorUpdate} contraseña`)
  } finally {
    isUpdatingPassword.value = false
  }
}

const getClientVehicle = async () => {
  const url = `${URLS.clientVehicle.prefix}/${route.params.id_client}`
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url,
    })

    if (response.code === 200) {
      logger.logRequest(url, {}, response)
      const data = response.data
      clientVehicleId.value = data.id

      // Obtener datos del cliente anidado
      const client = data.client
      if (client) {
        clientForm.value = {
          id: client.id,
          first_name: client.first_name || '',
          last_name: client.last_name || '',
          email: client.email || '',
          phone: client.phone || '',
          dni: client.dni || '',
          birthday: client.birthday || '',
          password: '',
          created_at: client.created_at || '',
          updated_at: client.updated_at || '',
          url_image: client.url_image || null,
          id_city: client.id_city || null,
        }
      }
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    swalToast.showError(`${ERROR.errorGetRegister} cliente`)
  } finally {
    isLoading.value = false
  }
}

const deleteClient = async () => {
  const fullName = `${clientForm.value.first_name} ${clientForm.value.last_name}`.trim()
  const confirmed = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${fullName}?`,
    `Esta acción eliminará al cliente ${fullName} de esta empresa.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!confirmed) return

  try {
    const payload = {
      id: clientVehicleId.value,
      status: 2,
    }
    const response = await store.dispatch('changeStatus', {
      url: URLS.clientVehicle.changeStatus,
      ...payload,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.clientVehicle.changeStatus, payload, response)
      swal.showSuccess('Cliente eliminado exitosamente')
      store.dispatch('utils/setIsDeleting', true)
      router.push({ name: 'Clientes de la Empresa' })
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.clientVehicle.changeStatus,
      { id: clientVehicleId.value, status: 2 },
      error,
    )
    swalToast.showError(`${ERROR.errorDelete} ${fullName}`)
  }
}

onMounted(async () => {
  await getClientVehicle()
})
</script>

<template>
  <div class="mb-5 mt-4">
    <div class="container position-relative">
      <LoadingOverlay v-if="isLoading" message="Cargando datos del cliente" />

      <ClientForm
        v-if="!isLoading"
        :initial-data="clientForm"
        :is-edit="true"
        :loading="isUpdating"
        :loading-password="isUpdatingPassword"
        :show-unlock="false"
        :show-delete="true"
        @update="updateClient"
        @update-password="updatePassword"
        @delete="deleteClient"
      />
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.nav-tabs .nav-link.active {
  border: none;
  border-bottom: 2px solid #222;
  background: none;
  color: #222;
}
.nav-tabs .nav-link {
  border: none;
  background: none;
  color: #bbb;
  font-weight: 500;
}
</style>
