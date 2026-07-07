<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'

interface LoyaltySettingsForm {
  points_multiplier: string | number
  expiration_days: string | number
}

const props = defineProps({
  initialData: {
    type: Object as () => Record<string, any> | null,
    default: null,
  },
})

const emit = defineEmits(['submit'])

const formData = ref<LoyaltySettingsForm>({
  points_multiplier: '',
  expiration_days: '',
})

const pointsMultiplierRules = [
  (val: any) => !!val || 'El multiplicador de puntos es obligatorio',
  (val: any) => !isNaN(Number(val)) || 'Debe ser un número válido',
  (val: any) => Number(val) >= 1 || 'El multiplicador debe ser mayor o igual a 1.0',
]

const expirationDaysRules = [
  (val: any) => !!val || 'Los días de expiración son obligatorios',
  (val: any) => !isNaN(Number(val)) || 'Debe ser un número válido',
  (val: any) => Number.isInteger(Number(val)) || 'Debe ser un número entero',
  (val: any) => Number(val) > 0 || 'Los días de expiración deben ser mayores a 0',
]

const initForm = () => {
  if (props.initialData) {
    formData.value = {
      points_multiplier: props.initialData.points_multiplier ?? '1.0',
      expiration_days: props.initialData.expiration_days ?? 30,
    }
  } else {
    formData.value = {
      points_multiplier: '1.0',
      expiration_days: 30,
    }
  }
}

onMounted(() => {
  initForm()
})

watch(
  () => props.initialData,
  () => {
    initForm()
  },
  { deep: true }
)

const handleSubmit = () => {
  // Validaciones locales antes de emitir
  const mult = Number(formData.value.points_multiplier)
  const days = Number(formData.value.expiration_days)

  if (isNaN(mult) || mult < 1) return
  if (isNaN(days) || !Number.isInteger(days) || days <= 0) return

  emit('submit', {
    points_multiplier: formData.value.points_multiplier.toString(),
    expiration_days: parseInt(formData.value.expiration_days.toString(), 10),
  })
}

defineExpose({
  handleSubmit,
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="row g-3">
    <div class="col-12 col-md-6">
      <BaseInput
        id="loyalty-points-multiplier"
        v-model="formData.points_multiplier"
        label="Multiplicador de Puntos"
        placeholder="Ej: 1.50"
        is-currency
        :rules="pointsMultiplierRules"
      />
      <div class="form-text mt-1 text-muted">
        Establece cuántos puntos se acumularán por cada unidad de valor gastada (ej. 1.5 significa 1.5 puntos por cada $1).
      </div>
    </div>

    <div class="col-12 col-md-6">
      <BaseInput
        id="loyalty-expiration-days"
        v-model="formData.expiration_days"
        label="Días de Expiración"
        placeholder="Ej: 60"
        type="number"
        :rules="expirationDaysRules"
      />
      <div class="form-text mt-1 text-muted">
        Período de validez en días para los puntos acumulados por los usuarios antes de caducar.
      </div>
    </div>
  </form>
</template>
