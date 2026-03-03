// Rutas de Centros Integrales
export default [
  {
    path: '/concessionaire',
    name: 'Concesionarios',
    component: () => import('../../views/concessionaire/List.vue'),
    meta: { requiresAuth: true },
  },

  {
    path: '/concessionaire/new',
    name: 'Nuevo Concesionario',
    component: () => import('../../views/concessionaire/New.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/concessionaire/edit/:id_concessionaire',
    name: 'Editar Concesionario',
    component: () => import('../../views/concessionaire/Orchestrator.vue'),
    meta: { requiresAuth: true },
    redirect: (to: any) =>
      `/concessionaire/edit/${to.params.id_concessionaire}/detail-concessionaire`,
    children: [
      {
        path: 'detail-concessionaire',
        name: 'Datos del concesionario',
        component: () => import('../../views/concessionaire/concessionaire_detail/Edit.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'administrators-concessionaire',
        name: 'Administradores (Concesionario)',
        component: () => import('../../views/concessionaire/administrators/List.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: 'new',
            name: 'Nuevo Administrador (Concesionario)',
            component: () => import('../../views/concessionaire/administrators/New.vue'),
            meta: { requiresAuth: true },
          },
          {
            path: 'edit/:id_user',
            name: 'Editar Administrador (Concesionario)',
            component: () => import('../../views/concessionaire/administrators/Edit.vue'),
            meta: { requiresAuth: true },
            props: true,
          },
        ],
      },

      {
        path: 'services-concessionaire',
        name: 'Servicios (Concesionario)',
        component: () => import('../../views/concessionaire/services/List.vue'),
        meta: { requiresAuth: true },
      },

      {
        path: 'reservations-concessionaire',
        name: 'Reservas (Concesionario)',
        component: () => import('../../views/concessionaire/reservations/List.vue'),
        meta: { requiresAuth: true },
      },

      {
        path: 'service-historical-concessionaire',
        name: 'Historial de Servicios (Concesionario)',
        component: () => import('../../views/concessionaire/service_historical/List.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]
