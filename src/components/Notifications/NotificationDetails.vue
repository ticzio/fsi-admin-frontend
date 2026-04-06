<script setup lang="ts">
const props = defineProps<{
  notification: {
    title: string
    description?: string
    message?: string
    type_notification?: string
    type?: string
    active?: boolean
    [key: string]: any
  } | null
}>()

const emit = defineEmits(['close'])
</script>

<template>
  <div class="notification-details px-3 py-4" v-if="notification">
    <div class="d-flex align-items-center mb-4 pb-4 border-bottom">
      <div
        class="icon-wrapper me-4 d-flex justify-content-center align-items-center rounded-circle bg-light shadow-sm"
        style="width: 64px; height: 64px"
      >
        <i class="bi bi-bell text-primary fs-2"></i>
      </div>
      <div>
        <h4 class="mb-2 text-dark fw-bolder" style="letter-spacing: -0.5px">
          {{ notification.title }}
        </h4>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <span class="text-secondary small fw-medium text-uppercase tracking-wider"
            >Audiencia Dirigida:</span
          >
          <span class="badge bg-white text-dark border py-1 px-3 shadow-sm rounded-pill fs-6">
            <span v-if="notification.type_city?.name"
              >Ciudad {{ notification.type_city.name }}</span
            >
            <span v-if="notification.level?.name">Nivel {{ notification.level.name }}</span>
            <span v-if="!notification.type_city?.name && !notification.level?.name">General</span>
          </span>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <h6
        class="text-secondary fw-semibold mb-3 fs-7 text-uppercase tracking-wide d-flex align-items-center"
      >
        <i class="bi bi-text-paragraph me-2 fs-6"></i> Mensaje Descriptivo
      </h6>
      <div
        class="message-box p-4 bg-light rounded-4 text-dark fs-6 fw-bold border border-light shadow-sm"
      >
        {{ notification.message || notification.description }}
      </div>
    </div>

    <div class="d-flex justify-content-end mt-5 pt-3 border-top">
      <button
        type="button"
        class="btn btn-outline-secondary px-5 py-2 fw-semibold rounded-pill transition-all"
        @click="emit('close')"
      >
        Cerrar Detalle
      </button>
    </div>
  </div>
  <div v-else class="text-center py-5 text-muted">
    <i class="bi bi-inbox fs-1 d-block mb-3 text-light"></i>
    No se encontró información de la notificación.
  </div>
</template>

<style scoped>
.notification-details {
  color: #1f2937;
}

.fs-7 {
  font-size: 0.85rem;
}

.tracking-wide {
  letter-spacing: 0.05em;
}

.tracking-wider {
  letter-spacing: 0.08em;
}

.transition-all {
  transition: all 0.2s ease;
}

.btn-outline-secondary {
  border-width: 2px;
}

.btn-outline-secondary:hover {
  background-color: #f3f4f6;
  color: #111827;
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.btn-outline-secondary:active {
  transform: translateY(0);
}

.icon-wrapper {
  background-color: #f9fafb !important;
  border: 1px solid #f3f4f6;
}

.message-box {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 0.95rem;
}
</style>
