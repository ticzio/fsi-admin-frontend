import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useHandleError } from '@/composables/useHandleError'
import { TABLE_PAGINATION } from '@/const/tableConst'

export interface ClientPointInterface {
  id: number | string
  points: number
  description: string
  type: string
  created_at: string
  [key: string]: any
}

export function usePoints() {
  const store = useStore()
  const { handleErrorResponse } = useHandleError()

  const loading = ref(false)
  const pointsHistory = ref<ClientPointInterface[]>([])

  const paginationKey = 'client-points-list'
  const pagination = reactive({
    currentPage: TABLE_PAGINATION.currentPage,
    totalPages: TABLE_PAGINATION.totalPages,
    limit: TABLE_PAGINATION.limit,
  })

  const currentSearch = ref('')

  const getClientPoints = async (idClient: string | number, page = 1, search = '') => {
    currentSearch.value = search
    pointsHistory.value = []
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: `points/client/${idClient}`,
        params: {
          page: page,
          limit: pagination.limit,
          query: search || null,
        },
      })

      if (response.code === 200) {
        pointsHistory.value = response.data
        pagination.totalPages = response.meta?.last_page || response.last_page || 1
        pagination.currentPage = response.meta?.current_page || response.current_page || 1
      } else {
        handleErrorResponse(null, 'Recursos no encontrados')
        pointsHistory.value = []
        pagination.totalPages = 1
      }
    } catch (error: any) {
      handleErrorResponse(error, 'Recursos no encontrados')
      pointsHistory.value = []
      pagination.totalPages = 1
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    pointsHistory,
    pagination,
    paginationKey,
    getClientPoints,
  }
}
