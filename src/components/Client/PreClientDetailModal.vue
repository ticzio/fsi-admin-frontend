<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import defaultProfileImage from '@/assets/images/default-profile.png'

const props = defineProps<{
  client: any
}>()

const modalElement = ref<HTMLElement | null>(null)
let modalInstance: Modal | null = null

const openModal = () => {
  modalInstance?.show()
}

const closeModal = () => {
  modalInstance?.hide()
}

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value)
  }
})

defineExpose({ openModal, closeModal })
</script>

<template>
  <div
    class="modal fade"
    ref="modalElement"
    tabindex="-1"
    aria-labelledby="preClientDetailModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-0 pb-0">
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body text-center pt-0 pb-4">
          <div class="mb-3 position-relative d-inline-block">
            <img
              :src="client?.url_image || defaultProfileImage"
              alt="Profile"
              class="rounded-circle object-fit-cover border border-3 border-white shadow-sm"
              style="width: 120px; height: 120px"
              @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)"
            />
            <span
              class="position-absolute bottom-0 end-0 p-2 rounded-circle border border-2 border-white"
              :class="client?.active ? 'bg-success' : 'bg-danger'"
            ></span>
          </div>

          <h4 class="fw-bold mb-1">{{ client?.full_name || 'Sin Nombre' }}</h4>
          <p class="text-muted mb-3">{{ client?.email || 'Sin Correo' }}</p>

          <div class="d-flex justify-content-center gap-2 mb-4">
            <span class="badge rounded-pill bg-light text-dark border">
              <i class="bi bi-person-badge me-1"></i> Pre-Cliente
            </span>
            <span
              class="badge rounded-pill"
              :class="
                client?.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
              "
            >
              {{ client?.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="card bg-light border-0 rounded-4 text-start">
            <div class="card-body">
              <h6 class="fw-bold mb-3 text-uppercase small text-muted">Información de Contacto</h6>

              <div class="mb-3 d-flex align-items-center">
                <div class="icon-box bg-white rounded-circle p-2 me-3 shadow-sm text-primary">
                  <i class="bi bi-telephone mb-0"></i>
                </div>
                <div>
                  <small class="text-muted d-block">Teléfono</small>
                  <span class="fw-medium">{{ client?.phone || 'No registrado' }}</span>
                </div>
              </div>

              <div class="mb-3 d-flex align-items-center">
                <div class="icon-box bg-white rounded-circle p-2 me-3 shadow-sm text-primary">
                  <i class="bi bi-card-text mb-0"></i>
                </div>
                <div>
                  <small class="text-muted d-block">RIF</small>
                  <span class="fw-medium">{{ client?.dni || 'No registrado' }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center">
                <div class="icon-box bg-white rounded-circle p-2 me-3 shadow-sm text-primary">
                  <i class="bi bi-geo-alt mb-0"></i>
                </div>
                <div>
                  <small class="text-muted d-block">Ubicación</small>
                  <span class="fw-medium">{{ client?.city?.name || 'No registrada' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
