import React, { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'

const copy = {
  bg: {
    eyebrow: 'FLORIAL • АВТОМАТИЧНО НАПОЯВАНЕ',
    title: 'Оборудване за поливане с доставка и помощ от инженер',
    intro: 'Изберете оборудване за вашата градина с увереност. Доставяме поръчките в района на Слънчев бряг и предлагаме безплатна консултация с инженер по поливни системи на място.',
    catalog: 'Разгледайте оборудването',
    consult: 'Заявете консултация',
    free: 'Безплатна доставка',
    freeSub: 'Слънчев бряг',
    engineer: 'Безплатна консултация',
    engineerSub: 'Инженер по поливни системи на обекта',
    repair: 'Ремонт от 30 €',
    repairSub: 'Цената се уточнява преди работа',
    deliveryTitle: 'Доставка в района',
    deliveryIntro: 'Ясни цени за доставка на поръчано оборудване. Уточняваме удобен ден и час предварително.',
    location: 'Населено място',
    price: 'Цена за доставка',
    distance: 'Разстояние от Слънчев бряг',
    sunny: 'Слънчев бряг',
    nessebar: 'Несебър',
    ravda: 'Равда',
    svetivlas: 'Свети Влас',
    kosharitsa: 'Кошарица',
    kableshkovo: 'Каблешково',
    pomorie: 'Поморие',
    freePrice: 'Безплатно',
    other: 'Други населени места',
    otherText: 'За адреси извън посочения списък попитайте за възможност и цена за доставка.',
    engineerTitle: 'Инженерът помага да изберете правилното решение',
    engineerText: 'Не сте сигурни кои разпръсквачи, дюзи, клапани или контролер са подходящи? При консултацията можем да обсъдим вашия участък, съществуващото оборудване и задачата, която искате да решите.',
    engineerBullets: ['Подбор на оборудване за нова или съществуваща система', 'Съвместимост на разпръсквачи, дюзи, клапани и контролери', 'Капково напояване за жив плет, цветни лехи и храсти', 'Причини за неравномерно поливане или неработеща зона', 'Възможности за ремонт, настройка и модернизация'],
    repairTitle: 'Ремонт и настройка на поливни системи',
    repairText: 'Ако системата не работи правилно, инженерът може да огледа проблема и да предложи подходящи действия. Трудът по ремонт започва от 30 €. Частите и допълнителните материали се заплащат отделно, когато са необходими. Точната цена се съгласува преди започване на работата.',
    stepsTitle: 'Как става',
    step1: 'Изберете оборудването или ни опишете задачата.',
    step2: 'Уточняваме адреса, доставката и удобно време за посещение.',
    step3: 'Инженерът прави консултация на място и обсъжда възможните решения.',
    step4: 'Ако е нужен ремонт, предварително съгласуваме обхвата и цената.',
    finalTitle: 'Нека намерим правилното решение за вашата градина',
    finalText: 'Изпратете ни кратко описание или снимки на участъка и съществуващата система. Ще обсъдим какво оборудване е необходимо и как можем да помогнем.',
    note: 'Безплатната консултация не ви задължава да поръчате монтаж или ремонт. Доставката е за поръчано оборудване; посещението се уговаря предварително.'
  },
  ru: {
    eyebrow: 'FLORIAL • АВТОМАТИЧЕСКИЙ ПОЛИВ',
    title: 'Оборудование для полива с доставкой и помощью инженера',
    intro: 'Подбирайте оборудование для сада с уверенностью. Доставляем заказы в районе Солнечного Берега и предлагаем бесплатную консультацию инженера по системам полива непосредственно на объекте.',
    catalog: 'Посмотреть оборудование',
    consult: 'Заказать консультацию',
    free: 'Бесплатная доставка',
    freeSub: 'Солнечный Берег',
    engineer: 'Бесплатная консультация',
    engineerSub: 'Инженер по системам полива на объекте',
    repair: 'Ремонт от 30 €',
    repairSub: 'Стоимость согласуется до начала работ',
    deliveryTitle: 'Доставка в регионе',
    deliveryIntro: 'Понятные тарифы на доставку заказанного оборудования. Заранее согласуем удобный день и время.',
    location: 'Населённый пункт',
    price: 'Стоимость доставки',
    distance: 'Расстояние от Солнечного Берега',
    sunny: 'Солнечный Берег',
    nessebar: 'Несебр',
    ravda: 'Равда',
    svetivlas: 'Святой Влас',
    kosharitsa: 'Кошарица',
    kableshkovo: 'Каблешково',
    pomorie: 'Поморие',
    freePrice: 'Бесплатно',
    other: 'Другие населённые пункты',
    otherText: 'Для адресов за пределами списка уточните возможность и стоимость доставки.',
    engineerTitle: 'Инженер поможет выбрать правильное решение',
    engineerText: 'Не уверены, какие дождеватели, форсунки, клапаны или контроллер подойдут? На консультации обсудим участок, существующее оборудование и задачу, которую нужно решить.',
    engineerBullets: ['Подбор оборудования для новой или существующей системы', 'Совместимость дождевателей, форсунок, клапанов и контроллеров', 'Капельный полив для живых изгородей, клумб и кустарников', 'Причины неравномерного полива или неработающей зоны', 'Возможности ремонта, настройки и модернизации'],
    repairTitle: 'Ремонт и настройка систем полива',
    repairText: 'Если система работает неправильно, инженер может осмотреть проблему и предложить варианты решения. Стоимость ремонтных работ начинается от 30 €. Запасные части и дополнительные материалы оплачиваются отдельно, если они необходимы. Точная стоимость согласуется до начала работ.',
    stepsTitle: 'Как это работает',
    step1: 'Выберите оборудование или расскажите нам о своей задаче.',
    step2: 'Согласуем адрес, доставку и удобное время визита.',
    step3: 'Инженер проведёт консультацию на месте и обсудит возможные решения.',
    step4: 'Если потребуется ремонт, заранее согласуем объём и стоимость.',
    finalTitle: 'Найдём подходящее решение для вашего сада',
    finalText: 'Пришлите краткое описание или фотографии участка и существующей системы. Обсудим, какое оборудование нужно и чем мы можем помочь.',
    note: 'Бесплатная консультация не обязывает заказывать монтаж или ремонт. Доставка относится к заказанному оборудованию; визит согласуется заранее.'
  },
  en: {
    eyebrow: 'FLORIAL • AUTOMATIC IRRIGATION',
    title: 'Irrigation equipment delivered, with help from an engineer',
    intro: 'Choose equipment for your garden with confidence. We deliver orders around Sunny Beach and offer a free on-site consultation with an irrigation engineer.',
    catalog: 'Browse irrigation equipment',
    consult: 'Request a consultation',
    free: 'Free delivery',
    freeSub: 'Sunny Beach',
    engineer: 'Free consultation',
    engineerSub: 'An irrigation engineer at your property',
    repair: 'Repairs from €30',
    repairSub: 'The price is agreed before work starts',
    deliveryTitle: 'Local delivery',
    deliveryIntro: 'Clear delivery rates for ordered equipment. We agree on a convenient day and time in advance.',
    location: 'Location',
    price: 'Delivery price',
    distance: 'Distance from Sunny Beach',
    sunny: 'Sunny Beach',
    nessebar: 'Nessebar',
    ravda: 'Ravda',
    svetivlas: 'Sveti Vlas',
    kosharitsa: 'Kosharitsa',
    kableshkovo: 'Kableshkovo',
    pomorie: 'Pomorie',
    freePrice: 'Free',
    other: 'Other locations',
    otherText: 'For addresses outside the list, ask us to confirm availability and delivery cost.',
    engineerTitle: 'An engineer helps you choose the right solution',
    engineerText: 'Not sure which sprinklers, nozzles, valves or controller you need? During the consultation, we can discuss your garden, existing equipment and the issue you want to solve.',
    engineerBullets: ['Equipment selection for a new or existing system', 'Compatibility of sprinklers, nozzles, valves and controllers', 'Drip irrigation for hedges, flower beds and shrubs', 'Possible causes of uneven watering or a zone that will not run', 'Repair, adjustment and upgrade options'],
    repairTitle: 'Irrigation system repairs and adjustments',
    repairText: 'If your system is not working correctly, an engineer can inspect the issue and suggest possible solutions. Repair labour starts from €30. Spare parts and additional materials are charged separately when required. The final price is agreed before work begins.',
    stepsTitle: 'How it works',
    step1: 'Choose equipment or tell us what you need help with.',
    step2: 'We confirm the address, delivery and a convenient visit time.',
    step3: 'The engineer consults on site and discusses suitable options.',
    step4: 'If repairs are needed, we agree on the scope and price in advance.',
    finalTitle: 'Let’s find the right solution for your garden',
    finalText: 'Send us a short description or photos of the area and existing system. We will discuss the equipment you need and how we can help.',
    note: 'The free consultation does not oblige you to order installation or repairs. Delivery applies to ordered equipment; site visits are arranged in advance.'
  }
} as const

const deliveryRows = [
  { key: 'sunny', names: { bg: 'Слънчев бряг', ru: 'Солнечный Берег', en: 'Sunny Beach' }, distance: '0', price: 0 },
  { key: 'nessebar', names: { bg: 'Несебър', ru: 'Несебр', en: 'Nessebar' }, distance: '4', price: 10 },
  { key: 'svetivlas', names: { bg: 'Свети Влас', ru: 'Святой Влас', en: 'Sveti Vlas' }, distance: '5', price: 10 },
  { key: 'tankovo', names: { bg: 'Тънково', ru: 'Тънково (Tankovo)', en: 'Tankovo' }, distance: '6', price: 10 },
  { key: 'ravda', names: { bg: 'Равда', ru: 'Равда', en: 'Ravda' }, distance: '7', price: 10 },
  { key: 'kosharitsa', names: { bg: 'Кошарица', ru: 'Кошарица', en: 'Kosharitsa' }, distance: '7', price: 10 },
  { key: 'aheloy', names: { bg: 'Ахелой', ru: 'Ахелой', en: 'Aheloy' }, distance: '9', price: 10 },
  { key: 'alexandrovo', names: { bg: 'Александрово', ru: 'Александрово', en: 'Alexandrovo' }, distance: '11', price: 10 },
  { key: 'orizare', names: { bg: 'Оризаре', ru: 'Оризаре', en: 'Orizare' }, distance: '12', price: 10 },
  { key: 'gyulyovtsa', names: { bg: 'Гюльовца', ru: 'Гюльовца', en: 'Gyulyovtsa' }, distance: '14', price: 10 },
  { key: 'medovo', names: { bg: 'Медово', ru: 'Медово', en: 'Medovo' }, distance: '14', price: 10 },
  { key: 'poroy', names: { bg: 'Порой', ru: 'Порой', en: 'Poroy' }, distance: '15', price: 10 },
  { key: 'kableshkovo', names: { bg: 'Каблешково', ru: 'Каблешково', en: 'Kableshkovo' }, distance: '15', price: 10 },
  { key: 'pomorie', names: { bg: 'Поморие', ru: 'Поморие', en: 'Pomorie' }, distance: '19', price: 15 },
  { key: 'kamenar', names: { bg: 'Каменар', ru: 'Каменар', en: 'Kamenar' }, distance: '20', price: 15 },
  { key: 'laka', names: { bg: 'Лъка', ru: 'Лъка', en: 'Laka' }, distance: '21', price: 15 },
  { key: 'banya', names: { bg: 'Баня', ru: 'Баня', en: 'Banya' }, distance: '21', price: 15 },
  { key: 'bata', names: { bg: 'Бата', ru: 'Бата', en: 'Bata' }, distance: '23', price: 15 },
  { key: 'galabets', names: { bg: 'Гълъбец', ru: 'Гълъбец', en: 'Galabets' }, distance: '23,5', price: 15 },
  { key: 'gaberovo', names: { bg: 'Габерово', ru: 'Габерово', en: 'Gaberovo' }, distance: '25', price: 15 },
  { key: 'dubnik', names: { bg: 'Дъбник', ru: 'Дъбник', en: 'Dubnik' }, distance: '24', price: 17 },
  { key: 'goritsa', names: { bg: 'Горица', ru: 'Горица', en: 'Goritsa' }, distance: '26,5', price: 20 },
  { key: 'belodol', names: { bg: 'Белодол', ru: 'Белодол', en: 'Belodol' }, distance: '27', price: 20 },
  { key: 'emona', names: { bg: 'Емона', ru: 'Емона', en: 'Emona' }, distance: '27,5', price: 20 },
  { key: 'stratsin', names: { bg: 'Страцин', ru: 'Страцин', en: 'Stratsin' }, distance: '29', price: 20 },
  { key: 'obzor', names: { bg: 'Обзор', ru: 'Обзор', en: 'Obzor' }, distance: '32,5', price: 20 },
  { key: 'priseltci', names: { bg: 'Приселци', ru: 'Приселци', en: 'Priseltsi' }, distance: '33,5', price: 25 },
  { key: 'kozichino', names: { bg: 'Козичино', ru: 'Козичино', en: 'Kozichino' }, distance: '37,5', price: 25 },
  { key: 'rakovskovo', names: { bg: 'Раковсково', ru: 'Раковсково', en: 'Rakovskovo' }, distance: '36,5', price: 25 },
  { key: 'panitsovo', names: { bg: 'Паницово', ru: 'Паницово', en: 'Panitsovo' }, distance: '39', price: 25 },
] as const

export function IrrigationSupportPage() {
  const { language } = useI18n()
  const text = copy[language] || copy.bg
  const phone = language === 'bg' ? '+359876777902' : '+359885834860'
  const phoneHref = language === 'bg' ? 'tel:+359876777902' : 'tel:+359885834860'
  const whatsapp = 'https://wa.me/380674807486'
  const catalogHref = localizedHref('/category/vsichko-za-polivane', language)
  const pageUrl = 'https://florial-bg.com/services/dostavka-poliv'

  useEffect(() => {
    applyPageSeo({
      fallbackTitle: language === 'ru'
        ? 'Доставка оборудования для полива и консультация инженера | Florial'
        : language === 'en'
          ? 'Irrigation Equipment Delivery & Engineer Consultation | Florial'
          : 'Доставка на оборудване за напояване и консултация с инженер | Florial',
      fallbackDescription: text.intro,
      language,
      alternates: { bg: pageUrl, ru: pageUrl + '?lang=ru', en: pageUrl + '?lang=en', 'x-default': pageUrl },
    })
  }, [language, text.intro])

  return (
    <main className="flex-grow bg-[#FAFBF7]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F0F3E8] via-white to-[#E6ECD8]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:py-20 lg:px-8">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-[#71824F]">{text.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">{text.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{text.intro}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={catalogHref} className="inline-flex items-center justify-center rounded-xl bg-[#647746] px-6 py-3.5 text-center font-bold text-white no-underline shadow-sm transition hover:bg-[#53643A]">{text.catalog} <span className="ml-2" aria-hidden="true">→</span></a>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-[#B8C59F] bg-white px-6 py-3.5 text-center font-bold text-[#53643A] no-underline transition hover:bg-[#F3F5ED]">{text.consult}</a>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{text.note}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-2xl border border-[#E1E6D7] bg-white/90 p-5 shadow-sm">
              <div className="text-2xl" aria-hidden="true">🚚</div><h2 className="mt-2 font-bold text-slate-900">{text.free}</h2><p className="mt-1 text-sm text-slate-600">{text.freeSub}</p>
            </div>
            <div className="rounded-2xl border border-[#E1E6D7] bg-white/90 p-5 shadow-sm">
              <div className="text-2xl" aria-hidden="true">🌿</div><h2 className="mt-2 font-bold text-slate-900">{text.engineer}</h2><p className="mt-1 text-sm text-slate-600">{text.engineerSub}</p>
            </div>
            <div className="rounded-2xl border border-[#E1E6D7] bg-white/90 p-5 shadow-sm">
              <div className="text-2xl" aria-hidden="true">🛠️</div><h2 className="mt-2 font-bold text-slate-900">{text.repair}</h2><p className="mt-1 text-sm text-slate-600">{text.repairSub}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-7 max-w-3xl"><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{text.deliveryTitle}</h2><p className="mt-3 leading-7 text-slate-600">{text.deliveryIntro}</p></div>
        <div className="overflow-x-auto rounded-2xl border border-[#E1E6D7] bg-white shadow-sm">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead className="bg-[#EEF2E5] text-sm text-slate-700"><tr><th className="px-5 py-4 font-bold">{text.location}</th><th className="px-5 py-4 text-right font-bold">{text.distance} (км)</th><th className="px-5 py-4 text-right font-bold">{text.price}</th></tr></thead>
            <tbody>{deliveryRows.map((row) => <tr key={row.key} className="border-t border-[#E8ECDF]"><td className="px-5 py-4 text-slate-800">{row.names[language] || row.names.bg}</td><td className="px-5 py-4 text-right text-slate-600">{row.distance}</td><td className="px-5 py-4 text-right font-extrabold text-[#53643A]">{row.price === 0 ? text.freePrice : row.price + ' €'}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">{text.other}: {text.otherText}</p>
      </section>

      <section className="border-y border-[#E5E9DC] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16 lg:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#71824F]">Florial</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{text.engineerTitle}</h2>
            <p className="mt-4 leading-7 text-slate-600">{text.engineerText}</p>
            <ul className="mt-5 space-y-3">{text.engineerBullets.map((item) => <li key={item} className="flex gap-3 rounded-xl bg-[#F6F8F1] p-4 text-slate-700"><span className="font-black text-[#71824F]" aria-hidden="true">✓</span><span>{item}</span></li>)}</ul>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-[#E1E6D7] bg-[#F6F8F1] shadow-sm">
            <img src="https://cdn.sanity.io/images/bxvcy0qs/production/97ebd01d7dc8a7e709720377e58cee7662223b26-1536x1024.jpg" alt={text.engineerTitle} loading="lazy" className="h-full min-h-[320px] w-full object-cover" />
            <figcaption className="p-4 font-semibold text-slate-800">{text.engineerTitle}</figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid items-center gap-8 rounded-3xl bg-[#EEF2E5] p-6 sm:p-9 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{text.repairTitle}</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-700">{text.repairText}</p>
            <a href={phoneHref} className="mt-6 inline-flex rounded-xl bg-[#647746] px-6 py-3.5 font-bold text-white no-underline transition hover:bg-[#53643A]">{phone}</a>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-[#DCE4CE] bg-white shadow-sm">
            <img src="https://cdn.sanity.io/images/bxvcy0qs/production/ea4b7f34582a5ca4802a33eb268188ca242890de-1539x1022.png" alt={text.repairTitle} loading="lazy" className="h-72 w-full object-cover" />
            <figcaption className="p-4 font-semibold text-slate-800">{text.repairTitle}</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-[#E5E9DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{text.stepsTitle}</h2>
          <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[text.step1, text.step2, text.step3, text.step4].map((item, index) => <li key={item} className="rounded-2xl border border-[#E1E6D7] p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8EDDC] font-extrabold text-[#53643A]">{index + 1}</span>{index === 2 && <img src="https://cdn.sanity.io/images/bxvcy0qs/production/ffa71c7029bfcff16498b12cdbbea5d12d0a2d13-1779x884.png" alt={text.step3} loading="lazy" className="mt-4 h-36 w-full rounded-xl object-cover" />}{index === 3 && <img src="https://cdn.sanity.io/images/bxvcy0qs/production/27e5e04d0d36c3c4df0d734a157581ee9e9b66e7-1503x1047.png" alt={text.step4} loading="lazy" className="mt-4 h-36 w-full rounded-xl object-cover" />}<p className="mt-4 leading-6 text-slate-700">{item}</p></li>)}</ol>
        </div>
      </section>

      <section className="bg-[#647746]">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 md:py-16 lg:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{text.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-white/90">{text.finalText}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={catalogHref} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 font-bold text-[#53643A] no-underline transition hover:bg-[#F0F3E8]">{text.catalog}</a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3.5 font-bold text-white no-underline transition hover:bg-white/10">{text.consult}</a>
          </div>
        </div>
      </section>
    </main>
  )
}
