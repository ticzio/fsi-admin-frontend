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
import { useLocationInfo } from '@/composables/useLocationInfo'
import { useLogger } from '@/composables/useLogger'
import { useTableActions } from '@/composables/useTableActions'
import { useMasters } from '@/composables/Masters/useMasters'
import defaultProfileImage from '@/assets/images/default-profile.png'

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
const { showLocationInfo } = useLocationInfo()
const store = useStore()
const logger = useLogger()
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
const loading = ref(false)
const concessionaires = ref([])
const selectedCity = ref<Item | null>(null)
const selectedState = ref<Item | null>(null)
const search = ref('')

const paginationKey = 'concessionaire-list'
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const handleTableAction = ({ actionName, item }: { actionName: string; item: Item }) => {
  if (actionName === 'edit') {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }

    router.push(`/concessionaire/edit/${item.id}/detail-concessionaire`)
  }
  if (actionName === 'deactivate') {
    deactivateConcessionaire(item)
  }
  if (actionName === 'delete') {
    deleteConcessionaire(item)
  }
}

const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const getConcessionaires = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: search.value,
    id_city: selectedCity.value?.id,
    active: null,
  }

  loading.value = true

  try {
    const response = await store.dispatch('getData', {
      url: URLS.concessionaire.getAll,
      params,
    })
    if (response.code == 200) {
      logger.logRequest(URLS.concessionaire.getAll, params, response)
      concessionaires.value = response.data?.data || []
      pagination.totalPages = response.data?.meta?.last_page || 1

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error) {
    logger.logRequest(URLS.concessionaire.getAll, params, error)
    swalToast.showError(`${ERROR.errorGet} para los concesionarios`)
  } finally {
    loading.value = false
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

const deactivateConcessionaire = async (item: Item) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}  concesionario?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} ${item.trade_name}`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.concessionaire.changeStatus,
      id: item.id,
      status: !isActive ? 1 : 0,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.concessionaire.changeStatus, '', response)
      swal.showSuccess('Concesionario ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
      getConcessionaires()
    }
  } catch (error: any) {
    logger.logRequest(URLS.concessionaire.changeStatus, '', error)
    console.error('Error al cambiar el estado del concesionario:', error)
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.trade_name}`)
  }
}

const deleteConcessionaire = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${item.trade_name}?`,
    `Esta acción eliminará al concesionario ${item.trade_name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.concessionaire.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.concessionaire.changeStatus, '', response)
      swal.showSuccess('Concesionario eliminado exitosamente')
      getConcessionaires()
    }
  } catch (error: any) {
    logger.logRequest(URLS.concessionaire.changeStatus, '', error)
    console.error('Error al eliminar concesionario:', error)
    swalToast.showError(`${ERROR.errorDelete} ${item.trade_name}`)
  }
}

const showAddressInfo = async (item: any) => {
  const address = item.address || 'Sin dirección registrada'
  const idCity = item.id_city

  await showLocationInfo({
    idCity,
    title: 'Ubicación del concesionario',
    subtitle: 'Revisa la información de ubicación:',
    address,
    latitude: item.latitude,
    longitude: item.longitude,
    showAddress: true,
    showMapsLink: true,
    enableCopy: true,
  })
}

const handleTablePagination = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getConcessionaires()
}

const goToNew = () => {
  router.push({ name: 'Nuevo Concesionario' })
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getStates()
  getConcessionaires()
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
        :title="TITLE_SECTION_COMPONENT.concessionaire.title"
        :description="TITLE_SECTION_COMPONENT.concessionaire.description"
      />
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <button
              :class="BUTTONS.search.class"
              @click="getConcessionaires"
              id="basic-addon1"
              tabindex="-1"
            >
              <i :class="BUTTONS.search.icon"></i>
            </button>
            <input
              type="text"
              class="form-control border-radius-right border-none-left"
              placeholder="Código, RIF o nombre de la empresa"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="search"
              @keyup.enter="getConcessionaires()"
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
              @select="getConcessionaires"
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
        <div class="col gap-2 d-flex align-items-end justify-content-end">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click="
              ;((selectedState = null), (selectedCity = null), (search = ''), getConcessionaires())
            "
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>
          <button
            :class="BUTTONS.new.class"
            :data-title="BUTTONS_TOOLTIPS.concessionaire.tooltipTitle"
            :data-tooltip-pos="BUTTONS.new.tooltipPos"
            @click="goToNew"
          >
            <i :class="BUTTONS.new.icon"></i>
            <span class="d-none d-md-inline" v-if="!isMobile">
              {{ BUTTONS_TOOLTIPS.concessionaire.tooltipTitle }}
            </span>
          </button>
        </div>
      </div>

      <div class="container-fluid mt-2 border rounded-4">
        <CustomTable
          :data="concessionaires"
          :headers="TABLE_HEADERS.concessionaire"
          :actions="getTableActions"
          :is-loading="loading"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :limit="pagination.limit"
          :change-page="handleTablePagination"
          @change-page="handleTablePagination"
          @action-click="handleTableAction"
        >
          <template #cell(url_logo)="{ value }">
            <img
              :src="value || defaultProfileImage"
              :alt="value || 'imagen'"
              class="img-fluid object-fit-cover rounded-pill"
              style="width: 50px; height: 50px"
              @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)"
            />
          </template>
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" />
          </template>
          <template #cell(address)="{ item }">
            <button
              class="btn btn-sm btn-primary border-0 rounded-pill"
              @click="showAddressInfo(item)"
            >
              <i class="bi bi-geo-alt-fill"></i>
            </button>
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>
</template>
