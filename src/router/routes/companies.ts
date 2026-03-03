// Rutas de Empresas
export default [
  {
    path: '/companies',
    name: 'Empresas',
    component: () => import('../../views/companies/List.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/companies/new',
    name: 'Nueva Empresa',
    component: () => import('../../views/companies/New.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/companies/edit/:id_company',
    name: 'Editar Empresa',
    component: () => import('../../views/companies/Orchestrator.vue'),
    meta: { requiresAuth: true },
    redirect: { name: 'Datos de la Empresa' },
    children: [
      {
        path: 'detail-company',
        name: 'Datos de la Empresa',
        component: () => import('../../views/companies/detail_company/Edit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'vehicles-company',
        name: 'Vehículos de la Empresa',
        component: () => import('../../views/companies/vehicles_company/List.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'clients-company',
        name: 'Clientes de la Empresa',
        component: () => import('../../views/companies/clients_company/List.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: 'detail-client/:id_client',
            name: 'Datos del Cliente',
            component: () => import('../../views/companies/clients_company/Edit.vue'),
            meta: { requiresAuth: true },
          },
          {
            path: 'new-client',
            name: 'Nuevo Cliente',
            component: () => import('../../views/companies/clients_company/New.vue'),
            meta: { requiresAuth: true },
          },
        ],
      },
      {
        path: 'assignments-company',
        name: 'Asignaciones de la Empresa',
        component: () => import('../../views/companies/assignments_company/List.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]
