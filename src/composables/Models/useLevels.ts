import { ref } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useHandleError } from '@/composables/useHandleError'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

export interface LevelInterface {
  id?: number | string
  name: string
  min_points: number | string
  max_points: number | string
  active?: number | boolean
}

export function useLevels() {
  const store = useStore()
  const swalToast = useSwalToast()
  const { handleErrorResponse } = useHandleError()

  const loading = ref(false)
  const level = ref<LevelInterface | null>(null)

  /**
   * Obtiene todos los niveles activos.
   */
  const getLevels = async (params: any = { limit: 100, active: 1 }) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.level.getAll,
        params,
      })

      return response
    } catch (error: any) {
      console.error('Error in getLevels:', error)
      return { code: 500, message: error.message || 'Error', data: [] }
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un nivel por su ID.
   */
  const getLevelById = async (id: string | number) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: `${URLS.level.prefix}/${id}`,
      })

      if (response.code === 200) {
        level.value = response.data
        return response.data
      } else {
        handleErrorResponse(null, 'Recursos no encontrados')
      }
    } catch (error: any) {
      handleErrorResponse(error, 'Recursos no encontrados')
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza los puntos de un nivel.
   */
  const updateLevelPoints = async (id: string | number, pointsData: { min_points: number | string, max_points: number | string }) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('updateData', {
        url: URLS.level.update,
        id: id,
        data: pointsData,
      })

      if (response.code === 200 || response.code === 201) {
        swalToast.showSuccess('Puntos del nivel actualizados correctamente')
        return true
      } else {
        handleErrorResponse(null, 'Recursos no encontrados')
        return false
      }
    } catch (error: any) {
      handleErrorResponse(error, 'Recursos no encontrados')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    level,
    getLevels,
    getLevelById,
    updateLevelPoints,
  }
}

