<script setup lang="ts">
import { ref, watch } from 'vue'

// Define los props explícitamente para poder observarlos
const props = defineProps<{
  modelValue?: string
}>()

const phone = ref('')
const error = ref('')

const emit = defineEmits<{
  (e: 'error', value: string): void
  (e: 'update:modelValue', value: string): void
}>()

// Observa cambios en el prop modelValue que viene desde el v-model
watch(
  () => props.modelValue,
  (newValue) => {
    const value = (newValue || '').replace(/[^0-9+\-]/g, '') // Permite números, + y -

    // Aplica formato básico al estado interno 'phone'
    phone.value = value

    // Valida el nuevo valor
    validate(value)
  },
  { immediate: true },
)

function onInput(e: Event) {
  let value = (e.target as HTMLInputElement).value.replace(/[^0-9+\-]/g, '')

  // Solo emite el valor actualizado
  emit('update:modelValue', value)
}

function onKeydown(e: KeyboardEvent) {
  // Permitir teclas especiales (backspace, delete, tab, escape, enter, arrows, etc.)
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Tab' ||
    e.key === 'Escape' ||
    e.key === 'Enter' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    (e.key === 'a' && e.ctrlKey === true) || // Ctrl+A
    (e.key === 'c' && e.ctrlKey === true) || // Ctrl+C
    (e.key === 'v' && e.ctrlKey === true) || // Ctrl+V
    (e.key === 'x' && e.ctrlKey === true) || // Ctrl+X
    (e.key === 'z' && e.ctrlKey === true) // Ctrl+Z
  ) {
    return // Permitir estas teclas
  }

  // Solo permitir números (0-9), + y -
  if (!/[0-9+\-]/.test(e.key)) {
    e.preventDefault() // Bloquear cualquier otra tecla
  }
}

function validate(rawValue?: string) {
  error.value = ''
  const val = rawValue !== undefined ? rawValue : (props.modelValue || '').replace(/[^0-9+\-]/g, '')

  if (!val) return // Si no hay valor, no hay error

  // Validación básica: mínimo 11 dígitos, máximo 15 dígitos (estándar internacional)
  if (val.length < 11) {
    error.value = 'El número debe tener al menos 11 dígitos'
  } else if (val.length > 15) {
    error.value = 'El número no puede tener más de 15 dígitos'
  }

  emit('error', error.value)
}
</script>

<template>
  <div>
    <input
      id="venephone-input"
      type="tel"
      class="form-control border-radius-left border-radius-right"
      :value="phone"
      maxlength="15"
      @input="onInput"
      @keydown="onKeydown"
      placeholder="Ej: 0412-1234567"
    />
    <div class="d-flex justify-content-end">
      <div v-if="error" class="text-danger small mt-1 fw-light">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-input-placeholder {
  color: #b0b0b0;
}
input:-moz-placeholder {
  color: #b0b0b0;
}
input::-moz-placeholder {
  color: #b0b0b0;
}
input:-ms-input-placeholder {
  color: #b0b0b0;
}
</style>
<!--
============================
VenePhone.vue — Componente de entrada para teléfonos internacionales
============================

Props:
  - modelValue (string, opcional): Valor del teléfono (vía v-model)

Emite:
  - update:modelValue (string): Se emite cada vez que el usuario ingresa un valor válido (solo dígitos)
  - error (string): Se emite cada vez que el valor cambia, con el mensaje de error actual ('' si no hay error)

Validaciones:
  - Solo permite caracteres del 0 al 9, + y - (input restringido a dígitos, + y -)
  - El número debe tener entre 7 y 15 dígitos (estándar internacional)

Uso básico:
```vue
<VenePhone v-model="teléfono" @error="onError" />
```

Ejemplo de manejo de errores en el padre:
```vue
<template>
  <VenePhone v-model="teléfono" @error="error => errorMsg = error" />
  <div v-if="errorMsg" class="text-danger">{{ errorMsg }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const teléfono = ref('')
const errorMsg = ref('')
</script>
```

-->
