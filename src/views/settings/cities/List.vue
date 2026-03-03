<script setup lang="ts">
import DashboardLayout from '@/components/DashboardLayout.vue'
import titleSection from '@/components/common/titleSection.vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'

import { ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { URLS } from '@/const/api'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useMultiselectIcons } from '@/composables/useMultiselectIcons'
import { useTableActions } from '@/composables/useTableActions'
import { Modal } from 'bootstrap/dist/js/bootstrap.esm.js'

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
const { createIconMaps, updateIconMaps } = useMultiselectIcons()
const { getDefaultActions } = useTableActions()
const store = useStore()
const isMobile = computed(() => store.getters.isMobile)
const isLoading = ref(false)
const queryName = ref('')

const ModalElement = ref<HTMLElement | null>(null)
let ModalInstance: Modal | null = null
const states = ref([])
const selectedState = ref<any | null>(null)
const stateIconMap = ref<Record<string, string>>({})
const stateDescriptionMap = ref<Record<string, string>>({})
const roleName = ref('')
const editingCityId = ref<number | null>(null)

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'settings-cities-list'

// Función para generar acciones dinámicas según el estado de la ciudad
const getTableActions = (item: any) => getDefaultActions(item)

const cities = ref([])

const getStates = () => {
  isLoading.value = true
  store
    .dispatch('getData', {
      url: URLS.state.getAll,
    })
    .then((response: any) => {
      if (response.code == 200) {
        const statesList = response?.data?.data ?? response?.data ?? []
        states.value = statesList

        updateIconMaps(stateIconMap, stateDescriptionMap, statesList, 'bi bi-building-add', {
          dataKey: 'name',
          descriptionPrefix: 'Estado:',
        })
        logRequest(URLS.state.getAll, {}, response)
      }
    })
    .catch((error: any) => {
      logRequest(URLS.state.getAll, {}, error)
      swalToast.showError(ERROR.errorGet)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const getCities = () => {
  isLoading.value = true
  store
    .dispatch('getData', {
      url: URLS.city.getAll,
      params: {
        active: null,
        page: pagination.currentPage,
        limit: pagination.limit,
        query: queryName.value,
      },
    })
    .then((response: any) => {
      if (response.code == 200) {
        cities.value = response.data.data
        pagination.totalPages = response.data.meta.last_page

        store.dispatch('pagination/updatePagination', {
          key: paginationKey,
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
        })
        logRequest(
          URLS.city.getAll,
          { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
          response,
        )
      }
    })
    .catch((error: any) => {
      logRequest(
        URLS.city.getAll,
        { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
        error,
      )
      swalToast.showError(ERROR.errorGet)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const saveOrUpdateCity = async () => {
  isLoading.value = true

  if (!roleName.value || !selectedState.value) {
    swalToast.showError('Por favor, completa todos los campos')
    isLoading.value = false
    return
  }

  const payload = {
    name: roleName.value,
    id_state: (selectedState.value as any).id,
  }

  try {
    const response =
      editingCityId.value === null
        ? await store.dispatch('createData', {
            url: URLS.city.save,
            data: payload,
          })
        : await store.dispatch('updateData', {
            url: URLS.city.update,
            id: editingCityId.value,
            data: payload,
          })

    if (response.code == 200 || response.code == 201) {
      logRequest(
        editingCityId.value === null ? URLS.city.save : URLS.city.update,
        payload,
        response,
      )
      swal.showSuccess(
        editingCityId.value === null
          ? 'Ciudad guardada exitosamente'
          : 'Ciudad actualizada exitosamente',
      )
      getCities()
      closeModal()
      // limpiar estado del formulario
      editingCityId.value = null
      roleName.value = ''
      selectedState.value = null
    }
  } catch (error) {
    logRequest(editingCityId.value === null ? URLS.city.save : URLS.city.update, payload, error)
    if (editingCityId.value === null) {
      swalToast.showError(ERROR.errorCreate)
    } else {
      swalToast.showError(ERROR.errorUpdate)
    }
  } finally {
    isLoading.value = false
  }
}

const deactivateCity = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de ${item.active ? 'desactivar' : 'activar'} la ciudad ?`,
    `Esta acción ${item.active ? 'desactivará' : 'activará'} la ciudad ${item.name}.`,
    {
      confirmButtonText: `${item.active ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.city.changeStatus,
      id: item.id,
      status: !item.active ? 1 : 0,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(URLS.city.changeStatus, { id: item.id, status: !item.active ? 1 : 0 }, response)
      swal.showSuccess(`${item.active ? 'Desactivado' : 'Activado'} la ciudad ${item.name}`)
      getCities()
    }
  } catch (error: any) {
    logRequest(URLS.city.changeStatus, { id: item.id, status: !item.active ? 1 : 0 }, error)
    swalToast.showError(
      `${item.active ? ERROR.errorDeactive : ERROR.errorActive} la ciudad ${item.name}`,
    )
  }
}
const deleteCity = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar la ciudad?`,
    `Esta acción eliminará la ciudad ${item.name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.city.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(URLS.city.changeStatus, { id: item.id, status: 2 }, response)
      swal.showSuccess(`La ciudad ${item.name} ha sido eliminada exitosamente`)
      getCities()
    }
  } catch (error: any) {
    logRequest(URLS.city.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} la ciudad ${item.name}`)
  }
}

const handleAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === TABLE_ACTIONS.deactivate.name) {
    deactivateCity(item)
  }
  if (actionName === TABLE_ACTIONS.delete.name) {
    deleteCity(item)
  }
  if (actionName === TABLE_ACTIONS.edit.name) {
    if (item.active !== 1) {
      swalToast.showError('No puedes editar una ciudad inactiva')
      return
    }

    editingCityId.value = item.id
    roleName.value = item.name

    const foundState = states.value.find((state: any) => {
      if (item.state && item.state.id) return state.id === item.state.id
      if (item.id_state) return state.id === item.id_state
      return false
    })

    selectedState.value = foundState || null

    // Abrir en modo edición (no limpiar editingCityId ni el formulario)
    openModal(true)
  }
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getCities()
}

const openModal = (isEdit: boolean = false) => {
  // Si NO es edición, limpiar formulario y estado
  if (!isEdit) {
    editingCityId.value = null
    roleName.value = ''
    selectedState.value = null
  }

  ModalInstance?.show()
}

const closeModal = () => {
  ModalInstance?.hide()
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getCities()
  getStates()
  if (ModalElement.value) {
    ModalInstance = new Modal(ModalElement.value)
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="container-fluid">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.cities.title"
        :description="TITLE_SECTION_COMPONENT.cities.description"
      />

      <div class="container-fluid">
        <div class="row mb-4 align-items-end g-3">
          <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
            <label for="">Buscar por:</label>
            <div class="input-group rounded-pill">
              <span
                :class="BUTTONS.search.class"
                id="basic-addon1"
                @click="getCities()"
                style="cursor: pointer"
              >
                <i :class="BUTTONS.search.icon"></i>
              </span>
              <input
                type="text"
                class="form-control border-radius-right"
                placeholder="Nombre de la ciudad"
                v-model="queryName"
                aria-label="Username"
                aria-describedby="basic-addon1"
                inputmode="search"
                enterkeyhint="search"
                @keyup.enter="getCities()"
              />
            </div>
          </div>
          <div class="col-md-1">
            <button
              :class="BUTTONS.filter.class"
              :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
              :data-tooltip-pos="BUTTONS.filter.tooltipPos"
              @click=";((queryName = ''), getCities())"
            >
              <i :class="BUTTONS.filter.icon"></i>
            </button>
          </div>
          <div class="col-12 col-md-7">
            <div class="col mb-0 gap-2 d-flex align-items-end justify-content-end">
              <button
                @click="openModal()"
                :class="BUTTONS.new.class"
                :data-title="BUTTONS_TOOLTIPS.cities.tooltipTitle"
                :data-tooltip-pos="BUTTONS.new.tooltipPos"
              >
                <i :class="BUTTONS.new.icon"></i>
                <span v-if="!isMobile">
                  {{ BUTTONS_TOOLTIPS.cities.tooltipTitle }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="cities"
          :headers="TABLE_HEADERS.cities"
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

    <div ref="ModalElement" class="modal fade" tabindex="-1" style="z-index: 10000">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content rounded-4 border-0">
          <div class="modal-header bg-primary text-white rounded-top-4 px-4">
            <h5 class="modal-title fw-semibold">
              {{ editingCityId === null ? 'Nueva ciudad' : 'Editar ciudad' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
              @click="closeModal()"
            ></button>
          </div>
          <div class="modal-body">
            <div class="container-fluid">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label fw-medium mb-1">Estado</label>
                  <div class="col-12">
                    <MultiselectCustom
                      v-model="selectedState"
                      :options="states"
                      placeholder="Seleccionar estado"
                      helper-type="custom"
                      variant="primary"
                      :custom-icon-map="stateIconMap"
                      :custom-description-map="stateDescriptionMap"
                      class="w-100"
                    />
                  </div>
                </div>
                <div class="col-12">
                  <label for="roleName" class="form-label fw-medium mb-1">Nombre del rol</label>
                  <input
                    id="roleName"
                    v-model="roleName"
                    type="text"
                    class="form-control border-radius-left border-radius-right"
                    placeholder="Escribe el nombre del rol"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-primary rounded-pill px-4"
              @click="saveOrUpdateCity()"
            >
              <span v-if="editingCityId == null">{{ isLoading ? 'Guardando...' : 'Guardar' }}</span>
              <span v-else>{{ isLoading ? 'Actualizando...' : 'Actualizar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
