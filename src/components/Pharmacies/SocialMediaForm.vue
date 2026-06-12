<script setup lang="ts">
import BaseInput from '@/components/common/BaseInput.vue'

defineProps<{
  form: any
}>()


</script>

<template>
  <div class="social-media-form bg-light p-3 rounded-3 border">
    <div class="row g-3">
      <!-- WhatsApp Section -->
      <div class="col-12">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div
            class="icon-box rounded-circle d-flex align-items-center justify-content-center bg-success text-white"
            style="width: 40px; height: 40px"
          >
            <i class="bi bi-whatsapp fs-5"></i>
          </div>
        </div>
        <BaseInput
          id="social-whatsapp"
          type="url"
          v-model="form.url_whatsapp"
          label="Enlace de WhatsApp"
          placeholder="https://wa.me/584141234567"
        />
      </div>

      <hr class="my-3 text-muted opacity-25" />

      <!-- Instagram Section -->
      <div class="col-12">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div
            class="icon-box rounded-circle d-flex align-items-center justify-content-center bg-danger text-white"
            style="width: 40px; height: 40px; background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)"
          >
            <i class="bi bi-instagram fs-5"></i>
          </div>
        </div>
        <BaseInput
          id="social-instagram"
          type="url"
          v-model="form.url_instagram"
          label="Enlace de Instagram"
          placeholder="https://instagram.com/mi_farmacia"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-box {
  transition: transform 0.3s ease;
}

.social-media-form:hover .icon-box {
  transform: scale(1.08);
}

:deep(.form-group-custom) {
  margin-bottom: 0 !important;
}
</style>
