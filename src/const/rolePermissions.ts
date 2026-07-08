/**
 * Mapa de permisos por rol
 *
 * Cuando el backend devuelva permissions directamente,
 * solo hay que cambiar la fuente de datos en useAccessControl,
 * sin tocar el resto del código.
 *
 * Roles conocidos:
 * 1 = Super Admin
 * 2 = Admin
 * 3 = Operator
 * 4 = Marketing
 */

import { PERMISSIONS, PERMISSION_WILDCARD } from './permissions'

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  OPERATOR: 3,
  MARKETING: 4,
} as const

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS]

/**
 * Mapa rol -> permisos
 * '*' = acceso total (wildcard)
 */
export const ROLE_PERMISSIONS: Record<number, string[]> = {
  // Super Admin: acceso total
  [ROLE_IDS.SUPER_ADMIN]: [PERMISSION_WILDCARD],

  // Admin: casi todo excepto configuración crítica y algoritmo de puntos
  [ROLE_IDS.ADMIN]: [
    // Dashboard
    PERMISSIONS.dashboard.read,

    // Concesionarios (Farmacias)
    PERMISSIONS.concessionaire.read,
    PERMISSIONS.concessionaire.create,
    PERMISSIONS.concessionaire.update,
    PERMISSIONS.concessionaire.deactivate,
    PERMISSIONS.concessionaire.delete,

    // Empresas
    PERMISSIONS.company.read,
    PERMISSIONS.company.create,
    PERMISSIONS.company.update,
    PERMISSIONS.company.deactivate,
    PERMISSIONS.company.delete,

    // Administradores
    PERMISSIONS.administrator.read,
    PERMISSIONS.administrator.create,
    PERMISSIONS.administrator.update,
    PERMISSIONS.administrator.deactivate,
    PERMISSIONS.administrator.delete,

    // Clientes
    PERMISSIONS.client.read,
    PERMISSIONS.client.create,
    PERMISSIONS.client.update,
    PERMISSIONS.client.deactivate,
    PERMISSIONS.client.delete,

    // Operadores
    PERMISSIONS.operator.read,
    PERMISSIONS.operator.create,
    PERMISSIONS.operator.update,
    PERMISSIONS.operator.deactivate,
    PERMISSIONS.operator.delete,

    // Noticias (CRUD)
    PERMISSIONS.news.read,
    PERMISSIONS.news.create,
    PERMISSIONS.news.update,
    PERMISSIONS.news.deactivate,
    PERMISSIONS.news.delete,

    // Notificaciones (CRUD)
    PERMISSIONS.notification.read,
    PERMISSIONS.notification.create,
    PERMISSIONS.notification.update,
    PERMISSIONS.notification.delete,

    // Canjes (CRUD)
    PERMISSIONS.exchange.read,
    PERMISSIONS.exchange.update,
    PERMISSIONS.exchange.delete,

    // Banners publicitarios (CRUD)
    PERMISSIONS.banner.read,
    PERMISSIONS.banner.create,
    PERMISSIONS.banner.update,
    PERMISSIONS.banner.delete,
    PERMISSIONS.banner.deactivate,

    // Configurar misiones (SOLO VER)
    PERMISSIONS.mission.read,

    // Configuración general
    PERMISSIONS.settings.read,
  ],

  // Operador: tiene su propio dashboard, aquí se ignora/sin permisos
  [ROLE_IDS.OPERATOR]: [],

  // Marketing: Noticias (CRUD), Notificaciones (VER), Canjes (VER), Banners (CRUD)
  [ROLE_IDS.MARKETING]: [
    PERMISSIONS.dashboard.read,

    // Noticias (CRUD)
    PERMISSIONS.news.read,
    PERMISSIONS.news.create,
    PERMISSIONS.news.update,
    PERMISSIONS.news.deactivate,
    PERMISSIONS.news.delete,

    // Notificaciones (VER)
    PERMISSIONS.notification.read,

    // Canjes (VER)
    PERMISSIONS.exchange.read,

    // Banners publicitarios (CRUD)
    PERMISSIONS.banner.read,
    PERMISSIONS.banner.create,
    PERMISSIONS.banner.update,
    PERMISSIONS.banner.delete,
    PERMISSIONS.banner.deactivate,

    // Configuración general (necesario para ver banners)
    PERMISSIONS.settings.read,
  ],
}

/**
 * Obtener permisos de un rol
 */
export const getPermissionsByRole = (roleId: number): string[] => {
  return ROLE_PERMISSIONS[roleId] || []
}

/**
 * Verificar si un rol tiene un permiso específico
 */
export const roleHasPermission = (roleId: number, permission: string): boolean => {
  const permissions = getPermissionsByRole(roleId)

  // Wildcard = acceso total
  if (permissions.includes(PERMISSION_WILDCARD)) {
    return true
  }

  return permissions.includes(permission)
}

/**
 * Verificar si un rol tiene TODOS los permisos especificados
 */
export const roleHasAllPermissions = (roleId: number, requiredPermissions: string[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.every((perm) => roleHasPermission(roleId, perm))
}

/**
 * Verificar si un rol tiene AL MENOS UNO de los permisos especificados
 */
export const roleHasAnyPermission = (roleId: number, requiredPermissions: string[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.some((perm) => roleHasPermission(roleId, perm))
}
