import { ref } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useHandleError } from '@/composables/useHandleError'

export interface LoyaltySettingsInterface {
  id?: number | string
  points_multiplier: string | number
  expiration_days: number | string
  updated_by?: any
  created_at?: string
  updated_at?: string
}

export function useLoyaltySettings() {
  const store = useStore()
  const swalToast = useSwalToast()
  const swal = useSwal()
  const { handleErrorResponse } = useHandleError()

  const loading = ref(false)
  const settings = ref<LoyaltySettingsInterface | null>(null)

  /**
   * Obtiene la configuración de lealtad actual.
   */
  const getLoyaltySettings = async () => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: 'loyalty-settings',
      })

      if (response && response.code === 200) {
        settings.value = response.data
        return response
      } else {
        handleErrorResponse(null, 'No se pudo obtener la configuración de puntaje')
        return null
      }
    } catch (error: any) {
      console.error('Error in getLoyaltySettings:', error)
      handleErrorResponse(error, 'Error al obtener la configuración de puntaje')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza la configuración de lealtad.
   */
  const updateLoyaltySettings = async (data: { points_multiplier: string | number; expiration_days: number | string }) => {
    const confirmed = await swal.showConfirm(
      'Atención',
      '¿Estás seguro de que deseas actualizar la configuración de puntaje?',
      {
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar',
      }
    )
    if (!confirmed) return null

    loading.value = true
    try {
      const response: any = await store.dispatch('updateData', {
        url: 'loyalty-settings',
        id: 'update',
        data,
      })

      if (response && (response.code === 200 || response.code === 201 || response.status === 'OK')) {
        swalToast.showSuccess('Configuración de puntaje actualizada correctamente')
        if (response.data) {
          settings.value = response.data
        }
        return response
      } else {
        handleErrorResponse(null, response.message || 'Error al actualizar la configuración')
        return null
      }
    } catch (error: any) {
      console.error('Error in updateLoyaltySettings:', error)
      handleErrorResponse(error, 'Error al actualizar la configuración de puntaje')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    settings,
    getLoyaltySettings,
    updateLoyaltySettings,
  }
}
