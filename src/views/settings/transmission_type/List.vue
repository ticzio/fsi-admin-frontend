<script setup lang="ts">
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import MasterNewModal from '@/components/master_modal/MasterNewModal.vue'
import MasterEditModal from '@/components/master_modal/MasterEditModal.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

import { ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { URLS } from '@/const/api'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'

import {
  TITLE_SECTION_COMPONENT,
  TABLE_HEADERS,
  TABLE_ACTIONS,
  TABLE_PAGINATION,
} from '@/const/tableConst'
import { BUTTONS, BUTTONS_TOOLTIPS } from '@/const/buttonConst'
import { ERROR } from '@/const/errorConst'

const swal = useSwal()
const swalToast = useSwalToast()
const { logRequest } = useLogger()
const { createIconMaps } = useMultiselectIcons()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const typesTransmission = ref([])
const queryName = ref('')
const modalRef = ref()
const modalEditRef = ref()
const selectedItem = ref({ id: '', name: '' })

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

// Función para generar acciones dinámicas según el estado de la ciudad
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
    tooltip: !item.active ? 'Desactivar' : 'Activar',
  },
  {
    name: TABLE_ACTIONS.delete.name,
    icon: TABLE_ACTIONS.delete.icon,
    class: TABLE_ACTIONS.delete.class,
    tooltip: TABLE_ACTIONS.delete.tooltip,
  },
]

const getTypesTransmission = () => {
  isLoading.value = true
  store
    .dispatch('getData', {
      url: URLS.typeTransmission.getAll,
      params: {
        active: null,
        page: pagination.currentPage,
        limit: pagination.limit,
        query: queryName.value,
      },
    })
    .then((response: any) => {
      if (response.code == 200) {
        typesTransmission.value = response.data.data
        pagination.totalPages = response.data.meta.last_page
        logRequest(
          URLS.typeTransmission.getAll,
          { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
          response,
        )
      }
    })
    .catch((error: any) => {
      logRequest(
        URLS.typeTransmission.getAll,
        { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
        error,
      )
      swalToast.showError(ERROR.errorGet)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const deactivateTypeTransmission = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de ${item.active ? 'desactivar' : 'activar'} el tipo de transmisión ?`,
    `Esta acción ${item.active ? 'desactivará' : 'activará'} el tipo de transmisión ${item.name}.`,
    {
      confirmButtonText: `${item.active ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.typeTransmission.changeStatus,
      id: item.id,
      status: !item.active ? 1 : 0,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(
        URLS.typeTransmission.changeStatus,
        { id: item.id, status: !item.active ? 1 : 0 },
        response,
      )
      swal.showSuccess(
        `${item.active ? 'Desactivado' : 'Activado'} el tipo de transmisión ${item.name}`,
      )
      getTypesTransmission()
    }
  } catch (error: any) {
    logRequest(
      URLS.typeTransmission.changeStatus,
      { id: item.id, status: !item.active ? 1 : 0 },
      error,
    )
    swalToast.showError(
      `${item.active ? ERROR.errorDeactive : ERROR.errorActive} el tipo de transmisión ${item.name}`,
    )
  }
}
const deleteTypeTransmission = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar el tipo de transmisión?`,
    `Esta acción eliminará el tipo de transmisión ${item.name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.typeTransmission.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(URLS.typeTransmission.changeStatus, { id: item.id, status: 2 }, response)
      swal.showSuccess(`El tipo de transmisión ${item.name} ha sido eliminado exitosamente`)
      getTypesTransmission()
    }
  } catch (error: any) {
    logRequest(URLS.typeTransmission.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} el tipo de transmisión ${item.name}`)
  }
}

const handleAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === TABLE_ACTIONS.deactivate.name) {
    deactivateTypeTransmission(item)
  }
  if (actionName === TABLE_ACTIONS.delete.name) {
    deleteTypeTransmission(item)
  }
  if (actionName === TABLE_ACTIONS.edit.name) {
    if (!item.active) {
      swalToast.showError(ERROR.errorEdited)
      return
    }
    openEditModal(item)
  }
}

const openModal = () => {
  modalRef.value.openModal()
}

const openEditModal = (item: any) => {
  selectedItem.value = item
  modalEditRef.value.openModal()
}

const handleSaved = () => {
  getTypesTransmission()
}
const handleEdit = () => {
  getTypesTransmission()
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  getTypesTransmission()
}
onMounted(() => {
  getTypesTransmission()
})
</script>

<template>
  <DashboardLayout>
    <div class="container-fluid">
      <MasterNewModal
        ref="modalRef"
        id_target="newTypeTransmissionModal"
        :name_master_endpoint="URLS.typeTransmission.prefix"
        title="Nuevo tipo de transmisión"
        @saved="handleSaved"
      />

      <MasterEditModal
        ref="modalEditRef"
        id_target="editTypeTransmissionModal"
        :name_master_endpoint="URLS.typeTransmission.prefix"
        title="Editar tipo de transmisión"
        :item="selectedItem"
        @saved="handleEdit"
      />
      <titleSection
        :title="TITLE_SECTION_COMPONENT.typeTransmission.title"
        :description="TITLE_SECTION_COMPONENT.typeTransmission.description"
      />

      <div class="container-fluid">
        <div class="row mb-4 align-items-end g-3">
          <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
            <label for="">Buscar por:</label>
            <div class="input-group rounded-pill">
              <span
                :class="BUTTONS.search.class"
                id="basic-addon1"
                @click="getTypesTransmission()"
                style="cursor: pointer"
              >
                <i :class="BUTTONS.search.icon"></i>
              </span>
              <input
                type="text"
                class="form-control border-radius-right"
                placeholder="Nombre del tipo de transmisión"
                v-model="queryName"
                aria-label="Username"
                aria-describedby="basic-addon1"
                inputmode="search"
                enterkeyhint="search"
                @keyup.enter="getTypesTransmission()"
              />
            </div>
          </div>
          <div class="col-md-1">
            <button
              :class="BUTTONS.filter.class"
              :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
              :data-tooltip-pos="BUTTONS.filter.tooltipPos"
              @click=";((queryName = ''), getTypesTransmission())"
            >
              <i :class="BUTTONS.filter.icon"></i>
            </button>
          </div>
          <div class="col-12 col-md-7">
            <div class="col mb-0 gap-2 d-flex align-items-end justify-content-end">
              <button
                @click="openModal()"
                :class="BUTTONS.new.class"
                :data-title="BUTTONS_TOOLTIPS.typeTransmission.tooltipTitle"
                :data-tooltip-pos="BUTTONS.new.tooltipPos"
              >
                <i :class="BUTTONS.new.icon"></i>
                <span v-if="!isMobile">
                  {{ BUTTONS_TOOLTIPS.typeTransmission.tooltipTitle }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="typesTransmission"
          :headers="TABLE_HEADERS.typeTransmission"
          :actions="getTableActions"
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          @change-page="handlePageChange"
          :is-loading="isLoading"
          @action-click="handleAction"
        >
          <template #cell(active)="{ value }">
            <StatusBadge :value="value" :extra-class="isMobile ? 'w-100' : 'w-50'" />
          </template>
        </CustomTable>
      </div>
    </div>
  </DashboardLayout>
</template>
