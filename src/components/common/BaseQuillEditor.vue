<script setup lang="ts">
import { computed } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Escribe aquí...',
  },
  toolbar: {
    type: [String, Array],
    default: 'essential', // 'essential', 'full', or custom array
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const content = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <div class="base-quill-editor d-flex flex-column">
    <label v-if="label" class="form-label fw-bold mb-2 fs-6">{{ label }}</label>
    <div
      class="quill-wrapper bg-white rounded-3 shadow-sm border transition-all"
      :class="{ 'border-danger': !!error }"
    >
      <QuillEditor
        v-model:content="content"
        contentType="html"
        theme="snow"
        :toolbar="toolbar"
        :placeholder="placeholder"
      />
    </div>
    <div v-if="error" class="text-danger small mt-1">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.quill-wrapper {
  transition: border-color 0.2s;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.quill-wrapper:focus-within {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.1) !important;
}

:deep(.ql-toolbar.ql-snow) {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-family: inherit;
  padding: 8px;
  border-radius: 0.5rem 0.5rem 0 0;
}

:deep(.ql-container.ql-snow) {
  border: none;
  font-size: 1rem;
  font-family: inherit;
  border-radius: 0 0 0.5rem 0.5rem;
  flex-grow: 1;
}

:deep(.ql-editor) {
  min-height: 150px;
  padding: 1rem;
}

:deep(.ql-editor.ql-blank::before) {
  color: #9ca3af;
  font-style: normal;
  left: 1rem;
  right: 1rem;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
