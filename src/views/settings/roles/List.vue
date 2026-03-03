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
const roles = ref([])
const queryName = ref('')

const ModalElement = ref<HTMLElement | null>(null)
let ModalInstance: Modal | null = null

const environments = ref([])
const editingRoleId = ref<number | null>(null)
const roleName = ref('')
const selectedSEnv = ref<any | null>(null)
const envIconMap = ref<Record<string, string>>({})
const envDescriptionMap = ref<Record<string, string>>({})

const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'settings-roles-list'

// Función para generar acciones dinámicas según el estado del rol
const getTableActions = (item: any) => getDefaultActions(item)

const getEnviroments = () => {
  isLoading.value = true
  store
    .dispatch('getData', {
      url: URLS.typeEnvironment.getAll,
    })
    .then((response: any) => {
      if (response.code == 200) {
        environments.value = response.data

        updateIconMaps(envIconMap, envDescriptionMap, response.data, 'bi bi-globe', {
          dataKey: 'name',
          descriptionPrefix: 'Entorno:',
        })
        logRequest(URLS.typeEnvironment.getAll, {}, response)
      }
    })
    .catch((error: any) => {
      logRequest(URLS.typeEnvironment.getAll, {}, error)
      swalToast.showError(ERROR.errorGet)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const getRoles = () => {
  isLoading.value = true
  store
    .dispatch('getData', {
      url: URLS.role.getAll,
      params: {
        active: null,
        page: pagination.currentPage,
        limit: pagination.limit,
        query: queryName.value,
      },
    })
    .then((response: any) => {
      if (response.code == 200) {
        roles.value = response.data.data
        pagination.totalPages = response.data.meta.last_page

        store.dispatch('pagination/updatePagination', {
          key: paginationKey,
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
        })
        logRequest(
          URLS.role.getAll,
          { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
          response,
        )
      }
    })
    .catch((error: any) => {
      logRequest(
        URLS.role.getAll,
        { page: pagination.currentPage, limit: pagination.limit, query: queryName.value },
        error,
      )
      swalToast.showError(ERROR.errorGet)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const saveOrUpdateRole = async () => {
  isLoading.value = true

  if (!roleName.value || !selectedSEnv.value) {
    swalToast.showError('Por favor, completa todos los campos')
    isLoading.value = false
    return
  }

  const payload = {
    name: roleName.value,
    id_type_environment: (selectedSEnv.value as any).id,
  }

  try {
    const response =
      editingRoleId.value === null
        ? await store.dispatch('createData', {
            url: URLS.role.save,
            data: payload,
          })
        : await store.dispatch('updateData', {
            url: URLS.role.update,
            id: editingRoleId.value,
            data: payload,
          })

    if (response.code == 200 || response.code == 201) {
      logRequest(
        editingRoleId.value === null ? URLS.role.save : URLS.role.update,
        payload,
        response,
      )
      swal.showSuccess(
        editingRoleId.value === null ? 'Rol guardado exitosamente' : 'Rol actualizado exitosamente',
      )
      getRoles()
      closeModal()
      // limpiar estado del formulario
      editingRoleId.value = null
      roleName.value = ''
      selectedSEnv.value = null
    }
  } catch (error) {
    logRequest(editingRoleId.value === null ? URLS.role.save : URLS.role.update, payload, error)
    if (editingRoleId.value === null) {
      swalToast.showError(ERROR.errorCreate)
    } else {
      swalToast.showError(ERROR.errorUpdate)
    }
  } finally {
    isLoading.value = false
  }
}

const deactivateRole = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de ${item.active ? 'desactivar' : 'activar'} el rol ?`,
    `Esta acción ${item.active ? 'desactivará' : 'activará'} el rol ${item.name}.`,
    {
      confirmButtonText: `${item.active ? 'Desactivar' : 'Activar'}`,
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.role.changeStatus,
      id: item.id,
      status: !item.active ? 1 : 0,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(URLS.role.changeStatus, { id: item.id, status: !item.active ? 1 : 0 }, response)
      swal.showSuccess(`${item.active ? 'Desactivado' : 'Activado'} el rol ${item.name}`)
      getRoles()
    }
  } catch (error: any) {
    logRequest(URLS.role.changeStatus, { id: item.id, status: !item.active ? 1 : 0 }, error)
    swalToast.showError(
      `${item.active ? ERROR.errorDeactive : ERROR.errorActive} el rol ${item.name}`,
    )
  }
}

const deleteRole = async (item: any) => {
  const result = await swal.showConfirm(
    `¿Estás seguro de eliminar el rol?`,
    `Esta acción eliminará el rol ${item.name}.`,
    {
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    },
  )

  if (!result) return

  try {
    const response = await store.dispatch('changeStatus', {
      url: URLS.role.changeStatus,
      id: item.id,
      status: 2,
    })
    if (response.code == 200 || response.code == 201) {
      logRequest(URLS.role.changeStatus, { id: item.id, status: 2 }, response)
      swal.showSuccess(`El rol ${item.name} ha sido eliminado exitosamente`)
      getRoles()
    }
  } catch (error: any) {
    logRequest(URLS.role.changeStatus, { id: item.id, status: 2 }, error)
    swalToast.showError(`${ERROR.errorDelete} el rol ${item.name}`)
  }
}

const handleAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === TABLE_ACTIONS.deactivate.name) {
    deactivateRole(item)
  }
  if (actionName === TABLE_ACTIONS.delete.name) {
    deleteRole(item)
  }
  if (actionName === TABLE_ACTIONS.edit.name) {
    if (!item.active) {
      swalToast.showError('No puedes editar un rol inactivo')
      return
    }

    editingRoleId.value = item.id
    roleName.value = item.name

    const foundEnv = environments.value.find((env: any) => {
      if (item.type_environment && item.type_environment.id)
        return env.id === item.type_environment.id
      if (item.type_enviroment && item.type_enviroment.id) return env.id === item.type_enviroment.id
      if (item.id_type_environment) return env.id === item.id_type_environment
      if (item.id_type_enviroment) return env.id === item.id_type_enviroment
      return false
    })
    selectedSEnv.value = foundEnv || null

    // Abrir en modo edición (no limpiar editingRoleId ni el formulario)
    openModal(true)
  }
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page

  store.dispatch('pagination/updatePagination', {
    key: paginationKey,
    currentPage: page,
  })

  getRoles()
}

const openModal = (isEdit: boolean = false) => {
  // Si NO es edición, limpiar formulario y estado
  if (!isEdit) {
    editingRoleId.value = null
    roleName.value = ''
    selectedSEnv.value = null
  }

  ModalInstance?.show()
}

const closeModal = () => {
  ModalInstance?.hide()
}

onMounted(() => {
  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  getRoles()
  getEnviroments()
  if (ModalElement.value) {
    ModalInstance = new Modal(ModalElement.value)
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="container-fluid">
      <titleSection
        :title="TITLE_SECTION_COMPONENT.roles.title"
        :description="TITLE_SECTION_COMPONENT.roles.description"
      />

      <div class="container-fluid">
        <div class="row mb-4 align-items-end g-3">
          <div class="col-12 col-md-4 d-flex flex-column justify-content-end">
            <label for="">Buscar por:</label>
            <div class="input-group rounded-pill">
              <span
                :class="BUTTONS.search.class"
                id="basic-addon1"
                @click="getRoles()"
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
                @keyup.enter="getRoles()"
              />
            </div>
          </div>
          <div class="col-md-1">
            <button
              :class="BUTTONS.filter.class"
              :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
              :data-tooltip-pos="BUTTONS.filter.tooltipPos"
              @click=";((queryName = ''), getRoles())"
            >
              <i :class="BUTTONS.filter.icon"></i>
            </button>
          </div>
          <div class="col-12 col-md-7">
            <div class="col mb-0 gap-2 d-flex align-items-end justify-content-end">
              <button
                @click="openModal(false)"
                :class="BUTTONS.new.class"
                :data-title="BUTTONS_TOOLTIPS.role.tooltipTitle"
                :data-tooltip-pos="BUTTONS.new.tooltipPos"
              >
                <i :class="BUTTONS.new.icon"></i>
                <span v-if="!isMobile">
                  {{ BUTTONS_TOOLTIPS.role.tooltipTitle }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid border rounded-4 mt-2">
        <CustomTable
          :data="roles"
          :headers="TABLE_HEADERS.roles"
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
              {{ editingRoleId === null ? 'Nuevo rol' : 'Editar rol' }}
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
                  <label class="form-label fw-medium mb-1">Entorno</label>
                  <div class="col-12">
                    <MultiselectCustom
                      v-model="selectedSEnv"
                      :options="environments"
                      placeholder="Seleccionar entorno"
                      helper-type="custom"
                      variant="primary"
                      :custom-icon-map="envIconMap"
                      :custom-description-map="envDescriptionMap"
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
              @click="saveOrUpdateRole()"
            >
              <span v-if="editingRoleId == null">
                {{ isLoading ? 'Guardando...' : 'Guardar' }}
              </span>
              <span v-else>
                {{ isLoading ? 'Actualizando...' : 'Actualizar' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
