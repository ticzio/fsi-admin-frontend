<script setup lang="ts">
defineProps<{
  vehicleData: any
  vehicleName: string
  vehicleModelName: string
  typeEngineName: string
  typeTransmissionName: string
  typeBrakeName: string
  vehicleCount?: number
}>()
</script>

<template>
  <!-- Vehicle Info (Read Only) -->
  <div class="mb-4">
    <div class="col-md-12 d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Información del Vehículo</h5>
      <div class="d-flex align-items-center gap-2">
        <span class="text-muted small me-2">{{ vehicleCount || 1 }} vehículo(s)</span>
        <i class="bi bi-chevron-left text-secondary cursor-pointer" style="font-size: 1.2rem"></i>
        <span class="badge bg-primary px-3 py-2 fs-6 rounded-pill shadow-sm">
          Vehículo: {{ vehicleName || 'N/A' }}
        </span>
        <i class="bi bi-chevron-right text-secondary cursor-pointer" style="font-size: 1.2rem"></i>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Placa</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="vehicleData?.license_plate || 'N/A'"
          disabled
        />
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">VIN</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="vehicleData?.vin || 'N/A'"
          disabled
        />
      </div>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Nombre del vehículo</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="vehicleName || 'N/A'"
          disabled
        />
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">Modelo</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="vehicleModelName || 'N/A'"
          disabled
        />
      </div>
    </div>
  </div>

  <!-- Vehicle Types (Read Only - from first level IDs) -->
  <div class="mb-4">
    <h5 class="mb-3">Especificaciones Técnicas</h5>
    <div class="row">
      <div class="col-md-3 mb-3">
        <label class="form-label">Tipo de Motor</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="typeEngineName"
          disabled
        />
      </div>
      <div class="col-md-3 mb-3">
        <label class="form-label">Tipo de combustible</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="vehicleData?.type_fuel || 'N/A'"
          disabled
        />
      </div>
      <div class="col-md-3 mb-3">
        <label class="form-label">Tipo de Transmisión</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="typeTransmissionName"
          disabled
        />
      </div>
      <div class="col-md-3 mb-3">
        <label class="form-label">Tipo de Freno</label>
        <input
          type="text"
          class="form-control border-radius-left border-radius-right"
          :value="typeBrakeName"
          disabled
        />
      </div>
    </div>
  </div>
</template>
