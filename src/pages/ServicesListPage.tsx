import React, { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import type { ServiceItem } from '../types'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'

interface ServicesListPageProps {
  services: ServiceItem[]
}

export function ServicesListPage({ services }: ServicesListPageProps) {
  const { language, localize } = useI18n()

  const copy = language === 'ru'
    ? {
        title: 'Услуги садового центра Florial — создаём сады вашей мечты',
        intro: 'Профессиональный ландшафтный дизайн, озеленение и системы автоматического полива на побережье Болгарии: Поморие, Равда, Несебр, Солнечный Берег и Святой Влас.',
        body: 'Мы превращаем обычные участки в живые оазисы, где приятно отдыхать, проводить время с семьёй и наслаждаться природой каждый день. Садовый центр Florial берёт на себя полный цикл работ: от разработки уникального ландшафтного проекта и подбора подходящих растений до профессиональной посадки и монтажа современных систем полива. Наш опыт, внимание к деталям и любовь к растениям помогают создавать гармоничные, долговечные и простые в уходе сады, которые прекрасно выглядят в любой сезон.',
        all: 'Все услуги',
        maintenance: 'Обслуживание частных и коммерческих объектов',
        maintenanceIntro: 'Мы успешно работаем как с частными клиентами, так и с бизнесом по всему региону: Несебр, Солнечный Берег, Святой Влас, Елените, Равда и Поморие.',
        homes: 'Частные дома, дачи и виллы',
        homesText: 'Проектирование уютных персональных садов, озеленение территорий вокруг бассейнов и установка автоматического полива.',
        hotels: 'Отели, курортные и жилые комплексы',
        hotelsText: 'Создание презентабельного ландшафта, укладка газонов и регулярное обслуживание общих зелёных зон.',
        titleTag: 'Ландшафтный дизайн и автополив в Несебре, Солнечном Берегу, Святом Власе | Florial',
        description: 'Услуги садового центра Florial: ландшафтный дизайн, монтаж и обслуживание систем автополива, укладка газона и озеленение в Несебре, Святом Власе, Равде и Солнечном Берегу.'
      }
    : language === 'en'
      ? {
          title: 'Florial Garden Centre Services — Creating the Garden of Your Dreams',
          intro: 'Professional landscape design, planting and automatic irrigation systems along the Bulgarian coast, including Pomorie, Ravda, Nessebar, Sunny Beach and Sveti Vlas.',
          body: 'We transform ordinary plots into living oases where you can relax, spend time with your family and enjoy nature every day. Florial Garden Centre manages the entire process, from a unique landscape plan and carefully selected plants to professional planting and installation of modern irrigation systems. Our experience, attention to detail and love of plants help us create harmonious, long-lasting, easy-care gardens that look their best in every season.',
          all: 'All services',
          maintenance: 'Maintenance for private and commercial properties',
          maintenanceIntro: 'We work with private clients and businesses throughout Nessebar, Sunny Beach, Sveti Vlas, Elenite, Ravda and Pomorie.',
          homes: 'Private homes, holiday houses and villas',
          homesText: 'Designing welcoming gardens, landscaping around swimming pools and installing automatic irrigation.',
          hotels: 'Hotels, resorts and residential complexes',
          hotelsText: 'Creating attractive landscapes, installing turf and regularly maintaining shared green spaces.',
          titleTag: 'Landscape Design & Irrigation in Nessebar, Sunny Beach and Sveti Vlas | Florial',
          description: 'Florial Garden Centre services: landscape design, installation and maintenance of automatic irrigation, turf laying and planting in Nessebar, Sveti Vlas, Ravda and Sunny Beach.'
        }
      : {
          title: 'Услуги на градински център Florial — създаваме градините на вашите мечти',
          intro: 'Професионален ландшафтен дизайн, озеленяване и системи за автоматично напояване по българското Черноморие — в Поморие, Равда, Несебър, Слънчев бряг и Свети Влас.',
          body: 'Превръщаме обикновените дворове в живи оазиси, където е приятно да си почивате, да прекарвате време със семейството и да се наслаждавате на природата всеки ден. Градински център Florial поема целия процес — от създаването на индивидуален ландшафтен проект и избора на подходящи растения до професионалното им засаждане и монтажа на съвременни системи за напояване. Нашият опит, вниманието към детайла и любовта към растенията ни помагат да създаваме хармонични, устойчиви и лесни за поддръжка градини, които изглеждат прекрасно през всеки сезон.',
          all: 'Всички услуги',
          maintenance: 'Поддръжка на частни и търговски обекти',
          maintenanceIntro: 'Работим успешно както с частни клиенти, така и с бизнеси в Несебър, Слънчев бряг, Свети Влас, Елените, Равда и Поморие.',
          homes: 'Частни домове, вили и ваканционни имоти',
          homesText: 'Проектиране на уютни градини, озеленяване около басейни и изграждане на автоматично напояване.',
          hotels: 'Хотели, курортни и жилищни комплекси',
          hotelsText: 'Представително озеленяване, полагане на тревни чимове и редовна поддръжка на общите зелени площи.',
          titleTag: 'Ландшафтен дизайн и автоматично напояване в Несебър, Слънчев бряг и Свети Влас | Florial',
          description: 'Услуги на градински център Florial: ландшафтен дизайн, монтаж и поддръжка на системи за автоматично напояване, полагане на тревен чим и озеленяване в Несебър, Свети Влас, Равда и Слънчев бряг.'
        }

  useEffect(() => {
    const base = 'https://florial-bg.com/services'
    applyPageSeo({
      fallbackTitle: copy.titleTag,
      fallbackDescription: copy.description,
      language,
      alternates: {
        bg: base,
        ru: base + '?lang=ru',
        en: base + '?lang=en',
        'x-default': base,
      },
    })
  }, [language])

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">
        <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">{copy.title}</h1>
        <p className="mb-4 text-lg leading-8 text-slate-600">{copy.intro}</p>
        <p className="text-base leading-8 text-slate-600">{copy.body}</p>
      </header>

      <section aria-label={copy.all}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <a
              key={service._id}
              href={localizedHref(`/services/${encodeURIComponent(service.slug?.current || service._id)}`, language)}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white shadow-sm transition hover:border-[#B9C79C] hover:shadow-md no-underline"
            >
              <div className="flex h-52 items-center justify-center overflow-hidden bg-[#E9EDDB]">
                {service.imageUrl ? <img src={service.imageUrl} alt={String(localize(service, 'name') || '')} loading="lazy" className="h-full w-full object-cover" /> : <span className="p-4 text-center font-semibold text-slate-700">{localize(service, 'name')}</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="mb-2 text-xl font-bold text-slate-900">{localize(service, 'name')}</h2>
                <p className="flex-1 text-sm leading-6 text-slate-600">{localize(service, 'shortDescription')}</p>
                <span className="mt-4 font-semibold text-emerald-800">{language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Learn more →' : 'Научете повече →'}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-[#F3F5EC] p-6 md:p-10">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">{copy.maintenance}</h2>
        <p className="mb-5 leading-7 text-slate-700">{copy.maintenanceIntro}</p>
        <ul className="space-y-4 text-slate-700">
          <li><strong>{copy.homes}:</strong> {copy.homesText}</li>
          <li><strong>{copy.hotels}:</strong> {copy.hotelsText}</li>
        </ul>
      </section>
    </main>
  )
}
