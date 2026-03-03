<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CustomTable from '@/components/common/CustomTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import titleSection from '@/components/common/titleSection.vue'
import MultiselectCustom from '@/components/common/MultiselectCustom.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import ScrollableTabs from '@/components/common/ScrollableTabs.vue'
import PreClientDetailModal from '@/components/Client/PreClientDetailModal.vue'
import { useRoute } from 'vue-router'
import { useClientVehicleModel } from '@/composables/useClientVehicleModel'
import { useClientModel } from '@/composables/useClientModel'
import { TITLE_SECTION_COMPONENT } from '@/const/tableConst'
import { TABLE_HEADERS } from '@/const/tableConst'
import { BUTTONS_TOOLTIPS, BUTTONS } from '@/const/buttonConst'
import defaultProfileImage from '@/assets/images/default-profile.png'
import { useSwalToast } from '@/composables/useSwalToast'

const route = useRoute()
const swalToast = useSwalToast()

// Active tab state
const activeTab = ref<'clients' | 'pre-clients'>('clients')

const tabs = [
  { label: 'Clientes', path: 'clients' },
  { label: 'Pre-clientes', path: 'pre-clients' },
]

const activeTabIndex = computed({
  get: () => tabs.findIndex((tab) => tab.path === activeTab.value),
  set: (index) => {
    if (tabs[index]) {
      activeTab.value = tabs[index].path as 'clients' | 'pre-clients'
    }
  },
})

// Composables for each tab
const clientsTab = useClientVehicleModel({
  paginationKey: 'clients-list',
})

const preClientsTab = useClientModel({
  paginationKey: 'pre-clients-list',
})

// Computed to get current active tab data
const currentTab = computed(() => {
  return activeTab.value === 'clients' ? clientsTab : preClientsTab
})

// Route state
const isCreate = computed(() => route.name === 'Nuevo Cliente')
const isEdit = computed(() => route.name === 'Editar Cliente')

// Pre-Client Modal Logic
const preClientModalRef = ref<InstanceType<typeof PreClientDetailModal> | null>(null)
const selectedPreClient = ref<any>(null)

const handlePreClientAction = ({ actionName, item }: { actionName: string; item: any }) => {
  if (actionName === 'view') {
    try {
      selectedPreClient.value = item
      preClientModalRef.value?.openModal()
    } catch (error) {
      console.error('Error opening modal:', error)
      swalToast.showError('No se pudo abrir el detalle del pre-cliente')
    }
  } else {
    preClientsTab.handleTableAction({ actionName, item })
  }
}

// Initialize on mount
onMounted(() => {
  clientsTab.initialize()
  preClientsTab.initialize()
})
</script>

<template>
  <DashboardLayout>
    <div>
      <div class="container-fluid" v-if="!isCreate && !isEdit">
        <titleSection
          :title="TITLE_SECTION_COMPONENT.client.title"
          :description="TITLE_SECTION_COMPONENT.client.description"
        />

        <!-- Tab Navigation -->
        <ScrollableTabs
          :tabs="tabs"
          :activeTab="activeTabIndex"
          @tab-change="(index) => (activeTabIndex = index)"
        />

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Filters Row -->
          <div class="row mb-4 align-items-end g-3">
            <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
              <label for="">Buscar por:</label>
              <div class="input-group rounded-pill">
                <span
                  :class="BUTTONS.search.class"
                  id="basic-addon1"
                  style="cursor: pointer"
                  @click="currentTab.getClients()"
                >
                  <i :class="BUTTONS.search.icon"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-radius-right"
                  placeholder="Nombre o Correo"
                  aria-label="Username"
                  aria-describedby="basic-addon1"
                  inputmode="search"
                  enterkeyhint="search"
                  v-model="currentTab.query.value"
                  @keyup.enter="currentTab.getClients()"
                />
              </div>
            </div>
            <div class="col-md-3" v-if="activeTab === 'clients'">
              <MultiselectCustom
                key="company-filter"
                v-model="clientsTab.selectedCompany.value"
                :options="clientsTab.companies.value"
                placeholder="Seleccionar empresa"
                class="border-radius-left border-radius-right"
                label-key="trade_name"
                helper-type="custom"
                icon-key="id"
                :custom-icon-map="clientsTab.companyIconMap.value"
                :custom-description-map="clientsTab.companyDescriptionMap.value"
                show-icons
                show-descriptions
              />
            </div>
            <div class="col gap-2 d-flex align-items-end justify-content-end">
              <button
                :class="BUTTONS.filter.class"
                :data-title="BUTTONS_TOOLTIPS.filter.tooltipTitle"
                :data-tooltip-pos="BUTTONS.filter.tooltipPos"
                @click="currentTab.clearFilters()"
              >
                <i :class="BUTTONS.filter.icon"></i>
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="container-fluid border rounded-4 mt-2">
            <!-- Clients Table -->
            <CustomTable
              v-if="activeTab === 'clients'"
              :data="clientsTab.clients.value"
              :headers="TABLE_HEADERS.client"
              :actions="clientsTab.getTableActions"
              @action-click="clientsTab.handleTableAction"
              :is-loading="clientsTab.isLoading.value"
              @change-page="clientsTab.handlePageChange"
              :current-page="clientsTab.pagination.currentPage"
              :total-pages="clientsTab.pagination.totalPages"
            >
              <template #cell(company.trade_name)="{ value }">
                {{ value || 'No tiene empresa' }}
              </template>
              <template #cell(client.url_image)="{ value, item }">
                <img
                  :src="value || item.url_image || defaultProfileImage"
                  :alt="value || 'imagen'"
                  class="img-fluid object-fit-cover rounded-pill"
                  style="width: 50px; height: 50px"
                  @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)"
                />
              </template>
              <template #cell(client.id_city)="{ value, item }">
                <button
                  class="btn btn-sm btn-primary border-0 rounded-pill"
                  @click="clientsTab.showAddressInfo(value || item.id_city)"
                >
                  <i class="bi bi-geo-alt-fill"></i>
                </button>
              </template>

              <template #cell(active)="{ value }">
                <StatusBadge :value="value" />
              </template>
            </CustomTable>

            <!-- Pre-Clients Table -->
            <CustomTable
              v-else
              :data="preClientsTab.clients.value"
              :headers="TABLE_HEADERS.preClient"
              :actions="preClientsTab.getTableActions"
              @action-click="handlePreClientAction"
              :is-loading="preClientsTab.isLoading.value"
              @change-page="preClientsTab.handlePageChange"
              :current-page="preClientsTab.pagination.currentPage"
              :total-pages="preClientsTab.pagination.totalPages"
            >
              <template #cell(url_image)="{ value }">
                <img
                  :src="value || defaultProfileImage"
                  :alt="value || 'imagen'"
                  class="img-fluid object-fit-cover rounded-pill"
                  style="width: 50px; height: 50px"
                  @error="(e: Event) => ((e.target as HTMLImageElement).src = defaultProfileImage)"
                />
              </template>
              <template #cell(id_city)="{ value }">
                <button
                  class="btn btn-sm btn-primary border-0 rounded-pill"
                  @click="preClientsTab.showAddressInfo(value)"
                >
                  <i class="bi bi-geo-alt-fill"></i>
                </button>
              </template>

              <template #cell(active)="{ value, item }">
                <StatusBadge
                  :value="value"
                  :blockedAttempts="item.client?.failed_attempts"
                  :blockedThreshold="10"
                />
              </template>
            </CustomTable>
          </div>
        </div>
      </div>
      <router-view />

      <!-- Pre-Client Detail Modal -->
      <PreClientDetailModal ref="preClientModalRef" :client="selectedPreClient" />
    </div>
  </DashboardLayout>
</template>
