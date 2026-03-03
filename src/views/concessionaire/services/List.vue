<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import NewServiceModal from './New.vue'
import EditServiceModal from './Edit.vue'

import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useTableActions } from '@/composables/useTableActions'
//Importaciones de constantes para componentes
import { TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'
import { URLS } from '@/const/api'

const route = useRoute()
const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const logger = useLogger()
const { getDefaultActions } = useTableActions()
const isMobile = computed(() => store.getters.isMobile)
const idConcessionaire = computed(() => route.params.id_concessionaire as string)
const isLoading = ref(false)
const query = ref('')

// Estado para los servicios
const services = ref([])
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'concessionaire-services-list'

// Estados para modales
const showNewModal = ref(false)
const showEditModal = ref(false)
const selectedItem = ref<any>(null)

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }
    openEditModal(item)
  }
  if (actionName === 'deactivate') {
    deactivateService(item)
  }
  if (actionName === 'delete') {
    deleteService(item)
  }
}

const deactivateService = async (item: any) => {
  const isActive = Boolean(item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro de ${isActive ? 'desactivar' : 'activar'} el servicio?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} el servicio ${
      item.type_service?.name || item.code
    }.`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      url: URLS.concessionaireService.changeStatus,
      id: item.id,
      status: !isActive ? 1 : 0,
    }

    const response = await store.dispatch('changeStatus', {
      url: payload.url,
      id: payload.id,
      status: payload.status,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.concessionaireService.changeStatus, payload, response)
      swal.showSuccess('Servicio ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
      getServices()
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.concessionaireService.changeStatus,
      { id: item.id, status: !isActive ? 1 : 0 },
      error,
    )
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} el servicio`)
  }
}

const deleteService = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar el servicio?`,
    `Esta acción eliminará el servicio ${item.type_service?.name || item.code}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      url: URLS.concessionaireService.changeStatus,
      id: item.id,
      status: 2,
    }

    const response = await store.dispatch('changeStatus', {
      url: payload.url,
      id: payload.id,
      status: payload.status,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.concessionaireService.changeStatus, payload, response)
      swal.showSuccess('Servicio eliminado exitosamente')
      getServices()
    }
  } catch (error: any) {
    logger.logRequest(URLS.concessionaireService.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} el servicio`)
  }
}

const getServices = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    id_concessionaire: route.params.id_concessionaire,
    active: null,
  }

  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: URLS.concessionaireService.getAll,
      params,
    })

    if (response.code === 200) {
      logger.logRequest(URLS.concessionaireService.getAll, params, response)
      services.value = response.data.data
      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.concessionaireService.getAll, params, error)
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

  getServices()
}

// Funciones para modales
const openNewModal = () => {
  showNewModal.value = true
}

const openEditModal = (item: any) => {
  selectedItem.value = item
  showEditModal.value = true
}

const handleSaved = () => {
  getServices()
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getServices()
})
</script>

<template>
  <div class="container-fluid">
    <!-- Modales -->
    <NewServiceModal
      :show="showNewModal"
      :idConcessionaire="idConcessionaire"
      @close="showNewModal = false"
      @saved="handleSaved"
    />

    <EditServiceModal
      :show="showEditModal"
      :idConcessionaire="idConcessionaire"
      :serviceData="selectedItem"
      @close="showEditModal = false"
      @saved="handleSaved"
    />

    <!-- Fila de filtros -->
    <div class="row mb-4 align-items-end g-3">
      <div class="col-md-5 ps-4">
        <button
          :class="BUTTONS.filter.class"
          :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
          :data-tooltip-pos="BUTTONS.filter.tooltipPos"
          @click=";((query = ''), getServices())"
        >
          <i :class="BUTTONS.filter.icon"></i>
        </button>
      </div>
      <div class="col-12 col-md-7">
        <div class="col mb-0 gap-2 d-flex align-items-end justify-content-end">
          <button
            @click="openNewModal()"
            :class="BUTTONS.new.class"
            :data-title="BUTTONS_TOOLTIPS.concessionaireService.tooltipTitle"
            :data-tooltip-pos="BUTTONS.new.tooltipPos"
          >
            <i :class="BUTTONS.new.icon"></i>
            <span v-if="!isMobile">
              {{ BUTTONS_TOOLTIPS.concessionaireService.tooltipTitle }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="container-fluid border rounded-4 mt-2">
      <CustomTable
        :data="services"
        :headers="TABLE_HEADERS.concessionaireService"
        :actions="getTableActions"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @change-page="handlePageChange"
        :is-loading="isLoading"
        @action-click="handleTableAction"
      >
        <template #cell(is_available)="{ value }">
          <span :class="value ? 'badge bg-success' : 'badge bg-secondary'">
            {{ value ? 'Sí' : 'No' }}
          </span>
        </template>

        <template #cell(value_points)="{ value }">
          {{ Math.trunc(Number(value)) }}
        </template>

        <template #cell(active)="{ value }">
          <StatusBadge :value="value" :extra-class="isMobile ? 'w-100' : 'w-50'" />
        </template>
      </CustomTable>
    </div>
  </div>
</template>
