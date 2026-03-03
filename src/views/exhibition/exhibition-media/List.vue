<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ExhibitionMediaModal from '@/components/exhibition/ExhibitionMediaModal.vue'
import ExhibitionMediaCardList from '@/components/exhibition/ExhibitionMediaCardList.vue'
import { useRouter, useRoute } from 'vue-router'
import { useTableActions } from '@/composables/useTableActions'

// Composables de la vista
import { useExhibitionMediaModel } from '@/composables/useExhibitionMediaModel'
import { BUTTONS, BUTTONS_TOOLTIPS } from '@/const/buttonConst'
import { TABLE_HEADERS } from '@/const/tableConst'
import defaultVehicleImage from '@/assets/images/changan_imagen_default.png'

interface Item {
  id: string | number
  [key: string]: any
}

const router = useRouter()
const route = useRoute()
const { getDefaultActions } = useTableActions()

// Integrar composable
const {
  mediaList,
  isLoading,
  pagination,
  getMedia,
  saveMedia,
  updateMedia,
  toggleStatus,
  deleteMedia,
} = useExhibitionMediaModel()

// Estados de la vista
const showModal = ref(false)
const selectedMedia = ref<Item | null>(null)
const viewMode = ref<'cards' | 'table'>('cards')
// Acciones de la tabla
const getTableActions = async (item: any) => {
  return getDefaultActions(item)
}

const handleTableAction = ({ actionName, item }: { actionName: string; item: Item }) => {
  if (actionName === 'edit') {
    openEditModal(item)
  }
  if (actionName === 'deactivate') {
    handleToggleStatus(item)
  }
  if (actionName === 'delete') {
    handleDelete(item)
  }
}

// Envoltorios de acciones para recargar la tabla automáticamente
const handleToggleStatus = async (item: Item) => {
  const result = await toggleStatus(item)
  if (result) getMedia()
}

const handleDelete = async (item: Item) => {
  const result = await deleteMedia(item)
  if (result) getMedia()
}

// Control del modal
const openCreateModal = () => {
  selectedMedia.value = null
  showModal.value = true
}

const openEditModal = (item: Item) => {
  selectedMedia.value = item
  showModal.value = true
}

// Guardar desde el modal
const handleModalSave = async (formDataObj: any) => {
  let result = false
  if (selectedMedia.value) {
    result = await updateMedia(selectedMedia.value.id, formDataObj)
  } else {
    result = await saveMedia(formDataObj)
  }

  if (result) {
    showModal.value = false
    getMedia()
  }
}

const handlePagination = (page: number) => {
  getMedia(page)
}

const goBack = () => {
  router.push({ name: 'Exhibiciones' })
}

onMounted(() => {
  getMedia()
})
</script>

<template>
  <div>
    <!-- Fila de filtros y acciones -->
    <div class="row mb-4 align-items-end g-3 mt-2">
      <div class="col gap-2 d-flex align-items-end justify-content-between">
        <div class="btn-group me-2" role="group">
          <button
            class="btn"
            :class="viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'"
            @click="viewMode = 'cards'"
            title="Vista de Tarjetas"
          >
            <i class="bi bi-grid-fill"></i>
          </button>
          <button
            class="btn"
            :class="viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
            @click="viewMode = 'table'"
            title="Vista de Tabla"
          >
            <i class="bi bi-list-ul"></i>
          </button>
        </div>

        <button
          :class="BUTTONS.new.class"
          data-title="Nueva Multimedia"
          :data-tooltip-pos="BUTTONS.new.tooltipPos"
          @click="openCreateModal"
        >
          <i :class="BUTTONS.new.icon"></i>
          <span class="d-none d-md-inline ms-1"> Agregar </span>
        </button>
      </div>
    </div>

    <!-- Vista de Tarjetas -->
    <div v-if="viewMode === 'cards'" class="container-fluid mt-2">
      <h5 class="fw-bold mb-3">
        <i class="bi bi-images me-2 text-primary"></i>
        Multimedia
        <span class="badge bg-primary ms-2">{{ mediaList.length }}</span>
      </h5>

      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2 text-muted">Cargando imágenes...</p>
      </div>

      <template v-else>
        <ExhibitionMediaCardList
          :media-list="mediaList"
          @edit="openEditModal"
          @toggle-status="handleToggleStatus"
          @delete="handleDelete"
        />
        <!-- Paginación para Cards -->
        <nav v-if="pagination.totalPages > 1" aria-label="Page navigation" class="mt-4">
          <ul class="pagination justify-content-center py-2">
            <li class="page-item mx-1" :class="{ disabled: pagination.currentPage === 1 }">
              <a
                class="page-link border-radius-left border-radius-right bg-light text-dark"
                href="#"
                @click.prevent="handlePagination(pagination.currentPage - 1)"
              >
                <i class="bi-arrow-left"></i>
              </a>
            </li>
            <li class="page-item mx-1">
              <span class="page-link border-radius-left border-radius-right bg-dark text-white">
                Página {{ pagination.currentPage }} de {{ Math.max(1, pagination.totalPages) }}
              </span>
            </li>
            <li
              class="page-item mx-1"
              :class="{
                disabled:
                  pagination.currentPage === pagination.totalPages || pagination.totalPages === 0,
              }"
            >
              <a
                class="page-link border-radius-left border-radius-right bg-light text-dark"
                href="#"
                @click.prevent="handlePagination(pagination.currentPage + 1)"
              >
                <i class="bi-arrow-right"></i>
              </a>
            </li>
          </ul>
        </nav>
      </template>
    </div>

    <!-- Tabla -->
    <div v-if="viewMode === 'table'" class="container-fluid mt-2 border rounded-4">
      <CustomTable
        :data="mediaList"
        :headers="TABLE_HEADERS.exhibitionMedia"
        :actions="getTableActions"
        :is-loading="isLoading"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :limit="pagination.limit"
        @action-click="handleTableAction"
        @change-page="handlePagination"
      >
        <template #cell(url_image)="{ value }">
          <img
            :src="value || defaultVehicleImage"
            alt="Imagen Principal"
            class="img-thumbnail rounded"
            style="width: 80px; height: 60px; object-fit: contain; cursor: pointer"
            @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultVehicleImage)"
            onclick="window.open(this.src, '_blank')"
          />
        </template>

        <template #cell(active)="{ value }">
          <StatusBadge :value="value" />
        </template>
      </CustomTable>
    </div>

    <!-- Modal de Creación/Edición -->
    <ExhibitionMediaModal
      :show="showModal"
      :is-saving="isLoading"
      :image-data="selectedMedia"
      @close="showModal = false"
      @saved="handleModalSave"
    />
  </div>
</template>
