<script setup lang="ts">
import AssignDriverModal from '@/components/Company/AssignDriverModal.vue'
import { ref, computed, onMounted, reactive, watch } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import 'vue-multiselect/dist/vue-multiselect.css'
import UnderConstruction from '@/components/common/UnderConstruction.vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
//Importaciones de constantes para componentes
import { TABLE_HEADERS, TABLE_ACTIONS, TABLE_PAGINATION } from '@/const/tableConst'
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
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const query = ref('')

const clients = ref([])
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

const getTableActions = (item: any) => [
  {
    name: TABLE_ACTIONS.edit.name,
    icon: TABLE_ACTIONS.edit.icon,
    class: TABLE_ACTIONS.edit.class,
    tooltip: TABLE_ACTIONS.edit.tooltip,
  },
  {
    name: TABLE_ACTIONS.deactivate.name,
    icon: !item.active ? 'bi bi-x-circle-fill fs-5' : 'bi bi-check-circle-fill fs-5',
    class: !item.active
      ? `${TABLE_ACTIONS.deactivate.class} btn btn-warning`
      : `${TABLE_ACTIONS.deactivate.class} btn btn-success`,
    tooltip: !item.active ? 'activar' : 'desactivar',
  },
  {
    name: TABLE_ACTIONS.delete.name,
    icon: TABLE_ACTIONS.delete.icon,
    class: TABLE_ACTIONS.delete.class,
    tooltip: TABLE_ACTIONS.delete.tooltip,
  },
]

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
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}  el Vehículo?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} el Vehículo con placa ${item.vehicle?.license_plate}.`,
    {
      confirmButtonText: `${isActive ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.clientVehicle.changeStatus,
      id: item.id,
      status: !isActive ? 1 : 0,
    })
    if (response.code === 200 || response.code === 201) {
      swal.showSuccess('Vehículo ' + (isActive ? 'desactivado' : 'activado') + ' exitosamente')
      getClients()
    }
  } catch (error: any) {
    console.error('Error al cambiar el estado del Vehículo:', error)
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive} ${item.code}`)
  }
}

const deleteClient = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar el Vehículo con placa ${item.vehicle?.license_plate}?`,
    `Esta acción eliminará el Vehículo con placa ${item.vehicle?.license_plate}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.clientVehicle.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      swal.showSuccess('Vehículo eliminado exitosamente')
      getClients()
    }
  } catch (error: any) {
    console.error('Error al eliminar Vehículo:', error)
    swalToast.showError(`${ERROR.errorDelete} ${item.code}`)
  }
}

const getClients = async () => {
  try {
    isLoading.value = true
    const response = await store.dispatch('getData', {
      url: URLS.clientVehicle.getAll,
      params: {
        page: pagination.currentPage,
        limit: pagination.limit,
        query: query.value,
        id_company: route.params.id_company,
        active: null,
      },
    })

    if (response.code === 200) {
      clients.value = response.data.data
      pagination.totalPages = response.data.meta.last_page
    }
  } catch (error) {
    console.error(error)
    swalToast.showError(ERROR.errorGet)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  getClients()
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

// ... existing imports

const showAssignModal = ref(false)

const driversList = computed(() => {
  return clients.value.map((item: any) => ({
    ...item,
    name: item.client ? `${item.client.first_name} ${item.client.last_name}` : 'Desconocido',
    first_name: item.client?.first_name || '',
    dni: item.client?.dni || '',
  }))
})

// ... existing code

const goToNew = () => {
  // router.push({ name: 'Nuevo Cliente' }) // User probably wants the modal now instead of this?
  showAssignModal.value = true
}

const handleAssignDriver = (data: any) => {
  console.log('Assigning driver:', data)
  // Logic to assign driver to vehicle will go here
  swal.showSuccess('Funcionalidad de asignación en desarrollo')
}

onMounted(() => {
  getClients()
})
</script>

<template>
  <div>
    <div class="container-fluid" v-if="!isCreate && !isEdit">
      <div class="row mb-4 align-items-end g-3">
        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
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
              placeholder="Nombre o Correo"
              aria-label="Username"
              aria-describedby="basic-addon1"
              inputmode="search"
              enterkeyhint="search"
              v-model="query"
              @keyup.enter="getClients()"
            />
          </div>
        </div>
        <div class="col gap-2 d-flex align-items-end justify-content-end">
          <button
            :class="BUTTONS.filter.class"
            :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
            :data-tooltip-pos="BUTTONS.filter.tooltipPos"
            @click=";((query = ''), getClients())"
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
            <span class="d-none d-md-inline" v-if="!isMobile">Asignar Vehículo </span>
          </button>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="clients"
          :headers="TABLE_HEADERS.companyAssignament"
          :actions="getTableActions"
          @action-click="handleTableAction"
          :is-loading="isLoading"
          @change-page="handlePageChange"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
        >
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" />
          </template>
        </CustomTable>
      </div>
      <AssignDriverModal
        v-model:show="showAssignModal"
        :drivers="driversList"
        @save="handleAssignDriver"
      />
    </div>
    <router-view />
  </div>
</template>
