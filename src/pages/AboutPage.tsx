import React, { useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import type { CategoryItem, ServiceItem } from '../types'

const content = {
  bg: {
    eyebrow: 'FLORIAL · НЕСЕБЪР, БЪЛГАРИЯ',
    title: 'Градински център Florial в Несебър',
    subtitle: 'Създаваме красиви и хармонични пространства',
    intro: 'Специализираме в ландшафтния дизайн, проектирането, озеленяването и благоустрояването на терени. Нашият екип съчетава практически опит в градинарството, ландшафтния дизайн и автоматичното напояване, за да превръща идеите на клиентите в добре обмислени пространства, съобразени с особеностите на всеки имот.',
    designTitle: 'Ландшафтен дизайн и проектиране',
    designLead: 'Красивата градина започва с внимателно изготвен проект.',
    design: 'Всяко професионално благоустрояване започва с прецизно планиране. Помагаме да се определи стилът на бъдещата градина, разработваме подробни проектни и инженерни решения и подбираме материали и технологии според релефа, почвата, климата и околната среда. Проектът преди началото на работата помага да се планира изпълнението, да се използва разумно бюджетът и да се избегнат излишни разходи.',
    designItems: ['Определяне на стила на градината', 'Подготовка на детайлни проектни решения', 'Планиране на инженерните системи', 'Избор на материали и технологии', 'Комплексно благоустрояване на градината'],
    plantingTitle: 'Озеленяване и засаждане на растения',
    planting: 'Подбираме растения за частни домове, вили, хотели и търговски обекти. Засаждаме дървета, храсти и цветя, оформяме живи плетове, групи от дървета и храсти, единични и вертикални насаждения, алпинеуми и други композиции. При избора се съобразяваме със сезона, почвата, осветеността и особеностите на терена. Съвременните технологии за засаждане на контейнерни растения и растения с почвена бала позволяват работата да се планира в по-широк сезонен период.',
    plantingNote: 'Правилната подготовка на почвата, спазването на технологията и професионалният контрол помагат на растенията да се прихванат и да се развиват хармонично. Имаме какво да предложим за озеленяването на вашата градина.',
    irrigationTitle: 'Системи за автоматично напояване',
    irrigationLead: 'Проектираме, изграждаме и поддържаме поливни системи от 2000 г.',
    irrigation: 'Извършваме проектиране, монтаж, поддръжка и ремонт на системи за автоматично напояване, реконструкция на съществуващи инсталации и пролетно пускане след зимата. Изграждаме системи за капково, микрокапково и точково напояване, включително за земеделски нужди. Предлагаме и оборудване и компоненти за самостоятелен монтаж.',
    irrigationItems: ['Проектиране и изчисляване на системата', 'Монтаж на автоматично напояване', 'Капково и микрокапково напояване', 'Ремонт и реконструкция на съществуващи системи', 'Пролетно пускане и сезонна поддръжка', 'Продажба на оборудване и компоненти'],
    turfTitle: 'Рулонен тревен чим',
    turf: 'Тревната площ е важна част от озеленяването — допълва архитектурата, разширява визуално пространството и обединява градината в цялостна композиция. Рулонният тревен чим осигурява бързо равна зелена повърхност и завършен вид. Предлагаме продажба, подготовка на основата, полагане и последваща грижа при спазване на технологията за успешно вкореняване.',
    turfBenefits: ['Бързо благоустрояване на терена', 'Равен и естетичен вид', 'Продажба, полагане и поддръжка'],
    plantSalesTitle: 'Продажба на растения',
    plantSalesIntro: 'Мечтаете за красив зелен кът около дома си? Градински център Florial предлага богат избор от качествени растения за вашата градина, тераса или ландшафтен проект в Несебър и Равда.',
    plantSalesItems: ['Палми, юки и маслини', 'Декоративни храсти и цветя, адаптирани към местния климат', 'Иглолистни растения и красиви многогодишни цветя', 'Фиданки за средиземноморски градини и живи плетове'],
    plantSalesOutro: 'Посетете нашите градински центрове в Несебър и Равда — ще ви помогнем да изберете подходящите растения и ще споделим професионални съвети за грижата за тях.',
    irrigationEquipmentTitle: 'Професионално оборудване за автоматично напояване',
    irrigationEquipmentIntro: 'Искате градината ви винаги да бъде зелена и добре поддържана без излишни усилия? Градински център Florial в Несебър и Равда предлага надеждно и модерно оборудване за напояване на дворове, тревни площи и тераси.',
    irrigationEquipmentItems: ['Надеждни разпръсквачи, контролери и сензори за дъжд', 'Капкови тръби, фитинги и компоненти за прецизно напояване', 'Маркучи, макари и аксесоари за ръчна грижа за градината'],
    irrigationEquipmentOutro: 'Посетете нашите градински центрове в Несебър и Равда — специалистите ни ще ви помогнат да изберете подходящото оборудване и да комплектовате системата си за напояване.',
    approachTitle: 'От идеята до грижата за градината',
    steps: ['Обсъждаме вашите желания и особеностите на терена', 'Изготвяме проект и подбираме подходящи растения, материали и оборудване', 'Изпълняваме договорените дейности по озеленяване и монтаж', 'При необходимост осигуряваме последваща грижа и поддръжка'],
    areasTitle: 'Работим по Българското Черноморие',
    areas: 'Извършваме дейности в Несебър, Равда, Каблешково, Слънчев бряг, Свети Влас, Поморие, Ахелой, Елените и близките райони. За проекти за автоматично напояване в района на Несебър предлагаме безплатно посещение за оглед, измерване и изготвяне на оферта.',
    cta: 'Обсъдете проекта си',
    ctaText: 'Разкажете ни за вашата градина, терен или поливна система — ще ви помогнем да намерите подходящото решение.',
    seoTitle: 'За нас | Градински център Florial — ландшафтен дизайн и напояване',
    seoDescription: 'Градински център Florial в Несебър: ландшафтно проектиране, озеленяване, засаждане, рулонен тревен чим и проектиране, монтаж и поддръжка на автоматично напояване от 2000 г.'
  },
  ru: {
    eyebrow: 'FLORIAL · НЕСЕБР, БОЛГАРИЯ',
    title: 'Садовый центр Florial в Несебре',
    subtitle: 'Создаём красивые и гармоничные пространства',
    intro: 'Мы специализируемся на ландшафтном дизайне, проектировании, озеленении и благоустройстве территорий. Наша команда объединяет практический опыт в садоводстве, ландшафтном дизайне и системах автоматического полива, чтобы воплощать идеи клиентов с учётом особенностей каждого участка.',
    designTitle: 'Ландшафтный дизайн и проектирование',
    designLead: 'Продуманное пространство начинается с хорошего проекта.',
    design: 'Любому профессиональному благоустройству предшествует кропотливая работа по проектированию. Мы помогаем определить стиль будущего сада, прорабатываем проектные и инженерные решения, подбираем материалы и технологии с учётом рельефа, почвы, климата и окружающей среды. Проект до начала работ помогает согласовать результат, рационально распределить бюджет и избежать лишних затрат при реализации.',
    designItems: ['Определение стиля сада', 'Подготовка детальных проектных решений', 'Планирование инженерных систем', 'Выбор материалов и технологий', 'Комплексное благоустройство сада'],
    plantingTitle: 'Озеленение и посадка растений',
    planting: 'Мы подбираем растения для частных домов, вилл, гостиниц и коммерческих объектов. Выполняем посадку деревьев, кустарников и цветов, создаём живые изгороди, древесно-кустарниковые группы, одиночные и вертикальные посадки, альпийские горки и другие композиции. При выборе растений учитываем сезон, почву, освещённость и особенности участка. Современные технологии посадки контейнерных растений и растений с земляным комом позволяют планировать работы в более широком сезонном диапазоне.',
    plantingNote: 'Правильная подготовка почвы, соблюдение технологии посадки и контроль специалиста помогают растениям прижиться и гармонично развиваться. Нам есть что предложить для озеленения вашего сада.',
    irrigationTitle: 'Системы автоматического полива',
    irrigationLead: 'Проектируем, устанавливаем и обслуживаем системы полива с 2000 года.',
    irrigation: 'Выполняем проектирование систем автоматического полива, монтаж, обслуживание и ремонт, реконструкцию существующих установок и весенний запуск после зимы. Устанавливаем системы капельного, микрокапельного и точечного полива, в том числе для сельскохозяйственных задач. Также продаём оборудование и комплектующие для самостоятельного монтажа.',
    irrigationItems: ['Проектирование и расчёт системы', 'Монтаж автоматического полива', 'Капельный и микрокапельный полив', 'Ремонт и реконструкция существующих систем', 'Весенний запуск и сезонное обслуживание', 'Продажа оборудования и комплектующих'],
    turfTitle: 'Рулонный газон',
    turf: 'Газон — важная часть озеленения: он расширяет пространство, дополняет архитектуру участка и объединяет сад в единую композицию. Рулонный газон позволяет быстро получить ровную зелёную поверхность и ухоженный внешний вид. Мы предлагаем продажу рулонного газона, подготовку основания, укладку и дальнейший уход с соблюдением технологии укоренения.',
    turfBenefits: ['Быстрое благоустройство участка', 'Ровный и эстетичный вид', 'Продажа, укладка и уход'],
    plantSalesTitle: 'Продажа растений',
    plantSalesIntro: 'Мечтаете об идеальном зелёном уголке у дома? Садовый центр Florial предлагает широкий выбор качественных растений для сада, террасы и ландшафтного дизайна в Несебре и Равде.',
    plantSalesItems: ['Пальмы, юкки и маслины', 'Декоративные кустарники и цветы, адаптированные к местному климату', 'Хвойные растения и изящные многолетники', 'Саженцы для средиземноморских садов и живых изгородей'],
    plantSalesOutro: 'Приходите в наши садовые центры в Несебре и Равде — мы поможем подобрать подходящие растения и поделимся профессиональными советами по уходу.',
    irrigationEquipmentTitle: 'Профессиональное оборудование для автополива',
    irrigationEquipmentIntro: 'Хотите, чтобы сад оставался зелёным и ухоженным без лишних хлопот? Садовый центр Florial в Несебре и Равде предлагает надёжное современное оборудование для полива частных участков, газонов и террас.',
    irrigationEquipmentItems: ['Надёжные дождеватели, контроллеры и датчики дождя', 'Капельные трубки, фитинги и комплектующие для точечного полива', 'Шланги, катушки и аксессуары для ручного ухода за садом'],
    irrigationEquipmentOutro: 'Посетите наши садовые центры в Несебре и Равде — специалисты помогут подобрать оптимальное оборудование и собрать комплект для вашей системы полива.',
    approachTitle: 'От идеи до ухода за садом',
    steps: ['Обсуждаем ваши пожелания и особенности участка', 'Разрабатываем проект и подбираем растения, материалы и оборудование', 'Выполняем согласованные работы по озеленению и монтажу', 'При необходимости обеспечиваем последующий уход и обслуживание'],
    areasTitle: 'Работаем на Черноморском побережье Болгарии',
    areas: 'Мы выполняем работы в Несебре, Равде, Каблешково, Солнечном Берегу, Святом Власе, Поморие, Ахелое, Елените и близлежащих районах. Для проектов автоматического полива в районе Несебра предлагаем бесплатный выезд для замеров и подготовки сметы.',
    cta: 'Обсудить ваш проект',
    ctaText: 'Расскажите нам о вашем саде, участке или системе полива — вместе определим подходящее решение.',
    seoTitle: 'О нас | Садовый центр Florial — ландшафтный дизайн и автополив в Болгарии',
    seoDescription: 'Садовый центр Florial в Несебре: ландшафтное проектирование, озеленение, посадка растений, рулонный газон, проектирование и монтаж автоматического полива с 2000 года.'
  },
  en: {
    eyebrow: 'FLORIAL · NESSEBAR, BULGARIA',
    title: 'Florial Garden Centre in Nessebar',
    subtitle: 'Creating beautiful, balanced outdoor spaces',
    intro: 'We specialise in landscape design, planning, planting and outdoor improvements. Our team brings together practical experience in horticulture, landscape design and automatic irrigation to turn clients’ ideas into thoughtful spaces shaped around the needs of each site.',
    designTitle: 'Landscape design and planning',
    designLead: 'A well-considered outdoor space starts with a clear plan.',
    design: 'Professional landscaping begins with careful planning. We help define the style of the future garden, develop landscape and engineering solutions, and select materials and methods suited to the terrain, soil, climate and surroundings. Planning before work begins helps coordinate the result, use the budget wisely and avoid unnecessary costs during implementation.',
    designItems: ['Defining the garden style', 'Preparing detailed design solutions', 'Planning engineering systems', 'Selecting materials and methods', 'Coordinated garden improvements'],
    plantingTitle: 'Planting and landscaping',
    planting: 'We select plants for private homes, villas, hotels and commercial properties. Our work includes planting trees, shrubs and flowers, creating hedges, mixed planting groups, specimen and vertical planting, rock gardens and other compositions. We consider the season, soil, sunlight and the characteristics of each site. Modern planting methods for container-grown and root-balled plants make it possible to plan work across a broader season.',
    plantingNote: 'Good soil preparation, correct planting techniques and professional supervision help plants establish and grow in harmony with the garden. We have plenty to offer for your landscaping project.',
    irrigationTitle: 'Automatic irrigation systems',
    irrigationLead: 'Designing, installing and maintaining irrigation systems since 2000.',
    irrigation: 'We design, install, maintain and repair automatic irrigation systems, modernise existing installations and carry out spring start-ups after winter. We also install drip, micro-drip and point irrigation systems, including for agricultural use. Equipment and components for self-installation are available too.',
    irrigationItems: ['System design and calculations', 'Automatic irrigation installation', 'Drip and micro-irrigation', 'Repair and renovation of existing systems', 'Spring start-up and seasonal maintenance', 'Irrigation equipment and components'],
    turfTitle: 'Rolled turf',
    turf: 'A lawn is an important part of a landscaped garden: it opens up the space, complements the architecture and brings the overall design together. Rolled turf provides an even green surface and a finished look quickly. We offer turf sales, base preparation, installation and ongoing care, following the correct methods to help it root successfully.',
    turfBenefits: ['Fast garden transformation', 'An even, attractive finish', 'Turf sales, installation and care'],
    plantSalesTitle: 'Plant sales',
    plantSalesIntro: 'Dreaming of a beautiful green space at home? Florial Garden Centre offers a wide selection of quality plants for gardens, terraces and landscape projects in Nessebar and Ravda.',
    plantSalesItems: ['Palms, yuccas and olive trees', 'Ornamental shrubs and flowers suited to the local climate', 'Conifers and elegant perennial plants', 'Young plants for Mediterranean gardens and living hedges'],
    plantSalesOutro: 'Visit our garden centres in Nessebar and Ravda. We will help you choose the right plants and share professional care advice.',
    irrigationEquipmentTitle: 'Professional automatic irrigation equipment',
    irrigationEquipmentIntro: 'Would you like your garden to stay green and well cared for with less effort? Florial Garden Centre in Nessebar and Ravda offers reliable, modern irrigation equipment for private gardens, lawns and terraces.',
    irrigationEquipmentItems: ['Reliable sprinklers, controllers and rain sensors', 'Drip tubing, fittings and components for precise watering', 'Garden hoses, hose reels and accessories for manual garden care'],
    irrigationEquipmentOutro: 'Visit our garden centres in Nessebar and Ravda. Our specialists will help you choose suitable equipment and put together a set for your irrigation system.',
    approachTitle: 'From the first idea to garden care',
    steps: ['Discuss your goals and the characteristics of your site', 'Plan the design and choose suitable plants, materials and equipment', 'Carry out the agreed landscaping and installation work', 'Provide ongoing care and maintenance when needed'],
    areasTitle: 'Serving Bulgaria’s Black Sea coast',
    areas: 'We work in Nessebar, Ravda, Kableshkovo, Sunny Beach, Sveti Vlas, Pomorie, Aheloy, Elenite and nearby areas. For automatic irrigation projects around Nessebar, we offer a free site visit for measurements and an estimate.',
    cta: 'Discuss your project',
    ctaText: 'Tell us about your garden, property or irrigation system and we will help you find a suitable solution.',
    seoTitle: 'About Florial | Landscape Design and Irrigation in Bulgaria',
    seoDescription: 'Florial Garden Centre in Nessebar offers landscape planning, planting, landscaping, rolled turf and automatic irrigation design, installation and maintenance since 2000.'
  }
} as const

interface AboutPageProps {
  services: ServiceItem[]
  categories: CategoryItem[]
}

const aboutServiceSlugs = {
  design: 'landshaften-dizain',
  planting: 'zasazhdane-na-rasteniya',
  landscaping: 'ozelenyavane',
  turf: 'rulonna-treva',
  irrigation: 'avtomatichno-napoyavane',
} as const

export function AboutPage({ services, categories }: AboutPageProps) {
  const { language } = useI18n()
  const copy = content[language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg']
  const locations = language === 'ru'
    ? 'Несебр, Равда, Солнечный Берег и Святой Влас'
    : language === 'en'
      ? 'Nessebar, Ravda, Sunny Beach and Sveti Vlas'
      : 'Несебър, Равда, Слънчев бряг и Свети Влас'

  const renderServiceImage = (slug: string, serviceName: string) => {
    const service = services.find((item) => item.slug?.current === slug)
    if (!service?.imageUrl) return null
    const imageTitle = `${serviceName} — ${locations} | Florial`

    return (
      <a
        href={localizedHref(`/services/${encodeURIComponent(slug)}`, language)}
        aria-label={serviceName}
        className="mt-5 block overflow-hidden rounded-2xl no-underline shadow-sm transition hover:shadow-md"
      >
        <img
          src={service.imageUrl}
          alt={imageTitle}
          title={imageTitle}
          loading="lazy"
          className="h-52 w-full object-cover sm:h-64"
        />
      </a>
    )
  }

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
          src={category.imageUrl}
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
  const itemClass = 'flex items-start gap-3 text-sm leading-6 text-slate-700 md:text-base'

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
        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div>
              <p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">01</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl"><a href={localizedHref(`/services/${aboutServiceSlugs.design}`, language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.designTitle}</a></h2>{renderServiceImage(aboutServiceSlugs.design, copy.designTitle)}
              <p className="mt-4 font-semibold leading-7 text-[#53643A]">{copy.designLead}</p>
            </div>
            <div>
              <p className="leading-8 text-slate-600">{copy.design}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {copy.designItems.map((item) => <li key={item} className={itemClass}><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#879663]" />{item}</li>)}
              </ul>
            </div>
          </div>
        </article>

        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div><p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">02</p><h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl"><a href={localizedHref(`/services/${aboutServiceSlugs.planting}`, language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.plantingTitle}</a></h2>{renderServiceImage(aboutServiceSlugs.planting, copy.plantingTitle)}</div>
            <div><p className="leading-8 text-slate-600">{copy.planting}</p><p className="mt-4 rounded-2xl bg-[#F3F5EC] p-5 leading-7 text-slate-700">{copy.plantingNote}</p></div>
          </div>
        </article>

        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div><p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">03</p><h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl"><a href={localizedHref(`/services/${aboutServiceSlugs.landscaping}`, language)} className="text-inherit no-underline transition hover:text-[#647746]">{language === 'ru' ? 'Озеленение территории' : language === 'en' ? 'Landscaping' : 'Озеленяване на терени'}</a></h2>{renderServiceImage(aboutServiceSlugs.landscaping, language === 'ru' ? 'Озеленение территории' : language === 'en' ? 'Landscaping' : 'Озеленяване на терени')}</div>
            <div><p className="leading-8 text-slate-600">{language === 'ru' ? 'Комплексное озеленение частных садов, гостиниц и коммерческих территорий: подготовка участка, оформление клумб, посадка деревьев и кустарников, создание живых изгородей и сочетание посадок с газоном и автоматическим поливом.' : language === 'en' ? 'Complete landscaping for private gardens, hotels and commercial properties, including site preparation, flower beds, planting trees and shrubs, creating hedges and combining planting with lawns and automatic irrigation.' : 'Извършваме цялостно озеленяване на частни градини, хотели и търговски обекти — подготовка на терена, оформяне на цветни лехи, засаждане на дървета и храсти, живи плетове и съчетаване на растителността с тревни площи и автоматично напояване.'}</p></div>
          </div>
        </article>

        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div><p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">04</p><h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl"><a href={localizedHref(`/services/${aboutServiceSlugs.turf}`, language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.turfTitle}</a></h2>{renderServiceImage(aboutServiceSlugs.turf, copy.turfTitle)}</div>
            <div><p className="leading-8 text-slate-600">{copy.turf}</p><ul className="mt-5 grid gap-3 sm:grid-cols-3">{copy.turfBenefits.map((item) => <li key={item} className="rounded-xl bg-[#F3F5EC] p-4 text-sm font-semibold leading-6 text-[#53643A]">{item}</li>)}</ul></div>
          </div>
        </article>

        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div><p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">05</p><h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl"><a href={localizedHref(`/services/${aboutServiceSlugs.irrigation}`, language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.irrigationTitle}</a></h2>{renderServiceImage(aboutServiceSlugs.irrigation, copy.irrigationTitle)}<p className="mt-4 font-semibold leading-7 text-[#53643A]">{copy.irrigationLead}</p></div>
            <div><p className="leading-8 text-slate-600">{copy.irrigation}</p><ul className="mt-5 grid gap-3 sm:grid-cols-2">{copy.irrigationItems.map((item) => <li key={item} className={itemClass}><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#879663]" />{item}</li>)}</ul></div>
          </div>
        </article>

        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div>
              <p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">06</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl">
                <a href={localizedHref('/category/rastenia', language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.plantSalesTitle}</a>
              </h2>
              {renderCatalogImage('rastenia', copy.plantSalesTitle)}
            </div>
            <div>
              <p className="leading-8 text-slate-600">{copy.plantSalesIntro}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {copy.plantSalesItems.map((item) => <li key={item} className={itemClass}><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#879663]" />{item}</li>)}
              </ul>
              <p className="mt-5 rounded-2xl bg-[#F3F5EC] p-5 leading-7 text-slate-700">{copy.plantSalesOutro}</p>
            </div>
          </div>
        </article>

        <article className={sectionClass}>
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
            <div>
              <p className="text-sm font-extrabold tracking-[0.2em] text-[#879663]">07</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[#263323] md:text-3xl">
                <a href={localizedHref('/category/vsichko-za-polivane', language)} className="text-inherit no-underline transition hover:text-[#647746]">{copy.irrigationEquipmentTitle}</a>
              </h2>
              {renderCatalogImage('vsichko-za-polivane', copy.irrigationEquipmentTitle)}
            </div>
            <div>
              <p className="leading-8 text-slate-600">{copy.irrigationEquipmentIntro}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {copy.irrigationEquipmentItems.map((item) => <li key={item} className={itemClass}><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#879663]" />{item}</li>)}
              </ul>
              <p className="mt-5 rounded-2xl bg-[#F3F5EC] p-5 leading-7 text-slate-700">{copy.irrigationEquipmentOutro}</p>
            </div>
          </div>
        </article>

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
