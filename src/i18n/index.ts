import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enAlerts from './locales/en/alerts.json'
import enAuth from './locales/en/auth.json'
import enCategories from './locales/en/categories.json'
import enCommon from './locales/en/common.json'
import enInventory from './locales/en/inventory.json'
import enLayout from './locales/en/layout.json'
import enMovements from './locales/en/movements.json'
import enProducts from './locales/en/products.json'
import enProfile from './locales/en/profile.json'
import enReplenishment from './locales/en/replenishment.json'
import enSuppliers from './locales/en/suppliers.json'
import enUsers from './locales/en/users.json'
import esAlerts from './locales/es/alerts.json'
import esAuth from './locales/es/auth.json'
import esCategories from './locales/es/categories.json'
import esCommon from './locales/es/common.json'
import esInventory from './locales/es/inventory.json'
import esLayout from './locales/es/layout.json'
import esMovements from './locales/es/movements.json'
import esProducts from './locales/es/products.json'
import esProfile from './locales/es/profile.json'
import esReplenishment from './locales/es/replenishment.json'
import esSuppliers from './locales/es/suppliers.json'
import esUsers from './locales/es/users.json'

export const defaultNS = 'common'

export const resources = {
  es: {
    common: esCommon,
    alerts: esAlerts,
    auth: esAuth,
    categories: esCategories,
    inventory: esInventory,
    layout: esLayout,
    movements: esMovements,
    products: esProducts,
    profile: esProfile,
    replenishment: esReplenishment,
    suppliers: esSuppliers,
    users: esUsers,
  },
  en: {
    common: enCommon,
    alerts: enAlerts,
    auth: enAuth,
    categories: enCategories,
    inventory: enInventory,
    layout: enLayout,
    movements: enMovements,
    products: enProducts,
    profile: enProfile,
    replenishment: enReplenishment,
    suppliers: enSuppliers,
    users: enUsers,
  },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
