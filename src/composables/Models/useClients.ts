import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useLogger } from '@/composables/useLogger'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import { TABLE_PAGINATION } from '@/const/tableConst'
import { useRoles } from '@/composables/Models/useRoles'

export interface ClientInterface {
  id: number | string
  id_type_rol_user: number | string
  blocked_at?: string | null
  id_pharmacy?: number | string | null
  count_login?: number
  email: string
  failed_attempts?: number
  first_name: string
  last_name: string
  last_login?: string | null
  password?: string
  phone: string
  url_image?: string | File | null
  active?: number | boolean
  timestamp?: string
}

export function useClients() {
  const store = useStore()
  const swalToast = useSwalToast()
  const swal = useSwal()
  const logger = useLogger()
  const { roles, getRoles } = useRoles()

  const loading = ref(false)
  const clients = ref<ClientInterface[]>([])
  const client = ref<ClientInterface | null>(null)

  const paginationKey = 'clients-list'
  const pagination = reactive({
    currentPage: TABLE_PAGINATION.currentPage,
    totalPages: TABLE_PAGINATION.totalPages,
    limit: TABLE_PAGINATION.limit,
  })

  const currentSearch = ref('')
  const currentExtraParams = ref<any>({})

  /**
   * Obtiene la lista de clientes paginada y filtrada.
   */
  const getDataClients = async (page = 1, search = '', extraParams: any = {}) => {
    currentSearch.value = search
    currentExtraParams.value = extraParams
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.client.getAll, // Modified targeted resource
        params: {
          page: page,
          limit: pagination.limit,
          query: search || null,
          active: null,
          ...extraParams,
        },
      })

      if (response.code === 200) {
        clients.value = response.data
        pagination.totalPages = response.meta?.last_page || response.last_page
        pagination.currentPage = response.meta?.current_page || response.current_page
      } else {
        swalToast.showError(response.message || 'Error al obtener los clientes')
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error)
      swalToast.showError(error.message || 'Error de conexión al obtener los clientes')
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un cliente específico mediante el método del store getData.
   * Útil para buscar por ID o algún parámetro específico.
   */
  const getClient = async (id: string | number) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.client.prefix + '/' + id, // Modified targeted resource
        params: {},
      })

      if (response.code === 200) {
        client.value = response.data
        return response.data
      } else {
        swalToast.showError(response.message || 'Error al obtener el cliente')
      }
    } catch (error: any) {
      console.error('Error fetching client:', error)
      swalToast.showError(error.message || 'Error de conexión al obtener el cliente')
    } finally {
      loading.value = false
    }
  }

  /**
   * Guarda o actualiza un cliente.
   * Maneja el envío de datos incluyendo la imagen.
   */
  const saveClient = async (data: ClientInterface, isEditing: boolean, id?: string | number) => {
    loading.value = true
    try {
      const formData = new FormData()

      // Mapeo de campos requeridos y opcionales
      const roleId =
        data.id_type_rol_user && typeof data.id_type_rol_user === 'object'
          ? (data.id_type_rol_user as any).id
          : data.id_type_rol_user

      formData.append('id_type_rol_user', String(roleId))
      formData.append('email', data.email)
      formData.append('first_name', data.first_name)
      formData.append('last_name', data.last_name)
      formData.append('phone', data.phone)
      formData.append('id_pharmacy', data.id_pharmacy ? String(data.id_pharmacy) : String(0))

      if (data.password) formData.append('password', data.password)

      if (data.url_image instanceof File) {
        formData.append('url_image', data.url_image)
      }

      let response: any
      if (isEditing && id) {
        response = await store.dispatch('updateData', {
          url: URLS.client.update, // Modified targeted resource
          id: id,
          data: formData,
        })
      } else {
        response = await store.dispatch('createData', {
          url: URLS.client.save, // Modified targeted resource
          data: formData,
        })
      }

      if (response.code === 200 || response.code === 201) {
        swalToast.showSuccess(
          isEditing ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente',
        )
        await getDataClients(pagination.currentPage, currentSearch.value, currentExtraParams.value)
        return true
      } else {
        swalToast.showError(response.message || 'Error al guardar el cliente')
        return false
      }
    } catch (error: any) {
      console.error('Error saving client:', error)
      swalToast.showError(error.message || 'Error de conexión al guardar el cliente')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Activa o desactiva un cliente.
   */
  const deactivateClient = async (item: ClientInterface) => {
    const isActive = Boolean(item?.active)

    const result = await swal.showConfirm(
      `¿Estás seguro ${isActive ? 'desactivar' : 'activar'} el cliente?`,
      `Esta acción ${isActive ? 'desactivará' : 'activará'} a ${item.first_name} ${item.last_name}.`,
      {
        confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.client.changeStatus, // Modified targeted resource
        id: item.id!,
        status: !isActive ? 1 : 0,
      })
      if (response.code === 200 || response.code === 201) {
        logger.logRequest(URLS.client.changeStatus, {}, response)
        swal.showSuccess('Cliente ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
        await getDataClients(pagination.currentPage, currentSearch.value, currentExtraParams.value)
        return true
      }
      return false
    } catch (error: any) {
      logger.logRequest(URLS.client.changeStatus, {}, error)
      swalToast.showError(
        `${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.first_name}`,
      )
      return false
    }
  }

  /**
   * Elimina un cliente (status 2).
   */
  const deleteClient = async (item: ClientInterface) => {
    const result = await swal.showConfirm(
      `¿Estás seguro de eliminar al cliente ${item.first_name} ${item.last_name}?`,
      `Esta acción eliminará permanentemente el registro.`,
      {
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.client.changeStatus, // Modified targeted resource
        id: item.id!,
        status: 2,
      })
      if (response.code == 200 || response.code == 201) {
        logger.logRequest(URLS.client.changeStatus, {}, response)
        swal.showSuccess('Cliente eliminado exitosamente')
        await getDataClients(pagination.currentPage, currentSearch.value, currentExtraParams.value)
        return true
      }
      return false
    } catch (error: any) {
      logger.logRequest(URLS.client.changeStatus, {}, error)
      swalToast.showError(`${ERROR.errorDelete} ${item.first_name}`)
      return false
    }
  }

  return {
    loading,
    clients,
    client,
    roles,
    pagination,
    paginationKey,
    getDataClients,
    getClient,
    getRoles,
    saveClient,
    deactivateClient,
    deleteClient,
  }
}
