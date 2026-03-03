<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import 'vue-multiselect/dist/vue-multiselect.css'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLocationInfo } from '@/composables/useLocationInfo'
import { useLogger } from '@/composables/useLogger'
import { useTableActions } from '@/composables/useTableActions'
import { useMasters } from '@/composables/Masters/useMasters'
//Importaciones de constantes para componentes
import { TABLE_HEADERS, TABLE_PAGINATION, TABLE_ACTIONS } from '@/const/tableConst'
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
const isLoading = ref(false)
const query = ref('')

const clients = ref([])
const selectedState = ref<Item | null>(null)
const selectedCity = ref<Item | null>(null)

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const isCreate = computed(() => route.name === 'Nuevo Cliente')
const isEdit = computed(() => route.name === 'Datos del Cliente')
const isDeleting = computed(() => store.getters['utils/isDeleting'])
const isUpdating = computed(() => store.getters['utils/isUpdating'])
const isCreating = computed(() => store.getters['utils/isCreating'])

const getTableActions = async (item: any) => {
  const actions = getDefaultActions(item)
  const deactivateAction = actions.find((a) => a.name === TABLE_ACTIONS.deactivate.name)

  if (deactivateAction && item.client) {
    const isActive = Boolean(item.client.status ?? item.client.active)
    deactivateAction.icon = !isActive ? 'bi bi-x-circle-fill fs-5' : 'bi bi-check-circle-fill fs-5'
    deactivateAction.class = !isActive
      ? `${TABLE_ACTIONS.deactivate.class} btn btn-warning`
      : `${TABLE_ACTIONS.deactivate.class} btn btn-success`
    deactivateAction.tooltip = !isActive ? 'activar' : 'desactivar'
  }

  return actions
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'edit') {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }
    router.push({ name: 'Datos del Cliente', params: { id_client: item.id } })
  }
  if (actionName === 'deactivate') {
    deactivateClient(item)
  }
  if (actionName === 'delete') {
    deleteClient(item)
  }
}

const deactivateClient = async (item: any) => {
  const isActive = Boolean(item?.client?.status ?? item?.client?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}  cliente?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} ${item.client?.first_name} ${
      item.client?.last_name
    }.`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      id: item.client?.id,
      status: !isActive ? 1 : 0,
    }
    const response = await store.dispatch('changeStatus', {
      url: URLS.client.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.client.changeStatus, payload, response)
      swal.showSuccess('Cliente ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
      getClients()
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.client.changeStatus,
      { id: item.client?.id, status: !isActive ? 1 : 0 },
      error,
    )
    swalToast.showError(
      `${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.client?.first_name} ${
        item.client?.last_name
      }`,
    )
  }
}

const deleteClient = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar a ${item.client?.first_name} ${item.client?.last_name}?`,
    `Esta acción eliminará al cliente ${item.client?.first_name} ${item.client?.last_name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const payload = {
      id: item.client?.id,
      status: 2,
    }
    const response = await store.dispatch('changeStatus', {
      url: URLS.client.changeStatus,
      ...payload,
    })
    if (response.code == 200 || response.code == 201) {
      logger.logRequest(URLS.client.changeStatus, payload, response)
      swal.showSuccess('Cliente eliminado exitosamente')
      getClients()
    }
  } catch (error: any) {
    logger.logRequest(URLS.client.changeStatus, { id: item.client?.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} ${item.client?.first_name} ${item.client?.last_name}`)
  }
}

const getClients = async () => {
  const params = {
    page: pagination.currentPage,
    limit: pagination.limit,
    query: query.value,
    id_company: route.params.id_company,
    id_city: selectedCity.value?.id,
    active: null,
  }

  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: URLS.clientVehicle.getAll,
      params,
    })

    if (response.code === 200) {
      logger.logRequest(URLS.clientVehicle.getAll, params, response)
      clients.value = response.data.data
      pagination.totalPages = response.data.meta.last_page
    }
  } catch (error) {
    logger.logRequest(URLS.clientVehicle.getAll, params, error)
    swalToast.showError(ERROR.errorGet)
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

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  getClients()
}

const clearFilters = () => {
  query.value = ''
  selectedState.value = null
  selectedCity.value = null
  clearCities()
  getClients()
}

const showAddressInfo = async (idCity: number) => {
  await showLocationInfo({
    idCity,
    title: 'Ubicación del cliente',
    showAddress: false,
    showMapsLink: false,
    enableCopy: false,
  })
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
    getClients()
  },
)

watch(selectedState, () => {
  handleStateChange()
})

const goToNew = () => {
  router.push({ name: 'Nuevo Cliente' })
}

onMounted(() => {
  getStates()
  getClients()
})
</script>

<template>
  <div>
    <div class="container-fluid" v-if="!isCreate && !isEdit">
      <!-- Fila de filtros -->
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
          <label for="">Buscar por:</label>
          <div class="input-group rounded-pill">
            <span
              :class="BUTTONS.search.class"
              id="basic-addon1"
              style="cursor: pointer"
              @click="getClients()"
            >
              <i :class="BUTTONS.search.icon"></i>
            </span>
            <input
              type="text"
              class="form-control border-radius-right"
              placeholder="Código, Cédula o nombre"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="query"
              @keyup.enter="getClients()"
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
              @select="getClients()"
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
            @click="clearFilters"
          >
            <i :class="BUTTONS.filter.icon"></i>
          </button>
          <button
            :class="BUTTONS.new.class"
            @click="goToNew"
            :data-title="BUTTONS_TOOLTIPS.client.tooltipTitle"
            :data-tooltip-pos="BUTTONS.new.tooltipPos"
          >
            <i :class="BUTTONS.new.icon"></i>
            <span class="d-none d-md-inline" v-if="!isMobile">
              {{ BUTTONS_TOOLTIPS.client.tooltipTitle }}
            </span>
          </button>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="clients"
          :headers="TABLE_HEADERS.companyClients"
          :actions="getTableActions"
          @action-click="handleTableAction"
          :is-loading="isLoading"
          @change-page="handlePageChange"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
        >
          <template #cell(client.url_image)="{ value }">
            <img
              :src="value || defaultProfileImage"
              :alt="value || 'imagen'"
              class="img-fluid object-fit-cover rounded-pill"
              style="width: 50px; height: 50px"
              @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)"
            />
          </template>
          <template #cell(client.id_city)="{ value }">
            <button
              class="btn btn-sm btn-primary border-0 rounded-pill"
              @click="showAddressInfo(value)"
            >
              <i class="bi bi-geo-alt-fill"></i>
            </button>
          </template>

          <template #cell(client.active)="{ value, item }">
            <StatusBadge
              :value="value"
              :blockedAttempts="item.client?.failed_attempts"
              :blockedThreshold="10"
            />
          </template>
        </CustomTable>
      </div>
    </div>
    <router-view />
  </div>
</template>
