<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import EmojiPicker from './EmojiPicker.vue'

interface Props {
  modelValue?: string | number
  type?: string
  label?: string
  id: string
  placeholder?: string
  disabled?: boolean
  autocomplete?: string
  rules?: Array<(val: any) => string | boolean>
  enableEmoji?: boolean
  isCurrency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  label: '',
  placeholder: '',
  disabled: false,
  autocomplete: 'off',
  rules: () => [],
  enableEmoji: false,
  isCurrency: false,
})

const emit = defineEmits(['update:modelValue'])

const internalErrors = ref<string[]>([])
const isPasswordVisible = ref(false)
const validationContext = useFormValidation()

// --- EMOJI PICKER LOGIC ---
const showEmojiPicker = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const emojiPickerRef = ref<any>(null)
const emojiTriggerRef = ref<HTMLElement | null>(null)

// --- CURRENCY LOGIC ---
const displayValue = ref('')
const numericValue = ref<number | null>(null)
const digitsOnly = ref('')
const isInternalUpdate = ref(false)

const formatCurrencyNumber = (num: number) => {
  if (num === null || num === undefined || isNaN(num)) return ''
  const [intPart, decPart] = num.toFixed(2).split('.')
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decPart}`
}

const formatFromDigits = (digits: string) => {
  const stripped = digits.replace(/^0+/, '')

  if (stripped === '') {
    return { formatted: '0.00', numeric: 0 }
  }
  
  if (stripped.length === 1) {
    const numeric = parseFloat(`0.0${stripped}`)
    return { formatted: '0.0' + stripped, numeric }
  } else if (stripped.length === 2) {
    const numeric = parseFloat(`0.${stripped}`)
    return { formatted: '0.' + stripped, numeric }
  } else {
    const intPart = stripped.slice(0, -2)
    const decPart = stripped.slice(-2)
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const formatted = `${formattedInt}.${decPart}`
    const numeric = parseFloat(`${intPart}.${decPart}`)
    return { formatted, numeric }
  }
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

// Insert emoji at the cursor position
const insertEmoji = (emojiChar: string) => {
  const input = inputRef.value
  if (!input) return

  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? 0
  const text = props.modelValue ? String(props.modelValue) : ''

  const newText = text.substring(0, start) + emojiChar + text.substring(end)
  emit('update:modelValue', newText)
  validate(newText)

  // Restore focus and cursor position
  setTimeout(() => {
    input.focus()
    const newPos = start + emojiChar.length
    input.setSelectionRange(newPos, newPos)
  }, 0)
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  const pickerEl = emojiPickerRef.value?.$el
  if (
    showEmojiPicker.value &&
    pickerEl &&
    !pickerEl.contains(event.target as Node) &&
    emojiTriggerRef.value &&
    !emojiTriggerRef.value.contains(event.target as Node)
  ) {
    showEmojiPicker.value = false
  }
}

onMounted(() => {
  validationContext?.registerField(props.id, internalErrors.value.length > 0)
  document.addEventListener('click', handleClickOutside)

  if (props.isCurrency) {
    const num = props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined 
      ? parseFloat(String(props.modelValue).replace(/,/g, '')) 
      : 0
    if (!isNaN(num)) {
      displayValue.value = formatCurrencyNumber(num)
      numericValue.value = num
      digitsOnly.value = num === 0 ? '' : String(Math.round(num * 100))
    } else {
      displayValue.value = '0.00'
      numericValue.value = 0
      digitsOnly.value = ''
    }
  }
})

onUnmounted(() => {
  validationContext?.unregisterField(props.id)
  document.removeEventListener('click', handleClickOutside)
})

watch(
  () => internalErrors.value.length,
  (newCount) => {
    validationContext?.updateFieldStatus(props.id, newCount > 0)
  },
)

const inputType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
})

const validate = (value: any) => {
  if (!props.rules || props.rules.length === 0) {
    internalErrors.value = []
    return true
  }

  const errors: string[] = []
  for (const rule of props.rules) {
    const result = rule(value)
    if (typeof result === 'string') {
      errors.push(result)
    } else if (result === false) {
      errors.push('Campo inválido')
    }
  }
  internalErrors.value = errors
  return errors.length === 0
}

// Opcional: Validar cuando cambia el valor desde fuera
watch(
  () => props.modelValue,
  (newVal) => {
    if (props.isCurrency) {
      if (isInternalUpdate.value) return
      
      const incoming = (newVal !== null && newVal !== undefined && newVal !== '') 
        ? parseFloat(String(newVal).replace(/,/g, '')) 
        : 0
      if (incoming !== numericValue.value) {
        if (!isNaN(incoming)) {
          displayValue.value = formatCurrencyNumber(incoming)
          numericValue.value = incoming
          digitsOnly.value = incoming === 0 ? '' : String(Math.round(incoming * 100))
        } else {
          displayValue.value = '0.00'
          numericValue.value = 0
          digitsOnly.value = ''
        }
      }
      if (internalErrors.value.length > 0) {
        validate(incoming)
      }
    } else {
      if (internalErrors.value.length > 0) {
        validate(newVal)
      }
    }
  },
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  emit('update:modelValue', value)
  validate(value)
}

const handleCurrencyInput = (event: Event) => {
  const inputEvent = event as InputEvent
  const inputType = inputEvent.inputType
  
  isInternalUpdate.value = true
  
  if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
    digitsOnly.value = digitsOnly.value.slice(0, -1)
  } else if (inputType === 'insertText' && inputEvent.data && /^[0-9]$/.test(inputEvent.data)) {
    digitsOnly.value += inputEvent.data
  } else {
    const target = event.target as HTMLInputElement
    const allDigits = target.value.replace(/[^0-9]/g, '')
    if (allDigits !== digitsOnly.value) {
      digitsOnly.value = allDigits
    }
  }
  
  const { formatted, numeric } = formatFromDigits(digitsOnly.value)
  displayValue.value = formatted
  numericValue.value = numeric
  emit('update:modelValue', numeric)
  validate(numeric)
  
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.setSelectionRange(formatted.length, formatted.length)
    }
    isInternalUpdate.value = false
  })
}

const handleFocus = () => {
  if (props.isCurrency && inputRef.value) {
    nextTick(() => {
      requestAnimationFrame(() => {
        if (inputRef.value) {
          const length = inputRef.value.value.length
          inputRef.value.setSelectionRange(length, length)
        }
      })
    })
  }
}

const handleBlur = (event: Event) => {
  if (props.isCurrency) {
    if (numericValue.value === null || numericValue.value === undefined) {
      displayValue.value = '0.00'
      numericValue.value = 0
      emit('update:modelValue', 0)
    }
    validate(numericValue.value)
  } else {
    const target = event.target as HTMLInputElement
    validate(target.value)
  }
}

const togglePasswordVisibility = () => {
  if (props.disabled) return
  isPasswordVisible.value = !isPasswordVisible.value
}
</script>

<template>
  <div class="mb-3 form-group-custom">
    <label v-if="label" :for="id" class="form-label mb-1 fw-bold">
      {{ label }}
      <slot name="label-icon"></slot>
    </label>

    <div class="input-wrapper">
      <div :class="{ 'input-group': type === 'password' }">
        <input
          ref="inputRef"
          :id="id"
          :type="isCurrency ? 'text' : inputType"
          :inputmode="isCurrency ? 'numeric' : undefined"
          class="form-control"
          :class="{
            'is-invalid': internalErrors.length > 0,
            'border-end-0': type === 'password' && internalErrors.length === 0,
            'custom-input': true,
            'has-emoji': type === 'text' && enableEmoji,
          }"
          :value="isCurrency ? displayValue : modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :autocomplete="autocomplete"
          :style="isCurrency ? 'text-align: right;' : undefined"
          @input="isCurrency ? handleCurrencyInput($event) : handleInput($event)"
          @blur="handleBlur"
          @focus="handleFocus"
        />

        <span
          v-if="type === 'password'"
          class="input-group-text bg-white custom-input-icon"
          :class="{
            'border-start-0': internalErrors.length === 0,
            'border-danger': internalErrors.length > 0,
            'disabled-icon': disabled,
          }"
        >
          <button
            class="btn btn-link p-0 text-muted text-decoration-none"
            type="button"
            @click="togglePasswordVisibility"
            tabindex="-1"
            :disabled="disabled"
          >
            <i :class="isPasswordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </span>
      </div>

      <!-- Emoji Trigger Button -->
      <button
        v-if="type === 'text' && enableEmoji"
        ref="emojiTriggerRef"
        type="button"
        class="emoji-trigger-btn"
        :disabled="disabled"
        @click="toggleEmojiPicker"
        @mousedown.prevent
        title="Insertar emoji"
      >
        <i class="bi bi-emoji-smile"></i>
      </button>

      <!-- macOS Emoji Picker Popover -->
      <transition name="popover-fade">
        <EmojiPicker
          v-if="type === 'text' && enableEmoji && showEmojiPicker"
          ref="emojiPickerRef"
          @select="insertEmoji"
        />
      </transition>
    </div>

    <transition name="fade">
      <div v-if="internalErrors.length > 0" class="errors-wrapper">
        <div class="errors-wrapper-inner">
          <transition-group
            name="list"
            tag="div"
            class="invalid-feedback d-block mt-1 errors-container"
          >
            <div v-for="error in internalErrors" :key="error" class="error-item">• {{ error }}</div>
          </transition-group>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.form-group-custom label {
  font-size: 1rem;
}

:deep(.label-icon) {
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s ease;
  font-size: 0.9em;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

:deep(.label-icon:hover) {
  color: #3b82f6;
}

.custom-input {
  font-size: 1.1rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background-color: #ffffff;
  color: #111827;
  box-shadow: none;
}

.custom-input:disabled {
  cursor: not-allowed;
  background-color: #f3f4f6;
  color: #9ca3af;
}

.custom-input::placeholder {
  color: #6b7280;
  font-size: 1.1rem;
}

.custom-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.1);
}

.input-group > .custom-input:focus {
  z-index: 3;
}

.custom-input-icon {
  border: 1px solid #e5e7eb;
  border-radius: 0 10px 10px 0;
  background-color: #ffffff;
}

.custom-input-icon.disabled-icon {
  cursor: not-allowed;
  background-color: #f3f4f6 !important;
}

.custom-input.border-end-0 {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.custom-input-icon.border-start-0 {
  border-left: none;
}

.input-group .btn-link {
  color: #9ca3af;
}
.input-group .btn-link:focus,
.input-group .btn-link:hover {
  color: #4b5563;
  outline: none;
  box-shadow: none;
}

.input-group .btn-link:disabled {
  cursor: not-allowed;
}

.invalid-feedback {
  font-size: 0.875em;
  color: #dc3545;
}

.errors-wrapper {
  position: relative;
  display: grid;
  grid-template-rows: 1fr;
  /* El pseudo-elemento creará la sombra/difuminado en la parte de abajo indicando scroll */
}

.errors-wrapper-inner {
  min-height: 0;
  overflow: hidden;
}

.errors-container {
  max-height: 3.2em; /* Muestra hasta 2 errores cómodamente */
  overflow-y: scroll; /* Fuerza la barra de scroll a estar visible si se excede el alto */
  /* Fallback para Firefox */
  scrollbar-width: thin;
  scrollbar-color: #fca5a5 #f9fafb;
  padding-right: 4px;
}

/* Forzar Webkit (Chrome/Safari/Edge/MacOS) a mostrar el scroll siempre */
.errors-container::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 6px;
}
.errors-container::-webkit-scrollbar-track {
  background: #f9fafb; /* Fondo muy gris claro para que el track exista visualmente */
  border-radius: 4px;
}
.errors-container::-webkit-scrollbar-thumb {
  background-color: #fca5a5; /* Color del scrollbar rojo tenue */
  border-radius: 4px;
  border: 1px solid #f9fafb; /* Pequeño borde para separarlo del track */
}

.error-item {
  line-height: 1.4em;
  margin-bottom: 4px;
  word-break: break-word; /* Rompe palabras extra largas que no tienen espacios */
  overflow-wrap: break-word; /* Asegura el salto de línea al llegar al borde */
  white-space: normal; /* Asegura que el texto respete los bordes de la caja */
  overflow: hidden;
  max-height: 5em;
}
.error-item:last-child {
  margin-bottom: 0;
}

.is-invalid {
  border-color: #dc3545 !important;
}

.is-valid {
  border-color: #198754 !important;
}

/* Fix for overlapping icons in time/date inputs with validation */
.custom-input[type='time'].is-valid,
.custom-input[type='time'].is-invalid,
.custom-input[type='date'].is-valid,
.custom-input[type='date'].is-invalid,
.custom-input[type='datetime-local'].is-valid,
.custom-input[type='datetime-local'].is-invalid,
.custom-input[type='month'].is-valid,
.custom-input[type='month'].is-invalid {
  background-image: none !important;
  padding-right: 1.2rem !important;
}

/* Transición del bloque de errores completo */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
  grid-template-rows: 0fr;
}

/* Transición individual de los errores al agregarse o quitarse */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
  max-height: 0;
  margin-bottom: 0;
}

/* Emoji Picker Integration */
.input-wrapper {
  position: relative;
  display: block;
}

.custom-input.has-emoji {
  padding-right: 2.75rem; /* Space for the emoji trigger button */
}

.emoji-trigger-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
  z-index: 5;
}

.emoji-trigger-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #111827;
}

.emoji-trigger-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  color: #9ca3af;
}

/* Popover animations */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(5px);
}
</style>
