// Pharmacy routes
export default [
  {
    path: '/pharmacy',
    name: 'Farmacia',
    component: () => import('../../views/pharmacies/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pharmacy/new',
    name: 'Nueva Farmacia',
    component: () => import('../../views/pharmacies/New.vue'),
    meta: { requiresAuth: true },
  },
]
