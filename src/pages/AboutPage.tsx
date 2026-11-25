import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { ABOUT_PAGE_CONTENT, ABOUT_PAGE_CENTRES, ABOUT_PAGE_TEAM } from '../content/aboutPageContent'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { getSanityImageProps } from '../lib/sanityImage'
import { sanityClient } from '../lib/sanity'
import type { CategoryItem, ServiceItem, ServiceRolePhoto } from '../types'



interface AboutPageProps {
  services: ServiceItem[]
  categories: CategoryItem[]
}

export function AboutPage({ categories }: AboutPageProps) {
  const { language } = useI18n()
  const copy = ABOUT_PAGE_CONTENT[language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg']

  const [rolePhotos, setRolePhotos] = useState<ServiceRolePhoto[]>([])
  const [centerImages, setCenterImages] = useState<Record<string, string>>({ nesebr: '', ravda: '' })
  const [ibanCopied, setIbanCopied] = useState(false)

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText('BG88STSA93000029605234')
      setIbanCopied(true)
    } catch (error) {
      console.error('Не удалось скопировать IBAN:', error)
      setIbanCopied(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const query = '*[_type == "photo" && isActive != false && (coalesce(slug.current, slug) in ["landshaften-arhitekt", "inzhener-polivni-sistemi", "gardinar", "specialist-trevni-ploshti", "florial-nesebr", "florial-ravda"] || lower(slug) in ["florial-nesebr", "florial-ravda"] || lower(slug.current) in ["florial-nesebr", "florial-ravda"])] { "slug": coalesce(slug.current, slug), title, titleEn, titleRu, "imageUrl": image.asset->url, "imageAlt": image.alt, "imageAltEn": image.altEn, "imageAltRu": image.altRu }'
    sanityClient.fetch(query).then((photos: ServiceRolePhoto[]) => {
      if (cancelled) return
      const items = Array.isArray(photos) ? photos : []
      setRolePhotos(items)
      setCenterImages({
        nesebr: items.find((item) => item.slug?.toLowerCase() === 'florial-nesebr')?.imageUrl || '',
        ravda: items.find((item) => item.slug?.toLowerCase() === 'florial-ravda')?.imageUrl || '',
      })
    }).catch((error) => console.error('Sanity: не удалось загрузить фотографии команды и садовых центров:', error))
    return () => { cancelled = true }
  }, [])

  const locations = language === 'ru'
    ? 'Несебр, Равда, Солнечный Берег и Святой Влас'
    : language === 'en'
      ? 'Nessebar, Ravda, Sunny Beach and Sveti Vlas'
      : 'Несебър, Равда, Слънчев бряг и Свети Влас'

  const renderCatalogImage = (slug: string, title: string) => {
    const category = categories.find((item) => item.slug?.current === slug)
    if (!category?.imageUrl) return null
    const imageTitle = `${title} — ${locations} | Florial`

    return (
      <a
        href={localizedHref(`/category/${encodeURIComponent(slug)}`, language)}
        aria-label={title}
        className="mt-5 block overflow-hidden rounded-2xl no-underline shadow-sm transition hover:shadow-md"
      >
        <img
          {...getSanityImageProps(category.imageUrl, '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw')}
          alt={imageTitle}
          title={imageTitle}
          loading="lazy"
          className="h-52 w-full object-cover sm:h-64"
        />
      </a>
    )
  }

  useEffect(() => {
    const base = 'https://florial-bg.com/about'
    applyPageSeo({
      fallbackTitle: copy.seoTitle,
      fallbackDescription: copy.seoDescription,
      language,
      alternates: { bg: base, ru: base + '?lang=ru', en: base + '?lang=en', 'x-default': base },
    })
  }, [language, copy.seoTitle, copy.seoDescription])

  const sectionClass = 'rounded-3xl border border-[#E2E7D9] bg-white p-6 shadow-sm md:p-9'

  return (
    <main className="flex-grow bg-[#F8F9F3]">
      <section className="relative overflow-hidden bg-[#E9EDDB] px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#647746]">{copy.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#263323] sm:text-4xl md:text-6xl">{copy.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-xl font-semibold leading-relaxed text-[#53643A] md:text-2xl">{copy.subtitle}</p>
          <p className="mx-auto mt-6 max-w-4xl text-base leading-8 text-slate-700 md:text-lg">{copy.intro}</p>
        </div>
      </section>


      <section className="mx-auto max-w-7xl space-y-7 px-4 py-10 md:space-y-9 md:py-16">
        <section aria-labelledby="about-offerings-heading">
          <h2 id="about-offerings-heading" className="mb-6 text-center text-2xl font-extrabold text-[#263323] md:text-3xl">
            {language === 'ru' ? 'Что мы предлагаем' : language === 'en' ? 'What we offer' : 'Какво предлагаме'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <article className={sectionClass}>
              <h3 className="text-lg font-extrabold text-[#263323] md:text-2xl"><a href={localizedHref('/category/rastenia', language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.plantSalesTitle}</a></h3>
              {renderCatalogImage('rastenia', copy.plantSalesTitle)}
              <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">
                {language === 'ru' ? 'Декоративные деревья, кустарники, цветы и растения для сада и террасы.' : language === 'en' ? 'Ornamental trees, shrubs, flowers and plants for gardens and terraces.' : 'Декоративни дървета, храсти, цветя и растения за градината и терасата.'}
              </p>
            </article>
            <article className={sectionClass}>
              <h3 className="text-lg font-extrabold text-[#263323] md:text-2xl"><a href={localizedHref('/category/vsichko-za-polivane', language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.irrigationEquipmentTitle}</a></h3>
              {renderCatalogImage('vsichko-za-polivane', copy.irrigationEquipmentTitle)}
              <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">
                {language === 'ru' ? 'Профессиональное оборудование и комплектующие для автоматического полива.' : language === 'en' ? 'Professional equipment and components for automatic irrigation systems.' : 'Професионално оборудване и компоненти за системи за автоматично напояване.'}
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="about-team-heading" className={sectionClass}>
          <h2 id="about-team-heading" className="mb-6 text-center text-2xl font-extrabold text-[#263323] md:text-3xl">
            {language === 'ru' ? 'Наша команда' : language === 'en' ? 'Our team' : 'Нашият екип'}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {ABOUT_PAGE_TEAM.map((member) => {
              const photo = rolePhotos.find((item) => item.slug === member.slug)
              const title = member.title[language]
              const alt = language === 'ru' ? photo?.imageAltRu : language === 'en' ? photo?.imageAltEn : photo?.imageAlt
              return (
                <a key={member.slug} href={localizedHref(member.href, language)} className="group min-w-0 overflow-hidden rounded-2xl border border-[#E2E7D9] bg-[#F8F9F3] text-center no-underline transition hover:-translate-y-1 hover:shadow-md">
                  <div className="aspect-[4/5] overflow-hidden bg-[#E9EDDB]">
                    {photo?.imageUrl ? <img {...getSanityImageProps(photo.imageUrl, '(min-width: 768px) 25vw, 50vw', 480, 70)} alt={alt || title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center p-3 text-xs text-slate-500">{language === 'ru' ? 'Фото скоро появится' : language === 'en' ? 'Photo coming soon' : 'Снимката скоро ще бъде добавена'}</div>}
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="text-sm font-extrabold leading-5 text-[#263323] md:text-base">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600 md:text-sm">{member.text[language]}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="about-centres-heading" className={sectionClass}>
          <h2 id="about-centres-heading" className="mb-6 text-center text-2xl font-extrabold text-[#263323] md:text-3xl">
            {language === 'ru' ? 'Посетите садовый центр Florial' : language === 'en' ? 'Visit Florial Garden Centre' : 'Посетете градински център Florial'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ABOUT_PAGE_CENTRES.map((centre) => (
              <article key={centre.key} className="overflow-hidden rounded-2xl border border-[#E2E7D9] bg-[#F8F9F3]">
                <div className="aspect-[16/9] overflow-hidden bg-[#E9EDDB]">
                  {centerImages[centre.key] ? <img {...getSanityImageProps(centerImages[centre.key], '(min-width: 768px) 50vw, 100vw', 900, 75)} alt={centre.name[language]} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">{language === 'ru' ? 'Фото садового центра' : language === 'en' ? 'Garden centre photo' : 'Снимка на градинския център'}</div>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-extrabold text-[#263323]">{centre.name[language]}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{centre.address[language]}</p>
                  <a href={centre.map} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center rounded-xl bg-[#647746] px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-[#53643A]">
                    {language === 'ru' ? 'Открыть на карте' : language === 'en' ? 'View on Google Maps' : 'Вижте в Google Карти'}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="about-company-details-heading" className={sectionClass}>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#647746]">FLORIAL OOD</p>
              <h2 id="about-company-details-heading" className="mt-2 text-2xl font-extrabold text-[#263323] md:text-3xl">
                {language === 'ru' ? 'Юридические и банковские реквизиты' : language === 'en' ? 'Company and bank details' : 'Фирмени данни и банкови реквизити'}
              </h2>
            </div>
            <p className="text-sm text-slate-500">„Флориал“ ООД · FLORIAL OOD / FLORIAL LTD</p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F5F7EF] p-5">
              <h3 className="text-base font-extrabold text-[#263323]">
                {language === 'ru' ? 'Регистрационные данные' : language === 'en' ? 'Company registration' : 'Регистрационни данни'}
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-slate-500">{language === 'ru' ? 'Наименование' : language === 'en' ? 'Legal name' : 'Наименование'}</dt><dd className="mt-0.5 font-semibold text-[#263323]">„Флориал“ ООД (FLORIAL OOD / FLORIAL LTD)</dd></div>
                <div><dt className="text-slate-500">ЕИК / UIC</dt><dd className="mt-0.5 font-semibold text-[#263323]">206978288</dd></div>
                <div><dt className="text-slate-500">ДДС № / VAT №</dt><dd className="mt-0.5 font-semibold text-[#263323]">BG206978288</dd></div>
                <div><dt className="text-slate-500">{language === 'ru' ? 'Управитель (МОЛ)' : language === 'en' ? 'Company manager' : 'Управител (МОЛ)'}</dt><dd className="mt-0.5 font-semibold text-[#263323]">Десислав Бараков</dd></div>
                <div><dt className="text-slate-500">{language === 'ru' ? 'Юридический адрес' : language === 'en' ? 'Registered address' : 'Адрес на регистрация'}</dt><dd className="mt-0.5 font-semibold leading-6 text-[#263323]">{language === 'ru' ? 'г. Несебр, ул. «Черно море», №28, Болгария' : language === 'en' ? '28 Cherno More St, Nessebar, Bulgaria' : 'гр. Несебър, ул. „Черно море“ №28, България'}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl bg-[#F5F7EF] p-5">
              <h3 className="text-base font-extrabold text-[#263323]">
                {language === 'ru' ? 'Банковские реквизиты' : language === 'en' ? 'Bank details' : 'Банкови реквизити'}
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-slate-500">{language === 'ru' ? 'Банк' : language === 'en' ? 'Bank' : 'Банка'}</dt><dd className="mt-0.5 font-semibold text-[#263323]">Банка ДСК (DSK Bank)</dd></div>
                <div>
                  <dt className="text-slate-500">IBAN</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="break-all font-semibold tracking-wide text-[#263323]">BG88STSA93000029605234</span>
                    <button type="button" onClick={copyIban} className="inline-flex items-center rounded-lg border border-[#C9D3B8] bg-white px-3 py-1.5 text-xs font-bold text-[#34452D] transition hover:bg-[#E9EDDB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#647746]">
                      {ibanCopied
                        ? (language === 'ru' ? 'Скопировано' : language === 'en' ? 'Copied' : 'Копирано')
                        : (language === 'ru' ? 'Копировать IBAN' : language === 'en' ? 'Copy IBAN' : 'Копирай IBAN')}
                    </button>
                  </dd>
                </div>
                <div><dt className="text-slate-500">BIC / SWIFT</dt><dd className="mt-0.5 font-semibold text-[#263323]">STSABGSF</dd></div>
              </dl>
            </div>
          </div>

          <div className="mt-5 border-t border-[#E2E7D9] pt-5">
            <h3 className="text-base font-extrabold text-[#263323]">
              {language === 'ru' ? 'Контакты и торговый объект' : language === 'en' ? 'Contact and garden centre' : 'Контакти и търговски обект'}
            </h3>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">{language === 'ru' ? 'Телефон' : language === 'en' ? 'Phone' : 'Телефон'}</p>
                <a href="tel:+359876777902" className="mt-0.5 inline-block font-semibold text-[#34452D] underline underline-offset-4">+359 876 777 902</a>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <a href="mailto:barakov1971@abv.bg" className="mt-0.5 inline-block break-all font-semibold text-[#34452D] underline underline-offset-4">barakov1971@abv.bg</a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">{language === 'ru' ? 'Садовый центр' : language === 'en' ? 'Garden centre' : 'Градински център'}</p>
                <p className="mt-0.5 font-semibold leading-6 text-[#263323]">{language === 'ru' ? '«Флориал», ул. «Хан Крум», 8230 Несебр, Болгария (рядом с магазином Janet)' : language === 'en' ? 'Florial, Khan Krum St, 8230 Nessebar, Bulgaria (next to Janet store)' : '„Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet)'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-extrabold text-[#263323] md:text-3xl">{copy.approachTitle}</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">{copy.steps.map((step, index) => <li key={step} className="flex gap-4 rounded-2xl bg-[#F5F7EF] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#647746] text-sm font-bold text-white">{index + 1}</span><span className="pt-1 text-sm leading-6 text-slate-700">{step}</span></li>)}</ol>
        </section>

        <section className="rounded-3xl bg-[#263323] px-6 py-9 text-white md:px-10 md:py-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">{copy.areasTitle}</h2><p className="mt-4 max-w-4xl leading-8 text-white/80">{copy.areas}</p>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-sm leading-6 text-white/75">{copy.ctaText}</p><a href={localizedHref('/contacts', language)} className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#A9B88A] px-6 py-3.5 font-bold text-[#263323] transition hover:bg-[#C0CCA9] no-underline">{copy.cta} <span aria-hidden="true">→</span></a></div>
        </section>
      </section>
    </main>
  )
}
