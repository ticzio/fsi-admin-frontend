<script setup lang="ts">
import { computed } from 'vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'

interface Props {
  id: string
  label?: string
  options: Array<string | { id: string | number; name: string }>
  selectedModifiers: any
  inputValue: string
  placeholderMultiselect?: string
  placeholderInput?: string
  disabled?: boolean
  disableModifiers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholderMultiselect: 'Seleccionar modificadores',
  placeholderInput: 'Tecla',
  disabled: false,
  disableModifiers: false,
})

const emit = defineEmits<{
  'update:selectedModifiers': [value: any]
  'update:inputValue': [value: string]
}>()

const formattedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string') {
      return { id: opt, name: opt }
    }
    return opt
  })
})

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const filtered = input.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1)
  if (input.value !== filtered) {
    input.value = filtered
  }
  emit('update:inputValue', filtered)
}
</script>

<template>
  <div class="shortcut-input-group mb-3">
    <label v-if="label" :for="id" class="form-label mb-1 fw-bold">{{ label }}</label>
    
    <div class="d-flex align-items-center gap-2">
      <!-- Contenedor para Multiselect -->
      <div class="shortcut-col">
        <MultiselectCustom
          :model-value="selectedModifiers"
          @update:modelValue="emit('update:selectedModifiers', $event)"
          :options="formattedOptions"
          :placeholder="placeholderMultiselect"
          helper-type="custom"
          :show-icons="false"
          :show-descriptions="false"
          :clearable="!disableModifiers"
          :disabled="disabled || disableModifiers"
        />
      </div>

      <!-- Separador + -->
      <span class="fs-4 fw-bold text-secondary px-1">+</span>

      <!-- Contenedor para Input -->
      <div class="shortcut-col">
        <input
          :id="id"
          type="text"
          class="form-control custom-input-field"
          :value="inputValue"
          @input="handleInput"
          :placeholder="placeholderInput"
          :disabled="disabled"
          maxlength="1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shortcut-input-group label {
  font-size: 1rem;
}

.shortcut-col {
  flex: 1;
  min-width: 0;
}

.custom-input-field {
  font-size: 1.1rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background-color: #ffffff;
  color: #111827;
  box-shadow: none;
  width: 100%;
  height: 50px; /* Aligns with MultiselectCustom height */
}

.custom-input-field::placeholder {
  color: #6b7280;
  font-size: 1.1rem;
}

.custom-input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.1);
  outline: none;
}

.custom-input-field:disabled {
  cursor: not-allowed;
  background-color: #f3f4f6;
  color: #9ca3af;
}
</style>
