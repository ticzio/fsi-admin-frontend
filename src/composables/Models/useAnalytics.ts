import { ref } from 'vue'
import { useStore } from 'vuex'
import { useHandleError } from '@/composables/useHandleError'

export function useAnalytics() {
  const store = useStore()
  const { handleErrorResponse } = useHandleError()
  const loading = ref(false)

  /**
   * Obtiene los datos de analítica para el back office.
   * Apunta al endpoint /analytics/back_office en la API configurada por VITE_CHAT_IFRAME_BACKEND.
   */
  const getBackOfficeAnalytics = async () => {
    loading.value = true
    try {
      const baseUrl = import.meta.env.VITE_CHAT_IFRAME_BACKEND
      const response: any = await store.dispatch('getData', {
        url: `${baseUrl}/analytics/back_office`,
      })

      if (response.code === 200) {
        return response.data
      } else {
        handleErrorResponse(null, 'Recursos no encontrados')
        return null
      }
    } catch (error: any) {
      handleErrorResponse(error, 'Recursos no encontrados')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    getBackOfficeAnalytics,
  }
}
