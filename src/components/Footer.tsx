import { useI18n } from '../lib/i18n'
import './Footer.css'
import { localizedHref } from '../lib/navigation'
import { trackEvent } from '../services/trackingService'

export function Footer() {
  const { t, language } = useI18n()

  const callNumber = language === 'bg' ? '+359876777902' : '+359885834860'
  const callLabel = language === 'en'
    ? 'Call us'
    : language === 'ru'
      ? 'Позвонить'
      : 'Обаждане'
  const whatsappLabel = language === 'en'
    ? 'Message on WhatsApp'
    : language === 'ru'
      ? 'Написать в WhatsApp'
      : 'Пишете ни в WhatsApp'

  const sectionClass = 'footer-disclosure min-w-0'
  const summaryClass = 'flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-bold text-slate-900 md:cursor-default md:py-0 [&::-webkit-details-marker]:hidden'
  const linkClass = 'block py-1.5 text-sm text-slate-600 transition hover:text-emerald-800 hover:underline'

  return (
    <footer className="mt-auto border-t border-[#DDE3D0] bg-[#F3F5EC] text-slate-700">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-7 sm:px-6 sm:pt-9 lg:px-8">
        {/* Compact contact actions */}
        <section className="mb-7 rounded-2xl border border-[#DDE3D0] bg-[#E9EDDB] p-4 sm:p-5">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {language === 'en' ? 'Need help with your garden?' : language === 'ru' ? 'Нужна помощь с вашим садом?' : 'Имате нужда от помощ за Вашата градина?'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {language === 'en' ? 'Contact the Florial team' : language === 'ru' ? 'Свяжитесь с командой Florial' : 'Свържете се с екипа на Florial'}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[310px]">
              <a
                href={`tel:${callNumber}`}
                onClick={() => trackEvent(language === 'bg' ? 'call_bg' : 'call_en_ru', language, window.location.pathname)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">📞</span>{callLabel}
              </a>
              <a
                href="https://wa.me/380674807486"
                onClick={() => trackEvent('chat_click', language, window.location.pathname)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-700 px-3 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">💬</span>{whatsappLabel}
              </a>
            </div>
          </div>
        </section>

        {/* Four clear information groups: accordion on mobile, open columns on desktop */}
        <div className="grid grid-cols-1 gap-x-8 divide-y divide-[#DDE3D0] md:grid-cols-2 md:gap-y-7 md:divide-y-0 lg:grid-cols-4">
          <section className="py-1 md:py-0">
            <h2 className="mb-3 text-lg font-extrabold tracking-wide text-slate-900">
              <a href={localizedHref('/about', language)} className="text-inherit no-underline transition hover:text-emerald-800">
                FLORIAL
              </a>
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-slate-600">
              {language === 'en'
                ? 'Florial Landscape has been operating since 2000. We care for gardens through landscaping, planting, turf installation and automatic irrigation.'
                : language === 'ru'
                  ? 'Florial Landscape работает с 2000 года. Мы занимаемся благоустройством и озеленением: ландшафтным дизайном, посадками, рулонным газоном и автоматическим поливом.'
                  : 'Florial Landscape работи от 2000 г. Предлагаме ландшафтно проектиране, озеленяване, засаждане, полагане на тревен чим и изграждане на автоматизирани поливни системи.'}
            </p>
            <a href={localizedHref('/about', language)} className={`${linkClass} mt-2 font-semibold text-emerald-800`}>
              {language === 'en' ? 'About us' : language === 'ru' ? 'О компании' : 'За нас'}
            </a>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href="https://www.facebook.com/share/19guUXVgFC/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook — Florial"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-emerald-800"
              >
                <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-sm font-extrabold text-white">f</span>
                Facebook
              </a>
              <a
                href="https://www.instagram.com/florial_garden?utm_source=qr&avpt=MXVobno2Nnlqa3k4Mw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram — Florial"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-emerald-800"
              >
                <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-400 text-base font-extrabold text-white">◎</span>
                Instagram
              </a>
            </div>
          </section>

          <details className={sectionClass}>
            <summary className={summaryClass}>
              {language === 'en' ? 'Shop and services' : language === 'ru' ? 'Магазин и услуги' : 'Магазин и услуги'}
              <span aria-hidden="true" className="text-emerald-800 md:hidden">＋</span>
            </summary>
            <div className="footer-disclosure-content pb-3 md:pb-0">
              <a href={localizedHref('/services', language)} className={linkClass}>
                {language === 'en' ? 'All services' : language === 'ru' ? 'Все услуги' : 'Всички услуги'}
              </a>
              <a href={localizedHref('/contacts', language)} className={linkClass}>
                {language === 'en' ? 'Contacts and consultation' : language === 'ru' ? 'Контакты и консультация' : 'Контакти и консултация'}
              </a>
              <a href={localizedHref('/category/rastenia', language)} className={linkClass}>
                {language === 'en' ? 'Online plant shop' : language === 'ru' ? 'Интернет-магазин растений' : 'Онлайн магазин за растения'}
              </a>
              <a href={localizedHref('/category/vsichko-za-polivane', language)} className={linkClass}>
                {language === 'en' ? 'Online irrigation equipment shop' : language === 'ru' ? 'Интернет-магазин оборудования для полива' : 'Онлайн магазин за поливно оборудване'}
              </a>
            </div>
          </details>

          <details className={sectionClass}>
            <summary className={summaryClass}>
              {t('Контакти')}
              <span aria-hidden="true" className="text-emerald-800 md:hidden">＋</span>
            </summary>
            <div className="footer-disclosure-content space-y-2 pb-3 text-sm md:pb-0">
              <p className="font-semibold text-slate-900">
                {language === 'en' ? 'Florial Garden Centre' : language === 'ru' ? 'Садовый центр Florial' : 'Градински център „Флориал“'}
              </p>
              <p>
                <span className="text-slate-500">{language === 'en' ? 'BG:' : language === 'ru' ? 'Болгарский:' : 'Български:'}</span>{' '}
                <a href="tel:+359876777902" onClick={() => trackEvent('call_bg', language, window.location.pathname)} className="font-semibold text-emerald-800 hover:underline">+359 876 777 902</a>
              </p>
              <p>
                <span className="text-slate-500">ENG / UA / RU:</span>{' '}
                <a href="tel:+359885834860" onClick={() => trackEvent('call_en_ru', language, window.location.pathname)} className="font-semibold text-emerald-800 hover:underline">+359 885 834 860</a>
              </p>
              <p>
                <span className="text-slate-500">WhatsApp:</span>{' '}
                <a href="https://wa.me/380674807486" onClick={() => trackEvent('chat_click', language, window.location.pathname)} target="_blank" rel="noreferrer" className="font-semibold text-emerald-800 hover:underline">+380 67 480 74 86</a>
              </p>
              <p className="leading-relaxed text-slate-600">
                {language === 'en' ? 'Nursery: Khan Krum St., 8230 Nessebar' : language === 'ru' ? 'Питомник: ул. Хан Крум, 8230 Несебр' : 'Разсадник: ул. „Хан Крум“, 8230 Несебър'}
              </p>
            </div>
          </details>

          <details className={sectionClass}>
            <summary className={summaryClass}>
              {language === 'en' ? 'Information' : language === 'ru' ? 'Информация' : 'Информация'}
              <span aria-hidden="true" className="text-emerald-800 md:hidden">＋</span>
            </summary>
            <div className="footer-disclosure-content pb-3 md:pb-0">
              <a
                href={localizedHref('/privacy-policy', language)}
                onClick={(event) => {
                  event.preventDefault()
                  window.dispatchEvent(new Event('florial:open-analytics-settings'))
                }}
                className={linkClass}
              >
                {language === 'en' ? 'Privacy settings' : language === 'ru' ? 'Настройки конфиденциальности' : 'Настройки за поверителност'}
              </a>
              <a href={localizedHref('/privacy-policy', language)} className={linkClass}>
                {language === 'en' ? 'Privacy Policy' : language === 'ru' ? 'Политика конфиденциальности' : 'Политика за поверителност'}
              </a>
              <a href={localizedHref('/withdrawal', language)} className={linkClass}>
                {language === 'en' ? 'Withdrawal from contract' : language === 'ru' ? 'Отказ от договора' : 'Отказ от договор'}
              </a>
              <a href={localizedHref('/terms', language)} className={linkClass}>
                {language === 'en' ? 'Terms and Conditions' : language === 'ru' ? 'Общие условия' : 'Общи условия'}
              </a>
            </div>
          </details>
        </div>

        <div className="mt-6 border-t border-[#DDE3D0] pt-4 text-center">
          <p className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">{t('Райони и населени места на обслужване:')}</span>{' '}
            {language === 'en'
              ? 'Nessebar • Ravda • Sunny Beach • Sveti Vlas • Pomorie • Aheloy • Tankovo • Kosharitsa • Kableshkovo and nearby areas.'
              : language === 'ru'
                ? 'Несебр • Равда • Солнечный Берег • Святой Влас • Поморие • Ахелой • Тънково • Кошарица • Каблешково и близлежащие населённые пункты.'
                : 'Несебър • Равда • Слънчев бряг • Свети Влас • Поморие • Ахелой • Тънково • Кошарица • Каблешково и близките населени места в региона.'}
          </p>
          <p className="pt-3 text-[11px] text-slate-500">
            © {new Date().getFullYear()} Florial Landscape & {language === 'en' ? 'Florial Garden Centre. All rights reserved.' : language === 'ru' ? 'Садовый центр Florial. Все права защищены.' : 'Градински център Флориал. Всички права запазени.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
