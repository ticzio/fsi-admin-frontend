<script setup lang="ts">
interface TitleSectionProps {
  title: string
  description: string
  alert?: string
  isLoading?: boolean
}
defineProps<TitleSectionProps>()
</script>

<template>
  <div
    class="mb-4 pb-3 d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center"
  >
    <div>
      <!-- Skeleton de carga -->
      <template v-if="isLoading">
        <div class="placeholder-glow">
          <span
            class="placeholder rounded-pill mb-2 d-block bg-secondary"
            style="height: 40px; width: 350px"
          ></span>
          <span
            class="placeholder rounded-pill d-block bg-secondary"
            style="height: 24px; width: 500px"
          ></span>
        </div>
      </template>
      <!-- Contenido real -->
      <template v-else>
        <h1 class="fw-bold display-5 mb-0">{{ title }}</h1>
        <h3 class="fs-4 fw-light">{{ description }}</h3>
      </template>
      <div
        v-if="alert && !isLoading"
        :class="['alert alert-warning text-warning-subtle', alert ? 'mb-2' : '']"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ alert }}
      </div>
    </div>
    <div>
      <!-- arrow back -->
      <button
        class="btn btn-outline-secondary border-radius-left border-radius-right px-4 mt-2"
        @click="$router.go(-1)"
      >
        <i class="bi bi-arrow-left"></i> Volver
      </button>
    </div>
  </div>
</template>
