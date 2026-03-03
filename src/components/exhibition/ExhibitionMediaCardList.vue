<script setup lang="ts">
import defaultVehicleImage from '@/assets/images/changan_imagen_default.png'

interface Item {
  id: string | number
  url_image?: string
  active?: boolean
  [key: string]: any
}

defineProps<{
  mediaList: Item[]
}>()

const emit = defineEmits<{
  (e: 'edit', item: Item): void
  (e: 'toggleStatus', item: Item): void
  (e: 'delete', item: Item): void
}>()
</script>

<template>
  <div>
    <div v-if="mediaList.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-image fs-1"></i>
      <p class="mt-2">No hay multimedia registrada</p>
    </div>

    <div v-else class="row g-3">
      <div v-for="item in mediaList" :key="item.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="position-relative">
            <img
              :src="item.url_image || defaultVehicleImage"
              alt="Multimedia"
              class="card-img-top bg-light"
              style="height: 180px; object-fit: contain; cursor: pointer"
              onclick="window.open(this.src, '_blank')"
              @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultVehicleImage)"
            />
            <span
              class="position-absolute top-0 end-0 m-2 badge"
              :class="item.active ? 'bg-success' : 'bg-warning'"
            >
              {{ item.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-end">
              <div class="btn-group btn-group-sm">
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="emit('edit', item)"
                  title="Editar"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-sm"
                  :class="item.active ? 'btn-outline-success' : 'btn-outline-warning'"
                  @click="emit('toggleStatus', item)"
                  :title="item.active ? 'Desactivar' : 'Activar'"
                >
                  <i :class="item.active ? 'bi bi-toggle-on' : 'bi bi-toggle-off'"></i>
                </button>
                <button
                  class="btn btn-outline-danger btn-sm"
                  @click="emit('delete', item)"
                  title="Eliminar"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
