import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import brazilian from '@/locales/pt-BR.json'

/** Brazilian (pt-BR) is the app's language. */
export const defaultLocale = 'pt-BR'

export const resources = {
  'pt-BR': { translation: brazilian },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: {
    // React already escapes rendered values.
    escapeValue: false,
  },
})

export default i18n
