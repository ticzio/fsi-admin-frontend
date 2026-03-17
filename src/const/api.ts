// 1. La función constructora de endpoints
function CreateApiEndpoints(prefix: string) {
  return {
    prefix: prefix,
    save: `${prefix}/save`,
    update: `${prefix}/update`,
    changeStatus: `${prefix}/change_status`,
    getAll: `${prefix}/all`,
  }
}

// 2. Un mapa más simple con tus recursos y sus prefijos
const RESOURCES = {
  administrator: 'admin',
  user: 'user',
  state: 'state',
  city: 'city',
  role: 'role',
  notification: 'notification',
  news: 'news',
  level: 'level',
  coupon: 'coupon',
  banner: 'banner',
  mission: 'missions',
  appUbication: 'app_ubication',
}

// 3. Genera el objeto URLS final de forma dinámica
export const URLS = Object.fromEntries(
  Object.entries(RESOURCES).map(([key, prefix]) => [key, CreateApiEndpoints(prefix)]),
)

// Nota: NO ejecutar InitializeConfig aquí. Solo debe llamarse desde main.ts
