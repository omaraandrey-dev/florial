import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { ServiceItem, ServiceRolePhoto } from '../types'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { getOrderedServiceEntries } from '../lib/servicesOrder'
import { getSanityImageProps } from '../lib/sanityImage'

interface ServicesListPageProps {
  services: ServiceItem[]
  rolePhotos: ServiceRolePhoto[]
  loading?: boolean
}

type ServiceDirection = 'landscaping' | 'irrigation' | 'planting' | 'lawn'

const SERVICE_DIRECTIONS: Array<{
  id: ServiceDirection
  photoSlug: string
  categories: string[]
  title: { bg: string; ru: string; en: string }
}> = [
  {
    id: 'landscaping',
    photoSlug: 'landshaften-arhitekt',
    categories: ['landscaping'],
    title: { bg: 'Ландшафтен архитект', ru: 'Ландшафтный архитектор', en: 'Landscape architect' },
  },
  {
    id: 'irrigation',
    photoSlug: 'inzhener-polivni-sistemi',
    categories: ['irrigation', 'maintenance', 'delivery'],
    title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' },
  },
  {
    id: 'planting',
    photoSlug: 'gardinar',
    categories: ['planting'],
    title: { bg: 'Градинар', ru: 'Садовник', en: 'Gardener' },
  },
  {
    id: 'lawn',
    photoSlug: 'specialist-trevni-ploshti',
    categories: ['lawn'],
    title: { bg: 'Специалист по тревни площи', ru: 'Специалист по газонам', en: 'Lawn specialist' },
  },
]

export function ServicesListPage({ services, rolePhotos, loading = false }: ServicesListPageProps) {
  const { language, localize } = useI18n()
  const [selectedDirections, setSelectedDirections] = useState<ServiceDirection[]>(
    () => SERVICE_DIRECTIONS.map((direction) => direction.id)
  )

  const orderedEntries = useMemo(() => getOrderedServiceEntries(services), [services])
  const filteredEntries = useMemo(() => {
    if (selectedDirections.length === SERVICE_DIRECTIONS.length) return orderedEntries
    const categories = new Set(
      SERVICE_DIRECTIONS
        .filter((direction) => selectedDirections.includes(direction.id))
        .flatMap((direction) => direction.categories)
    )
    return orderedEntries.filter((entry) => {
      if (entry.kind === 'delivery') return categories.has('delivery')
      return Boolean(entry.service.serviceCategory && categories.has(entry.service.serviceCategory))
    })
  }, [orderedEntries, selectedDirections])

  const toggleDirection = (directionId: ServiceDirection) => {
    setSelectedDirections((current) => {
      const next = current.includes(directionId)
        ? current.filter((id) => id !== directionId)
        : [...current, directionId]
      // An empty selection means "all services", so the list never disappears unexpectedly.
      return next.length === 0 ? SERVICE_DIRECTIONS.map((direction) => direction.id) : next
    })
  }

  const copy = language === 'ru'
    ? {
        title: 'Услуги садового центра Florial — создаём сады вашей мечты',
        intro: 'Профессиональный ландшафтный дизайн, озеленение и системы автоматического полива на побережье Болгарии: Поморие, Равда, Несебр, Солнечный Берег и Святой Влас.',
        body: 'Мы превращаем обычные участки в живые оазисы, где приятно отдыхать, проводить время с семьёй и наслаждаться природой каждый день. Садовый центр Florial берёт на себя полный цикл работ: от разработки уникального ландшафтного проекта и подбора подходящих растений до профессиональной посадки и монтажа современных систем полива. Наш опыт, внимание к деталям и любовь к растениям помогают создавать гармоничные, долговечные и простые в уходе сады, которые прекрасно выглядят в любой сезон.',
        all: 'Все услуги',
        directions: 'Направления специалистов',
        directionsHint: 'Выберите одно или несколько направлений, чтобы увидеть соответствующие услуги.',
        showing: (count: number) => `Показано услуг: ${count}`,
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
          directions: 'Our specialist teams',
          directionsHint: 'Choose one or more directions to see the related services.',
          showing: (count: number) => `Services shown: ${count}`,
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
          directions: 'Нашите професионални направления',
          directionsHint: 'Изберете едно или повече направления, за да видите съответните услуги.',
          showing: (count: number) => `Показани услуги: ${count}`,
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
  useEffect(() => {
    const items = filteredEntries.slice(0, 50).flatMap((entry, index) => {
      if (entry.kind === 'delivery') {
        return [{
          '@type': 'ListItem',
          position: index + 1,
          name: language === 'ru' ? 'Доставка оборудования для полива' : language === 'en' ? 'Irrigation equipment delivery' : 'Доставка на оборудване за поливане',
          url: new URL(localizedHref('/services/dostavka-poliv', language), window.location.origin).toString(),
        }]
      }
      const service = entry.service
      const slug = service.slug?.current || (typeof service.slug === 'string' ? service.slug : '')
      if (!slug) return []
      return [{
        '@type': 'ListItem',
        position: index + 1,
        name: String(localize(service, 'name') || service.name),
        url: new URL(localizedHref('/services/' + encodeURIComponent(slug), language), window.location.origin).toString(),
      }]
    })
    setStructuredData('collection-page', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: copy.titleTag,
      description: copy.description,
      url: new URL(localizedHref('/services', language), window.location.origin).toString(),
      ...(items.length ? { mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items } } : {}),
    })
  }, [filteredEntries, language, localize, copy.titleTag, copy.description])

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <a href={localizedHref('/', language)} className="hover:text-emerald-700 no-underline">{language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-slate-700">{copy.all}</span>
      </nav>
      <header className="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">
        <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">{copy.title}</h1>
        <p className="mb-4 text-lg leading-8 text-slate-600">{copy.intro}</p>
        <p className="text-base leading-8 text-slate-600">{copy.body}</p>
      </header>

      <section aria-labelledby="service-directions-heading" className="mb-8">
        <div className="mb-4 text-center">
          <h2 id="service-directions-heading" className="mb-2 text-2xl font-bold text-slate-900">{copy.directions}</h2>
          <p className="text-sm leading-6 text-slate-600">{copy.directionsHint}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {SERVICE_DIRECTIONS.map((direction, index) => {
            const photo = rolePhotos.find((item) => item.slug === direction.photoSlug)
            const isSelected = selectedDirections.includes(direction.id)
            const title = direction.title[language]
            const imageAlt = language === 'ru'
              ? photo?.imageAltRu || title
              : language === 'en'
                ? photo?.imageAltEn || title
                : photo?.imageAlt || title

            return (
              <button
                key={direction.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleDirection(direction.id)}
                className={`group min-w-0 overflow-hidden rounded-xl border bg-white p-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:rounded-2xl sm:p-3 ${isSelected ? 'border-emerald-700 shadow-sm ring-1 ring-emerald-700/20' : 'border-[#DDE3D0] opacity-70 hover:opacity-100'}`}
              >
                <span className="block aspect-square overflow-hidden rounded-lg bg-[#E9EDDB] sm:rounded-xl">
                  {photo?.imageUrl ? (
                    <img {...getSanityImageProps(photo.imageUrl, '(min-width: 640px) 160px, 25vw', 320, 65)} alt={imageAlt} loading="eager" decoding="async" fetchPriority={index === 0 ? 'high' : undefined} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <span className="flex h-full items-center justify-center px-1 text-[9px] font-semibold text-slate-600 sm:text-sm">{title}</span>
                  )}
                </span>
                <span className="mt-1.5 block break-words text-[10px] font-semibold leading-tight text-slate-800 sm:mt-2 sm:text-sm">{title}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500" aria-live="polite">{loading ? (language === 'ru' ? 'Загрузка услуг…' : language === 'en' ? 'Loading services…' : 'Зареждане на услугите…') : copy.showing(filteredEntries.length)}</p>
      </section>

      <section aria-label={copy.all}>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white">
                <div className="h-52 animate-pulse bg-[#E9EDDB]" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-4/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => {
            if (entry.kind === 'delivery') {
              return (
                <a key="service-delivery" href={localizedHref('/services/dostavka-poliv', language)} className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white shadow-sm transition hover:border-[#B9C79C] hover:shadow-md no-underline">
                  <div className="flex h-52 items-center justify-center overflow-hidden bg-[#E9EDDB]">
                    <img {...getSanityImageProps('https://cdn.sanity.io/images/bxvcy0qs/production/97ebd01d7dc8a7e709720377e58cee7662223b26-1536x1024.jpg', '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', 640, 65)} alt={language === 'ru' ? 'Доставка оборудования и консультация инженера' : language === 'en' ? 'Equipment delivery and engineer consultation' : 'Доставка на оборудване и консултация с инженер'} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="mb-2 text-xl font-bold text-slate-900">{language === 'ru' ? 'Доставка оборудования и консультация инженера' : language === 'en' ? 'Equipment delivery & engineer consultation' : 'Доставка на оборудване и консултация с инженер'}</h2>
                    <p className="flex-1 text-sm leading-6 text-slate-600">{language === 'ru' ? 'Бесплатная доставка в Солнечном Береге, понятные тарифы по региону, консультация на объекте и ремонт от 30 €.' : language === 'en' ? 'Free delivery in Sunny Beach, clear local delivery rates, an on-site consultation and repairs from €30.' : 'Безплатна доставка в Слънчев бряг, ясни цени за района, консултация на място и ремонт от 30 €.'}</p>
                    <span className="mt-4 font-semibold text-emerald-800">{language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Learn more →' : 'Научете повече →'}</span>
                  </div>
                </a>
              )
            }
            const service = entry.service
            return (
              <a key={service._id} href={localizedHref(`/services/${encodeURIComponent(service.slug?.current || service._id)}`, language)} className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white shadow-sm transition hover:border-[#B9C79C] hover:shadow-md no-underline">
                <div className="flex h-52 items-center justify-center overflow-hidden bg-[#E9EDDB]">
                  {service.imageUrl ? <img {...getSanityImageProps(service.imageUrl, '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', 640, 65)} alt={String(localize(service, 'name') || '')} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="p-4 text-center font-semibold text-slate-700">{localize(service, 'name')}</span>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="mb-2 text-xl font-bold text-slate-900">{localize(service, 'name')}</h2>
                  <p className="flex-1 text-sm leading-6 text-slate-600">{localize(service, 'shortDescription')}</p>
                  <span className="mt-4 font-semibold text-emerald-800">{language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Learn more →' : 'Научете повече →'}</span>
                </div>
              </a>
            )
          })}
        </div>
        )}
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
