/**
 * Configuración del menú lateral
 */

export interface MenuItem {
  label: string
  to: string
  icon?: string
  iconActive?: string
  matchPath?: string
  excludePath?: string
  permission?: string
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Inicio', to: '/dashboard', matchPath: '/dashboard', permission: 'dashboard.read' },
  { label: 'Farmacia', to: '/pharmacy', matchPath: '/pharmacy', permission: 'concessionaire.read' },
  { label: 'Canjes', to: '/exchanges', matchPath: '/exchanges', permission: 'exchange.read' },
  { label: 'Noticias', to: '/news', matchPath: '/news', permission: 'news.read' },
  { label: 'Notificaciones', to: '/notifications', matchPath: '/notifications', permission: 'notification.read' },
  { label: 'Clientes', to: '/clients', matchPath: '/clients', permission: 'client.read' },
  { label: 'Operadores', to: '/operators', matchPath: '/operators', permission: 'operator.read' },
  { label: 'Administradores', to: '/administrators', matchPath: '/administrators', permission: 'administrator.read' },
  { label: 'Configuración', to: '/settings', matchPath: '/settings', permission: 'settings.read' },
]

/**
 * Helper para verificar si una ruta está activa
 */
export const isMenuItemActive = (item: MenuItem, currentPath: string): boolean => {
  const matchPath = item.matchPath || item.to

  if (item.excludePath && currentPath.includes(item.excludePath)) {
    return false
  }

  return currentPath.includes(matchPath)
}
