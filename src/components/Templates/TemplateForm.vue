<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useSwalToast } from '@/composables/useSwalToast'
import { URLS } from '@/const/api'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import ShortcutInput from '@/components/common/ShortcutInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps({
  initialData: {
    type: Object as () => Record<string, any> | null,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'close'])

const store = useStore()
const route = useRoute()
const swalToast = useSwalToast()
const idPharmacy = route.params.id_pharmacy as string

const categoryOptions = [
  { id: 'Welcome', name: 'Bienvenida' },
  { id: 'Inactivity', name: 'Inactividad' },
  { id: 'Other', name: 'Otros' },
]

const selectedCategory = ref<any>(null)
const existingTemplates = ref<any[]>([])

const form = ref({
  name: '',
  description: '',
  category: '',
})

const descriptionError = ref('')

const validateDescription = () => {
  const content = form.value.description || ''
  if (!content || content.trim() === '') {
    descriptionError.value = 'La descripción es obligatoria'
    return false
  }
  descriptionError.value = ''
  return true
}

watch(
  () => form.value.description,
  () => {
    if (descriptionError.value) {
      validateDescription()
    }
  }
)

const shortcutOptions = ['CTRL']
const shortcutModifiers = ref<any>(null)
const shortcutKey = ref('')

watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      form.value.name = newVal.name || newVal.title || ''
      form.value.description = newVal.description || ''
      form.value.category = newVal.category || ''
      selectedCategory.value = categoryOptions.find(opt => opt.id === newVal.category) || null
      
      if (newVal.command) {
        const parts = newVal.command.split(/\s*\+\s*/).map((p: string) => p.trim()).filter(Boolean)
        const modifiers: string[] = []
        let key = ''
        parts.forEach((part: string) => {
          const upperPart = part.toUpperCase()
          if (shortcutOptions.includes(upperPart)) {
            modifiers.push(upperPart)
          } else {
            key = part
          }
        })
        shortcutModifiers.value = modifiers.length > 0 ? { id: modifiers[0], name: modifiers[0] } : null
        shortcutKey.value = key
      } else {
        shortcutModifiers.value = null
        shortcutKey.value = ''
      }
    } else {
      form.value.name = ''
      form.value.description = ''
      form.value.category = ''
      selectedCategory.value = null
      shortcutModifiers.value = null
      shortcutKey.value = ''
    }
    descriptionError.value = ''
  },
  { immediate: true },
)

watch(selectedCategory, (newVal) => {
  form.value.category = newVal ? newVal.id : ''
})

const fetchExistingTemplates = async () => {
  if (!idPharmacy) return
  try {
    const response: any = await store.dispatch('getData', {
      url: URLS.template_message.getAll,
      params: {
        active: null,
        id_pharmacies: idPharmacy,
        limit: 1000,
      },
    })
    if (response && response.code === 200) {
      existingTemplates.value = response.data || []
    }
  } catch (error) {
    console.error('Error fetching templates:', error)
  }
}

onMounted(() => {
  fetchExistingTemplates()
})

const handleSubmit = () => {
  const isDescValid = validateDescription()
  if (!form.value.name || !isDescValid) {
    return
  }
  if (!form.value.category) {
    swalToast.showError('La categoría es requerida')
    return
  }

  const categoryVal = form.value.category
  if (categoryVal === 'Welcome' || categoryVal === 'Inactivity') {
    const isEditing = !!props.initialData?.id
    const currentId = props.initialData?.id

    const exists = existingTemplates.value.some((temp) => {
      if (isEditing && String(temp.id) === String(currentId)) {
        return false
      }
      return temp.category === categoryVal && temp.active !== 2
    })

    if (exists) {
      swalToast.showError(
        `Ya existe una plantilla registrada con la categoría "${categoryVal}".`
      )
      return
    }
  }

  const parts: string[] = []
  if (shortcutModifiers.value) {
    if (Array.isArray(shortcutModifiers.value)) {
      shortcutModifiers.value.forEach((item: any) => {
        const val = typeof item === 'string' ? item : (item?.id || item?.name)
        if (val) parts.push(val)
      })
    } else {
      const val = typeof shortcutModifiers.value === 'string' 
        ? shortcutModifiers.value 
        : (shortcutModifiers.value.id || shortcutModifiers.value.name)
      if (val) parts.push(val)
    }
  }
  if (shortcutKey.value) {
    parts.push(shortcutKey.value)
  }
  const command = parts.join(' + ').toUpperCase()

  emit('submit', { ...form.value, command })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-3">
      <MultiselectCustom
        v-model="selectedCategory"
        :options="categoryOptions"
        label="Categoría *"
        placeholder="Seleccionar categoría"
        helper-type="custom"
        :show-icons="false"
        :show-descriptions="false"
        clearable
      />
      <transition name="fade">
        <div
          v-if="form.category === 'Welcome' || form.category === 'Inactivity'"
          class="alert alert-warning border-0 py-2 px-3 mt-2 rounded-3 d-flex align-items-center gap-2"
          style="font-size: 0.85rem; background-color: #fffbeb; color: #b45309;"
        >
          <i class="bi bi-info-circle-fill fs-5" style="color: #d97706;"></i>
          <span>La plantilla creada con esta categoría se enviará automáticamente y solo puede existir una por farmacia.</span>
        </div>
      </transition>
    </div>
    <BaseInput
      id="templateName"
      label="Nombre *"
      v-model="form.name"
      placeholder="Ej. Plantilla de bienvenida"
      :disabled="!selectedCategory"
      enable-emoji
      :rules="[(v) => !!v || 'El nombre es obligatorio']"
    />
    <BaseTextarea
      id="templateDescription"
      v-model="form.description"
      label="Descripción *"
      placeholder="Mensaje de la plantilla..."
      :disabled="!selectedCategory"
      enable-emoji
      :error="descriptionError"
      :rules="[(v) => !!v || 'La descripción es obligatoria']"
    />

    <ShortcutInput
      id="shortcutKey"
      label="Atajo de teclado para la plantilla (Opcional)"
      :options="shortcutOptions"
      v-model:selectedModifiers="shortcutModifiers"
      v-model:inputValue="shortcutKey"
      :disabled="!selectedCategory"
    />
    
    
    <div class="d-flex justify-content-end gap-2 mt-4">
      <button type="button" class="btn btn-light" @click="emit('close')" :disabled="loading">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary text-white px-4" :disabled="loading">
        <LoadingSpinner v-if="loading" class="me-1" />
        Guardar
      </button>
    </div>
  </form>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
