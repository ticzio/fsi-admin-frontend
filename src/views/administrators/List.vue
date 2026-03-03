<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useTableActions } from '@/composables/useTableActions'
import { useLogger } from '@/composables/useLogger'
import { useMasters } from '@/composables/Masters/useMasters'
//Importaciones de constantes para componentes
import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { URLS } from '@/const/api'
import defaultProfileImage from '@/assets/images/default-profile.png'

interface Item {
  id: string | number
  [key: string]: any
}

const router = useRouter()
const route = useRoute()
const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const logger = useLogger()
const { getDefaultActions } = useTableActions()

// Masters composable para roles
const { roles, customIconMapRole, customDescriptionMapRole, getRoles } = useMasters()

const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const query = ref('')
const selectedRole = ref<Item | null>(null)
const administrators = ref([])
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'administrators-list'

const isCreate = computed(() => route.name === 'Nuevo Administrador')
const isEdit = computed(() => route.name === 'Editar Administrador')
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
    router.push({ name: 'Editar Administrador', params: { id_administrator: item.id } })
  }
  if (actionName === 'deactivate') {
    deactivateAdministrator(item)
  }
  if (actionName === 'delete') {
    deleteAdministrator(item)
  }
}

const deactivateAdministrator = async (item: any) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}  administrador?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} ${item.name} ${item.last_name}.`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      id: item.id,
      status: !isActive ? 1 : 0,
    }
    const response = await store.dispatch('changeStatus', {
      url: URLS.administrator.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.administrator.changeStatus, payload, response)
      swal.showSuccess('Administrador ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
      getAdministrators()
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.administrator.changeStatus,
      { id: item.id, status: !isActive ? 1 : 0 },
      error,
    )
    swalToast.showError(
      `${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.name} ${item.last_name}`,
    )
  }
}

const deleteAdministrator = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${item.first_name} ${item.last_name}?`,
    `Esta acción eliminará al administrador ${item.name} ${item.last_name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      id: item.id,
      status: 2,
    }
    const response = await store.dispatch('changeStatus', {
      url: URLS.administrator.changeStatus,
      ...payload,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.administrator.changeStatus, payload, response)
      swal.showSuccess('Administrador eliminado exitosamente')
      getAdministrators()
    }
  } catch (error: any) {
    logger.logRequest(URLS.administrator.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} ${item.name} ${item.last_name}`)
  }
}

const getAdministrators = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    id_role: selectedRole.value?.id,
    active: null,
  }
  isLoading.value = true
  try {
    const response = await store.dispatch('getData', {
      url: URLS.administrator.getAll,
      params,
    })

    if (response.code === 200) {
      administrators.value = response.data.data
      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
      logger.logRequest(URLS.administrator.getAll, params, response)
    }
  } catch (error) {
    logger.logRequest(URLS.administrator.getAll, params, error)
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

  getAdministrators()
}

const goToNew = () => {
  router.push({ name: 'Nuevo Administrador' })
}

const clearFilters = () => {
  query.value = ''
  selectedRole.value = null
  getAdministrators()
}

// Observa los cambios en las variables de estado de utilidades
watch(
  [() => isDeleting.value, () => isUpdating.value, () => isCreating.value],
  ([newIsDeleting, newIsUpdating, newIsCreating]) => {
    if (newIsDeleting) {
      // Resetea el estado si es necesario
      store.dispatch('utils/setIsDeleting', false)
    }

    if (newIsUpdating) {
      store.dispatch('utils/setIsUpdating', false)
    }

    if (newIsCreating) {
      store.dispatch('utils/setIsCreating', false)
    }
    getAdministrators()
  },
)

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getRoles()
  getAdministrators()
})
</script>

<template>
  <div>
    <DashboardLayout>
      <titleSection
        :title="TITLE_SECTION_COMPONENT.administrator.title"
        :description="TITLE_SECTION_COMPONENT.administrator.description"
      />
      <div class="container-fluid" v-if="!isCreate && !isEdit">
        <!-- Fila de filtros -->
        <div class="row mb-4 align-items-end g-3">
          <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
            <label for="">Buscar por:</label>
            <div class="input-group">
              <span
                :class="BUTTONS.search.class"
                id="basic-addon1"
                style="cursor: pointer"
                @click="getAdministrators()"
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
                @keyup.enter="getAdministrators()"
              />
            </div>
          </div>
          <div class="col-12 col-md-2 d-flex flex-column justify-content-end">
            <MultiselectCustom
              v-model="selectedRole"
              :options="roles"
              placeholder="Rol"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapRole"
              :custom-description-map="customDescriptionMapRole"
              @select="getAdministrators()"
            />
          </div>
          <div class="col gap-2 d-flex align-items-end justify-content-end">
            <button
              :class="BUTTONS.filter.class"
              :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
              :data-tooltip-pos="BUTTONS.filter.tooltipPos"
              @click="clearFilters"
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
            :data="administrators"
            :headers="TABLE_HEADERS.administrator"
            :actions="getTableActions"
            @action-click="handleTableAction"
            :is-loading="isLoading"
            @change-page="handlePageChange"
            :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages"
          >
            <template #cell(url_image)="{ value }">
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
                :blockedAttempts="item.failed_attempts"
                :blockedThreshold="10"
              />
            </template>
          </CustomTable>
        </div>
      </div>
      <router-view />
    </DashboardLayout>
  </div>
</template>
