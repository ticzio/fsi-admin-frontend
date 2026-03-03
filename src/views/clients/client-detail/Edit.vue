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
  failed_attempts: 0,
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
      router.push({ name: 'Clientes' })
      store.dispatch('utils/setIsUpdating', true)
    } else if (result.code == 409) {
      logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: formData }, result)
      const email = formData.get('email')
      swalToast.showError(`Correo: ${email} ya está en uso.`)
    }
  } catch (error: any) {
    if (error?.code == 409 || error?.status == 409) {
      const email = formData.get('email')
      logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: formData }, error)
      swalToast.showError(`Correo: ${email} ya está en uso.`)
    } else {
      logger.logRequest(URLS.client.update, { id: clientForm.value.id, data: formData }, error)
      swalToast.showError(`${ERROR.errorUpdate} cliente`)
    }
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

const unlockClient = async () => {
  const fullName = `${clientForm.value.first_name} ${clientForm.value.last_name}`.trim()
  const attempts = clientForm.value.failed_attempts || 0

  let subtitle = `Esta acción desbloqueará al cliente ${fullName}.`
  if (attempts >= 10) {
    subtitle = `El cliente ha realizado ${attempts} intentos fallidos y se encuentra bloqueado.`
  }

  const confirmed = await swal.showConfirm(
    `¿Estás seguro de desbloquear a ${fullName}?`,
    subtitle,
    {
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!confirmed) return

  const url = `${URLS.client.prefix}/unlock`

  try {
    const response = await store.dispatch('updateData', {
      url,
      id: clientForm.value.id,
      data: {},
    })

    logger.logRequest(url, {}, response)

    if (response.code == 200 || response.code == 201) {
      swal.showSuccess('Cliente desbloqueado exitosamente')
      await getClient()
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    swalToast.showError(`Error al desbloquear a ${fullName}`)
  }
}

const deleteClient = async () => {
  const fullName = `${clientForm.value.first_name} ${clientForm.value.last_name}`.trim()
  const confirmed = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${fullName}?`,
    `Esta acción eliminará al cliente ${fullName}.`,
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
      router.push({ name: 'Clientes' })
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

const getClient = async () => {
  const idFromRoute = route.params.id_client

  if (!idFromRoute) {
    swalToast.showError('No se encontró el ID del cliente')
    router.push({ name: 'Clientes' })
    return
  }

  const url = `${URLS.clientVehicle.prefix}/${idFromRoute}`
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url,
    })

    if (response.code === 200) {
      logger.logRequest(url, {}, response)
      const data = response.data
      clientVehicleId.value = data.id

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
          failed_attempts: client.failed_attempts || 0,
          url_image: client.url_image || null,
          id_city: client.id_city || null,
        }
      }
      store.dispatch('utils/setIsGetting', true)
    }
  } catch (error: any) {
    logger.logRequest(url, {}, error)
    swalToast.showError(`${ERROR.errorGetRegister} cliente`)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await getClient()
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
        :show-unlock="true"
        :show-delete="true"
        :failed-attempts="clientForm.failed_attempts"
        @update="updateClient"
        @update-password="updatePassword"
        @unlock="unlockClient"
        @delete="deleteClient"
      />
    </div>
  </div>
</template>
