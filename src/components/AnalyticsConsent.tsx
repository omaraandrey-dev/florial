import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { localizedHref } from '../lib/navigation'
import { getAnalyticsConsent, setAnalyticsConsent, trackEvent } from '../services/trackingService'

const copy = {
  bg: {
    title: 'Настройки за поверителност',
    body: 'Използваме необходимото локално съхранение за езика и количката. Аналитични събития се изпращат само ако разрешите това. Не изпращаме данни за поръчки или контакти.',
    accept: 'Приемам аналитиката',
    reject: 'Отказвам',
    privacy: 'Политика за поверителност',
  },
  ru: {
    title: 'Настройки конфиденциальности',
    body: 'Мы используем необходимое локальное хранение для языка и корзины. Аналитические события отправляются только с вашего разрешения. Данные заказов и контакты не передаются.',
    accept: 'Разрешить аналитику',
    reject: 'Отклонить',
    privacy: 'Политика конфиденциальности',
  },
  en: {
    title: 'Privacy settings',
    body: 'We use necessary local storage for language and your cart. Analytics events are sent only if you allow them. Order details and contact information are not sent.',
    accept: 'Allow analytics',
    reject: 'Reject',
    privacy: 'Privacy Policy',
  },
} as const

export function AnalyticsConsent() {
  const { language } = useI18n()
  const [isOpen, setIsOpen] = useState(() => getAnalyticsConsent() === 'unknown')
  const text = copy[language]

  useEffect(() => {
    const openSettings = () => setIsOpen(true)
    window.addEventListener('florial:open-analytics-settings', openSettings)
    return () => window.removeEventListener('florial:open-analytics-settings', openSettings)
  }, [])

  const choose = (value: 'accepted' | 'rejected') => {
    setAnalyticsConsent(value)
    window.dispatchEvent(new Event('florial:analytics-consent-change'))
    if (value === 'accepted') trackEvent('page_view', language, window.location.pathname)
    setIsOpen(false)
  }

  return isOpen ? (
    <section
      id="analytics-settings"
      aria-label={text.title}
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-[#DDE3D0] bg-white p-4 shadow-2xl sm:inset-x-5 sm:bottom-5 sm:p-5"
    >
      <h2 className="mb-2 text-base font-bold text-slate-900">{text.title}</h2>
      <p className="mb-4 text-sm leading-relaxed text-slate-700">{text.body}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => choose('accepted')} className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
          {text.accept}
        </button>
        <button type="button" onClick={() => choose('rejected')} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          {text.reject}
        </button>
        <a href={localizedHref('/privacy-policy', language)} className="ml-auto text-sm text-emerald-800 underline underline-offset-4">
          {text.privacy}
        </a>
      </div>
    </section>
  ) : null
}
