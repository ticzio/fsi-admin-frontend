<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { useSwal } from '@/composables/useSwal'
import { useAccessControl } from '@/composables/useAccessControl'
import { MENU_ITEMS, isMenuItemActive } from '@/const/menuItems'
import type { MenuItem } from '@/const/menuItems'
import { useCookies } from '@/composables/useCookies'
import defaultAvatar from '@/assets/images/default-profile.png'

const store = useStore()
const route = useRoute()
const router = useRouter()
const swal = useSwal()
const { canAll } = useAccessControl()
const { getCookie } = useCookies()
const CookiesFullName = getCookie('changan_admin_full_name')
const CookiesUrlImage = getCookie('changan_admin_url_image')
// Menú filtrado por permisos
const visibleMenuItems = computed<MenuItem[]>(() => {
  return MENU_ITEMS.filter((item) => canAll(item.permissions))
})

// Helper para verificar si un item está activo
const isItemActive = (item: MenuItem): boolean => {
  return isMenuItemActive(item, route.path)
}

// Responsive sidebar logic
const isMobile = ref(window.innerWidth <= 768)
const sidebarVisible = ref(false)

const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    sidebarVisible.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

// Cierra la sidebar en móvil automáticamente al cambiar de ruta
router.afterEach(() => {
  if (isMobile.value) {
    sidebarVisible.value = false
  }
})

const toggleSidebar = () => {
  if (isMobile.value) {
    sidebarVisible.value = !sidebarVisible.value
  } else {
    store.dispatch('toggleSidebar')
  }
}

const closeSidebar = () => {
  if (isMobile.value) {
    sidebarVisible.value = false
  }
}

const sidebarCollapsed = computed(() => store.getters.sidebarCollapsed)
const currentUser = computed(() => store.getters.currentUser)

const handleLogout = async () => {
  try {
    const result = await swal.showConfirm(
      '¿Estás seguro de cerrar sesión?',
      'Esta acción cerrará tu sesión actual.',
    )
    if (result) {
      await store.dispatch('logout')
      router.push('/login')
    }
  } catch (error) {
    console.log(error)
  }
}
</script>

<template>
  <div class="dashboard-layout">
    <!-- Sidebar Overlay for mobile -->
    <div v-if="isMobile && sidebarVisible" class="sidebar-overlay" @click="closeSidebar"></div>

    <!-- Sidebar -->
    <div
      class="sidebar bg-primary"
      :class="{
        collapsed: !isMobile && sidebarCollapsed,
        'sidebar-mobile': isMobile,
        'sidebar-mobile-open': isMobile && sidebarVisible,
      }"
    >
      <button
        v-if="!isMobile"
        class="btn btn-secondary text-white p-1 px-2"
        @click="toggleSidebar"
        style="position: absolute; top: 54px; right: -18px; z-index: 10000"
        :data-title="[sidebarCollapsed ? 'Abrir menú lateral' : 'Ocultar menú lateral']"
        data-tooltip-pos="right"
      >
        <i
          :class="['bi fs-6', sidebarCollapsed ? 'bi-caret-right-fill' : 'bi-caret-left-fill']"
        ></i>
      </button>
      <div class="sidebar-content-wrapper d-flex flex-column h-100">
        <div class="px-3 py-0">
          <div :class="['logo', 'justify-content-center']">
            <img
              src="@/assets/images/dashboardLayout/changan-logo.png"
              alt="Logo Changan"
              class="img-fluid object-fit-cover"
            />
          </div>
          <div class="mx-auto line"></div>
        </div>
        <div class="d-flex flex-column justify-content-center gap-2 align-items-center my-3 px-3">
          <img
            :src="CookiesUrlImage || defaultAvatar"
            width="50"
            height="50"
            class="ratio-1x1 overflow-hidden object-fit-cover rounded-3"
            alt="Avatar"
          />
          <span
            class="text-white d-inline-block text-center text-truncate mw-100"
            v-show="!sidebarCollapsed || isMobile"
          >
            {{ CookiesFullName }}</span
          >
        </div>
        <nav class="sidebar-nav mt-0">
          <ul :class="['nav flex-column']">
            <li v-for="item in visibleMenuItems" :key="item.to" class="nav-item">
              <router-link
                :to="item.to"
                :class="[
                  'nav-link rounded-3',
                  sidebarCollapsed && !isMobile ? 'justify-content-center ' : 'ps-3',
                  { active: isItemActive(item) },
                ]"
              >
                <i
                  :class="[
                    'bi mx-3 fs-5 text-white',
                    isItemActive(item) ? item.iconActive : item.icon,
                  ]"
                ></i>
                <span v-show="!sidebarCollapsed || isMobile" class="text-white">{{
                  item.label
                }}</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ expanded: sidebarCollapsed && !isMobile }">
      <!-- Top Navigation -->
      <header class="pb-1 border-bottom" style="z-index: 3">
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex align-items-center">
            <button
              class="btn btn-link text-dark ms-2"
              @click="toggleSidebar"
              title="Toggle Sidebar"
              v-if="isMobile"
            >
              <i class="bi-list fs-4"></i>
            </button>
          </div>
          <button
            class="btn btn-link text-decoration-none text-danger d-flex align-items-center"
            @click="handleLogout"
            title="Cerrar sesión"
          >
            <span class="d-none d-md-inline me-2">Cerrar sesión</span>
            <i class="bi bi-door-open fs-4"></i>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main
        class="content p-4 border-white bg-white"
        :class="{
          container: !$route.path.includes('/dashboard'),
        }"
      >
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: #042f2f;
  background-image: url('@/assets/images/dashboardLayout/background-sidebar.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  color: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  z-index: 99;
  position: relative;
}

.sidebar.collapsed {
  width: 120px;
}

.sidebar-mobile {
  position: fixed;
  left: -250px;
  top: 0;
  height: 100vh;
  width: 250px;
  z-index: 1102;
  transition: left 0.3s;
}

.sidebar-mobile.sidebar-mobile-open {
  left: 0;
}

.sidebar-content-wrapper {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  scrollbar-width: thin;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1100;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: bold;
}

.line {
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    #fff 50%,
    rgba(255, 255, 255, 0) 100%
  );
  border: none;
  margin-top: 5px;
  margin-bottom: 2rem;
}

.logo .icon {
  font-size: 1.5rem;
}

.sidebar-nav {
  padding: 0;
  flex: 1;
  padding-bottom: 10rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #072b2b;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  border-radius: 0;
  border-left: none;
}

.nav-link.active,
.nav-link.active:hover {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1),
    inset 0 0 10px 7px rgba(255, 255, 255, 0.1);
}

.nav-link:not(.active):hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.main-content {
  flex: 1 1 0%;
  flex-direction: column;
  width: 100%;
  margin-right: 0;
  scrollbar-width: thin; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  min-width: 0;
  transition: all 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
}

.main-content.expanded {
  margin-left: 0;
}

.content {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.user-avatar img {
  width: 32px;
  height: 32px;
  object-fit: cover;
}

.badge {
  font-size: 0.7rem;
}

.dropdown-item .icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .dashboard-layout {
    position: relative;
  }
  .sidebar {
    display: none;
  }
  .sidebar-mobile {
    display: block;
  }
  .main-content {
    margin-left: 0;
    width: 100%;
    min-width: 0;
  }
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
