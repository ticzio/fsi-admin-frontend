import { ref } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
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

  const loading = ref(false)
  const level = ref<LevelInterface | null>(null)

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
        swalToast.showError(response.message || ERROR.errorGet)
      }
    } catch (error: any) {
      console.error('Error fetching level:', error)
      swalToast.showError(error.message || ERROR.errorGet)
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
        swalToast.showError(response.message || ERROR.errorUpdate)
        return false
      }
    } catch (error: any) {
      console.error('Error updating level points:', error)
      swalToast.showError(error.message || ERROR.errorUpdate)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    level,
    getLevelById,
    updateLevelPoints,
  }
}
