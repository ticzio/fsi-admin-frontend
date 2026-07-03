<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import EmojiPicker from './EmojiPicker.vue'

interface Props {
  modelValue: string | number
  label?: string
  id: string
  placeholder?: string
  disabled?: boolean
  autocomplete?: string
  rows?: number | string
  rules?: Array<(val: any) => string | boolean>
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  enableEmoji?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  disabled: false,
  autocomplete: 'off',
  rows: 3,
  rules: () => [],
  resize: 'none',
  enableEmoji: false,
  error: '',
})

const emit = defineEmits(['update:modelValue'])

const internalErrors = ref<string[]>([])
const validationContext = useFormValidation()

// Combine internal validation rules errors with the external error prop
const displayErrors = computed(() => {
  const errorsList = [...internalErrors.value]
  if (props.error) {
    errorsList.push(props.error)
  }
  // Return unique errors to avoid duplicate displays
  return Array.from(new Set(errorsList))
})

onMounted(() => {
  validationContext?.registerField(props.id, displayErrors.value.length > 0)
})

onUnmounted(() => {
  validationContext?.unregisterField(props.id)
})

watch(
  () => displayErrors.value.length,
  (newCount) => {
    validationContext?.updateFieldStatus(props.id, newCount > 0)
  },
)

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

watch(
  () => props.modelValue,
  (newVal) => {
    if (displayErrors.value.length > 0) {
      validate(newVal)
    }
  },
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  emit('update:modelValue', value)
  validate(value)
}

const handleBlur = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  validate(target.value)
}

// --- EMOJI PICKER LOGIC ---
const showEmojiPicker = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const emojiPickerRef = ref<any>(null)
const emojiTriggerRef = ref<HTMLElement | null>(null)

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

// Insert emoji at the cursor position
const insertEmoji = (emojiChar: string) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = props.modelValue ? String(props.modelValue) : ''

  const newText = text.substring(0, start) + emojiChar + text.substring(end)
  emit('update:modelValue', newText)
  validate(newText)

  // Restore focus and cursor position
  setTimeout(() => {
    textarea.focus()
    const newPos = start + emojiChar.length
    textarea.setSelectionRange(newPos, newPos)
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
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>


<template>
  <div class="mb-3 form-group-custom">
    <label v-if="label" :for="id" class="form-label mb-1 fw-bold">{{ label }}</label>

    <div class="textarea-wrapper">
      <textarea
        ref="textareaRef"
        :id="id"
        class="form-control"
        :class="{
          'is-invalid': displayErrors.length > 0,
          'custom-textarea': true,
          'has-emoji': enableEmoji
        }"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :rows="rows"
        :style="{ resize: resize }"
        @input="handleInput"
        @blur="handleBlur"
      ></textarea>

      <!-- Emoji Trigger Button -->
      <button
        v-if="enableEmoji"
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
          v-if="showEmojiPicker"
          ref="emojiPickerRef"
          @select="insertEmoji"
        />
      </transition>
    </div>

    <transition name="fade">
      <div v-if="displayErrors.length > 0" class="errors-wrapper">
        <div class="errors-wrapper-inner">
          <transition-group
            name="list"
            tag="div"
            class="invalid-feedback d-block mt-1 errors-container"
          >
            <div v-for="error in displayErrors" :key="error" class="error-item">• {{ error }}</div>
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

.textarea-wrapper {
  position: relative;
  display: block;
}

.custom-textarea {
  font-size: 1.1rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background-color: #ffffff;
  color: #111827;
  box-shadow: none;
}

.custom-textarea.has-emoji {
  padding-right: 2.75rem; /* Space for the emoji trigger button */
}

.custom-textarea:disabled {
  cursor: not-allowed;
  background-color: #f3f4f6;
  color: #9ca3af;
}

.custom-textarea::placeholder {
  color: #6b7280;
  font-size: 1.1rem;
}

.custom-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.1);
  outline: none;
}

.emoji-trigger-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
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

.emoji-trigger-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.emoji-trigger-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  color: #9ca3af;
}



.invalid-feedback {
  font-size: 0.875em;
  color: #dc3545;
}

.errors-wrapper {
  position: relative;
  display: grid;
  grid-template-rows: 1fr;
}

.errors-wrapper-inner {
  min-height: 0;
  overflow: hidden;
}

.errors-container {
  max-height: 3.2em;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: #fca5a5 #f9fafb;
  padding-right: 4px;
}

.errors-container::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 6px;
}
.errors-container::-webkit-scrollbar-track {
  background: #f9fafb;
  border-radius: 4px;
}
.errors-container::-webkit-scrollbar-thumb {
  background-color: #fca5a5;
  border-radius: 4px;
  border: 1px solid #f9fafb;
}

.error-item {
  line-height: 1.4em;
  margin-bottom: 4px;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  max-height: 5em;
}
.error-item:last-child {
  margin-bottom: 0;
}

.is-invalid {
  border-color: #dc3545 !important;
}

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
