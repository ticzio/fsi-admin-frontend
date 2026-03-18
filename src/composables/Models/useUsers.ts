import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useLogger } from '@/composables/useLogger'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import { TABLE_PAGINATION } from '@/const/tableConst'
import { useRoles } from '@/composables/Models/useRoles'

export interface UserInterface {
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

export function useUsers() {
  const store = useStore()
  const swalToast = useSwalToast()
  const swal = useSwal()
  const logger = useLogger()
  const { roles, getRoles } = useRoles()

  const loading = ref(false)
  const users = ref<UserInterface[]>([])
  const user = ref<UserInterface | null>(null)

  const paginationKey = 'users-list'
  const pagination = reactive({
    currentPage: TABLE_PAGINATION.currentPage,
    totalPages: TABLE_PAGINATION.totalPages,
    limit: TABLE_PAGINATION.limit,
  })

  /**
   * Obtiene la lista de usuarios paginada y filtrada.
   */
  const getDataUsers = async (page = 1, search = '') => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.user.getAll,
        params: {
          page: page,
          limit: pagination.limit,
          query: search || null,
          active: null,
        },
      })

      if (response.code === 200) {
        users.value = response.data
        pagination.totalPages = response.meta?.last_page || response.last_page
        pagination.currentPage = response.meta?.current_page || response.current_page
      } else {
        swalToast.showError(response.message || 'Error al obtener los usuarios')
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      swalToast.showError(error.message || 'Error de conexión al obtener los usuarios')
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un usuario específico mediante el método del store getData.
   * Útil para buscar por ID o algún parámetro específico.
   */
  const getUser = async (id: string | number) => {
    loading.value = true
    try {
      const response: any = await store.dispatch('getData', {
        url: URLS.user.prefix + '/' + id,
        params: {},
      })

      if (response.code === 200) {
        user.value = response.data
        return response.data
      } else {
        swalToast.showError(response.message || 'Error al obtener el usuario')
      }
    } catch (error: any) {
      console.error('Error fetching user:', error)
      swalToast.showError(error.message || 'Error de conexión al obtener el usuario')
    } finally {
      loading.value = false
    }
  }

  /**
   * Guarda o actualiza un usuario.
   * Maneja el envío de datos incluyendo la imagen.
   */
  const saveUser = async (data: UserInterface, isEditing: boolean, id?: string | number) => {
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
      formData.append('id_pharmacy', String(0))

      if (data.password) formData.append('password', data.password)

      if (data.url_image instanceof File) {
        formData.append('url_image', data.url_image)
      }

      let response: any
      if (isEditing && id) {
        response = await store.dispatch('updateData', {
          url: URLS.user.update,
          id: id,
          data: formData,
        })
      } else {
        response = await store.dispatch('createData', {
          url: URLS.user.save,
          data: formData,
        })
      }

      if (response.code === 200 || response.code === 201) {
        swalToast.showSuccess(
          isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
        )
        await getDataUsers(pagination.currentPage)
        return true
      } else {
        swalToast.showError(response.message || 'Error al guardar el usuario')
        return false
      }
    } catch (error: any) {
      console.error('Error saving user:', error)
      swalToast.showError(error.message || 'Error de conexión al guardar el usuario')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Activa o desactiva un usuario.
   */
  const deactivateUser = async (item: UserInterface) => {
    const isActive = Boolean(item?.active)

    const result = await swal.showConfirm(
      `¿Estás seguro ${isActive ? 'desactivar' : 'activar'} el usuario?`,
      `Esta acción ${isActive ? 'desactivará' : 'activará'} a ${item.first_name} ${item.last_name}.`,
      {
        confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.user.changeStatus,
        id: item.id!,
        status: !isActive ? 1 : 0,
      })
      if (response.code === 200 || response.code === 201) {
        logger.logRequest(URLS.user.changeStatus, {}, response)
        swal.showSuccess('Usuario ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
        await getDataUsers(pagination.currentPage)
        return true
      }
      return false
    } catch (error: any) {
      logger.logRequest(URLS.user.changeStatus, {}, error)
      swalToast.showError(
        `${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.first_name}`,
      )
      return false
    }
  }

  /**
   * Elimina un usuario (status 2).
   */
  const deleteUser = async (item: UserInterface) => {
    const result = await swal.showConfirm(
      `¿Estás seguro de eliminar al usuario ${item.first_name} ${item.last_name}?`,
      `Esta acción eliminará permanentemente el registro.`,
      {
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      },
    )

    if (!result) return false

    try {
      const response = await store.dispatch('changeStatus', {
        url: URLS.user.changeStatus,
        id: item.id!,
        status: 2,
      })
      if (response.code == 200 || response.code == 201) {
        logger.logRequest(URLS.user.changeStatus, {}, response)
        swal.showSuccess('Usuario eliminado exitosamente')
        await getDataUsers(pagination.currentPage)
        return true
      }
      return false
    } catch (error: any) {
      logger.logRequest(URLS.user.changeStatus, {}, error)
      swalToast.showError(`${ERROR.errorDelete} ${item.first_name}`)
      return false
    }
  }

  return {
    loading,
    users,
    user,
    roles,
    pagination,
    paginationKey,
    getDataUsers,
    getUser,
    getRoles,
    saveUser,
    deactivateUser,
    deleteUser,
  }
}
