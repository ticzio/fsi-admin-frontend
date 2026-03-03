<script setup lang="ts">
import { ref } from 'vue'
import ClientForm from '@/components/Client/ClientForm.vue'
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

const saveClient = async (formData: FormData) => {
  formData.append('profile_completed', '1')
  formData.append('id_company', String(route.params.id_company))

  isLoading.value = true

  try {
    const createUrl = `${URLS.client.prefix}/company_create_client`
    const result = await store.dispatch('createData', {
      url: createUrl,
      data: formData,
    })

    if (result.code == 201 || result.code == 200) {
      logger.logRequest(createUrl, formData, result)

      const goToAssignment = await swal.showConfirm(
        'Cliente creado exitosamente',
        '¿Deseas realizar la asignación de vehículo ahora?',
        {
          icon: 'success',
          confirmButtonText: 'Sí, asignar',
          cancelButtonText: 'No, ir al listado',
        },
      )
      store.dispatch('utils/setIsCreating', true)
      if (goToAssignment) {
        router.push({ name: 'Asignaciones de la Empresa' })
      } else {
        router.push({ name: 'Clientes de la Empresa' })
      }
    } else if (result.code == 409) {
      logger.logRequest(createUrl, formData, result)
      const email = formData.get('email')
      swalToast.showError(`Correo: ${email} ya está en uso.`)
    }
  } catch (error: any) {
    logger.logRequest(`${URLS.client.prefix}/company_create_client`, formData, error)
    swalToast.showError(`${ERROR.errorCreate} cliente`)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mb-5 mt-4">
    <div class="container">
      <ClientForm @save="saveClient" :loading="isLoading" />
    </div>
  </div>
</template>
