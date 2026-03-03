/**
 * Configuración del menú lateral con permisos
 *
 * Cada item define:
 * - label: texto a mostrar
 * - to: ruta de navegación
 * - icon: clase de icono Bootstrap
 * - iconActive: clase de icono cuando está activo
 * - permissions: permisos requeridos para ver el item
 * - matchPath: patrón para determinar si está activo (opcional)
 */

import { PERMISSIONS } from './permissions'

export interface MenuItem {
  label: string
  to: string
  icon: string
  iconActive: string
  permissions: string[]
  matchPath?: string // Para rutas que necesitan match parcial
  excludePath?: string // Para excluir rutas específicas del match
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Inicio',
    to: '/dashboard',
    icon: 'bi-house-door',
    iconActive: 'bi-house-door-fill',
    permissions: [PERMISSIONS.dashboard.read],
    matchPath: '/dashboard',
  },
  {
    label: 'Concesionarios',
    to: '/concessionaire',
    icon: 'bi-ev-station',
    iconActive: 'bi-ev-station-fill',
    permissions: [PERMISSIONS.concessionaire.read],
    matchPath: '/concessionaire',
  },
  {
    label: 'Empresas',
    to: '/companies',
    icon: 'bi-buildings',
    iconActive: 'bi-buildings-fill',
    permissions: [PERMISSIONS.company.read],
    matchPath: '/companies',
  },
  {
    label: 'Administradores',
    to: '/administrators',
    icon: 'bi-person',
    iconActive: 'bi-person-fill',
    permissions: [PERMISSIONS.administrator.read],
    matchPath: '/administrators',
    excludePath: '/administrators-concessionaire',
  },
  {
    label: 'Clientes',
    to: '/clients',
    icon: 'bi-people',
    iconActive: 'bi-people-fill',
    permissions: [PERMISSIONS.client.read],
    matchPath: '/clients',
    excludePath: '/clients-company',
  },
  {
    label: 'Exhibiciones',
    to: '/exhibition',
    icon: 'bi-car-front',
    iconActive: 'bi-car-front-fill',
    permissions: [PERMISSIONS.exhibition.read],
    matchPath: '/exhibition',
  },
  {
    label: 'Noticias',
    to: '/news',
    icon: 'bi-megaphone',
    iconActive: 'bi-megaphone-fill',
    permissions: [PERMISSIONS.news.read],
    matchPath: '/news',
  },
  {
    label: 'Notificaciones',
    to: '/notifications',
    icon: 'bi-bell',
    iconActive: 'bi-bell-fill',
    permissions: [PERMISSIONS.notification.read],
    matchPath: '/notifications',
  },
  {
    label: 'Configuración',
    to: '/settings',
    icon: 'bi-gear',
    iconActive: 'bi-gear-fill',
    permissions: [PERMISSIONS.settings.read],
    matchPath: '/settings',
  },
]

/**
 * Helper para verificar si una ruta está activa
 */
export const isMenuItemActive = (item: MenuItem, currentPath: string): boolean => {
  const matchPath = item.matchPath || item.to

  // Si hay excludePath y la ruta actual lo incluye, no está activo
  if (item.excludePath && currentPath.includes(item.excludePath)) {
    return false
  }

  return currentPath.includes(matchPath)
}
