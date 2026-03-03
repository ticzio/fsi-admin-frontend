<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import Cookies from 'js-cookie'

//Importaciones de constantes para componentes
import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { URLS } from '@/const/api'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { useTableActions } from '@/composables/useTableActions'
import { ERROR } from '@/const/errorConst'

interface Item {
  id: string | number
  [key: string]: any
}

const router = useRouter()
const swal = useSwal()
const swalToast = useSwalToast()
const store = useStore()
const logger = useLogger()
const { updateIconMaps, clearIconMaps, createStatusMaps } = useMultiselectIcons()
const { getDefaultActions } = useTableActions()
const isMobile = computed(() => store.getters.isMobile)
const loading = ref(false)
const exhibitions = ref<any[]>([])
const cities = ref([])
const statuses = ref([
  { id: 1, name: 'Activos' },
  { id: 0, name: 'Inactivos' },
])
const selectedCity = ref<Item | null>(null)
const selectedStatus = ref<Item | null>(null)
const search = ref('')

const paginationKey = 'exhibition-list'

const customIconMapStatus = ref<Record<string, string>>({})
const customDescriptionMapStatus = ref<Record<string, string>>({})

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

// Manejar acciones de la tabla
const handleTableAction = ({ actionName, item }: { actionName: string; item: Item }) => {
  if (actionName == 'edit') {
    goToEdit(item)
  }
  if (actionName == 'deactivate') {
    deactivateExhibition(item)
  }
  if (actionName == 'delete') {
    deleteExhibition(item)
  }
}

const getExhibitions = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: search.value,
    id_city: selectedCity.value?.id,
    active: selectedStatus.value?.id ?? null,
  }

  loading.value = true
  try {
    const response = await store.dispatch('getData', {
      url: URLS.exhibition.getAll,
      params,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.exhibition.getAll, params, response)
      exhibitions.value = response.data.data
      pagination.totalPages = response.data.meta.last_page

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error: any) {
    logger.logRequest(URLS.exhibition.getAll, params, error)
    swalToast.showError(`${ERROR.errorGet} para las exhibiciones`)
  } finally {
    loading.value = false
  }
}

// Activar/Desactivar exhibición
const deactivateExhibition = async (item: Item) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'} exhibición?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} la exhibición`,
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
      url: URLS.exhibition.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.exhibition.changeStatus, payload, response)
      swal.showSuccess('Exhibición ' + (isActive ? 'desactivada' : 'activada') + ' exitosamente')
      getExhibitions()
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.exhibition.changeStatus,
      { id: item.id, status: !isActive ? 1 : 0 },
      error,
    )
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} exhibición`)
  }
}

// Eliminar exhibición
const deleteExhibition = async (item: Item) => {
  const result = await swal.showConfirm(
    '¿Estás seguro de eliminar esta exhibición?',
    'Esta acción eliminará la exhibición.',
    {
      confirmButtonText: 'Sí, Eliminar',
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
      url: URLS.exhibition.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.exhibition.changeStatus, payload, response)
      swal.showSuccess('Exhibición eliminada exitosamente')
      getExhibitions()
    }
  } catch (error: any) {
    logger.logRequest(URLS.exhibition.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} exhibición`)
  }
}

const clearFilters = () => {
  selectedCity.value = null
  search.value = ''
  selectedStatus.value = null
  getExhibitions()
}

const initializeStatusMaps = () => {
  const { iconMap, descriptionMap } = createStatusMaps(statuses.value)
  Object.assign(customIconMapStatus.value, iconMap.value)
  Object.assign(customDescriptionMapStatus.value, descriptionMap.value)
}

const gotoNew = () => {
  router.push({ name: 'Nueva exhibición' })
}

const goToEdit = (item: Item) => {
  router.push(`/exhibition/edit/${item.id}/${item.id_vehicle_model}/detail-exhibition`)
}

const handlePagination = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getExhibitions()
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  initializeStatusMaps()
  getExhibitions()
})
</script>

<template>
  <DashboardLayout>
    <div>
      <titleSection
        :title="TITLE_SECTION_COMPONENT.exhibition.title"
        :description="TITLE_SECTION_COMPONENT.exhibition.description"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <button
              :class="BUTTONS.search.class"
              id="basic-addon1"
              tabindex="-1"
              @click="getExhibitions"
            >
              <i :class="BUTTONS.search.icon"></i>
            </button>
            <input
              type="text"
              class="form-control border-radius-right border-none-left"
              placeholder="Nombre"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="search"
              @keyup.enter="getExhibitions"
            />
          </div>
        </div>

        <div class="col-12 col-md-3">
          <MultiselectCustom
            v-model="selectedStatus"
            :options="statuses"
            placeholder="Estatus"
            helper-type="custom"
            variant="primary"
            :custom-icon-map="customIconMapStatus"
            :custom-description-map="customDescriptionMapStatus"
            @select="getExhibitions()"
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
          <button
            :class="BUTTONS.new.class"
            :data-title="BUTTONS_TOOLTIPS.vehicle.tooltipTitle"
            :data-tooltip-pos="BUTTONS.new.tooltipPos"
            v-can="'exhibition.create'"
            @click="gotoNew"
          >
            <i :class="BUTTONS.new.icon"></i>
            <span class="d-none d-md-inline" v-if="!isMobile">
              {{ BUTTONS_TOOLTIPS.vehicle.tooltipTitle }}
            </span>
          </button>
        </div>
      </div>

      <div class="container-fluid mt-2 border rounded-4">
        <CustomTable
          :data="exhibitions"
          :headers="TABLE_HEADERS.exhibition"
          :actions="getTableActions"
          :is-loading="loading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          @action-click="handleTableAction"
          @change-page="handlePagination"
        >
          <template #cell(url_file)="{ value }">
            <a v-if="value" :href="value" target="_blank" class="btn btn-sm">
              <i class="bi bi-eye-fill fs-4"></i>
            </a>
            <span v-else class="text-muted">-</span>
          </template>
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" />
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>
</template>
