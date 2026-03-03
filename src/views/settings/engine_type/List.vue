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
import { useTableActions } from '@/composables/useTableActions'

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
const { getDefaultActions } = useTableActions()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const typesEngine = ref([])
const queryName = ref('')
const modalRef = ref()
const modalEditRef = ref()
const selectedItem = ref({ id: '', name: '' })

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

// Función para generar acciones dinámicas según el estado del item
const getTableActions = (item: any) => getDefaultActions(item)

const getTypesEngine = () => {
  isLoading.value = true
  store
    .dispatch('getData', {
      url: URLS.typeEngine.getAll,
      params: {
        active: null,
        page: pagination.currentPage,
        limit: pagination.limit,
        query: queryName.value,
      },
    })
    .then((response: any) => {
      if (response.code == 200) {
        typesEngine.value = response.data.data
        pagination.totalPages = response.data.meta.last_page
        logRequest(
          URLS.typeEngine.getAll,
          { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
          response,
        )
      }
    })
    .catch((error: any) => {
      logRequest(
        URLS.typeEngine.getAll,
        { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
        error,
      )
      swalToast.showError(ERROR.errorGet)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const deactivateTypeEngine = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de ${item.active ? 'desactivar' : 'activar'} el tipo de motor ?`,
    `Esta acción ${item.active ? 'desactivará' : 'activará'} el tipo de motor ${item.name}.`,
    {
      confirmButtonText: `${item.active ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.typeEngine.changeStatus,
      id: item.id,
      status: !item.active ? 1 : 0,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(
        URLS.typeEngine.changeStatus,
        { id: item.id, status: !item.active ? 1 : 0 },
        response,
      )
      swal.showSuccess(`${item.active ? 'Desactivado' : 'Activado'} el tipo de motor ${item.name}`)
      getTypesEngine()
    }
  } catch (error: any) {
    logRequest(URLS.typeEngine.changeStatus, { id: item.id, status: !item.active ? 1 : 0 }, error)
    swalToast.showError(
      `${item.active ? ERROR.errorDeactive : ERROR.errorActive} el tipo de motor ${item.name}`,
    )
  }
}
const deleteTypeEngine = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar el tipo de motor?`,
    `Esta acción eliminará el tipo de motor ${item.name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.typeEngine.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(URLS.typeEngine.changeStatus, { id: item.id, status: 2 }, response)
      swal.showSuccess(`El tipo de motor ${item.name} ha sido eliminado exitosamente`)
      getTypesEngine()
    }
  } catch (error: any) {
    logRequest(URLS.typeEngine.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} el tipo de motor ${item.name}`)
  }
}

const handleAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === TABLE_ACTIONS.deactivate.name) {
    deactivateTypeEngine(item)
  }
  if (actionName === TABLE_ACTIONS.delete.name) {
    deleteTypeEngine(item)
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
  getTypesEngine()
}
const handleEdit = () => {
  getTypesEngine()
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  getTypesEngine()
}
onMounted(() => {
  getTypesEngine()
})
</script>

<template>
  <DashboardLayout>
    <div class="container-fluid">
      <MasterNewModal
        ref="modalRef"
        id_target="newTypeEngineModal"
        :name_master_endpoint="URLS.typeEngine.prefix"
        title="Nuevo tipo de motor"
        @saved="handleSaved"
      />

      <MasterEditModal
        ref="modalEditRef"
        id_target="editTypeEngineModal"
        :name_master_endpoint="URLS.typeEngine.prefix"
        title="Editar tipo de motor"
        :item="selectedItem"
        @saved="handleEdit"
      />
      <titleSection
        :title="TITLE_SECTION_COMPONENT.typeEngine.title"
        :description="TITLE_SECTION_COMPONENT.typeEngine.description"
      />

      <div class="container-fluid">
        <div class="row mb-4 align-items-end g-3">
          <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
            <label for="">Buscar por:</label>
            <div class="input-group rounded-pill">
              <span
                :class="BUTTONS.search.class"
                id="basic-addon1"
                @click="getTypesEngine()"
                style="cursor: pointer"
              >
                <i :class="BUTTONS.search.icon"></i>
              </span>
              <input
                type="text"
                class="form-control border-radius-right"
                placeholder="Nombre del tipo de motor"
                v-model="queryName"
                aria-label="Username"
                aria-describedby="basic-addon1"
                inputmode="search"
                enterkeyhint="search"
                @keyup.enter="getTypesEngine()"
              />
            </div>
          </div>
          <div class="col-md-1">
            <button
              :class="BUTTONS.filter.class"
              :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
              :data-tooltip-pos="BUTTONS.filter.tooltipPos"
              @click=";((queryName = ''), getTypesEngine())"
            >
              <i :class="BUTTONS.filter.icon"></i>
            </button>
          </div>
          <div class="col-12 col-md-7">
            <div class="col mb-0 gap-2 d-flex align-items-end justify-content-end">
              <button
                @click="openModal()"
                :class="BUTTONS.new.class"
                :data-title="BUTTONS_TOOLTIPS.typeEngine.tooltipTitle"
                :data-tooltip-pos="BUTTONS.new.tooltipPos"
              >
                <i :class="BUTTONS.new.icon"></i>
                <span v-if="!isMobile">
                  {{ BUTTONS_TOOLTIPS.typeEngine.tooltipTitle }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="typesEngine"
          :headers="TABLE_HEADERS.typeEngine"
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
