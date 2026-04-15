import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useHandleError } from '@/composables/useHandleError'
import { useLogger } from '@/composables/useLogger'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import { TABLE_PAGINATION } from '@/const/tableConst'

export interface BenefitInterface {
  id?: number | string
  id_level: number | string
  body: string
  body_only_text?: string
  active?: number | boolean
  timestamp?: string
}

export function useBenefits() {
  const store = useStore()
  const swalToast = useSwalToast()
  const swal = useSwal()
  const { handleErrorResponse } = useHandleError()
  const logger = useLogger()

  const loading = ref(false)
  const benefits = ref<BenefitInterface[]>([])
  const benefit = ref<BenefitInterface | null>(null)

  const pagination = reactive({
    currentPage: TABLE_PAGINATION.currentPage,
    totalPages: TABLE_PAGINATION.totalPages,
    limit: TABLE_PAGINATION.limit,
  })

  /**
   * Obtiene la lista de beneficios filtrada por id_level.
   */
  const getDataBenefits = async (idLevel: string | number, page = 1, search = '') => {
    benefits.value = []
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.benefit.getAll,
        params: {
          id_levels: idLevel,
          page: page,
          limit: pagination.limit,
          query: search || null,
        },
      })

      if (response.code === 200) {
        benefits.value = response.data
        pagination.totalPages = response.meta?.last_page || response.last_page
        pagination.currentPage = response.meta?.current_page || response.current_page
      } else {
        handleErrorResponse(null, 'Recursos no encontrados')
        benefits.value = []
        pagination.totalPages = 1
      }
    } catch (error: any) {
      handleErrorResponse(error, 'Recursos no encontrados')
      benefits.value = []
      pagination.totalPages = 1
    } finally {
      loading.value = false
    }
  }

  /**
   * Guarda o actualiza un beneficio.
   */
  const saveBenefit = async (data: BenefitInterface, isEditing: boolean) => {
    loading.value = true
    try {
      let response: any
      if (isEditing) {
        response = await store.dispatch('updateData', {
          url: URLS.benefit.update,
          id: data.id,
          data: data,
        })
      } else {
        response = await store.dispatch('createData', {
          url: URLS.benefit.save,
          data: data,
        })
      }

      if (response.code === 200 || response.code === 201) {
        swalToast.showSuccess(
          isEditing ? 'Beneficio actualizado correctamente' : 'Beneficio creado correctamente',
        )
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

  /**
   * Activa o desactiva un beneficio.
   */
  const deactivateBenefit = async (item: BenefitInterface) => {
    const isActive = Boolean(item?.active)
    const result = await swal.showConfirm(
      `¿Estás seguro de ${isActive ? 'desactivar' : 'activar'} el beneficio?`,
      '',
      {
        confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.benefit.changeStatus,
        id: item.id!,
        status: !isActive ? 1 : 0,
      })
      if (response.code === 200 || response.code === 201) {
        swal.showSuccess('Beneficio ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
        return true
      }
      return false
    } catch (error: any) {
      handleErrorResponse(error, ERROR.errorActive)
      return false
    }
  }

  /**
   * Elimina un beneficio.
   */
  const deleteBenefit = async (item: BenefitInterface) => {
    const result = await swal.showConfirm(
      `¿Estás seguro de eliminar el beneficio?`,
      `Esta acción eliminará permanentemente el registro.`,
      {
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.benefit.changeStatus,
        id: item.id!,
        status: 2,
      })
      if (response.code == 200 || response.code == 201) {
        swal.showSuccess('Beneficio eliminado exitosamente')
        return true
      }
      return false
    } catch (error: any) {
      handleErrorResponse(error, ERROR.errorDelete)
      return false
    }
  }

  return {
    loading,
    benefits,
    benefit,
    pagination,
    getDataBenefits,
    saveBenefit,
    deactivateBenefit,
    deleteBenefit,
  }
}
