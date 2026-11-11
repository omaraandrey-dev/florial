import React from 'react'
import { useI18n } from '../lib/i18n'
import { localizedHref } from '../lib/navigation'
import { trackEvent } from '../services/trackingService'

export function Footer() {
  const { t, language } = useI18n()
  return (
    <footer className="mt-auto border-t border-[#DDE3D0] bg-[#F3F5EC] pt-10 pb-8 text-slate-700">
      <div className="mx-auto max-w-7xl px-4">

        {/* Контакти и бързи връзки */}
        <div className="mb-8 rounded-2xl border border-[#DDE3D0] bg-[#E9EDDB] p-5 shadow-sm">
          <h3 className="mb-4 text-center text-lg font-bold text-slate-900">
            {t('Свържете се с нас за консултация и оглед')}
          </h3>
          <div className="mx-auto grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href={language === 'bg' ? 'tel:+359876777902' : 'tel:+359885834860'}
              onClick={() => trackEvent(language === 'bg' ? 'call_bg' : 'call_en_ru', language, window.location.pathname)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-center font-bold text-white shadow transition hover:bg-emerald-800"
            >
              📞 {language === 'en' ? 'Call: +359885834860' : language === 'ru' ? 'Позвонить: +359885834860' : 'Обаждане: +359876777902'}
            </a>
            <a
              href="https://wa.me/380674807486"
              onClick={() => trackEvent('chat_click', language, window.location.pathname)}
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-center font-bold text-white shadow transition hover:bg-green-800"
            >
              💬 {t('WhatsApp чат с оператором')}
            </a>
          </div>
        </div>

        {/* Основна информация за компанията */}
        <div className="mb-8 grid grid-cols-1 gap-8 border-b border-[#DDE3D0] pb-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl font-extrabold tracking-wide text-slate-900">
              <a href={localizedHref('/about', language)} className="text-inherit no-underline transition hover:text-emerald-800">{t('За нас')}</a>
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              {language === 'en' ? 'Florial Landscape has been operating since 2000. We provide landscaping and garden improvement services, including landscape design, planting, turf installation and automatic irrigation systems.' : language === 'ru' ? 'Florial Landscape работает с 2000 года. Мы предлагаем услуги по благоустройству и озеленению: ландшафтный дизайн, посадки, укладка рулонного газона и монтаж систем автоматического полива.' : 'Florial Landscape работи от 2000 г. Предлагаме широк спектър от дейности по озеленяване и благоустрояване: ландшафтен дизайн, засаждане, изграждане на тревни площи с готови чимове и монтаж на системи за автоматично поливане.'}
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-700 md:text-right">
            <h3 className="mb-2 text-lg font-bold text-slate-900">{t('Контакти')}</h3>
            <p className="font-semibold text-slate-900">{language === 'en' ? 'Florial Garden Centre' : language === 'ru' ? 'Садовый центр Florial' : 'Градински център „Флориал“'}</p>
            <p>{language === 'en' ? 'Phone:' : language === 'ru' ? 'Тел.:' : 'Тел:'} <a href="tel:+359876777902" onClick={() => trackEvent('call_bg', language, window.location.pathname)} className="font-bold text-emerald-800 transition hover:text-emerald-900 hover:underline">+359 876 777 902</a> BG</p>
            <p>{language === 'en' ? 'Phone:' : language === 'ru' ? 'Тел.:' : 'Тел:'} <a href="tel:+359885834860" onClick={() => trackEvent('call_en_ru', language, window.location.pathname)} className="font-bold text-emerald-800 transition hover:text-emerald-900 hover:underline">+359 885 834 860</a> — ENG / UA / RU</p>
            <p>{language === 'en' ? 'WhatsApp:' : 'WhatsApp:'} <a href="https://wa.me/380674807486" onClick={() => trackEvent('chat_click', language, window.location.pathname)} target="_blank" rel="noreferrer" className="font-bold text-emerald-800 transition hover:text-emerald-900 hover:underline">+380 67 480 74 86</a> — WhatsApp Chat BG / ENG / UA / RU</p>
            <p>{language === 'en' ? 'Nursery: Khan Krum St., 8230 Nessebar' : language === 'ru' ? 'Питомник: ул. Хан Крум, 8230 Несебр' : 'Разсадник: ул. „Хан Крум“, 8230 Несебър'}</p>
          </div>
        </div>

        {/* Социални мрежи */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <h3 className="text-base font-bold text-slate-900">
            {language === 'en' ? 'Follow us' : language === 'ru' ? 'Мы в социальных сетях' : 'Последвайте ни'}
          </h3>
          <a
            href="https://www.facebook.com/share/19guUXVgFC/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook — Florial"
            className="inline-flex items-center gap-2 rounded-full border border-[#DDE3D0] bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-emerald-700 hover:bg-[#E9EDDB] hover:text-emerald-900"
          >
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-base font-extrabold text-white">f</span>
            Facebook
          </a>
        </div>

        {/* Райони на обслужване и правна информация */}
        <div className="space-y-2 text-center text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            {t('Райони и населени места на обслужване:')}
          </p>
          <p className="mx-auto max-w-4xl leading-relaxed">
            {language === 'en' ? 'Nessebar • Ravda • Sunny Beach • Sveti Vlas • Pomorie • Aheloy • Tankovo • Kosharitsa • Kableshkovo and nearby areas.' : language === 'ru' ? 'Несебр • Равда • Солнечный Берег • Святой Влас • Поморие • Ахелой • Тънково • Кошарица • Каблешково и близлежащие населённые пункты.' : 'Несебър • Равда • Слънчев бряг • Свети Влас • Поморие • Ахелой • Тънково • Кошарица • Каблешково и близките населени места в региона.'}
          </p>
          <div className="flex flex-col items-center justify-center gap-x-6 gap-y-2 pt-3 sm:flex-row">
            <a
              href={localizedHref('/privacy-policy', language)}
              className="font-medium text-emerald-800 underline decoration-[#A9B99B] underline-offset-4 transition hover:text-emerald-950"
            >
              {language === 'en' ? 'Privacy Policy' : language === 'ru' ? 'Политика конфиденциальности' : 'Политика за поверителност'}
            </a>
            <a
              href={localizedHref('/withdrawal', language)}
              className="font-medium text-emerald-800 underline decoration-[#A9B99B] underline-offset-4 transition hover:text-emerald-950"
            >
              {language === 'en' ? 'Withdrawal from contract' : language === 'ru' ? 'Отказ от договора' : 'Отказ от договор'}
            </a>
          </div>
          <p className="pt-3 text-[11px] text-slate-600">
            © {new Date().getFullYear()} Florial Landscape & {language === 'en' ? 'Florial Garden Centre. All rights reserved.' : language === 'ru' ? 'Садовый центр Florial. Все права защищены.' : 'Градински център Флориал. Всички права запазени.'}
          </p>
        </div>

      </div>
    </footer>
  )
}
