import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useLogger } from '@/composables/useLogger'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import { TABLE_PAGINATION } from '@/const/tableConst'

export interface PharmacyInterface {
  id: number | string
  name: string
  code: string
  description?: string
  id_type_city?: number | string | null
  ubication?: string
  url_google_map?: string
  lat?: string | number
  lon?: string | number
  url_image?: string | File | null
  url_instagram?: string
  url_whatsapp?: string
  phone?: string
  opening_week?: string
  close_week?: string
  opening_saturday?: string
  close_saturday?: string
  opening_sunday?: string
  close_sunday?: string
  active?: number | boolean
  timestamp?: string
  [key: string]: any
}

export function usePharmacy() {
  const store = useStore()
  const swalToast = useSwalToast()
  const swal = useSwal()
  const logger = useLogger()

  const loading = ref(false)
  const pharmacies = ref<PharmacyInterface[]>([])
  const pharmacy = ref<PharmacyInterface | null>(null)

  const paginationKey = 'pharmacy-list'
  const pagination = reactive({
    currentPage: TABLE_PAGINATION.currentPage,
    totalPages: TABLE_PAGINATION.totalPages,
    limit: TABLE_PAGINATION.limit,
  })

  /**
   * Obtiene la lista de farmacias paginada y filtrada.
   */
  const getDataPharmacies = async (
    page = 1,
    search = '',
    cityId: number | string | null = null,
  ) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.pharmacy.getAll,
        params: {
          page: page,
          limit: pagination.limit,
          query: search || null,
          active: null,
          id_type_cities: cityId || null,
        },
      })

      if (response.code === 200) {
        pharmacies.value = response.data
        pagination.totalPages = response.meta?.last_page || response.last_page
        pagination.currentPage = response.meta?.current_page || response.current_page
      } else {
        swalToast.showError(response.message || 'Error al obtener las farmacias')
      }
    } catch (error: any) {
      console.error('Error fetching pharmacies:', error)
      swalToast.showError(error.message || 'Error de conexión al obtener las farmacias')
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene una farmacia específica mediante su ID.
   */
  const getPharmacy = async (id: string | number) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.pharmacy.prefix + '/' + id,
        params: {},
      })

      if (response.code === 200) {
        pharmacy.value = response.data
        return response.data
      } else {
        swalToast.showError(response.message || 'Error al obtener la farmacia')
      }
    } catch (error: any) {
      console.error('Error fetching pharmacy:', error)
      swalToast.showError(error.message || 'Error de conexión al obtener la farmacia')
    } finally {
      loading.value = false
    }
  }

  /**
   * Guarda o actualiza una farmacia.
   */
  const savePharmacy = async (
    data: PharmacyInterface,
    isEditing: boolean,
    id?: string | number,
  ) => {
    loading.value = true
    try {
      // Validación de campos obligatorios
      const requiredFields = [
        'name',
        'phone',
        'id_type_city',
        'description',
        'ubication',
        'url_google_map',
      ]

      const missingFields = requiredFields.filter((field) => {
        const value = data[field]
        if (value === undefined || value === null) return true
        if (typeof value === 'string' && value.trim() === '') return true
        return false
      })

      if (missingFields.length > 0 || (!isEditing && !data.url_image)) {
        swalToast.showError('Por favor, completa todos los campos obligatorios.')
        loading.value = false
        return false
      }

      const formData = new FormData()

      // Mapear campos base
      const fields = [
        'name',
        'code',
        'description',
        'ubication',
        'url_google_map',
        'lat',
        'lon',
        'url_instagram',
        'url_whatsapp',
        'phone',
        'opening_week',
        'close_week',
        'opening_saturday',
        'close_saturday',
        'opening_sunday',
        'close_sunday',
      ]

      fields.forEach((key) => {
        const value = data[key]
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value))
        }
      })

      // Set City id
      const cityId =
        data.id_type_city && typeof data.id_type_city === 'object'
          ? (data.id_type_city as any).id
          : data.id_type_city

      if (cityId) {
        formData.append('id_type_cities', String(cityId))
      }

      if (data.url_image instanceof File) {
        formData.append('url_image', data.url_image)
      }

      let response: any
      if (isEditing && id) {
        response = await store.dispatch('updateData', {
          url: URLS.pharmacy.update,
          id: id,
          data: formData,
        })
      } else {
        response = await store.dispatch('createData', {
          url: URLS.pharmacy.save,
          data: formData,
        })
      }

      if (response.code === 200 || response.code === 201) {
        swalToast.showSuccess(
          isEditing ? 'Farmacia actualizada correctamente' : 'Farmacia creada correctamente',
        )
        return true
      } else {
        swalToast.showError(response.message || 'Error al guardar la farmacia')
        return false
      }
    } catch (error: any) {
      console.error('Error saving pharmacy:', error)
      swalToast.showError(error.message || 'Error de conexión al guardar la farmacia')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Activa o desactiva una farmacia.
   */
  const deactivatePharmacy = async (item: PharmacyInterface) => {
    const isActive = Boolean(item?.active)

    const result = await swal.showConfirm(
      `¿Estás seguro de ${isActive ? 'desactivar' : 'activar'} la farmacia?`,
      `Esta acción ${isActive ? 'desactivará' : 'activará'} a ${item.name}.`,
      {
        confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.pharmacy.changeStatus,
        id: item.id!,
        status: !isActive ? 1 : 0,
      })
      if (response.code === 200 || response.code === 201) {
        logger.logRequest(URLS.pharmacy.changeStatus, {}, response)
        swal.showSuccess('Farmacia ' + (isActive ? 'desactivada' : 'activada') + ' exitosamente')
        await getDataPharmacies(pagination.currentPage)
        return true
      }
      return false
    } catch (error: any) {
      logger.logRequest(URLS.pharmacy.changeStatus, {}, error)
      swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.name}`)
      return false
    }
  }

  /**
   * Elimina una farmacia de forma lógica.
   */
  const deletePharmacy = async (item: PharmacyInterface) => {
    const result = await swal.showConfirm(
      `¿Estás seguro de eliminar la farmacia ${item.name}?`,
      `Esta acción eliminará permanentemente el registro.`,
      {
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.pharmacy.changeStatus,
        id: item.id!,
        status: 2,
      })
      if (response.code == 200 || response.code == 201) {
        logger.logRequest(URLS.pharmacy.changeStatus, {}, response)
        swal.showSuccess('Farmacia eliminada exitosamente')
        await getDataPharmacies(pagination.currentPage)
        return true
      }
      return false
    } catch (error: any) {
      logger.logRequest(URLS.pharmacy.changeStatus, {}, error)
      swalToast.showError(`${ERROR.errorDelete} ${item.name}`)
      return false
    }
  }

  return {
    loading,
    pharmacies,
    pharmacy,
    pagination,
    paginationKey,
    getDataPharmacies,
    getPharmacy,
    savePharmacy,
    deactivatePharmacy,
    deletePharmacy,
  }
}
