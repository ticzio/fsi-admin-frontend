// Settings routes
export default [
  {
    path: '/settings',
    name: 'Configuración',
    component: () => import('../../views/settings/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/missions',
    name: 'settings.misiones',
    component: () => import('../../views/settings/missions/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/levels',
    name: 'settings.niveles',
    component: () => import('../../views/settings/levels/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/banners',
    name: 'settings.banners',
    component: () => import('../../views/settings/banners/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/cities',
    name: 'settings.ciudades',
    component: () => import('../../views/settings/cities/List.vue'),
    meta: { requiresAuth: true },
  },
]
