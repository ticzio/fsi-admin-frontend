<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'

import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useTableActions } from '@/composables/useTableActions'
import { useLogger } from '@/composables/useLogger'
//Importaciones de constantes para componentes
import { TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { URLS } from '@/const/api'
import defaultProfileImage from '@/assets/images/default-profile.png'

const router = useRouter()
const route = useRoute()
const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const logger = useLogger()
const { getDefaultActions } = useTableActions()
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const query = ref('')
const users = ref([])
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'concessionaire-administrators-list'

const isCreate = computed(() => route.name === 'Nuevo Administrador (Concesionario)')
const isEdit = computed(() => route.name === 'Editar Administrador (Concesionario)')
const isDeleting = computed(() => store.getters['utils/isDeleting'])
const isUpdating = computed(() => store.getters['utils/isUpdating'])
const isCreating = computed(() => store.getters['utils/isCreating'])

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }
    router.replace({ name: 'Editar Administrador (Concesionario)', params: { id_user: item.id } })
  }
  if (actionName === 'deactivate') {
    deactivateUser(item)
  }
  if (actionName === 'delete') {
    deleteUser(item)
  }
}

const deactivateUser = async (item: any) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}  administrador?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} ${item.user.first_name} ${
      item.user.last_name
    }.`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.userConcessionaire.changeStatus,
      id: item.id,
      status: !isActive ? 1 : 0,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.userConcessionaire.changeStatus, {}, response)
      swal.showSuccess('Administrador ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
      getUsers()
    }
  } catch (error: any) {
    logger.logRequest(URLS.userConcessionaire.changeStatus, {}, error)
    swalToast.showError(
      `${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.user.first_name} ${
        item.user.last_name
      }`,
    )
  }
}

const deleteUser = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${item.user.first_name} ${item.user.last_name}?`,
    `Esta acción eliminará al administrador ${item.user.first_name} ${item.user.last_name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.userConcessionaire.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.userConcessionaire.changeStatus, {}, response)
      swal.showSuccess('Administrador eliminado exitosamente')
      getUsers()
    }
  } catch (error: any) {
    logger.logRequest(URLS.userConcessionaire.changeStatus, {}, error)
    swalToast.showError(`${ERROR.errorDelete} ${item.user.first_name} ${item.user.last_name}`)
  }
}

const getUsers = async () => {
  const params = {
    id_concessionaire: route.params.id_concessionaire,
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    active: null,
  }
  isLoading.value = true
  try {
    const response = await store.dispatch('getData', {
      url: URLS.userConcessionaire.getAll,
      params,
    })

    if (response.code === 200) {
      logger.logRequest(URLS.userConcessionaire.getAll, params, response)
      users.value = response.data.data

      if (
        users.value.length === 0 &&
        route.name === 'Administradores (Concesionario)' &&
        query.value === ''
      ) {
        swal.showConfirm(
          'Atención',
          'El concesionario no tiene un gerente para poder ingresar al entorno concesionario, Por favor cree un gerente!',
          {
            showCancelButton: false,
            confirmButtonText: 'Entendido',
          },
        )
      }

      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.userConcessionaire.getAll, params, error)
    swalToast.showError(ERROR.errorGet)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getUsers()
}

// Observa los cambios en las variables de estado de utilidades
watch(
  [() => isDeleting.value, () => isUpdating.value, () => isCreating.value],
  ([newIsDeleting, newIsUpdating, newIsCreating]) => {
    // Solo ejecutar si alguno cambió a true
    if (!newIsDeleting && !newIsUpdating && !newIsCreating) return

    // Resetear estados
    if (newIsDeleting) store.dispatch('utils/setIsDeleting', false)
    if (newIsUpdating) store.dispatch('utils/setIsUpdating', false)
    if (newIsCreating) store.dispatch('utils/setIsCreating', false)

    // Ejecutar solo una vez
    getUsers()
  },
)

const goToNew = () => {
  router.replace({ name: 'Nuevo Administrador (Concesionario)' })
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getUsers()
})
</script>

<template>
  <div>
    <div class="container-fluid" v-if="!isCreate && !isEdit">
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <span
              :class="BUTTONS.search.class"
              id="basic-addon1"
              style="cursor: pointer"
              @click="getUsers()"
            >
              <i :class="BUTTONS.search.icon"></i>
            </span>
            <input
              type="text"
              class="form-control border-radius-right"
              placeholder="Nombre o Correo"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="query"
              @keyup.enter="getUsers()"
            />
          </div>
        </div>
        <div class="col gap-2 d-flex align-items-end justify-content-end">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click=";((query = ''), getUsers())"
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>
          <button :class="BUTTONS.new.class" @click="goToNew">
            <i :class="BUTTONS.new.icon"></i>
            <span class="d-none d-md-inline" v-if="!isMobile"> Nuevo administrador </span>
          </button>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="users"
          :headers="TABLE_HEADERS.user"
          :actions="getTableActions"
          @action-click="handleTableAction"
          :is-loading="isLoading"
          @change-page="handlePageChange"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
        >
          <template #cell(user.url_image)="{ value }">
            <img
              :src="value || defaultProfileImage"
              :alt="value || 'imagen'"
              class="img-fluid object-fit-cover rounded-pill"
              style="width: 50px; height: 50px"
              @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)"
            />
          </template>

          <template #cell(active)="{ value, item }">
            <StatusBadge
              :value="value"
              :blockedAttempts="item.user.failed_attempts"
              :blockedThreshold="10"
            />
          </template>
        </CustomTable>
      </div>
    </div>
    <router-view />
  </div>
</template>
