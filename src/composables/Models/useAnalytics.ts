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
  const getBackOfficeAnalytics = async (code_pharmacy: string, code_user: string, id_operator?: any) => {
    loading.value = true
    try {
      const baseUrl = import.meta.env.VITE_CHAT_IFRAME_BACKEND
      
      const requestParams: Record<string, any> = {
        code_pharmacy: code_pharmacy,
        code_user: code_user,
      }

      if (id_operator !== undefined && id_operator !== null && id_operator !== '') {
        requestParams.id_operator = id_operator
      }

      const response: any = await store.dispatch('getData', {
        url: `${baseUrl}/api/1.0/analytics/back_office`,
        params: requestParams,
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

  /**
   * Obtiene las estadísticas de canjes de una farmacia específica.
   * Apunta al endpoint interno analytics/pharmacy/:id_pharmacy.
   */
  const getPharmacyExchangesAnalytics = async (id_pharmacy: number | string) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: `analytics/pharmacy/${id_pharmacy}`,
      })

      if (response.code === 200) {
        return response.data
      } else {
        handleErrorResponse(null, 'No se pudieron cargar los datos de canjes')
        return null
      }
    } catch (error: any) {
      handleErrorResponse(error, 'No se pudieron cargar los datos de canjes')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene los datos analíticos del dashboard principal.
   * Apunta al endpoint interno analytics/backoffice del backend de este proyecto.
   */
  const getDashboardAnalytics = async () => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: 'analytics/backoffice',
      })

      if (response.code === 200) {
        return response.data
      } else {
        handleErrorResponse(null, 'No se pudieron cargar los datos del dashboard')
        return null
      }
    } catch (error: any) {
      handleErrorResponse(error, 'No se pudieron cargar los datos del dashboard')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    getBackOfficeAnalytics,
    getDashboardAnalytics,
    getPharmacyExchangesAnalytics,
  }
}
