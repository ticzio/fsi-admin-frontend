<template>
  <div>
    <div class="content_table position-relative border-radius-left border-radius-right">
      <div
        v-if="isTableLoading"
        class="position-absolute top-50 start-50 translate-middle d-flex justify-content-center align-items-center"
        style="z-index: 5; background: rgba(255, 255, 255, 0.8); width: 100%; height: 100%"
      >
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table" :class="{ 'opacity-50': isTableLoading }">
          <thead class="bg-white">
            <tr>
              <th v-for="header in headers" :key="header.key" class="text-center text-nowrap">
                <div class="fw-bold py-2 text-nowrap">{{ header.label }}</div>
              </th>
              <th
                v-if="hasActions"
                class="text-center fw-bold py-2 text-nowrap"
                style="vertical-align: middle; min-width: 120px"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="data.length === 0">
              <td :colspan="headers.length + (hasActions ? 1 : 0)" class="text-center py-5">
                No hay datos para mostrar
              </td>
            </tr>
            <tr v-for="item in data" :key="item.id" @click="$emit('row-click', item)">
              <td
                v-for="header in headers"
                :key="header.key"
                :class="['text-center py-3']"
                style="vertical-align: middle"
              >
                <slot
                  :name="`cell(${header.key})`"
                  :item="item"
                  :value="getNestedValue(item, header.key)"
                >
                  <!-- NO ES NECESARIO MODIFICAR LINEAS PARA CUSTOMIZAR COLUMNAS -->
                  <!-- Ver documentación para más detalles. Ejemplo en la línea 272 -->

                  {{ getNestedValue(item, header.key) }}
                </slot>
              </td>
              <td
                v-if="getActionsForItem(item).length > 0"
                class="text-center py-2 text-nowrap"
                style="vertical-align: middle; min-width: 120px"
              >
                <div class="d-flex justify-content-center w-100 gap-2">
                  <button
                    v-for="action in getActionsForItem(item)"
                    :key="`action-${action.name}-${item.id}`"
                    :class="action.class"
                    @click.stop="handleActionClick(action.name, item)"
                    :data-title="action.tooltip"
                    data-tooltip-pos="bottom"
                  >
                    <i :class="action.icon"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <nav v-if="totalPages >= 1 && !hidePagination" aria-label="Page navigation">
      <ul class="pagination justify-content-center py-2">
        <li class="page-item mx-1" :class="{ disabled: currentPage === 1 }">
          <a
            class="page-link border-radius-left border-radius-right bg-light text-dark"
            href="#"
            @click.prevent="changePage(currentPage - 1)"
          >
            <i class="bi-arrow-left"></i>
          </a>
        </li>
        <li class="page-item mx-1" v-for="page in pagesToShow" :key="page">
          <a
            class="page-link border-radius-left border-radius-right"
            :class="{
              'bg-dark text-white': page === currentPage,
              'bg-light text-dark': page !== currentPage,
            }"
            href="#"
            @click.prevent="changePage(page)"
          >
            {{ page }}
          </a>
        </li>
        <li class="page-item mx-1" v-if="showEllipsis">
          <span class="page-link border-0 fw-bold">...</span>
        </li>
        <li class="page-item mx-1" :class="{ disabled: currentPage === totalPages }">
          <a
            class="page-link border-radius-left border-radius-right bg-light text-dark"
            href="#"
            @click.prevent="changePage(currentPage + 1)"
          >
            <i class="bi-arrow-right"></i>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, ref, watch } from 'vue'

// --- Type Definitions (Interfaces) ---

interface Header {
  key: string
  label: string
}

interface Action {
  name: string
  icon: string
  class: string
  tooltip?: string
}

interface EntityItem {
  // Item -> EntityItem
  id: string | number
  [key: string]: any
}

// --- Component Props ---

const props = withDefaults(
  defineProps<{
    data: EntityItem[] // Item[] -> EntityItem[]
    headers: Header[]
    actions?:
      | Action[]
      | ((item: EntityItem) => Action[])
      | ((item: EntityItem) => Promise<Action[]>)
    currentPage?: number
    totalPages?: number
    maxPagesToShow?: number
    isLoading?: boolean
    hidePagination?: boolean
  }>(),
  {
    headers: () => [],
    actions: () => [],
    currentPage: 1,
    totalPages: 1,
    maxPagesToShow: 5,
    isLoading: false,
    hidePagination: false,
  },
)

// Estado reactivo para manejar acciones asíncronas
const itemActions = ref<Record<string | number, Action[]>>({})
const loadingActions = ref<Record<string | number, boolean>>({})

// Computed property para determinar si la tabla está cargando (datos + acciones)
const isTableLoading = computed(() => {
  // Si isLoading es true, la tabla está cargando
  if (props.isLoading) return true

  // Si hay alguna acción cargando, la tabla está cargando
  const hasLoadingActions = Object.values(loadingActions.value).some((loading) => loading)
  return hasLoadingActions
})

// --- Emits ---

const emit = defineEmits<{
  (e: 'change-page', page: number): void
  (e: 'action-click', payload: { actionName: string; item: EntityItem }): void // Item -> EntityItem
  (e: 'row-click', item: EntityItem): void // Item -> EntityItem
}>()

// --- Lógica de Paginación ---

const { currentPage, totalPages, maxPagesToShow } = toRefs(props)

const pagesToShow = computed(() => {
  const pages: number[] = []
  const startPage = Math.max(1, currentPage.value - Math.floor(maxPagesToShow.value / 2))
  const endPage = Math.min(totalPages.value, startPage + maxPagesToShow.value - 1)

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  return pages
})

const showEllipsis = computed(() => {
  return (
    totalPages.value > maxPagesToShow.value &&
    pagesToShow.value[pagesToShow.value.length - 1] < totalPages.value
  )
})

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('change-page', page)
  }
}

// --- Lógica de Acciones ---

const handleActionClick = (actionName: string, item: EntityItem) => {
  emit('action-click', { actionName, item })
}

// --- Funciones de Utilidad ---

const getNestedValue = (obj: any, key: string): any => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj) ?? '-'
}

const getActionsForItem = (item: EntityItem): Action[] => {
  if (!item) return []

  if (typeof props.actions === 'function') {
    // Si ya tenemos las acciones calculadas, las retornamos
    if (itemActions.value[item.id] && !loadingActions.value[item.id]) {
      return itemActions.value[item.id]
    }

    // Si ya está cargando, retornar array vacío
    if (loadingActions.value[item.id]) {
      return itemActions.value[item.id] || []
    }

    // CAMBIO IMPORTANTE: Usar try-catch y Promise.resolve
    try {
      const result = props.actions(item)

      // console.log('Result from actions function:', {
      //   itemId: item.id,
      //   resultType: typeof result,
      //   isPromise: result instanceof Promise,
      //   isThenable: result && typeof (result as any).then === 'function',
      //   result: result,
      // })

      // Detectar Promise de manera más robusta
      if (result instanceof Promise || (result && typeof (result as any).then === 'function')) {
        // Marcar como cargando INMEDIATAMENTE
        loadingActions.value[item.id] = true
        itemActions.value[item.id] = []

        // Convertir a Promise si no lo es ya
        Promise.resolve(result)
          .then((actions) => {
            itemActions.value[item.id] = actions || []
            loadingActions.value[item.id] = false
          })
          .catch((error) => {
            console.error('Error cargando acciones para item:', item.id, error)
            itemActions.value[item.id] = []
            loadingActions.value[item.id] = false
          })

        return []
      }

      // Si es síncrona, retornar directamente
      return result || []
    } catch (error) {
      console.error('Error executing actions function for item:', item.id, error)
      return []
    }
  }

  return props.actions || []
}

// Computed para verificar si hay acciones disponibles
// Computed para verificar si hay acciones disponibles
const hasActions = computed(() => {
  if (props.data.length === 0) return false
  if (typeof props.actions === 'function') {
    // Verificar si algún item tiene acciones (incluso si están cargando)
    return props.data.some((item) => {
      const actions = getActionsForItem(item)
      return actions.length > 0 || loadingActions.value[item.id]
    })
  }
  return (props.actions || []).length > 0
})

// Limpiar acciones cuando cambian los datos
watch(
  () => props.data,
  () => {
    itemActions.value = {}
    loadingActions.value = {}
  },
  { deep: true },
)
</script>

<style scoped>
/* Los estilos se pueden mantener, son genéricos y funcionales */
.page-link:focus {
  outline: 0px;
  box-shadow: none;
}
.img-fit {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  width: 40px;
}
.img-fit img {
  border-radius: 6px;
  object-fit: cover;
  width: 100%;
  height: 100%;
}
td {
  vertical-align: middle;
}
tr:hover {
  background-color: rgba(0, 0, 0, 0.048) !important;
}
.content_table {
  overflow: auto hidden;
  padding-bottom: 1.5rem;
}
.content_table::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.content_table::-webkit-scrollbar-thumb {
  background: rgba(134, 134, 134, 0.205);
  border-radius: 3px;
}
.content_table::-webkit-scrollbar-track {
  background: transparent;
}
</style>

<!--

Este bloque de código muestra cómo se utiliza un componente reutilizable llamado `<DataTable>` en Vue. Se divide en tres conceptos clave:

---

### 1. Pasar Datos (Props) ⬇️

Las líneas que empiezan con dos puntos (`:`) son **props**. Sirven para pasar datos desde el componente padre hacia el componente `DataTable`.

* `:data="paginatedProducts"`: Le entrega la lista de ítems a mostrar en la tabla.
* `:headers="productHeaders"`: Le pasa la configuración de las columnas.
* `:is-loading="isLoading"`: Le indica a la tabla si debe mostrar el spinner de carga.

---

### 2. Reaccionar a Eventos (Listeners) ⬆️

Las líneas que empiezan con una arroba (`@`) son **listeners de eventos**. Permiten que el componente padre reaccione cuando algo sucede dentro de la tabla.

* `@change-page="handlePageChange"`: Cuando el usuario hace clic en un botón de paginación dentro de la tabla, se ejecuta el método `handlePageChange` del padre.
* `@action-click="handleAction"`: Cuando se hace clic en un botón de acción (ej. editar, borrar), se ejecuta el método `handleAction`.

---

### 3. Personalizar el Contenido (Slots) 🎨

Las etiquetas `<template #...>` definen **slots**. Permiten inyectar HTML personalizado desde el componente padre en lugares específicos del componente hijo, en este caso, para renderizar celdas de una manera especial.

* `<template #cell(price)="{ value }">`: Reemplaza el contenido de cualquier celda en la columna `price`.
* `{ value }` te da acceso al dato original de la celda para que puedas formatearlo, como en este caso, añadiéndole un símbolo de `$` y color verde.
* `<template #cell(stock)="{ value }">`: Hace lo mismo para la columna `stock`, mostrando un "badge" de "En Stock" o "Agotado" según el valor.

--- EJEMPLO DE USO ---

<template>
  <div style="padding: 2rem;">
    <h1>Lista de Productos 📦</h1>

    <DataTable
      :data="paginatedProducts"
      :headers="productHeaders"
      :actions="productActions"
      :is-loading="isLoading"
      :current-page="currentPage"
      :total-pages="totalPages"
      @change-page="handlePageChange"
      @action-click="handleAction"
    >
      <template #cell(price)="{ value }">
        <span style="font-weight: bold; color: green;">${{ value.toFixed(2) }}</span>
      </template>

      <template #cell(stock)="{ value }">
        <span :class="value > 0 ? 'badge bg-success' : 'badge bg-danger'">
          {{ value > 0 ? 'En Stock' : 'Agotado' }}
        </span>
      </template>

    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from './DataTable.vue'; // 1. Importa tu componente

// --- ESTADO DEL COMPONENTE PADRE ---

const isLoading = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(5); // Define el límite de ítems por página

// 2. Define los encabezados de la tabla
const productHeaders = [
  { key: 'name', label: 'Producto' },
  { key: 'price', label: 'Precio' },
  { key: 'stock', label: 'Disponibilidad' },
];

// 3. Define las acciones para cada fila
const productActions = [
  { name: 'edit', icon: 'bi-pencil-fill', class: 'btn btn-sm btn-outline-primary', tooltip: 'Editar' },
  { name: 'delete', icon: 'bi-trash-fill', class: 'btn btn-sm btn-outline-danger', tooltip: 'Eliminar' },
];

// 4. Proporciona los datos (en una app real, esto vendría de una API)
const allProducts = ref([
  { id: 1, name: 'Laptop Pro', price: 1200.50, stock: 15 },
  { id: 2, name: 'Mouse Inalámbrico', price: 25.00, stock: 30 },
  { id: 3, name: 'Teclado Mecánico', price: 89.99, stock: 8 },
  { id: 4, name: 'Monitor 4K', price: 450.00, stock: 0 },
  { id: 5, name: 'Webcam HD', price: 55.00, stock: 22 },
  { id: 6, name: 'Auriculares Gamer', price: 78.50, stock: 12 },
  { id: 7, name: 'Silla Ergonómica', price: 250.00, stock: 5 },
  { id: 8, name: 'Micrófono de Estudio', price: 110.00, stock: 0 },
  { id: 9, name: 'Disco Duro SSD 1TB', price: 99.99, stock: 40 },
  { id: 10, name: 'Impresora Multifuncional', price: 150.00, stock: 7 },
]);

// --- LÓGICA DE PAGINACIÓN ---

// Calcula el número total de páginas basado en los datos y el límite
const totalPages = computed(() => {
  return Math.ceil(allProducts.value.length / itemsPerPage.value);
});

// "Corta" el array de datos para mostrar solo los de la página actual
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return allProducts.value.slice(start, end);
});

// --- MANEJO DE EVENTOS ---

// 5. Escucha el evento 'change-page' y actualiza la página actual
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 6. Escucha el evento 'action-click' y decide qué hacer
const handleAction = ({ actionName, item }) => {
  alert(`Acción: '${actionName}' en el producto: '${item.name}'`);
  // Aquí puedes abrir un modal, llamar a una API, etc.
};
</script>

<style>
/* Importa los íconos de Bootstrap (necesario para las acciones) */
@import 'bootstrap-icons/font/bootstrap-icons.css';
</style>
-->
