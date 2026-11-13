import React, { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import bgLocale from './i18n/bg'
import type { LocaleMessages } from './i18n/types'

export type Language = 'bg' | 'en' | 'ru'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (source: string) => string
  localize: (item: any, field: string) => any
}

const loadLocale = async (language: Language): Promise<LocaleMessages> => {
  if (language === 'bg') return bgLocale
  if (language === 'en') return (await import('./i18n/en')).default
  return (await import('./i18n/ru')).default
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('florial-language') : null
    const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null
    const candidate = fromUrl || stored || 'bg'
    return candidate === 'en' || candidate === 'ru' ? candidate : 'bg'
  })
  const [locale, setLocale] = useState<LocaleMessages>(bgLocale)
  const [loadedLanguage, setLoadedLanguage] = useState<Language>('bg')

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    let cancelled = false

    if (language === 'bg') {
      setLocale(bgLocale)
      setLoadedLanguage('bg')
      return () => { cancelled = true }
    }

    loadLocale(language)
      .then((messages) => {
        if (cancelled) return
        setLocale(messages)
        setLoadedLanguage(language)
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Не удалось загрузить языковой пакет Florial:', error)
        setLocale(bgLocale)
        setLoadedLanguage('bg')
        setLanguageState('bg')
        window.localStorage.setItem('florial-language', 'bg')
        document.documentElement.lang = 'bg'
        const url = new URL(window.location.href)
        url.searchParams.delete('lang')
        window.history.replaceState({}, '', url.pathname + url.search + url.hash)
      })

    return () => { cancelled = true }
  }, [language])

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('florial-language', next)
      document.documentElement.lang = next
      const url = new URL(window.location.href)
      if (next === 'bg') url.searchParams.delete('lang')
      else url.searchParams.set('lang', next)
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
  }

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (source: string) => locale.translations[source] || source,
    localize: (item: any, field: string) => {
      if (!item) return undefined
      const translated = item.translations?.[language]?.[field]
        ?? item[`${field}Translations`]?.[language]?.[field]
        ?? item[`${field}Translations`]?.[language]?.name
        ?? item[`${field}${language.toUpperCase()}`]
        ?? item[`${field}_${language}`]
      const categoryTranslation = item.slug?.current
        ? locale.knownCategoryTranslations[item.slug.current]?.[field as 'name' | 'description']
        : undefined
      return translated ?? categoryTranslation ?? (
        typeof item[field] === 'string'
          ? locale.knownContentTranslations[item[field]] ?? item[field]
          : item[field]
      )
    },
  }), [language, locale])

  if (loadedLanguage !== language) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16 text-sm text-slate-500" role="status" aria-live="polite">
        Зареждане на езиковите данни…
      </main>
    )
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useI18n must be used inside LanguageProvider')
  return value
}
