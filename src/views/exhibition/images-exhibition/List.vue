<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import ModalNewImage from './New.vue'
import ModalEditImage from './Edit.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useSwal } from '@/composables/useSwal'
import { useSwalToast } from '@/composables/useSwalToast'
import { useLogger } from '@/composables/useLogger'
import { useTableActions } from '@/composables/useTableActions'

import { TABLE_ACTIONS, TABLE_HEADERS, TABLE_PAGINATION } from '@/const/tableConst'
import { BUTTONS } from '@/const/buttonConst'
import { URLS } from '@/const/api'
import { ERROR } from '@/const/errorConst'
import defaultVehicleImage from '@/assets/images/changan_imagen_default.png'
import ExhibitionImageCard from '@/components/exhibition/ExhibitionImageCard.vue'

interface Item {
  id: string | number
  [key: string]: any
}

const route = useRoute()
const store = useStore()
const swal = useSwal()
const swalToast = useSwalToast()
const logger = useLogger()
const { getDefaultActions } = useTableActions()

// IDs de la ruta
const idVehicleModel = ref<string | null>(null)
const idExhibition = ref<string | null>(null)

// Estados
const viewMode = ref<'cards' | 'table'>('cards')
const showModal = ref(false)
const showEditModal = ref(false)

// Datos
const vehicleModelImages = ref<any[]>([])
const selectedImage = ref<any | null>(null)
const isLoading = ref(false)

// Paginación
const pagination = reactive({
  currentPage: TABLE_PAGINATION.currentPage,
  totalPages: TABLE_PAGINATION.totalPages,
  limit: TABLE_PAGINATION.limit,
})

const paginationKey = 'exhibition-images-list'

// Acciones de la tabla
const getTableActions = (item: any) => getDefaultActions(item)
// Obtener imágenes del modelo de vehículo
const getVehicleModelImages = async () => {
  isLoading.value = true
  try {
    const payload = {
      params: {
        id_vehicle_model: idVehicleModel.value,
        page: pagination.currentPage,
        limit: pagination.limit,
        active: null,
      },
    }
    const response = await store.dispatch('getData', {
      url: URLS.vehicleModelImage.getAll,
      ...payload,
    })
    if (response.code === 200) {
      logger.logRequest(URLS.vehicleModelImage.getAll, payload, response)
      vehicleModelImages.value = response.data?.data || response.data || []

      pagination.totalPages = response.data?.meta?.last_page || TABLE_PAGINATION.totalPages

      store.dispatch('pagination/updatePagination', {
        key: paginationKey,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      })
    }
  } catch (error: any) {
    logger.logRequest(
      URLS.vehicleModelImage.getAll,
      { id_vehicle_model: idVehicleModel.value },
      error,
    )
    swalToast.showError(`${ERROR.errorGet} imágenes`)
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

  getVehicleModelImages()
}

// Abrir modal de creación
const openModal = () => {
  showModal.value = true
}

// Abrir modal de edición
const openEditModal = (item: any) => {
  selectedImage.value = item
  showEditModal.value = true
}

// Cerrar modal
const closeModal = () => {
  showModal.value = false
}

// Cerrar modal de edición
const closeEditModal = () => {
  showEditModal.value = false
  selectedImage.value = null
}

// Callback cuando se guarda una imagen
const onImageSaved = () => {
  getVehicleModelImages()
}

// Callback cuando se edita una imagen
const onImageEdited = () => {
  getVehicleModelImages()
}

// Manejar acciones de la tabla
const handleTableAction = ({ actionName, item }: { actionName: string; item: Item }) => {
  if (actionName === TABLE_ACTIONS.edit.name) {
    openEditModal(item)
  }
  if (actionName === 'deactivate') {
    toggleStatus(item)
  }
  if (actionName === 'delete') {
    deleteItem(item)
  }
}

// Activar/Desactivar
const toggleStatus = async (item: Item) => {
  const isActive = Boolean(item?.status ?? item?.active)

  const result = await swal.showConfirm(
    `¿Estás seguro ${isActive ? 'desactivar' : 'activar'}?`,
    `Esta acción ${isActive ? 'desactivará' : 'activará'} el registro`,
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
      url: URLS.vehicleModelImage.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.vehicleModelImage.changeStatus, payload, response)
      swal.showSuccess(`Registro ${isActive ? 'desactivado' : 'activado'} exitosamente`)
      getVehicleModelImages()
    }
  } catch (error: any) {
    logger.logRequest(URLS.vehicleModelImage.changeStatus, { id: item.id }, error)
    swalToast.showError(`${isActive ? ERROR.errorDeactive : ERROR.errorActive}`)
  }
}

// Eliminar
const deleteItem = async (item: Item) => {
  const result = await swal.showConfirm(
    '¿Estás seguro de eliminar?',
    'Esta acción eliminará el registro.',
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
      url: URLS.vehicleModelImage.changeStatus,
      ...payload,
    })
    if (response.code === 200 || response.code === 201) {
      logger.logRequest(URLS.vehicleModelImage.changeStatus, payload, response)
      swal.showSuccess('Registro eliminado exitosamente')
      getVehicleModelImages()
    }
  } catch (error: any) {
    logger.logRequest(URLS.vehicleModelImage.changeStatus, { id: item.id }, error)
    swalToast.showError(`${ERROR.errorDelete}`)
  }
}

onMounted(() => {
  idExhibition.value = route.params.id_exhibition as string
  idVehicleModel.value = route.params.id_vehicle_model as string

  const savedPageGetter = store.getters['pagination/getPage']
  pagination.currentPage = savedPageGetter(paginationKey)

  if (idVehicleModel.value) {
    getVehicleModelImages()
  }
})
</script>

<template>
  <div class="container-fluid">
    <div>
      <!-- Header con toggle de vista y botón agregar -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn"
            :class="viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'"
            @click="viewMode = 'cards'"
          >
            <i class="bi bi-grid-3x3-gap-fill me-1"></i>
            Cards
          </button>
          <button
            type="button"
            class="btn"
            :class="viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
            @click="viewMode = 'table'"
          >
            <i class="bi bi-table me-1"></i>
            Tabla
          </button>
        </div>

        <button :class="BUTTONS.new.class" @click="openModal">
          <i :class="BUTTONS.new.icon"></i>
          <span class="ms-1">Agregar</span>
        </button>
      </div>

      <!-- VISTA CARDS -->
      <div v-if="viewMode === 'cards'">
        <!-- Sección de Imágenes -->
        <div>
          <h5 class="fw-bold mb-3">
            <i class="bi bi-images me-2 text-primary"></i>
            Imágenes del Vehículo
            <span class="badge bg-primary ms-2">{{ vehicleModelImages.length }}</span>
          </h5>

          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">Cargando imágenes...</p>
          </div>

          <div v-else-if="vehicleModelImages.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-image fs-1"></i>
            <p class="mt-2">No hay imágenes registradas</p>
          </div>

          <div v-else class="row g-3">
            <div
              v-for="image in vehicleModelImages"
              :key="image.id"
              class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <ExhibitionImageCard
                :image="image"
                :default-image="defaultVehicleImage"
                @edit="openEditModal"
                @toggle-status="toggleStatus"
                @delete="deleteItem"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA TABLA -->
      <div v-if="viewMode === 'table'">
        <!-- Tabla de Imágenes -->
        <div>
          <h5 class="fw-bold mb-3">
            <i class="bi bi-images me-2 text-primary"></i>
            Imágenes del Vehículo
          </h5>
          <div class="border rounded-4">
            <CustomTable
              :data="vehicleModelImages"
              :headers="TABLE_HEADERS.imageExhibition"
              :actions="getTableActions"
              :is-loading="isLoading"
              :current-page="pagination.currentPage"
              :total-pages="pagination.totalPages"
              :limit="pagination.limit"
              :change-page="handlePageChange"
              @change-page="handlePageChange"
              @action-click="handleTableAction"
            >
              <template #cell(type_color.hex_color)="{ value }">
                <div class="d-flex align-items-center justify-content-center">
                  <span
                    class="rounded-circle border border-3 shadow-sm d-inline-block"
                    :style="{
                      width: '30px',
                      height: '30px',
                      backgroundColor: value || '#ffffff',
                    }"
                  ></span>
                </div>
              </template>
              <template #cell(url_image)="{ value }">
                <img
                  :src="value || defaultVehicleImage"
                  alt="Imagen"
                  class="img-thumbnail rounded"
                  style="width: 60px; height: 60px; object-fit: cover"
                  @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultVehicleImage)"
                />
              </template>
              <template #cell(url_background_mobile)="{ value }">
                <img
                  :src="value || defaultVehicleImage"
                  alt="Imagen"
                  class="img-thumbnail rounded"
                  style="width: 60px; height: 60px; object-fit: cover"
                  @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultVehicleImage)"
                />
              </template>
              <template #cell(url_background_tablet)="{ value }">
                <img
                  :src="value || defaultVehicleImage"
                  alt="Imagen"
                  class="img-thumbnail rounded"
                  style="width: 60px; height: 60px; object-fit: cover"
                  @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultVehicleImage)"
                />
              </template>
              <template #cell(active)="{ value }">
                <StatusBadge :value="value" />
              </template>
            </CustomTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para agregar imagen -->
    <ModalNewImage
      :show="showModal"
      :id-vehicle-model="idVehicleModel"
      @close="closeModal"
      @saved="onImageSaved"
    />

    <ModalEditImage
      :show="showEditModal"
      :id-vehicle-model="idVehicleModel"
      :image-data="selectedImage"
      @close="closeEditModal"
      @saved="onImageEdited"
    />
  </div>
</template>
