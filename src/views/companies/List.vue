<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'

//Composables
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { useSwal } from '@/composables/useSwal'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { useTableActions } from '@/composables/useTableActions'
import { useMasters } from '@/composables/Masters/useMasters'

import { TITLE_SECTION_COMPONENT, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'

interface Item {
  id: string | number
  [key: string]: any
}

const router = useRouter()
const swalToast = useSwalToast()
const swal = useSwal()
const store = useStore()
const logger = useLogger()
const { createStatusMaps } = useMultiselectIcons()
const { getDefaultActions } = useTableActions()

// Masters composable para states y cities
const {
  states,
  customIconMapState,
  customDescriptionMapState,
  getStates,
  cities,
  customIconMapCity,
  customDescriptionMapCity,
  getCities,
  clearCities,
} = useMasters()

const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const companies = ref([])
const statuses = ref([
  { id: 1, name: 'Activos' },
  { id: 0, name: 'Inactivos' },
])
const selectedCity = ref<Item | null>(null)
const selectedState = ref<Item | null>(null)
const selectedStatus = ref<Item | null>(null)
const search = ref('')

// Mapas dinámicos para estatus
const customIconMapStatus = ref<Record<string, string>>({})
const customDescriptionMapStatus = ref<Record<string, string>>({})

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'companies-list'

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: Item }) => {
  if (actionName === 'edit') {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }
    router.push(`/companies/edit/${item.id}/detail-company`)
  }
  if (actionName === 'deactivate') {
    deactivateCompany(item)
  }
  if (actionName === 'delete') {
    deleteCompany(item)
  }
}

const getCompanies = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: search.value,
    id_city: selectedCity.value?.id,
    active: selectedStatus.value?.id ?? null,
  }

  isLoading.value = true

  try {
    const response = await store.dispatch('getData', {
      url: URLS.company.getAll,
      params,
    })
    if (response.code == 200) {
      logger.logRequest(URLS.company.getAll, params, response)
      companies.value = response.data?.data || []
      pagination.totalPages = response.data?.meta?.last_page || 1

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.company.getAll, params, error)
    swalToast.showError(`${ERROR.errorGet} para las empresas`)
  } finally {
    isLoading.value = false
  }
}

const handleStateChange = async () => {
  selectedCity.value = null
  if (selectedState.value?.id) {
    await getCities(Number(selectedState.value.id))
  } else {
    clearCities()
  }
}

const deactivateCompany = async (item: Item) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'} la compañia?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} ${item.trade_name}`,
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
      url: URLS.company.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.company.changeStatus, payload, response)
      swal.showSuccess('Compañia ' + (isActive ? 'desactivada' : 'activada') + ' exitosamente')
      getCompanies()
    }
  } catch (error: any) {
    logger.logRequest(URLS.company.changeStatus, { id: item.id, status: !isActive ? 1 : 0 }, error)
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.trade_name}`)
  }
}

const deleteCompany = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${item.trade_name}?`,
    `Esta acción eliminará a la compañia ${item.trade_name}.`,
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
      url: URLS.company.changeStatus,
      ...payload,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.company.changeStatus, payload, response)
      swal.showSuccess('Compañia eliminada exitosamente')
      getCompanies()
    }
  } catch (error: any) {
    logger.logRequest(URLS.company.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} ${item.trade_name}`)
  }
}

const handlePagination = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getCompanies()
}

const goToNew = () => {
  router.push({ name: 'Nueva Empresa' })
}

const initializeStatusMaps = () => {
  // Usar composable para crear mapas de estatus con iconos específicos
  const { iconMap, descriptionMap } = createStatusMaps(statuses.value)

  // Asignar los mapas reactivos
  Object.assign(customIconMapStatus.value, iconMap.value)
  Object.assign(customDescriptionMapStatus.value, descriptionMap.value)
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  initializeStatusMaps()
  getStates()
  getCompanies()
})

// Watch para detectar cambios en el estado seleccionado
watch(selectedState, () => {
  handleStateChange()
})
</script>

<template>
  <DashboardLayout>
    <div>
      <titleSection
        :title="TITLE_SECTION_COMPONENT.company.title"
        :description="TITLE_SECTION_COMPONENT.company.description"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <button :class="BUTTONS.search.class" id="basic-addon1" tabindex="-1">
              <i :class="BUTTONS.search.icon"></i>
            </button>
            <input
              type="text"
              class="form-control border-radius-right border-none-left"
              placeholder="Código, RIF o Nombre de la empresa"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="search"
              @keyup.enter="getCompanies()"
            />
          </div>
        </div>
        <div class="col-12 col-md-2">
          <MultiselectCustom
            v-model="selectedState"
            :options="states"
            placeholder="Estado"
            helper-type="custom"
            variant="primary"
            :custom-icon-map="customIconMapState"
            :custom-description-map="customDescriptionMapState"
          />
        </div>
        <div class="col-12 col-md-2">
          <div class="position-relative">
            <MultiselectCustom
              v-model="selectedCity"
              :options="cities"
              placeholder="Ciudad"
              helper-type="custom"
              variant="primary"
              :custom-icon-map="customIconMapCity"
              :custom-description-map="customDescriptionMapCity"
              :disabled="!selectedState"
              @select="getCompanies()"
            />
            <span
              v-if="selectedState && !selectedCity"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style="z-index: 10000000"
            >
              !
            </span>
          </div>
        </div>
        <div class="col-12 col-md-2">
          <MultiselectCustom
            v-model="selectedStatus"
            :options="statuses"
            placeholder="Estatus"
            helper-type="custom"
            variant="primary"
            :custom-icon-map="customIconMapStatus"
            :custom-description-map="customDescriptionMapStatus"
            @select="getCompanies()"
          />
        </div>
        <div class="col gap-2 d-flex align-items-end justify-content-end">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click="
              ;((selectedState = null),
                (selectedCity = null),
                (selectedStatus = null),
                (search = ''),
                getCompanies())
            "
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>
          <button
            :class="BUTTONS.new.class"
            :data-title="BUTTONS_TOOLTIPS.company.tooltipTitle"
            :data-tooltip-pos="BUTTONS.new.tooltipPos"
            @click="goToNew"
          >
            <i :class="BUTTONS.new.icon"></i>
            <span class="d-none d-md-inline" v-if="!isMobile">
              {{ BUTTONS_TOOLTIPS.company.tooltipTitle }}
            </span>
          </button>
        </div>
      </div>

      <div class="container-fluid mt-2 border rounded-4">
        <CustomTable
          :data="companies"
          :headers="TABLE_HEADERS.company"
          :actions="getTableActions"
          :is-loading="isLoading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          @action-click="handleTableAction"
          @change-page="handlePagination"
        >
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" />
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>
</template>
