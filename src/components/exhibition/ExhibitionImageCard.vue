<script setup lang="ts">
interface Props {
  image: any
  defaultImage: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', image: any): void
  (e: 'toggleStatus', image: any): void
  (e: 'delete', image: any): void
}>()
</script>

<template>
  <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
    <div class="position-relative">
      <img
        :src="image.url_image || defaultImage"
        :alt="image.type_color?.name || 'Imagen'"
        class="card-img-top"
        style="height: 180px; object-fit: cover"
        @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultImage)"
      />
      <span
        class="position-absolute top-0 end-0 m-2 badge"
        :class="image.active ? 'bg-success' : 'bg-warning'"
      >
        {{ image.active ? 'Activo' : 'Inactivo' }}
      </span>
    </div>
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between">
        <span class="badge bg-light text-dark border">
          <span class="d-inline-flex align-items-center gap-2">
            <i class="bi bi-palette-fill"></i>
            <span
              class="rounded-circle border border-2 d-inline-block"
              :style="{
                width: '16px',
                height: '16px',
                backgroundColor: image.type_color?.hex_color || '#ffffff',
              }"
            ></span>
            <span>{{ image.type_color?.name || 'Sin color' }}</span>
            <small v-if="image.type_color?.hex_color" class="text-muted">
              {{ image.type_color?.hex_color }}
            </small>
          </span>
        </span>
        <div class="btn-group btn-group-sm">
          <button
            class="btn btn-outline-primary btn-sm"
            @click="emit('edit', image)"
            title="Editar"
          >
            <i class="bi bi-pencil"></i>
          </button>
          <button
            class="btn btn-sm"
            :class="image.active ? 'btn-outline-success' : 'btn-outline-warning'"
            @click="emit('toggleStatus', image)"
            :title="image.active ? 'Desactivar' : 'Activar'"
          >
            <i :class="image.active ? 'bi bi-toggle-on' : 'bi bi-toggle-off'"></i>
          </button>
          <button
            class="btn btn-outline-danger btn-sm"
            @click="emit('delete', image)"
            title="Eliminar"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
}
</style>
