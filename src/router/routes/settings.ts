// Settings routes
export default [
  {
    path: '/settings',
    name: 'Configuración',
    component: () => import('../../views/settings/List.vue'),
    meta: { requiresAuth: true, permissions: ['settings.read'] },
  },
  {
    path: '/settings/missions',
    name: 'settings.misiones',
    component: () => import('../../views/settings/missions/List.vue'),
    meta: { requiresAuth: true, permissions: ['mission.read'] },
  },
  {
    path: '/settings/levels',
    name: 'settings.niveles',
    component: () => import('../../views/settings/levels/List.vue'),
    meta: { requiresAuth: true, permissions: ['settings.update'] },
  },
  {
    path: '/settings/levels/edit/:id_level',
    name: 'settings.niveles.edit',
    component: () => import('../../views/settings/levels/Orchestrator.vue'),
    meta: { requiresAuth: true, permissions: ['settings.update'] },
    redirect: { name: 'settings.niveles.coupons' },
    children: [
      {
        path: 'benefits',
        name: 'settings.niveles.benefits',
        component: () => import('../../views/settings/levels/benefits-banners/List.vue'),
        meta: { requiresAuth: true, permissions: ['settings.update'] },
      },
      {
        path: 'coupons',
        name: 'settings.niveles.coupons',
        component: () => import('../../views/settings/levels/coupons-banners/List.vue'),
        meta: { requiresAuth: true, permissions: ['settings.update'] },
      },
    ],
  },
  {
    path: '/settings/banners',
    name: 'settings.banners',
    component: () => import('../../views/settings/banners/List.vue'),
    meta: { requiresAuth: true, permissions: ['banner.read'] },
  },
  {
    path: '/settings/banners/edit/:id',
    name: 'settings.banners.edit',
    component: () => import('../../views/settings/banners/List.vue'),
    meta: { requiresAuth: true, permissions: ['banner.read'] },
  },
  {
    path: '/settings/cities',
    name: 'settings.ciudades',
    component: () => import('../../views/settings/cities/List.vue'),
    meta: { requiresAuth: true, permissions: ['settings.update'] },
  },
  {
    path: '/settings/states',
    name: 'settings.estados',
    component: () => import('../../views/settings/states/List.vue'),
    meta: { requiresAuth: true, permissions: ['settings.update'] },
  },
]
