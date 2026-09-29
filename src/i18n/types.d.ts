import 'i18next'

import type enAlerts from './locales/en/alerts.json'
import type enAuth from './locales/en/auth.json'
import type enCategories from './locales/en/categories.json'
import type enCommon from './locales/en/common.json'
import type enInventory from './locales/en/inventory.json'
import type enLayout from './locales/en/layout.json'
import type enMovements from './locales/en/movements.json'
import type enProducts from './locales/en/products.json'
import type enProfile from './locales/en/profile.json'
import type enReplenishment from './locales/en/replenishment.json'
import type enSuppliers from './locales/en/suppliers.json'
import type enUsers from './locales/en/users.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof enCommon
      alerts: typeof enAlerts
      auth: typeof enAuth
      categories: typeof enCategories
      inventory: typeof enInventory
      layout: typeof enLayout
      movements: typeof enMovements
      products: typeof enProducts
      profile: typeof enProfile
      replenishment: typeof enReplenishment
      suppliers: typeof enSuppliers
      users: typeof enUsers
    }
  }
}
