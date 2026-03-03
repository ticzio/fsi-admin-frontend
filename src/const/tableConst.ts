// Detect domain to conditionally include ID columns in table headers
const URL_DOMAIN = window.location.host
const VITE_DOMAIN_DEVELOP = import.meta.env.VITE_DOMAIN_DEVELOP
const IS_DEV_DOMAIN =
  URL_DOMAIN.includes('localhost:517') ||
  URL_DOMAIN.includes('localhost:417') ||
  (!!VITE_DOMAIN_DEVELOP && URL_DOMAIN.includes(VITE_DOMAIN_DEVELOP))

function maybeId(key: string = 'id') {
  return IS_DEV_DOMAIN ? [{ key, label: 'ID' }] : []
}

export const TITLE_SECTION_COMPONENT = {
  concessionaire: {
    title: 'Concesionario',
    description: 'Lista de concesionarios',
    details: 'Detalles del concesionario',
    new: 'Nuevo concesionario',
    newDescription: 'Aquí puedes crear un nuevo concesionario con toda la información necesaria.',
  },
  company: {
    title: 'Empresas',
    description: 'Lista de empresas',
    details: 'Detalles de la empresa',
    stepOne: 'Datos de la empresa',
    stepOneDetails: 'Aquí podras agregar los datos de la empresa',
    new: 'Nueva empresa',
    newDescription: 'Aquí puedes crear una nueva empresa con toda la información necesaria.',
  },
  administrator: {
    title: 'Administradores',
    description: 'Podrás gestionar los administradores de la plataforma',
  },
  client: {
    title: 'Clientes',
    description: 'Lista de clientes',
    edit: 'Editar cliente',
    editDescription: 'Aquí puedes editar la información del cliente.',
  },
  vehicle: {
    title: 'Vehículos',
    description: 'Lista de vehículos',
  },
  exhibition: {
    title: 'Vehículos de exhibición',
    description: 'Lista de vehículos de exhibición',
    new: 'Nuevo vehículo de exhibición',
    newDescription:
      'Aquí puedes crear un nuevo vehículo de exhibición con toda la información necesaria.',
    edit: 'Editar vehículo de exhibición',
    editDescription: 'Aquí puedes editar la información de un vehículo de exhibición.',
  },
  news: {
    title: 'Noticias',
    description: 'Lista de noticias',
    new: 'Nueva noticia',
    newDescription: 'Aquí puedes crear una nueva noticia con toda la información necesaria.',
    edit: 'Editar noticia',
    editDescription: 'Aquí puedes editar la información de la noticia.',
  },
  notification: {
    title: 'Notificaciones',
    description: 'Lista de notificaciones',
  },
  settings: {
    title: 'Configuración',
    description: 'Podrás gestionar los items de la plataforma',
  },
  states: {
    title: 'Estados',
    description: 'Podrás gestionar los estados',
  },
  cities: {
    title: 'Ciudades',
    description: 'Podrás gestionar las ciudades',
  },
  roles: {
    title: 'Roles',
    description: 'Podrás gestionar los roles',
  },
  typeEnvironment: {
    title: 'Tipo de entorno',
    description: 'Podrás gestionar los tipos de entorno',
  },
  typeFuel: {
    title: 'Tipo de combustible',
    description: 'Gestionar tipos de combustible',
  },
  typeTransmission: {
    title: 'Tipo de transmisión',
    description: 'Gestionar tipos de transmisión',
  },
  typeService: {
    title: 'Tipo de servicio',
    description: 'Gestionar tipos de servicio',
  },
  typeNotification: {
    title: 'Tipo de notificación',
    description: 'Gestionar tipos de notificación',
  },
  typeEngine: {
    title: 'Tipo de motor',
    description: 'Gestionar tipos de motor',
  },
  typeColor: {
    title: 'Colores de vehículos',
    description: 'Gestionar colores de vehículos',
  },
  typeBrake: {
    title: 'Tipo de freno',
    description: 'Gestionar tipos de freno',
  },
  typeVehicle: {
    title: 'Tipo de vehículo',
    description: 'Gestionar tipos de vehículo',
  },
  typePurchase: {
    title: 'Tipo de compra',
    description: 'Gestionar tipos de compra',
  },
  concessionaireService: {
    title: 'Servicios por concesionario',
    description: 'Gestionar los servicios disponibles en el concesionario',
  },
}

export type TitleSectionKey = keyof typeof TITLE_SECTION_COMPONENT

export const TABLE_HEADERS = {
  concessionaire: [
    ...maybeId('id'),
    { key: 'code', label: 'Código' },
    { key: 'url_logo', label: 'Logo' },
    { key: 'business_name', label: 'Nombre de la empresa' },
    { key: 'trade_name', label: 'Nombre comercial' },
    { key: 'rif', label: 'RIF' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'address', label: 'Ubicación' },
    { key: 'active', label: 'Estatus' },
  ],

  company: [
    ...maybeId('id'),
    { key: 'code', label: 'Código' },
    { key: 'business_name', label: 'Nombre de la empresa' },
    { key: 'trade_name', label: 'Nombre comercial' },
    { key: 'rif', label: 'RIF' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'address', label: 'Ubicación' },
    { key: 'city.name', label: 'Ciudad' },
    { key: 'active', label: 'Estatus' },
  ],
  administrator: [
    ...maybeId('id'),
    { key: 'url_image', label: 'Foto' },
    { key: 'role.name', label: 'Rol' },
    { key: 'full_name', label: 'Nombre y apellido' },
    { key: 'email', label: 'Correo' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'active', label: 'Estatus' },
  ],
  user: [
    ...maybeId('id_user'),
    { key: 'user.url_image', label: 'Foto' },
    { key: 'user.full_name', label: 'Nombre y apellido' },
    { key: 'user.email', label: 'Correo' },
    { key: 'user.phone', label: 'Teléfono' },
    { key: 'role.name', label: 'Rol' },
    { key: 'active', label: 'Estatus' },
  ],
  companyClients: [
    ...maybeId('id'),
    { key: 'client.code', label: 'Código' },
    { key: 'client.url_image', label: 'Foto' },
    { key: 'client.full_name', label: 'Nombre y apellido' },
    { key: 'client.email', label: 'Correo' },
    { key: 'client.phone', label: 'Teléfono' },
    { key: 'client.dni', label: 'Cédula' },
    { key: 'client.id_city', label: 'Ciudad - Estado' },
    { key: 'client.active', label: 'Estatus' },
  ],
  client: [
    ...maybeId('id'),
    { key: 'client.code', label: 'Código' },
    { key: 'company.trade_name', label: 'Empresa' },
    { key: 'client.url_image', label: 'Foto' },
    { key: 'client.full_name', label: 'Nombre y apellido' },
    { key: 'client.email', label: 'Correo' },
    { key: 'client.id_city', label: 'Ciudad - Estado' },
    { key: 'active', label: 'Estatus' },
  ],
  preClient: [
    ...maybeId('id'),
    { key: 'url_image', label: 'Foto' },
    { key: 'full_name', label: 'Nombre y apellido' },
    { key: 'email', label: 'Correo' },
    { key: 'active', label: 'Estatus' },
  ],
  vehicle: [
    ...maybeId('id'),
    { key: 'url_image', label: 'Foto' },
    { key: 'license_plate', label: 'Placa' },
    { key: 'color', label: 'Color' },
    { key: 'vehicle_model.name', label: 'Modelo' },
    { key: 'transmission_type.name', label: 'Tipo de transmisión' },
    { key: 'vin', label: 'Número de serie' },
    { key: 'type_engine.name', label: 'Tipo de motor' },
    { key: 'active', label: 'Estatus' },
  ],
  companyAssignament: [
    ...maybeId('id'),
    { key: 'code', label: 'Código' },
    { key: 'client.full_name', label: 'Conductor' },
    { key: 'vehicle.license_plate', label: 'Placa' },
    { key: 'vehicle.vehicle_model.name', label: 'Modelo' },
    { key: 'purchase_date', label: 'Fecha de compra' },
    { key: 'current_mileage', label: 'Kilometraje' },
    { key: 'active', label: 'Estatus' },
  ],

  exhibition: [
    ...maybeId('id'),
    { key: 'vehicle_model.name', label: 'Nombre' },
    { key: 'vehicle_model.year', label: 'Año' },
    { key: 'type_engine.name', label: 'Tipo de motor' },
    { key: 'type_transmission.name', label: 'Tipo de transmisión' },
    { key: 'type_brake.name', label: 'Tipo de frenos' },
    { key: 'type_fuel', label: 'Tipo de combustible' },
    { key: 'url_file', label: 'Archivo' },
    { key: 'active', label: 'Estatus' },
  ],
  imageExhibition: [
    ...maybeId('id'),
    { key: 'url_image', label: 'Imagen' },
    { key: 'url_background_mobile', label: 'Fondo mobile' },
    { key: 'url_background_tablet', label: 'Fondo tablet' },
    { key: 'type_color.name', label: 'Nombre del color' },
    { key: 'type_color.hex_color', label: 'Color' },
    { key: 'active', label: 'Estatus' },
  ],
  notifications: [
    ...maybeId('id'),
    { key: 'title', label: 'Titulo' },
    { key: 'description', label: 'Descripción' },
    { key: 'scheduled_date', label: 'Fecha programada' },
    { key: 'active', label: 'Estatus' },
  ],

  news: [
    ...maybeId('id'),
    { key: 'url_image', label: 'Foto' },
    { key: 'title', label: 'Titulo' },
    { key: 'body_only_text', label: 'Descripción' },
    { key: 'creator.full_name', label: 'Nombre del creador' },
    { key: 'active', label: 'Estatus' },
  ],
  cities: [
    ...maybeId('id'),
    { key: 'state.name', label: 'Estado' },
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  states: [...maybeId('id'), { key: 'name', label: 'Nombre' }, { key: 'active', label: 'Estatus' }],
  roles: [
    ...maybeId('id'),
    { key: 'type_environment.name', label: 'Tipo de entorno' },
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typeEnvironment: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre del entorno' },
    { key: 'active', label: 'Estatus' },
  ],

  // Nuevas secciones de settings
  vehicle_type: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'active', label: 'Estatus' },
  ],
  typeFuel: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'active', label: 'Estatus' },
  ],
  typeTransmission: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typeService: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typeNotification: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typeEngine: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typeColor: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'hex_color', label: 'Color' },
    { key: 'active', label: 'Estatus' },
  ],
  typeBrake: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typeVehicle: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  typePurchase: [
    ...maybeId('id'),
    { key: 'name', label: 'Nombre' },
    { key: 'active', label: 'Estatus' },
  ],
  concessionaireService: [
    ...maybeId('id'),
    { key: 'code', label: 'Código' },
    { key: 'service_type.name', label: 'Tipo de servicio' },
    { key: 'is_available', label: 'Disponible' },
    { key: 'value_points', label: 'Kilómetros de beneficios' },
    { key: 'active', label: 'Estatus' },
  ],
  notification: [
    ...maybeId('id'),
    { key: 'title', label: 'Título' },
    { key: 'message', label: 'Mensaje' },
    { key: 'type_notification.name', label: 'Tipo' },
  ],
  serviceHistorical: [
    ...maybeId('id'),
    { key: 'code', label: 'Código' },
    { key: 'client.full_name', label: 'Cliente' },
    { key: 'service_date', label: 'Fecha de Servicio' },
    { key: 'current_mileage', label: 'Kilometraje' },
    { key: 'points_awarded', label: 'Kilómetros de beneficios' },
  ],
  lastAppointments: [
    { key: 'concessionaire.trade_name', label: 'Concesionario' },
    { key: 'client.full_name', label: 'Cliente' },
    { key: 'appointment_date', label: 'Fecha' },
    { key: 'appointment_status.name', label: 'Estatus' },
  ],
  clientServiceHistorical: [
    ...maybeId('id'),
    { key: 'code', label: 'Código' },
    { key: 'concessionaire.trade_name', label: 'Concesionario' },
    { key: 'service_date', label: 'Fecha de Servicio' },
    { key: 'notes', label: 'Notas del servicio' },
    { key: 'current_mileage', label: 'Kilometraje' },
    { key: 'points_awarded', label: 'Kilómetros de beneficios' },
  ],
  exhibitionMedia: [
    ...maybeId('id'),
    { key: 'url_image', label: 'Imagen' },
    { key: 'active', label: 'Estatus' },
  ],
  clientAudit: [
    ...maybeId('id'),
    { key: 'created_at', label: 'Fecha de obtención' },
    { key: 'description', label: 'Descripción' },
    { key: 'point', label: 'Kilómetros de beneficios' },
    { key: 'type', label: 'Tipo' },
  ],
}

export const TABLE_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  limit: 10,
}

export const TABLE_ACTIONS = {
  new: {
    name: 'new',
    icon: 'bi-plus fs-5',
    class: 'border-radius-left border-radius-right btn btn-primary fw-medium text-light',
    tooltip: 'Nuevo',
  },
  edit: {
    name: 'edit',
    icon: 'bi-list fs-5',
    class: 'border-radius-left border-radius-right btn btn-light fw-medium',
    tooltip: 'Ver detalles',
  },
  delete: {
    name: 'delete',
    icon: 'bi bi-trash3-fill fs-5 text-white',
    class: 'border-radius-left border-radius-right btn btn-danger fw-medium text-light',
    tooltip: 'Eliminar',
  },
  deactivate: {
    name: 'deactivate',
    icon: 'bi bi-check-circle-fill fs-5',
    class: 'border-radius-left border-radius-right fw-medium text-white',
    tooltip: 'Desactivar',
  },
}
