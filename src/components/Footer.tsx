import React from 'react'
import { useI18n } from '../lib/i18n'

export function Footer() {
  const { t, language } = useI18n()
  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-8 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Кнопки быстрого вызова и мессенджеров (из блока контактов) */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-8 shadow-inner">
          <h3 className="text-white text-center font-bold text-lg mb-4">
            {t('Свържете се с нас за консултация и оглед')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <a 
              href="tel:+359876777902" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-center shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              📞 {language === 'en' ? 'Call: +359876777902' : language === 'ru' ? 'Позвонить: +359876777902' : 'Обаждане: +359876777902'}
            </a>
            <a 
              href="https://wa.me/359876777902" 
              target="_blank" 
              rel="noreferrer" 
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl text-center shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              💬 {t('WhatsApp Контакт')}
            </a>
          </div>
        </div>

        {/* Основная информация о компании "{t('За нас')}" */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-800">
          <div>
            <h4 className="text-white text-xl font-extrabold mb-3 tracking-wide">
              {t("За нас")}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              <strong>Florial landscape</strong> {language === 'en' ? 'Florial Landscape has been working since 2000. We provide a wide range of landscaping and garden improvement services. Our goal is to create beautiful, functional outdoor spaces, including landscape design, planting, turf installation and automatic irrigation systems.' : language === 'ru' ? 'Florial Landscape работает с 2000 года. Мы предлагаем широкий спектр услуг по благоустройству и озеленению. Наша цель — создавать красивые и функциональные сады: ландшафтный дизайн, посадки, укладка рулонного газона и монтаж систем автоматического полива.' : 'работят от 2000г. Извършваме широк спектър от дейности по озеленяване и благоустрояване. Нашата основна цел е да създаваме красиви и функционални градински пространства. Основните области на нашата работа: ландшафтен дизайн, озеленяване, засаждане, изграждане на тревни площи с готови чимове и инсталиране на системи за автоматично поливане.'}
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-400 md:text-right">
            <h4 className="text-white text-lg font-bold mb-2">{t('Контакти')}</h4>
            <p className="font-semibold text-slate-200">{language === 'en' ? 'Florial Garden Centre' : language === 'ru' ? 'Садовый центр Florial' : 'Градински център „Флориал“'}</p>
            <p>{language === 'en' ? 'Phone:' : language === 'ru' ? 'Тел.:' : 'Тел:'} <a href="tel:+359876777902" className="text-emerald-400 hover:underline font-bold">+359876777902</a></p>
            <p>Тел: <a href="tel:+359885834860" className="text-emerald-400 hover:underline font-bold">+359885834860</a> (BG / UA / RU)</p>
            <p>{language === 'en' ? 'Nursery: Khan Krum St., 8230 Nessebar' : language === 'ru' ? 'Питомник: ул. Хан Крум, 8230 Несебр' : 'Разсадник: ул. „Хан Крум“, 8230 Несебър'}</p>
          </div>
        </div>

        {/* SEO Блок: Мелкий шрифт с перечислением населенных пунктов */}
        <div className="text-center text-xs text-slate-500 space-y-2">
          <p className="font-medium text-slate-400">
            {t('Райони и населени места на обслужване:')}
          </p>
          <p className="leading-relaxed max-w-4xl mx-auto">
            {language === 'en' ? 'Nessebar • Ravda • Sunny Beach • Sveti Vlas • Pomorie • Aheloy • Tankovo • Kosharitsa • Kableshkovo and nearby areas.' : language === 'ru' ? 'Несебр • Равда • Солнечный Берег • Святой Влас • Поморие • Ахелой • Тънково • Кошарица • Каблешково и близлежащие населённые пункты.' : 'Несебър • Равда • Слънчев бряг • Свети Влас • Поморие • Ахелой • Тънково • Кошарица • Каблешково и близките населени места в региона.'}
          </p>
          <p className="pt-4 text-[11px] text-slate-600">
            © {new Date().getFullYear()} Florial Landscape & Градински център Флориал. Всички права запазени.
          </p>
        </div>

      </div>
    </footer>
  )
}
