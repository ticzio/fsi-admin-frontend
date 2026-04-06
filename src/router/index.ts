import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { getRoleIdFromCookie } from '@/composables/useAccessControl'
import { roleHasAllPermissions } from '@/const/rolePermissions'

import dashboardRoutes from './routes/dashboard'
import pharmacyRoutes from './routes/pharmacy'
import couponsRoutes from './routes/exchanges'
import newsRoutes from './routes/news'
import notificationsRoutes from './routes/notifications'
import clientRoutes from './routes/client'
import operatorsRoutes from './routes/operators'
import administratorsRoutes from './routes/administrators'
import settingsRoutes from './routes/settings'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    ...dashboardRoutes,
    ...pharmacyRoutes,
    ...couponsRoutes,
    ...newsRoutes,
    ...notificationsRoutes,
    ...clientRoutes,
    ...operatorsRoutes,
    ...administratorsRoutes,
    ...settingsRoutes,
    // Catch-all 404 route (must be last)
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue'),
      meta: { requiresGuest: false, requiresAuth: false },
    },
  ],
})

/**
 * Stale Chunk Handler
 *
 * Problem: Vite generates JS chunks with content-hash filenames (e.g. List-cb6ae253.js).
 * When a new build is deployed, old hash filenames are deleted from the server.
 * If a user keeps the app open across a deployment and then navigates via the sidebar,
 * Vue Router tries to lazy-import the OLD chunk hash → server returns 404 →
 * "TypeError: Failed to fetch dynamically imported module".
 *
 * Solution: intercept every router navigation error. If it's a chunk-load failure
 * (TypeError or ChunkLoadError), force a full hard-reload to the destination URL so
 * the browser fetches the fresh index.html and the new chunk hashes.
 */
router.onError((error, to) => {
  const isChunkLoadError =
    error instanceof TypeError ||
    error.name === 'ChunkLoadError' ||
    /Loading chunk|Failed to fetch dynamically imported module/i.test(error.message)

  if (isChunkLoadError) {
    // Avoid infinite reload loops: track if we already reloaded for this path
    const reloadedKey = `chunk_reload_${to.fullPath}`
    if (!sessionStorage.getItem(reloadedKey)) {
      sessionStorage.setItem(reloadedKey, '1')
      window.location.href = to.fullPath
    }
  }
})

/* Navigation guards
router.beforeEach((to, from, next) => {
  const roleId = getRoleIdFromCookie()
  const isAuthenticated = roleId !== null && roleId > 0

  // Rutas que requieren ser invitado (login)
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
    return
  }

  // Rutas públicas (login, 404, etc.)
  if (to.meta.requiresGuest || to.meta.requiresAuth === false) {
    next()
    return
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    next('/login')
    return
  }

  // Verificar permisos de la ruta
  const requiredPermissions = to.meta.permissions as string[] | undefined

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = roleHasAllPermissions(roleId!, requiredPermissions)

    if (!hasPermission) {
      // Sin permiso: redirigir a dashboard o mostrar error
      console.warn(`Acceso denegado a ${to.path}. Permisos requeridos:`, requiredPermissions)
      next('/dashboard')
      return
    }
  }

  // Todo OK
  next()
})*/

export default router
