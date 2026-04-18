import { createContext } from 'react'
import { Language, TranslationKey } from '../i18n/translations'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)
