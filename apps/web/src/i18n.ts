import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import es from './locales/es.json'
import et from './locales/et.json'

export type MessageSchema = typeof en

export const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'et'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function getStoredLocale(): SupportedLocale {
  const stored = localStorage.getItem('kontakt-locale')
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }
  return 'en'
}

const initialLocale = getStoredLocale()

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { en, fr, de, es, et },
})

document.documentElement.lang = initialLocale

export default i18n
