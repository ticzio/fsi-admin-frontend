// Pharmacy routes
export default [
  {
    path: '/pharmacy',
    name: 'Farmacia',
    component: () => import('../../views/pharmacies/List.vue'),
    meta: { requiresAuth: true },
  },
]
