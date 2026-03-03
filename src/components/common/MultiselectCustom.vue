<template>
  <Multiselect
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :options="options"
    :placeholder="placeholder"
    :track-by="defaultProps.trackBy"
    :label="defaultProps.label"
    :close-on-select="defaultProps.closeOnSelect"
    :clear-on-select="defaultProps.clearOnSelect"
    :searchable="defaultProps.searchable"
    :allow-empty="defaultProps.allowEmpty"
    :multiple="multiple"
    :class="[defaultClasses.container, variant ? `multiselect-${variant}` : '']"
    v-bind="$attrs"
  >
    <!-- Slot para opciones personalizadas -->
    <template #option="{ option }" v-if="showIcons">
      <div :class="defaultClasses.option">
        <div :class="defaultClasses.iconContainer">
          <i :class="[getIcon(option[iconKey]), defaultClasses.icon]"></i>
        </div>
        <div :class="defaultClasses.content">
          <div :class="defaultClasses.title">{{ option[labelKey] }}</div>
          <small :class="defaultClasses.description" v-if="showDescriptions">
            {{ getDescription(option[iconKey], option) }}
          </small>
        </div>
      </div>
    </template>

    <!-- Slot para label seleccionado -->
    <template #singleLabel="{ option }" v-if="showIcons">
      <div :class="defaultClasses.singleLabel">
        <i :class="[getIcon(option[iconKey]), defaultClasses.singleIcon]"></i>
        <span :class="defaultClasses.singleTitle">{{ option[labelKey] }}</span>
      </div>
    </template>

    <!-- Pasar otros slots al componente padre -->
    <template v-for="(_, slot) in $slots" #[slot]="scope" :key="slot">
      <slot :name="slot" v-bind="scope" />
    </template>
  </Multiselect>
</template>

<script setup lang="ts">
import Multiselect from 'vue-multiselect'
import { useMultiselectDefaults, useRoleHelpers } from '@/composables/useMultiselect'

interface Props {
  modelValue?: any
  options: any[]
  placeholder?: string
  multiple?: boolean
  showIcons?: boolean
  showDescriptions?: boolean
  iconKey?: string
  labelKey?: string
  variant?: 'success' | 'warning' | 'danger' | 'primary'
  helperType?: 'roles' | 'custom'
  customIconMap?: Record<string, string>
  customDescriptionMap?: Record<string, string>
  descriptionProp?: string
  customDefaultIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar opción',
  multiple: false,
  showIcons: true,
  showDescriptions: true,
  iconKey: 'name',
  labelKey: 'name',
  helperType: 'roles',
})

defineEmits<{
  'update:modelValue': [value: any]
}>()

const { defaultProps, defaultClasses } = useMultiselectDefaults()

// Configurar helpers según el tipo
// Las funciones leen los props directamente en cada llamada para reaccionar
// a datos cargados de forma asíncrona (ej. companyIconMap llega vacío al inicio).
const getIcon = (key: string): string => {
  if (props.helperType === 'roles') {
    return useRoleHelpers().getRoleIcon(key)
  }
  if (props.helperType === 'custom' && props.customIconMap) {
    return props.customIconMap[key] || props.customDefaultIcon || 'bi bi-circle'
  }
  return props.customDefaultIcon || 'bi bi-circle'
}

const getDescription = (key: string, option?: any): string => {
  if (props.helperType === 'roles') {
    return useRoleHelpers().getRoleDescription(key)
  }
  if (props.helperType === 'custom' && props.customDescriptionMap) {
    return props.customDescriptionMap[key] || 'Opción del sistema'
  }
  if (props.descriptionProp && option && option[props.descriptionProp]) {
    return option[props.descriptionProp]
  }
  return 'Opción del sistema'
}
</script>

<style>
@import '@/assets/styles/multiselect-custom.css';
</style>
