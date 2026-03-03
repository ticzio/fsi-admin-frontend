// Clients routes
export default [
  {
    path: '/clients',
    name: 'Clientes',
    component: () => import('../../views/clients/List.vue'),
    meta: { requiresAuth: true, sectionKey: 'client' },
  },
  {
    path: '/clients/edit/:id_client/:id_client_points',
    name: 'Editar Cliente',
    component: () => import('../../views/clients/Orchestrator.vue'),
    meta: { requiresAuth: true, sectionKey: 'client' },
    redirect: { name: 'Detalle del Cliente' },
    children: [
      {
        path: 'client-detail',
        name: 'Detalle del Cliente',
        component: () => import('../../views/clients/client-detail/Edit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'vehicle',
        name: 'Vehículo del Cliente',
        component: () => import('../../views/clients/vehicle/Edit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'service-historical',
        name: 'Historial de Servicios del Cliente',
        component: () => import('../../views/clients/service_historical/List.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'audit',
        name: 'Auditoría del Cliente',
        component: () => import('../../views/clients/audit/List.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]
