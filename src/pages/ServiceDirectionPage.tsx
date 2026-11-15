import React, { useEffect, useMemo } from 'react'
import type { ServiceItem, ServiceRolePhoto } from '../types'
import { useI18n } from '../lib/i18n'
import { applyPageSeo, setStructuredData } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { getOrderedServiceEntries } from '../lib/servicesOrder'
import { getSanityImageProps } from '../lib/sanityImage'
import { toPlainText } from '../lib/richTextUtils.mjs'

type DirectionId = 'landscaping' | 'irrigation' | 'planting' | 'lawn'
type LocaleCopy = {
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>
  faqHeading: string
  faqs: Array<{ question: string; answer: string }>
  serviceHeading: string
  emptyServices: string
  allServices: string
  learnMore: string
}
type Direction = {
  id: DirectionId
  slug: string
  photoSlug: string
  categories: string[]
  title: Record<'bg' | 'ru' | 'en', string>
  copy: Record<'bg' | 'ru' | 'en', LocaleCopy>
}

const DIRECTIONS: Direction[] = [
  {
    id: 'landscaping',
    slug: 'landshaften-arhitekt',
    photoSlug: 'landshaften-arhitekt',
    categories: ['landscaping'],
    title: { bg: 'Ландшафтен архитект', ru: 'Ландшафтный архитектор', en: 'Landscape architect' },
    copy: {
      bg: {
        title: 'Ландшафтно проектиране и дизайн на градини',
        metaTitle: 'Ландшафтен дизайн в Несебър и Равда | Florial',
        metaDescription: 'Ландшафтно проектиране на дворове и градини в Несебър, Равда, Слънчев бряг и района. Идеи, зониране, растения и поливане от Florial.',
        intro: 'Добре планираната градина съчетава удобни пространства, подходящи растения и решения, съобразени с терена. Florial предлага ландшафтен дизайн за частни дворове и зелени площи по Южното Черноморие. Проектът започва с разбиране на мястото и начина, по който искате да го използвате.',
        sections: [
          { heading: 'Индивидуален проект според терена и начина на живот', paragraphs: ['Преди избора на растения и настилки е важно да се разгледат размерът и формата на терена, изложението, съществуващата растителност, достъпът и желаните зони за почивка. Така се създава цялостна концепция, вместо отделни решения без връзка помежду им.', 'При имоти край морето се съобразяваме с реалните условия на конкретното място — слънчево огряване, вятър, почва, оттичане на водата и възможности за поддръжка. Подборът на видове се прави според тези условия, а не само според външния вид.'] },
          { heading: 'Какво може да включва ландшафтният дизайн', paragraphs: ['Обхватът се определя според задачата и състоянието на имота. В зависимост от проекта могат да се разработят:',], bullets: ['Функционално зониране на двора и връзките между отделните пространства', 'Разположение на тревни площи, дървета, храсти и цветни композиции', 'Подбор на растения според изложение, почва и местни условия', 'Планиране на поливане и осветление като част от общата концепция', 'Насоки за последователност на изпълнението и бъдеща поддръжка'] },
          { heading: 'От идея до изпълнима концепция', paragraphs: ['Работата започва с уточняване на желанията и оглед на наличната информация за терена. Следва разработване на концепция и съгласуване на основните решения. Конкретният състав на проекта, чертежите и детайлите се определят след уточняване на заданието.', 'Когато е необходимо, проектът може да се свърже с отделни услуги на Florial — озеленяване, засаждане, изграждане на тревна площ и автоматично напояване. Така отделните дейности следват общ план.'] },
          { heading: 'Ландшафтен дизайн по Българското Черноморие', paragraphs: ['При планиране на градини в Несебър, Равда, Слънчев бряг, Свети Влас, Ахелой и Поморие се отчитат особеностите на конкретния парцел и крайморската среда. Не съществува универсален списък растения за всеки двор — изборът зависи от микроклимата, почвата, напояването и грижите, които собственикът може да осигури.'] },
        ],
        faqHeading: 'Често задавани въпроси за ландшафтния дизайн',
        faqs: [
          { question: 'Кога е най-добре да се планира градината?', answer: 'Планирането е полезно преди основните строителни и озеленителни работи. Така могат да се съгласуват настилки, нива, поливане, осветление и места за растения.' },
          { question: 'Може ли проектът да включва автоматично напояване?', answer: 'Да. Поливането може да бъде предвидено като част от общата концепция, а техническото проектиране и монтажът се уточняват според отделната задача.' },
          { question: 'Работите ли по съществуващи градини?', answer: 'Може да се обсъди обновяване или преустройство на съществуваща градина след преглед на терена и конкретните нужди.' },
        ],
        serviceHeading: 'Услуги на ландшафтния архитект',
        emptyServices: 'В момента няма публикувани услуги в това направление. Свържете се с Florial, за да обсъдим вашия проект.',
        allServices: 'Всички услуги',
        learnMore: 'Научете повече',
      },
      ru: {
        title: 'Ландшафтное проектирование и дизайн сада',
        metaTitle: 'Ландшафтный дизайн в Несебре и Равде | Florial',
        metaDescription: 'Проектирование частных садов и участков в Несебре, Равде, Солнечном Береге и рядом. Зонирование, растения и полив с Florial.',
        intro: 'Продуманный сад объединяет удобные пространства, подходящие растения и решения, соответствующие особенностям участка. Florial предлагает ландшафтное проектирование частных дворов и зелёных территорий на Южном Черноморье. Работа начинается с изучения места и понимания того, как вы хотите использовать сад.',
        sections: [
          { heading: 'Индивидуальный проект с учётом участка и ваших задач', paragraphs: ['Перед выбором растений и покрытий важно оценить размеры и форму участка, освещённость, существующие насаждения, доступ и желаемые зоны отдыха. Это помогает создать общую концепцию, а не набор несвязанных решений.', 'Для прибрежных объектов учитываются реальные условия конкретного места: солнце, ветер, почва, отвод воды и возможности ухода. Растения подбираются с учётом этих факторов, а не только по внешнему виду.'] },
          { heading: 'Что может входить в ландшафтный дизайн', paragraphs: ['Состав работ определяется задачей и состоянием территории. В зависимости от проекта могут быть предусмотрены:'], bullets: ['Функциональное зонирование двора и связи между зонами', 'Размещение газонов, деревьев, кустарников и цветников', 'Подбор растений с учётом освещения, почвы и местных условий', 'Планирование полива и освещения в общей концепции', 'Рекомендации по последовательности работ и дальнейшему уходу'] },
          { heading: 'От идеи к реализуемой концепции', paragraphs: ['Сначала уточняются пожелания и изучается доступная информация об участке. Затем разрабатывается концепция и согласовываются основные решения. Состав проекта, чертежи и детализация определяются после уточнения задания.', 'При необходимости проект связывается с отдельными услугами Florial: озеленением, посадкой растений, устройством газона и автоматическим поливом. Это помогает выполнять работы в единой логике.'] },
          { heading: 'Ландшафтный дизайн на побережье Болгарии', paragraphs: ['При проектировании садов в Несебре, Равде, Солнечном Береге, Святом Власе, Ахелое и Поморие учитываются особенности конкретного участка и прибрежной среды. Универсального набора растений для каждого сада нет: выбор зависит от микроклимата, почвы, полива и доступного ухода.'] },
        ],
        faqHeading: 'Частые вопросы о ландшафтном дизайне',
        faqs: [
          { question: 'Когда лучше планировать сад?', answer: 'Желательно до основных строительных и озеленительных работ. Так можно согласовать покрытия, уровни, полив, освещение и места посадки.' },
          { question: 'Можно ли включить автоматический полив в проект?', answer: 'Да. Полив можно предусмотреть в общей концепции, а техническое проектирование и монтаж согласовать как отдельную задачу.' },
          { question: 'Можно ли обновить уже существующий сад?', answer: 'Можно обсудить обновление или перепланировку существующей территории после оценки участка и конкретных потребностей.' },
        ],
        serviceHeading: 'Услуги ландшафтного архитектора',
        emptyServices: 'Сейчас в этом направлении нет опубликованных услуг. Свяжитесь с Florial, чтобы обсудить ваш проект.',
        allServices: 'Все услуги',
        learnMore: 'Подробнее',
      },
      en: {
        title: 'Landscape planning and garden design',
        metaTitle: 'Landscape Design in Nessebar and Ravda | Florial',
        metaDescription: 'Garden and outdoor space design in Nessebar, Ravda, Sunny Beach and nearby areas. Site planning, planting and irrigation with Florial.',
        intro: 'A well-planned garden combines practical outdoor spaces, suitable plants and solutions that respond to the site. Florial provides landscape design for private gardens and green areas along Bulgaria’s southern Black Sea coast. The process starts by understanding the property and how you want to use it.',
        sections: [
          { heading: 'A tailored plan for the site and the way you live', paragraphs: ['Before choosing plants and surfaces, it is important to consider the plot size and shape, sunlight, existing vegetation, access and the outdoor areas you need. This creates a coherent concept rather than a collection of unrelated features.', 'For coastal properties, the design should respond to the actual conditions on site, including sun exposure, wind, soil, drainage and the level of maintenance available. Plant choices should reflect these factors, not appearance alone.'] },
          { heading: 'What landscape design can include', paragraphs: ['The scope depends on the brief and the condition of the property. A project may include:'], bullets: ['Functional zoning and connections between outdoor areas', 'Planning lawns, trees, shrubs and flower beds', 'Plant selection based on light, soil and local conditions', 'Planning irrigation and lighting as part of the overall concept', 'Guidance on work sequence and future maintenance'] },
          { heading: 'From an idea to a practical concept', paragraphs: ['The first step is to clarify your priorities and review the available information about the site. A concept is then prepared and the main decisions are discussed. The exact project deliverables and drawings are agreed once the brief is clear.', 'Where appropriate, the concept can connect with Florial services such as planting, lawn installation and automatic irrigation, helping the different stages follow one plan.'] },
          { heading: 'Garden design on Bulgaria’s Black Sea coast', paragraphs: ['For properties in Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy and Pomorie, the design should account for the specific plot and coastal setting. There is no single plant list that suits every garden; choices depend on microclimate, soil, irrigation and available care.'] },
        ],
        faqHeading: 'Landscape design questions',
        faqs: [
          { question: 'When should I plan my garden?', answer: 'Ideally before major construction and planting work. This makes it easier to coordinate surfaces, levels, irrigation, lighting and planting areas.' },
          { question: 'Can irrigation be included in the design?', answer: 'Yes. Irrigation can be considered in the overall concept, with technical design and installation scoped according to the project.' },
          { question: 'Can you redesign an existing garden?', answer: 'An update or redesign can be discussed after reviewing the site and its specific needs.' },
        ],
        serviceHeading: 'Landscape architect services',
        emptyServices: 'There are no published services in this direction at the moment. Contact Florial to discuss your project.',
        allServices: 'All services',
        learnMore: 'Learn more',
      },
    },
  },
  {
    id: 'irrigation',
    slug: 'polivni-sistemi',
    photoSlug: 'inzhener-polivni-sistemi',
    categories: ['irrigation', 'maintenance', 'delivery'],
    title: { bg: 'Инженер по поливни системи', ru: 'Инженер систем полива', en: 'Irrigation systems engineer' },
    copy: {
      bg: {
        title: 'Проектиране, монтаж и поддръжка на системи за автоматично напояване',
        metaTitle: 'Автоматично напояване в Несебър и Равда | Florial',
        metaDescription: 'Проектиране, монтаж, настройка и поддръжка на автоматично напояване в Несебър, Равда, Слънчев бряг и района. Florial.',
        intro: 'Автоматичното напояване помага водата да достига до тревните площи, дърветата, храстите и цветните лехи по контролиран начин. Florial работи с решения за частни градини и зелени площи, като изборът на система зависи от плана на терена, растенията, водоизточника и наличното налягане.',
        sections: [
          { heading: 'Система, съобразена с растенията и терена', paragraphs: ['Различните зелени площи имат различни нужди. За тревни площи често се използват разпръсквачи, а за редове от растения и лехи може да е подходящо капково напояване. Конкретното решение се определя след оценка на площта, водоснабдяването и разположението на насажденията.', 'При проектиране се разглеждат наличният дебит и налягане, разделянето на зони, трасетата на тръбите, местата за клапани и възможността за удобно управление.'] },
          { heading: 'Какво включват услугите по автоматично напояване', paragraphs: ['В зависимост от състоянието на обекта и задачата могат да се обсъдят:'], bullets: ['Оглед и оценка на съществуващото водоснабдяване', 'Проектиране и разделяне на поливните зони', 'Избор на контролер, клапани, филтри и поливни тела', 'Монтаж на тръбопроводи, разпръсквачи и капкови линии', 'Настройка на програмите и сезонна корекция', 'Диагностика, ремонт и поддръжка на съществуваща система'] },
          { heading: 'Монтаж и настройка', paragraphs: ['При монтаж се съгласуват местата на поливните тела и трасетата, след което системата се сглобява и проверява. Настройката включва проверка на работата на зоните и корекция на поливните сектори според разположението на растенията и настилките.', 'За вече изградени системи може да се обсъди диагностика на отделни зони, клапани, контролери, разпръсквачи и капкови линии. Необходимите части и обхватът на ремонта се уточняват след проверка.'] },
          { heading: 'Автоматично напояване по Южното Черноморие', paragraphs: ['В Несебър, Равда, Слънчев бряг, Свети Влас, Ахелой и Поморие режимът на поливане трябва да се съобразява със сезона, вида растения, почвата и изложението. Настройките не са универсални: те се променят според реалните условия и наблюденията върху градината.'] },
        ],
        faqHeading: 'Често задавани въпроси за поливните системи',
        faqs: [
          { question: 'Може ли една система да полива и тревата, и растенията?', answer: 'Да, но обикновено различните типове насаждения се разделят на отделни зони, за да се настройва поливането според нуждите им.' },
          { question: 'Може ли да се ремонтира съществуваща система?', answer: 'Да. Първо се установява причината за проблема и кои компоненти са засегнати, след което се уточнява необходимият ремонт.' },
          { question: 'Как се определя цената?', answer: 'Цената зависи от площта, водоизточника, броя зони, избраното оборудване и сложността на монтажа. Точният обхват се уточнява след информация или оглед на обекта.' },
        ],
        serviceHeading: 'Услуги за автоматично напояване',
        emptyServices: 'Няма публикувани услуги в това направление. Свържете се с Florial за консултация.',
        allServices: 'Всички услуги',
        learnMore: 'Научете повече',
      },
      ru: {
        title: 'Проектирование, монтаж и обслуживание систем автоматического полива',
        metaTitle: 'Автоматический полив в Несебре и Равде | Florial',
        metaDescription: 'Проектирование, монтаж, настройка и обслуживание автополива в Несебре, Равде, Солнечном Береге и рядом. Florial.',
        intro: 'Автоматический полив помогает подавать воду к газонам, деревьям, кустарникам и цветникам контролируемым способом. Florial предлагает решения для частных садов и зелёных территорий. Выбор системы зависит от планировки, растений, источника воды и доступного давления.',
        sections: [
          { heading: 'Система с учётом растений и участка', paragraphs: ['У разных зелёных зон разные потребности. Для газонов часто используют дождеватели, а для рядовых посадок и цветников может подойти капельный полив. Решение выбирают после оценки площади, водоснабжения и расположения растений.', 'При проектировании учитываются расход и давление воды, разделение на зоны, трассы труб, расположение клапанов и удобство управления.'] },
          { heading: 'Что могут включать услуги автоматического полива', paragraphs: ['В зависимости от объекта и задачи можно обсудить:'], bullets: ['Осмотр и оценку существующего водоснабжения', 'Проектирование и разделение поливных зон', 'Подбор контроллера, клапанов, фильтров и поливочных устройств', 'Монтаж труб, дождевателей и капельных линий', 'Настройку программ и сезонную корректировку', 'Диагностику, ремонт и обслуживание существующей системы'] },
          { heading: 'Монтаж и настройка', paragraphs: ['При монтаже согласуются места поливочных устройств и трассы, после чего система собирается и проверяется. Настройка включает проверку зон и корректировку секторов с учётом растений и покрытий.', 'Для действующих систем можно обсудить диагностику отдельных зон, клапанов, контроллеров, дождевателей и капельных линий. Необходимые детали и объём ремонта определяются после проверки.'] },
          { heading: 'Автоматический полив на Южном Черноморье', paragraphs: ['В Несебре, Равде, Солнечном Береге, Святом Власе, Ахелое и Поморие режим полива зависит от сезона, растений, почвы и освещённости. Универсального расписания нет: настройки корректируют по реальным условиям и состоянию сада.'] },
        ],
        faqHeading: 'Частые вопросы об автополиве',
        faqs: [
          { question: 'Может ли одна система поливать газон и растения?', answer: 'Да, но разные типы посадок обычно разделяют на отдельные зоны, чтобы настраивать полив с учётом их потребностей.' },
          { question: 'Можно ли отремонтировать существующую систему?', answer: 'Да. Сначала определяют причину неисправности и затронутые компоненты, затем согласуют необходимый ремонт.' },
          { question: 'От чего зависит стоимость?', answer: 'Стоимость зависит от площади, источника воды, количества зон, выбранного оборудования и сложности монтажа. Точный объём работ определяется после получения информации или осмотра.' },
        ],
        serviceHeading: 'Услуги по автоматическому поливу',
        emptyServices: 'В этом направлении пока нет опубликованных услуг. Свяжитесь с Florial для консультации.',
        allServices: 'Все услуги',
        learnMore: 'Подробнее',
      },
      en: {
        title: 'Automatic irrigation design, installation and maintenance',
        metaTitle: 'Automatic Irrigation in Nessebar and Ravda | Florial',
        metaDescription: 'Automatic irrigation design, installation, adjustment and maintenance in Nessebar, Ravda, Sunny Beach and nearby areas. Florial.',
        intro: 'Automatic irrigation helps deliver water to lawns, trees, shrubs and flower beds in a controlled way. Florial works with solutions for private gardens and green spaces. The right system depends on the site layout, plants, water source and available pressure.',
        sections: [
          { heading: 'A system designed around the plants and site', paragraphs: ['Different planted areas have different watering needs. Lawns often use sprinklers, while planting rows and beds may benefit from drip irrigation. The solution is selected after reviewing the area, water supply and planting layout.', 'Design considerations include available flow and pressure, irrigation zones, pipe routes, valve locations and convenient controls.'] },
          { heading: 'What irrigation services may include', paragraphs: ['Depending on the property and brief, the work may include:'], bullets: ['Reviewing the site and existing water supply', 'Planning and dividing irrigation zones', 'Selecting controllers, valves, filters and watering devices', 'Installing pipework, sprinklers and drip lines', 'Setting controller programmes and seasonal adjustments', 'Diagnosing, repairing and maintaining an existing system'] },
          { heading: 'Installation and adjustment', paragraphs: ['The locations of watering devices and pipe routes are agreed before installation. The system is then assembled and checked. Commissioning includes checking each zone and adjusting coverage around plants and paved areas.', 'For existing systems, diagnostics can focus on individual zones, valves, controllers, sprinklers and drip lines. Required parts and repair scope are confirmed after inspection.'] },
          { heading: 'Irrigation on Bulgaria’s southern Black Sea coast', paragraphs: ['In Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy and Pomorie, watering schedules depend on the season, plant types, soil and exposure. There is no universal programme; settings should reflect actual site conditions and the garden’s response.'] },
        ],
        faqHeading: 'Automatic irrigation questions',
        faqs: [
          { question: 'Can one system water both a lawn and planted beds?', answer: 'Yes, although different planting types are usually separated into zones so watering can be adjusted to their needs.' },
          { question: 'Can an existing system be repaired?', answer: 'Yes. The cause and affected components are identified first, then the required repair is agreed.' },
          { question: 'What affects the price?', answer: 'The price depends on the area, water source, number of zones, selected equipment and installation complexity. The scope is confirmed after reviewing the details or visiting the site.' },
        ],
        serviceHeading: 'Automatic irrigation services',
        emptyServices: 'There are no published services in this direction at the moment. Contact Florial for advice.',
        allServices: 'All services',
        learnMore: 'Learn more',
      },
    },
  },
  {
    id: 'planting',
    slug: 'gardinar',
    photoSlug: 'gardinar',
    categories: ['planting'],
    title: { bg: 'Градинар', ru: 'Садовник', en: 'Gardener' },
    copy: {
      bg: {
        title: 'Засаждане на растения и озеленяване на дворове',
        metaTitle: 'Засаждане и озеленяване в Несебър и Равда | Florial',
        metaDescription: 'Професионално засаждане на дървета, храсти и декоративни растения в Несебър, Равда, Слънчев бряг и района. Florial.',
        intro: 'Красивото озеленяване започва с правилен избор на растения и подготовка на мястото. Florial предлага услуги по засаждане и озеленяване за дворове и зелени площи, като съобразява работата с вида на растенията, почвата, сезона и условията на конкретния обект.',
        sections: [
          { heading: 'Подбор на растения и подготовка на мястото', paragraphs: ['Преди засаждане се преценяват изложението, почвата, дренажът, наличното пространство и възможностите за напояване. Важно е да се съобразят размерът на растението при доставка и очакваният му размер при развитие.', 'Подготовката може да включва почистване на зоната, обработка на почвата и оформяне на посадъчните места. Конкретните действия зависят от терена и от изискванията на избраните видове.'] },
          { heading: 'Какво включва засаждането и озеленяването', paragraphs: ['Според проекта и състоянието на терена могат да се изпълнят:'], bullets: ['Засаждане на дървета, палми, храсти и декоративни растения', 'Оформяне на групи и композиции в градината', 'Формировъчна и топиарна резитба на растения', 'Подготовка на почвата и посадъчните ями', 'Първоначално поливане и препоръки за последващи грижи', 'Съгласуване на посадките с тревните площи и поливната система'] },
          { heading: 'Грижи след засаждането', paragraphs: ['След засаждането растенията се нуждаят от внимание през периода на прихващане. Режимът на поливане и последващите грижи зависят от вида, размера, сезона, почвата и времето. При предаването на обекта е важно да се уточнят практическите препоръки за конкретните растения.', 'Когато озеленяването е част от по-голям проект, посадките се координират с настилките, осветлението, тревните площи и автоматичното напояване.'] },
          { heading: 'Озеленяване по Южното Черноморие', paragraphs: ['За имоти в Несебър, Равда, Слънчев бряг, Свети Влас, Ахелой и Поморие изборът на растения трябва да отчита крайморските условия и особеностите на мястото. Подходящият вид и грижите се определят индивидуално — не всяко растение е подходящо за всяка градина.'] },
        ],
        faqHeading: 'Често задавани въпроси за засаждането',
        faqs: [
          { question: 'Може ли да засадите растения, закупени от друг доставчик?', answer: 'Възможността се уточнява според вида и размера на растенията, количеството и условията на обекта.' },
          { question: 'Кога се засаждат дървета и храсти?', answer: 'Подходящият период зависи от вида, начина на отглеждане, сезона и местните условия. Конкретният срок се уточнява за избраните растения.' },
          { question: 'Предлагате ли грижи след засаждането?', answer: 'Обхватът на последващите грижи може да се обсъди отделно според растенията и нуждите на градината.' },
        ],
        serviceHeading: 'Услуги по засаждане и озеленяване',
        emptyServices: 'Няма публикувани услуги в това направление. Свържете се с Florial, за да обсъдим озеленяването.',
        allServices: 'Всички услуги',
        learnMore: 'Научете повече',
      },
      ru: {
        title: 'Посадка растений и озеленение участков',
        metaTitle: 'Посадка растений и озеленение в Несебре | Florial',
        metaDescription: 'Посадка деревьев, кустарников и декоративных растений в Несебре, Равде, Солнечном Береге и рядом. Услуги Florial.',
        intro: 'Красивое озеленение начинается с правильного выбора растений и подготовки места. Florial предлагает посадку и озеленение дворов и зелёных территорий с учётом вида растений, почвы, сезона и условий конкретного объекта.',
        sections: [
          { heading: 'Выбор растений и подготовка участка', paragraphs: ['Перед посадкой оцениваются освещённость, почва, дренаж, доступное пространство и возможность полива. Важно учитывать не только размер растения при покупке, но и его предполагаемые размеры по мере роста.', 'Подготовка может включать очистку территории, обработку почвы и устройство посадочных мест. Конкретные работы зависят от участка и требований выбранных видов.'] },
          { heading: 'Что включает посадка и озеленение', paragraphs: ['В зависимости от проекта и состояния участка могут выполняться:'], bullets: ['Посадка деревьев, пальм, кустарников и декоративных растений', 'Создание групп и композиций в саду', 'Формирующая и топиарная обрезка растений', 'Подготовка почвы и посадочных ям', 'Первичный полив и рекомендации по дальнейшему уходу', 'Согласование посадок с газонами и системой полива'] },
          { heading: 'Уход после посадки', paragraphs: ['После посадки растениям требуется внимание в период укоренения. Полив и последующий уход зависят от вида, размера, сезона, почвы и погоды. При завершении работ важно согласовать практические рекомендации для конкретных растений.', 'Если озеленение является частью более крупного проекта, посадки координируются с покрытиями, освещением, газонами и автоматическим поливом.'] },
          { heading: 'Озеленение на Южном Черноморье', paragraphs: ['Для объектов в Несебре, Равде, Солнечном Береге, Святом Власе, Ахелое и Поморие выбор растений должен учитывать прибрежные условия и особенности участка. Подходящие виды и уход определяются индивидуально: не каждое растение подходит для любого сада.'] },
        ],
        faqHeading: 'Частые вопросы о посадке растений',
        faqs: [
          { question: 'Можно ли посадить растения, купленные у другого поставщика?', answer: 'Возможность обсуждается с учётом вида и размера растений, количества и условий объекта.' },
          { question: 'Когда лучше сажать деревья и кустарники?', answer: 'Срок зависит от вида, способа выращивания, сезона и местных условий. Конкретный период уточняется для выбранных растений.' },
          { question: 'Есть ли уход после посадки?', answer: 'Объём последующего ухода можно согласовать отдельно с учётом растений и потребностей сада.' },
        ],
        serviceHeading: 'Услуги по посадке и озеленению',
        emptyServices: 'В этом направлении нет опубликованных услуг. Свяжитесь с Florial, чтобы обсудить озеленение.',
        allServices: 'Все услуги',
        learnMore: 'Подробнее',
      },
      en: {
        title: 'Planting and garden landscaping',
        metaTitle: 'Planting and Landscaping in Nessebar | Florial',
        metaDescription: 'Planting trees, shrubs and ornamental plants in Nessebar, Ravda, Sunny Beach and nearby areas. Florial garden services.',
        intro: 'Successful planting starts with choosing suitable plants and preparing the site. Florial provides planting and landscaping services for gardens and green spaces, taking account of plant type, soil, season and the conditions at each property.',
        sections: [
          { heading: 'Plant selection and site preparation', paragraphs: ['Before planting, sunlight, soil, drainage, available space and irrigation options should be considered. It is important to account for both the plant’s supplied size and its expected mature dimensions.', 'Preparation may include clearing the area, improving the soil and preparing planting positions. The exact work depends on the site and the requirements of the selected plants.'] },
          { heading: 'What planting and landscaping can include', paragraphs: ['Depending on the project and site condition, the work may include:'], bullets: ['Planting trees, palms, shrubs and ornamental plants', 'Arranging planting groups and garden compositions', 'Shaping and topiary pruning of plants', 'Preparing soil and planting pits', 'Initial watering and guidance on aftercare', 'Coordinating planting with lawns and irrigation'] },
          { heading: 'Care after planting', paragraphs: ['Plants need attention while they establish. Watering and aftercare depend on the species, size, season, soil and weather. Practical recommendations should be agreed for the specific plants when the work is completed.', 'Where planting is part of a wider project, it is coordinated with surfaces, lighting, lawn areas and automatic irrigation.'] },
          { heading: 'Planting on Bulgaria’s southern Black Sea coast', paragraphs: ['For properties in Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy and Pomorie, plant selection should reflect coastal conditions and the specific site. Suitable species and aftercare are assessed individually; not every plant suits every garden.'] },
        ],
        faqHeading: 'Planting questions',
        faqs: [
          { question: 'Can you plant trees purchased elsewhere?', answer: 'This can be discussed based on the plant type and size, quantity and site conditions.' },
          { question: 'When should trees and shrubs be planted?', answer: 'Timing depends on the species, growing method, season and local conditions. The suitable period is confirmed for the selected plants.' },
          { question: 'Do you provide aftercare?', answer: 'Follow-up care can be discussed separately according to the plants and the garden’s needs.' },
        ],
        serviceHeading: 'Planting and landscaping services',
        emptyServices: 'There are no published services in this direction at the moment. Contact Florial to discuss planting.',
        allServices: 'All services',
        learnMore: 'Learn more',
      },
    },
  },
  {
    id: 'lawn',
    slug: 'trevni-ploshti',
    photoSlug: 'specialist-trevni-ploshti',
    categories: ['lawn'],
    title: { bg: 'Специалист по тревни площи', ru: 'Специалист по газонам', en: 'Lawn specialist' },
    copy: {
      bg: {
        title: 'Изграждане, възстановяване и поддръжка на тревни площи',
        metaTitle: 'Изграждане на тревни площи в Несебър | Florial',
        metaDescription: 'Подготовка на терен, тревен чим и изграждане на тревни площи в Несебър, Равда, Слънчев бряг и района. Florial.',
        intro: 'Качествената тревна площ зависи не само от тревната смес или чима, но и от подготовката на основата, отводняването и правилното напояване. Florial предлага решения за изграждане и обновяване на тревни площи според състоянието на терена и предназначението на градината.',
        sections: [
          { heading: 'Подготовка на терена', paragraphs: ['Преди изграждане се оценяват съществуващата почва, наклоните, оттичането на водата, достъпът и бъдещото натоварване на тревната площ. Основата трябва да бъде подготвена равномерно, така че да се намалят проблемите с локви, неравности и неравномерно развитие.', 'Подходът се избира според обекта — нов двор, ремонт на съществуващ газон или частично възстановяване на увредени участъци.'] },
          { heading: 'Тревен чим или засяване', paragraphs: ['Рулонният тревен чим осигурява готова тревна повърхност след полагане, докато засяването изисква време за поникване и уплътняване. Изборът зависи от сроковете, сезона, бюджета, площта и възможността за последващи грижи.', 'При двата подхода важни са подготовката на почвата, равномерното разпределение на водата и спазването на подходящ режим през началния период.'] },
          { heading: 'Какво може да включва работата по тревната площ', paragraphs: ['Обхватът се уточнява според състоянието на терена и желания резултат. Възможните дейности включват:'], bullets: ['Почистване и подготовка на терена', 'Оформяне и нивелиране на основата', 'Полагане на рулонен тревен чим или засяване', 'Организиране на поливането и първоначалните грижи', 'Обновяване и възстановяване на отделни участъци'] },
          { heading: 'Поливане и последваща поддръжка', paragraphs: ['Водният режим е важен при прихващането на новия чим и развитието на младата трева. Настройките зависят от сезона, почвата, изложението и вида тревна смес. При наличие на автоматично напояване зоните и програмите трябва да бъдат съобразени с тревната площ.', 'След установяване на тревата грижите включват косене, наблюдение за проблемни участъци и сезонни корекции според реалното състояние.'] },
          { heading: 'Тревни площи по Южното Черноморие', paragraphs: ['В Несебър, Равда, Слънчев бряг, Свети Влас, Ахелой и Поморие изборът на тревна смес и режимът на грижи трябва да се съобразят с изложението, почвата, летните условия и наличното напояване. Решението се определя за конкретния терен.'] },
        ],
        faqHeading: 'Често задавани въпроси за тревните площи',
        faqs: [
          { question: 'Кое е по-подходящо — чим или засяване?', answer: 'Зависи от сезона, площта, бюджета и желания срок. Чимът дава готова повърхност след полагане, а засяването изисква период за поникване и развитие.' },
          { question: 'Нужно ли е автоматично напояване?', answer: 'То може значително да улесни поддържането на равномерен режим, но проектът трябва да бъде съобразен с площта, водоизточника и тревната смес.' },
          { question: 'Може ли да се възстанови стар газон?', answer: 'Да, след оценка на причините за увреждането може да се определи дали е достатъчно частично възстановяване или е нужна цялостна подготовка.' },
        ],
        serviceHeading: 'Услуги за тревни площи',
        emptyServices: 'Няма публикувани услуги в това направление. Свържете се с Florial за оценка на тревната площ.',
        allServices: 'Всички услуги',
        learnMore: 'Научете повече',
      },
      ru: {
        title: 'Создание, восстановление и уход за газоном',
        metaTitle: 'Устройство газона в Несебре и Равде | Florial',
        metaDescription: 'Подготовка участка, укладка рулонного газона и создание газонов в Несебре, Равде, Солнечном Береге и рядом. Florial.',
        intro: 'Качество газона зависит не только от травосмеси или рулонного покрытия, но и от подготовки основания, дренажа и правильного полива. Florial предлагает решения для устройства и обновления газонов с учётом состояния участка и назначения сада.',
        sections: [
          { heading: 'Подготовка участка', paragraphs: ['Перед устройством оцениваются почва, уклоны, отвод воды, доступ и предполагаемая нагрузка на газон. Основание должно быть подготовлено равномерно, чтобы снизить риск луж, неровностей и неравномерного роста.', 'Подход выбирается по объекту: новый двор, ремонт существующего газона или частичное восстановление повреждённых участков.'] },
          { heading: 'Рулонный газон или посев', paragraphs: ['Рулонный газон создаёт готовую травяную поверхность после укладки, тогда как посеву требуется время для прорастания и уплотнения. Выбор зависит от сроков, сезона, бюджета, площади и возможности дальнейшего ухода.', 'В обоих случаях важны подготовка почвы, равномерная подача воды и подходящий режим в начальный период.'] },
          { heading: 'Что может включать устройство газона', paragraphs: ['Объём работ определяется состоянием участка и желаемым результатом. Возможные этапы:'], bullets: ['Очистка и подготовка территории', 'Формирование и выравнивание основания', 'Укладка рулонного газона или посев', 'Организация полива и первоначального ухода', 'Обновление и восстановление отдельных участков'] },
          { heading: 'Полив и дальнейший уход', paragraphs: ['Водный режим важен для укоренения нового рулонного газона и развития молодой травы. Настройки зависят от сезона, почвы, освещённости и типа травосмеси. При автоматическом поливе зоны и программы должны учитывать газон.', 'После укоренения уход включает стрижку, наблюдение за проблемными участками и сезонные корректировки по фактическому состоянию.'] },
          { heading: 'Газоны на Южном Черноморье', paragraphs: ['В Несебре, Равде, Солнечном Береге, Святом Власе, Ахелое и Поморие выбор травосмеси и режим ухода нужно соотносить с освещённостью, почвой, летними условиями и доступным поливом. Решение подбирается для конкретного участка.'] },
        ],
        faqHeading: 'Частые вопросы о газонах',
        faqs: [
          { question: 'Что лучше — рулонный газон или посев?', answer: 'Это зависит от сезона, площади, бюджета и желаемых сроков. Рулонный газон даёт готовое покрытие после укладки, а посеву требуется время на прорастание и развитие.' },
          { question: 'Нужен ли автоматический полив?', answer: 'Он может облегчить поддержание равномерного режима, но система должна учитывать площадь, источник воды и тип травы.' },
          { question: 'Можно ли восстановить старый газон?', answer: 'Да. После оценки причин повреждения можно определить, достаточно ли локального восстановления или нужна полная подготовка.' },
        ],
        serviceHeading: 'Услуги по устройству газонов',
        emptyServices: 'В этом направлении нет опубликованных услуг. Свяжитесь с Florial для оценки газона.',
        allServices: 'Все услуги',
        learnMore: 'Подробнее',
      },
      en: {
        title: 'Lawn installation, renovation and care',
        metaTitle: 'Lawn Installation in Nessebar and Ravda | Florial',
        metaDescription: 'Site preparation, turf laying and lawn installation in Nessebar, Ravda, Sunny Beach and nearby areas. Florial.',
        intro: 'A successful lawn depends on more than the seed mix or turf. Ground preparation, drainage and appropriate watering all matter. Florial provides lawn installation and renovation options based on the condition of the site and how the garden will be used.',
        sections: [
          { heading: 'Preparing the ground', paragraphs: ['Before installation, the existing soil, slopes, drainage, access and expected lawn use should be assessed. The base needs even preparation to reduce puddling, unevenness and inconsistent growth.', 'The approach depends on the property: a new garden, renovation of an existing lawn or repair of damaged areas.'] },
          { heading: 'Turf or seed', paragraphs: ['Rolled turf provides an established-looking surface after laying, while seeding needs time to germinate and develop. The choice depends on timing, season, budget, area and the care available afterwards.', 'Both options rely on suitable soil preparation, even water distribution and an appropriate watering routine during establishment.'] },
          { heading: 'What lawn work can include', paragraphs: ['The scope is agreed according to the site condition and desired result. Possible tasks include:'], bullets: ['Clearing and preparing the area', 'Shaping and levelling the base', 'Laying rolled turf or seeding', 'Organising irrigation and initial aftercare', 'Renovating and repairing selected areas'] },
          { heading: 'Watering and ongoing care', paragraphs: ['Water management matters while new turf establishes and young grass develops. Settings depend on the season, soil, exposure and grass mix. Where automatic irrigation is installed, zones and programmes should suit the lawn.', 'Once established, care includes mowing, monitoring weak areas and seasonal adjustments based on actual conditions.'] },
          { heading: 'Lawns on Bulgaria’s southern Black Sea coast', paragraphs: ['In Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy and Pomorie, grass selection and care should reflect sunlight, soil, summer conditions and available irrigation. The right approach is site-specific.'] },
        ],
        faqHeading: 'Lawn care questions',
        faqs: [
          { question: 'Which is better: turf or seed?', answer: 'It depends on the season, area, budget and timing. Turf provides an established surface after laying, while seed needs time to germinate and grow.' },
          { question: 'Is automatic irrigation necessary?', answer: 'It can make consistent watering easier, but the system should be designed around the area, water source and grass type.' },
          { question: 'Can an old lawn be restored?', answer: 'Yes. After identifying the cause of damage, it is possible to decide whether local repairs are enough or the area needs full preparation.' },
        ],
        serviceHeading: 'Lawn services',
        emptyServices: 'There are no published services in this direction at the moment. Contact Florial to discuss your lawn.',
        allServices: 'All services',
        learnMore: 'Learn more',
      },
    },
  },
]

interface ServiceDirectionPageProps {
  directionSlug: string
  services: ServiceItem[]
  rolePhotos: ServiceRolePhoto[]
  loading?: boolean
  directionDocument?: any
}

export function getServiceDirectionBySlug(slug: string) {
  return DIRECTIONS.find((direction) => direction.slug === slug)
}

export function getServiceDirectionForCategory(category?: string) {
  return DIRECTIONS.find((direction) => direction.categories.includes(category || ''))
}

export function ServiceDirectionPage({ directionSlug, services, rolePhotos, loading = false, directionDocument }: ServiceDirectionPageProps) {
  const { language, localize } = useI18n()
  const direction = getServiceDirectionBySlug(directionSlug)
  const locale = (language === 'ru' || language === 'en' ? language : 'bg') as 'bg' | 'ru' | 'en'
  const storedCopy = directionDocument?.translations?.[locale]
  const copy: LocaleCopy | undefined = direction && storedCopy ? {
    title: storedCopy.title || direction.copy[locale].title,
    metaTitle: storedCopy.metaTitle || direction.copy[locale].metaTitle,
    metaDescription: storedCopy.metaDescription || direction.copy[locale].metaDescription,
    intro: storedCopy.intro || direction.copy[locale].intro,
    sections: Array.isArray(storedCopy.sections) && storedCopy.sections.length
      ? storedCopy.sections.map((section: any) => ({
          heading: section.heading || '',
          paragraphs: toPlainText(section.body).split(/\n+/).map((value: string) => value.trim()).filter(Boolean),
        }))
      : direction.copy[locale].sections,
    faqHeading: storedCopy.faqHeading || direction.copy[locale].faqHeading,
    faqs: Array.isArray(storedCopy.faqs) && storedCopy.faqs.length ? storedCopy.faqs : direction.copy[locale].faqs,
    serviceHeading: storedCopy.serviceHeading || direction.copy[locale].serviceHeading,
    emptyServices: storedCopy.emptyServices || direction.copy[locale].emptyServices,
    allServices: storedCopy.allServices || direction.copy[locale].allServices,
    learnMore: storedCopy.learnMore || direction.copy[locale].learnMore,
  } : direction?.copy[locale]
  const photo = direction ? rolePhotos.find((item) => item.slug === direction.photoSlug) : undefined
  const categories: string[] = Array.isArray(directionDocument?.serviceCategories) && directionDocument.serviceCategories.length
    ? directionDocument.serviceCategories
    : (direction?.categories || [])
  const heroImageUrl = directionDocument?.imageUrl || photo?.imageUrl
  const heroImageAlt = (locale === 'ru' ? directionDocument?.imageAltRu : locale === 'en' ? directionDocument?.imageAltEn : directionDocument?.imageAlt) || (locale === 'ru' ? photo?.imageAltRu : locale === 'en' ? photo?.imageAltEn : photo?.imageAlt) || direction?.title[locale] || ''
  const entries = useMemo(() => {
    if (!direction) return []
    return getOrderedServiceEntries(services).filter((entry) =>
      entry.kind === 'delivery'
        ? categories.includes('delivery')
        : categories.includes(entry.service.serviceCategory || '')
    )
  }, [services, direction, directionDocument, categories.join('|')])

  useEffect(() => {
    if (!direction || !copy) return
    const path = '/services/category/' + direction.slug
    const url = 'https://florial-bg.com' + path
    applyPageSeo({
      fallbackTitle: copy.metaTitle,
      fallbackDescription: copy.metaDescription,
      language: locale,
      alternates: {
        bg: url,
        ru: url + '?lang=ru',
        en: url + '?lang=en',
        'x-default': url,
      },
    })
    setStructuredData('service-direction-breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: locale === 'ru' ? 'Главная' : locale === 'en' ? 'Home' : 'Начало', item: 'https://florial-bg.com/' },
        { '@type': 'ListItem', position: 2, name: copy.allServices, item: 'https://florial-bg.com/services' },
        { '@type': 'ListItem', position: 3, name: direction.title[locale], item: url },
      ],
    })
    setStructuredData('service-direction-collection', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: copy.title,
      description: copy.metaDescription,
      url,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: entries.length,
        itemListElement: entries.slice(0, 50).flatMap((entry, index) => {
          if (entry.kind === 'delivery') return [{
            '@type': 'ListItem',
            position: index + 1,
            name: locale === 'ru' ? 'Доставка оборудования для полива' : locale === 'en' ? 'Irrigation equipment delivery' : 'Доставка на оборудване за поливане',
            url: 'https://florial-bg.com/services/dostavka-poliv',
          }]
          const slug = entry.service.slug?.current || ''
          if (!slug) return []
          return [{
            '@type': 'ListItem',
            position: index + 1,
            name: String(localize(entry.service, 'name') || entry.service.name),
            url: 'https://florial-bg.com/services/' + encodeURIComponent(slug),
          }]
        }),
      },
    })
  }, [direction, copy, locale, entries, localize])

  if (!direction || !copy) return null

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <a href={localizedHref('/', locale)} className="hover:text-emerald-700 no-underline">{locale === 'ru' ? 'Главная' : locale === 'en' ? 'Home' : 'Начало'}</a>
        <span aria-hidden="true">/</span>
        <a href={localizedHref('/services', locale)} className="hover:text-emerald-700 no-underline">{copy.allServices}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-slate-700">{direction.title[locale]}</span>
      </nav>

      <header className="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">
        {heroImageUrl && <img {...getSanityImageProps(heroImageUrl, '(min-width: 768px) 896px, 100vw', 1200)} alt={heroImageAlt} loading="eager" fetchPriority="high" decoding="async" className="mb-7 max-h-[420px] w-full rounded-2xl object-cover" />}
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-800">Florial · {direction.title[locale]}</p>
        <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">{copy.title}</h1>
        <p className="text-lg leading-8 text-slate-600">{copy.intro}</p>
      </header>

      <article className="mx-auto max-w-4xl">
        {copy.sections.map((section) => (
          <section key={section.heading} className="mb-9">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index} className="mb-4 leading-8 text-slate-600">{paragraph}</p>)}
            {section.bullets && <ul className="mb-5 list-disc space-y-2 pl-6 leading-7 text-slate-600">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
      </article>

      <section className="mx-auto my-12 max-w-5xl" aria-labelledby="direction-services-heading">
        <h2 id="direction-services-heading" className="mb-5 text-2xl font-bold text-slate-900 md:text-3xl">{copy.serviceHeading}</h2>
        {loading ? <p className="py-8 text-slate-500">{locale === 'ru' ? 'Загрузка услуг…' : locale === 'en' ? 'Loading services…' : 'Зареждане на услугите…'}</p> : entries.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              if (entry.kind === 'delivery') return (
                <a key="service-delivery" href={localizedHref('/services/dostavka-poliv', locale)} className="rounded-2xl border border-[#DDE3D0] bg-white p-5 font-semibold text-emerald-800 no-underline shadow-sm hover:shadow-md">
                  {locale === 'ru' ? 'Доставка оборудования и консультация инженера' : locale === 'en' ? 'Irrigation equipment delivery and engineer consultation' : 'Доставка на оборудване и консултация с инженер'}
                </a>
              )
              const service = entry.service
              const slug = service.slug?.current || ''
              return (
                <a key={service._id} href={localizedHref('/services/' + encodeURIComponent(slug), locale)} className="flex flex-col overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white no-underline shadow-sm transition hover:shadow-md">
                  {service.imageUrl && <img {...getSanityImageProps(service.imageUrl, '(min-width: 1024px) 33vw, 100vw', 640)} alt={String(localize(service, 'name') || service.name)} loading="lazy" decoding="async" className="h-48 w-full object-cover" />}
                  <span className="flex flex-1 flex-col p-5">
                    <span className="mb-2 text-lg font-bold text-slate-900">{localize(service, 'name')}</span>
                    <span className="flex-1 text-sm leading-6 text-slate-600">{localize(service, 'shortDescription')}</span>
                    <span className="mt-4 font-semibold text-emerald-800">{copy.learnMore} →</span>
                  </span>
                </a>
              )
            })}
          </div>
        ) : <p className="rounded-xl bg-slate-50 p-5 text-slate-600">{copy.emptyServices}</p>}
      </section>

      <section className="mx-auto my-12 max-w-4xl" aria-labelledby="direction-faq-heading">
        <h2 id="direction-faq-heading" className="mb-5 text-2xl font-bold text-slate-900">{copy.faqHeading}</h2>
        <div className="space-y-3">
          {copy.faqs.map((faq) => <details key={faq.question} className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-semibold text-slate-800">{faq.question}</summary>
            <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
          </details>)}
        </div>
      </section>

      <div className="mx-auto mb-10 flex max-w-4xl flex-wrap justify-center gap-4 text-sm font-semibold">
        <a href={localizedHref('/services', locale)} className="text-emerald-800 underline underline-offset-4">{copy.allServices}</a>
        <a href={localizedHref('/contacts', locale)} className="text-emerald-800 underline underline-offset-4">{locale === 'ru' ? 'Связаться с Florial' : locale === 'en' ? 'Contact Florial' : 'Свържете се с Florial'}</a>
      </div>
    </main>
  )
}
