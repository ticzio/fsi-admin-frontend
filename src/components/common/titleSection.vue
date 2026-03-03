<script setup lang="ts">
import fsiLogoImage from '@/assets/images/login/login_logo_FSI.png'

interface TitleSectionProps {
  title: string
  description: string
  alert?: string
  isLoading?: boolean
  showLogo?: boolean
}
defineProps<TitleSectionProps>()
</script>

<template>
  <div
    class="mb-4 pb-3 d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center"
  >
    <div class="d-flex align-items-center gap-3">
      <img
        v-if="showLogo"
        :src="fsiLogoImage"
        alt="FSI Logo"
        style="width: 90px; height: 90px; object-fit: contain"
      />
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
          <h1
            class="mb-0 fw-bold text-dark display-5"
            style="
              letter-spacing: -1px;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
              font-style: italic;
            "
          >
            {{ title }}
          </h1>
          <p class="mb-0 text-dark fw-medium fs-5 mt-1">{{ description }}</p>
        </template>
        <div
          v-if="alert && !isLoading"
          :class="['alert alert-warning text-warning-subtle mt-2', alert ? 'mb-2' : '']"
        >
          <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ alert }}
        </div>
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
