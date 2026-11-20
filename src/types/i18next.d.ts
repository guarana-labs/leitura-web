import 'i18next'
import type ptBR from '@/locales/pt-BR.json'

// Makes translation keys type-checked: t('dashboard.title') autocompletes and typos fail the build.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof ptBR
    }
  }
}
