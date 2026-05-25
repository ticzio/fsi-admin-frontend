<script setup lang="ts">
import { computed } from 'vue'
import { useMoment } from '@/composables/useMoment'
import CustomCard from '@/components/common/CustomCard.vue'

const props = defineProps<{
  exchange: any
}>()

const { getMoment } = useMoment()

// Data extraction with safe navigation
const operatorName = computed(() => props.exchange?.id_users?.full_name || 'N/A')
const exchangeDate = computed(() => props.exchange?.exchanged_at || '-')
const exchangeTime = computed(() => props.exchange?.created_at || '-')
const clientName = computed(() => props.exchange?.coupon_client?.client?.full_name || 'N/A')
const clientDni = computed(() => props.exchange?.coupon_client?.client?.ci || 'N/A')
const benefit = computed(() => props.exchange?.coupon_client?.coupon?.name || 'N/A')
const levelName = computed(() => props.exchange?.coupon_client?.coupon?.name || 'N/A')
const pharmacyName = computed(() => props.exchange?.id_pharmacy?.name || 'N/A')
const couponCode = computed(() => props.exchange?.coupon_client?.coupon?.code || '-')

// Coupon Preview Data
const couponName = computed(() => props.exchange?.coupon_client?.coupon?.name || 'Cupón')
const couponDesc = computed(() => props.exchange?.coupon_client?.coupon?.description || '')
const couponImage = computed(() => props.exchange?.coupon_client?.coupon?.url_img)
const startDate = computed(() => props.exchange?.coupon_client?.coupon?.start_date || '-')
const finishDate = computed(() => props.exchange?.coupon_client?.coupon?.finish_date || '-')

// Flexibility for extra data
const extraData = computed(() => {
  // Extract fields that are not already handled in the direct list
  const handledKeys = [
    'id',
    'id_user',
    'exchanged_at',
    'id_coupon_client',
    'id_pharmacy',
    'active',
    'timestamp',
    'id_users',
    'coupon_client',
    // also exclude specific nested objects if they appear as keys
    'operator',
    'pharmacy',
  ]
  return Object.entries(props.exchange || {})
    .filter(([key, value]) => !handledKeys.includes(key) && typeof value !== 'object')
    .map(([key, value]) => ({ key, value }))
})
</script>

<template>
  <div class="redeemed-coupon-detail p-3">
    <div class="row g-4">
      <!-- Columna Izquierda: Tarjeta de Cupón -->
      <div class="col-12 col-md-5 d-flex flex-column align-items-center">
        <CustomCard
          class="shadow-sm border-0 h-100"
          :centered-content="true"
          :item="{
            name: couponName,
            description: couponDesc,
            url_img: couponImage,
            start_date: startDate,
            finish_date: finishDate,
          }"
        >
          <template #footer>
            <div
              class="d-flex justify-content-between align-items-center w-100 p-3 bg-light rounded-4 mt-3"
            >
              <div class="date-range small text-secondary fw-medium">
                <i class="bi bi-calendar3 me-2"></i> <span v-format-date="startDate"> </span> -
                <span v-format-date="finishDate"></span>
              </div>
              <div class="coupon-code-footer d-flex align-items-center">
                <span class="text-secondary small text-uppercase fw-bold mx-1">COD:</span>
                <span class="fw-bold text-dark font-monospace">{{ couponCode }}</span>
              </div>
            </div>
          </template>
        </CustomCard>
      </div>

      <!-- Columna Derecha: Información Detallada -->
      <div class="col-12 col-md-7 d-flex flex-column">
        <div class="details-container bg-white p-4 rounded-4 shadow-sm border h-100">
          <h6
            class="mb-4 text-secondary text-uppercase fw-bold letter-spacing-1 border-bottom pb-2"
          >
            Detalles del Canje
          </h6>

          <div class="details-list">
            <!-- Operador -->
            <div class="row mb-3 align-items-center">
              <div class="col-sm-4 text-secondary small text-uppercase fw-semibold">Operador</div>
              <div class="col-sm-8 text-dark fw-bold">{{ operatorName }}</div>
            </div>

            <!-- Fecha/Hora -->
            <div class="row mb-3 align-items-center">
              <div class="col-sm-4 text-secondary small text-uppercase fw-semibold">
                Canjeado el
              </div>
              <div class="col-sm-8 text-dark fw-bold">
                <span v-format-date="exchangeDate"></span>
                <span class="text-secondary fw-normal mx-1">|</span>
                <span v-format-time="exchangeTime"></span>
              </div>
            </div>

            <div class="border-top my-3 opacity-50"></div>

            <!-- Cliente -->
            <div class="row mb-2 align-items-center">
              <div class="col-sm-4 text-secondary small text-uppercase fw-semibold">Cliente</div>
              <div class="col-sm-8 text-dark fw-bold">{{ clientName }}</div>
            </div>

            <!-- Cédula -->
            <div class="row mb-3 align-items-center">
              <div class="col-sm-4 text-secondary small text-uppercase fw-semibold">Cédula</div>
              <div class="col-sm-8 text-dark fw-bold font-monospace">{{ clientDni }}</div>
            </div>

            <div class="border-top my-3 opacity-50"></div>

            <!-- Beneficio -->
            <div class="row mb-2 align-items-center">
              <div class="col-sm-4 text-secondary small text-uppercase fw-semibold">Beneficio</div>
              <div class="col-sm-8 text-primary fw-bold">{{ benefit }}</div>
            </div>

            <!-- Sede -->
            <div class="row mb-0 align-items-center">
              <div class="col-sm-4 text-secondary small text-uppercase fw-semibold">Sede</div>
              <div class="col-sm-8 text-dark fw-bold">{{ pharmacyName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Código Principal -->
    <div class="mt-5 text-center">
      <small class="text-secondary text-uppercase fw-bold mb-2 d-block letter-spacing-2"
        >Código de Canje</small
      >
      <div
        class="code-bar bg-success bg-gradient text-white text-center py-3 rounded-pill shadow fw-bold h3 mb-0 font-monospace border border-white border-3"
      >
        {{ couponCode }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.redeemed-coupon-detail {
  font-family: 'Inter', sans-serif;
}

.details-container {
  border-color: #f0f0f0 !important;
}

.font-monospace {
  font-family: 'JetBrains Mono', 'Courier New', monospace !important;
  letter-spacing: 0.5px;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.letter-spacing-2 {
  letter-spacing: 2px;
}

.code-bar {
  max-width: 450px;
  margin: 0 auto;
  letter-spacing: 4px;
  box-shadow: 0 10px 15px -3px rgba(40, 167, 69, 0.3) !important;
}

@media (max-width: 767px) {
  .code-bar {
    max-width: 100%;
    font-size: 1.5rem;
  }
}
</style>
