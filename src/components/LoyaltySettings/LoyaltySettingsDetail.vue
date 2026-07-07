<script setup lang="ts">
import DateTimeBadges from '@/components/common/DateTimeBadges.vue'

interface LoyaltySettings {
  points_multiplier: string | number
  expiration_days: string | number
  created_at?: string
  updated_at?: string
}

defineProps({
  loyaltySettings: {
    type: Object as () => LoyaltySettings,
    required: true,
  },
})
</script>

<template>
  <div class="row g-4">
    <!-- Info header -->
    <div class="col-12 d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-3 mb-2">
      <div class="d-flex align-items-center gap-3">
        <div>
          <h4 class="fw-bold mb-1 text-dark">Configuración Actual de Puntaje</h4>
        </div>
      </div>
      <div class="flex-shrink-0">
        <DateTimeBadges
          :created-at="loyaltySettings.created_at"
          :updated-at="loyaltySettings.updated_at"
        />
      </div>
    </div>

    <!-- Multiplier Info Box -->
    <div class="col-12 col-md-6">
      <div class="p-4 border rounded-3 bg-light h-100 d-flex flex-column justify-content-between">
        <div>
          <span class="text-muted fs-6 text-uppercase fw-semibold d-block mb-2">Multiplicador de Puntos</span>
          <h1 class="fw-extrabold text-primary mb-3 display-6">
            {{ loyaltySettings.points_multiplier }}x
          </h1>
        </div>
        <p class="text-muted mb-0 fs-6">
          Cada unidad gastada se multiplicará por este factor para acreditar los puntos correspondientes a la cuenta del cliente.
        </p>
      </div>
    </div>

    <!-- Expiration Days Info Box -->
    <div class="col-12 col-md-6">
      <div class="p-4 border rounded-3 bg-light h-100 d-flex flex-column justify-content-between">
        <div>
          <span class="text-muted fs-6 text-uppercase fw-semibold d-block mb-2">Vigencia de los Puntos</span>
          <h1 class="fw-extrabold text-dark mb-3 display-6">
            {{ loyaltySettings.expiration_days }} días
          </h1>
        </div>
        <p class="text-muted mb-0 fs-6">
          Los puntos acumulados caducarán automáticamente transcurrido este número de días si no son canjeados.
        </p>
      </div>
    </div>
  </div>
</template>
