import React, { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'

export function AboutPage() {
  const { language } = useI18n()
  const copy = language === 'ru'
    ? {
        title: 'Садовый центр Florial — Несебр, Болгария',
        subtitle: 'Создаём красивые и гармоничные пространства',
        intro: 'Florial — садовый центр и команда специалистов по ландшафтному дизайну, озеленению и автоматическому поливу. Мы помогаем частным владельцам, отелям и коммерческим объектам создавать ухоженные, гармоничные и удобные в обслуживании зелёные пространства.',
        designTitle: 'Ландшафтный дизайн и проектирование',
        design: 'Профессиональному благоустройству участка предшествует тщательное проектирование. Мы помогаем определить стиль сада, разрабатываем проектные и инженерные решения, подбираем материалы и технологии с учётом особенностей участка, климата и окружающей среды. Проект до начала работ помогает согласовать результат, сократить лишние расходы и сделать реализацию последовательной.',
        plantingTitle: 'Посадка растений и озеленение',
        planting: 'Подбираем растения для частных садов, вилл, гостиниц и общественных пространств. Выполняем посадку деревьев, кустарников и цветов, создаём живые изгороди, растительные группы и другие композиции. Учитываем сезон, состояние почвы, освещённость и технологию посадки, чтобы растения хорошо приживались и развивались.',
        irrigationTitle: 'Системы автоматического полива',
        irrigation: 'С 2000 года выполняем проектирование, монтаж, обслуживание и ремонт систем автоматического полива, реконструкцию существующих систем, весенний запуск после зимы, а также монтаж капельного и микрокапельного полива. Мы также предлагаем оборудование и комплектующие для самостоятельного монтажа. В районе Несебра возможен бесплатный выезд для замеров и подготовки сметы.',
        turfTitle: 'Рулонный газон',
        turf: 'Рулонный газон позволяет быстро получить ровную зелёную поверхность и завершённый вид сада. Мы предлагаем продажу, укладку и уход за газоном, подготавливая основание и соблюдая технологию укоренения.',
        workTitle: 'Как мы работаем',
        steps: ['Обсуждаем ваши задачи и особенности участка', 'Разрабатываем проект и выбираем подходящие растения, материалы и оборудование', 'Выполняем озеленение, посадку и монтаж согласованных систем', 'При необходимости обеспечиваем последующий уход и обслуживание'],
        areasTitle: 'Работаем на Черноморском побережье Болгарии',
        areas: 'Несебр, Равда, Каблешково, Солнечный Берег, Святой Влас, Поморие, Ахелой, Елените и близлежащие районы. По вопросам оборудования для полива и проектных работ обращайтесь к нам — обсудим задачу и предложим подходящее решение.',
        cta: 'Обсудить ваш проект',
        ctaText: 'Расскажите нам о вашем саде, участке или системе полива — поможем определить следующий шаг.',
        seoTitle: 'О компании Florial | Ландшафтный дизайн и автополив в Болгарии',
        seoDescription: 'Садовый центр Florial в Несебре: ландшафтное проектирование, озеленение, посадка растений, рулонный газон и автоматический полив с 2000 года.'
      }
    : language === 'en'
      ? {
          title: 'Florial Garden Centre — Nessebar, Bulgaria',
          subtitle: 'Creating beautiful, balanced outdoor spaces',
          intro: 'Florial is a garden centre and a team of specialists in landscape design, planting and automatic irrigation. We help homeowners, hotels and commercial properties create attractive, harmonious green spaces that are practical to maintain.',
          designTitle: 'Landscape design and planning',
          design: 'Every well-planned garden begins with careful design. We help define the garden style, prepare landscape and engineering solutions, and select materials and methods suited to the site, climate and surroundings. Planning before work begins helps coordinate the result, reduce avoidable costs and guide implementation step by step.',
          plantingTitle: 'Planting and landscaping',
          planting: 'We select plants for private gardens, villas, hotels and public spaces. Our work includes planting trees, shrubs and flowers, creating hedges and planting compositions. We consider the season, soil, sunlight and correct planting techniques to help plants establish and thrive.',
          irrigationTitle: 'Automatic irrigation systems',
          irrigation: 'Since 2000, we have designed, installed, maintained and repaired automatic irrigation systems, modernised existing installations, carried out spring start-ups after winter, and installed drip and micro-irrigation. We also supply equipment and components for self-installation. Free site visits for measurements and estimates are available in the Nessebar area.',
          turfTitle: 'Rolled turf',
          turf: 'Rolled turf creates an even green lawn and a finished garden appearance quickly. We offer turf sales, installation and care, preparing the base and following the right methods to help the turf root successfully.',
          workTitle: 'How we work',
          steps: ['Discuss your goals and the characteristics of your site', 'Plan the design and choose suitable plants, materials and equipment', 'Carry out the agreed planting, landscaping and irrigation installation', 'Provide ongoing care and maintenance when needed'],
          areasTitle: 'Serving Bulgaria’s Black Sea coast',
          areas: 'Nessebar, Ravda, Kableshkovo, Sunny Beach, Sveti Vlas, Pomorie, Aheloy, Elenite and nearby areas. Contact us about irrigation equipment or a landscaping project, and we will help you find a suitable solution.',
          cta: 'Discuss your project',
          ctaText: 'Tell us about your garden, property or irrigation system and we will help you plan the next step.',
          seoTitle: 'About Florial | Landscape Design and Irrigation in Bulgaria',
          seoDescription: 'Florial Garden Centre in Nessebar offers landscape planning, planting, landscaping, rolled turf and automatic irrigation services since 2000.'
        }
      : {
          title: 'Градински център Florial — Несебър, България',
          subtitle: 'Създаваме красиви и хармонични пространства',
          intro: 'Florial е градински център и екип от специалисти по ландшафтен дизайн, озеленяване и автоматично напояване. Помагаме на частни клиенти, хотели и търговски обекти да създават красиви, хармонични и лесни за поддръжка зелени пространства.',
          designTitle: 'Ландшафтен дизайн и проектиране',
          design: 'Преди професионалното благоустрояване на един терен стои внимателното проектиране. Помагаме да се определи стилът на градината, разработваме проектни и инженерни решения и подбираме материали и технологии според особеностите на терена, климата и околната среда. Проектът преди началото на работите помага да се планира изпълнението и да се избегнат ненужни разходи.',
          plantingTitle: 'Засаждане на растения и озеленяване',
          planting: 'Подбираме растения за частни градини, вили, хотели и обществени пространства. Извършваме засаждане на дървета, храсти и цветя, оформяме живи плетове и растителни композиции. Съобразяваме се със сезона, почвата, осветеността и правилната технология на засаждане, за да се развиват растенията добре.',
          irrigationTitle: 'Системи за автоматично напояване',
          irrigation: 'От 2000 г. проектираме, изграждаме, поддържаме и ремонтираме системи за автоматично напояване, реконструираме съществуващи инсталации, извършваме пролетно пускане след зимата и изграждаме системи за капково и микрокапково напояване. Предлагаме и оборудване и компоненти за самостоятелен монтаж. В района на Несебър осигуряваме безплатно посещение за оглед, измерване и изготвяне на оферта.',
          turfTitle: 'Рулонен тревен чим',
          turf: 'Рулонният тревен чим осигурява бързо красив, равен и завършен вид на градината. Предлагаме продажба, полагане и грижа за тревния чим, като подготвяме основата и спазваме технологията за успешно вкореняване.',
          workTitle: 'Как работим',
          steps: ['Обсъждаме вашите цели и особеностите на терена', 'Подготвяме проект и подбираме подходящи растения, материали и оборудване', 'Изпълняваме договорените дейности по озеленяване, засаждане и напояване', 'При необходимост осигуряваме последваща грижа и поддръжка'],
          areasTitle: 'Работим по Българското Черноморие',
          areas: 'Несебър, Равда, Каблешково, Слънчев бряг, Свети Влас, Поморие, Ахелой, Елените и близките райони. Свържете се с нас за оборудване за напояване или ландшафтен проект — ще обсъдим задачата и ще предложим подходящо решение.',
          cta: 'Обсъдете проекта си',
          ctaText: 'Разкажете ни за вашата градина, терен или система за напояване — ще ви помогнем да планирате следващата стъпка.',
          seoTitle: 'За Florial | Ландшафтен дизайн и автоматично напояване в България',
          seoDescription: 'Градински център Florial в Несебър: ландшафтно проектиране, озеленяване, засаждане, рулонен тревен чим и автоматично напояване от 2000 г.'
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

  const sections = [
    { title: copy.designTitle, text: copy.design, number: '01' },
    { title: copy.plantingTitle, text: copy.planting, number: '02' },
    { title: copy.irrigationTitle, text: copy.irrigation, number: '03' },
    { title: copy.turfTitle, text: copy.turf, number: '04' },
  ]

  return (
    <main className="flex-grow bg-[#F8F9F3]">
      <section className="relative overflow-hidden bg-[#E9EDDB] px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#647746]">FLORIAL · NESSEBAR</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#263323] sm:text-4xl md:text-6xl">{copy.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-xl font-semibold leading-relaxed text-[#53643A] md:text-2xl">{copy.subtitle}</p>
          <p className="mx-auto mt-6 max-w-4xl text-base leading-8 text-slate-700 md:text-lg">{copy.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.number} className="rounded-2xl border border-[#E1E6D7] bg-white p-6 shadow-sm md:p-8">
              <p className="text-sm font-extrabold tracking-widest text-[#879663]">{section.number}</p>
              <h2 className="mt-3 text-xl font-bold text-[#263323] md:text-2xl">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">{section.text}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E1E6D7] md:p-9">
          <h2 className="text-2xl font-extrabold text-[#263323] md:text-3xl">{copy.workTitle}</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {copy.steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-xl bg-[#F5F7EF] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#647746] text-sm font-bold text-white">{index + 1}</span>
                <span className="pt-1 text-sm leading-6 text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 rounded-2xl bg-[#263323] px-6 py-9 text-white md:px-10 md:py-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">{copy.areasTitle}</h2>
          <p className="mt-4 max-w-4xl leading-7 text-white/80">{copy.areas}</p>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-white/75">{copy.ctaText}</p>
            <a href={localizedHref('/contacts', language)} className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#A9B88A] px-6 py-3.5 font-bold text-[#263323] transition hover:bg-[#C0CCA9] no-underline">{copy.cta} <span aria-hidden="true">→</span></a>
          </div>
        </section>
      </section>
    </main>
  )
}
