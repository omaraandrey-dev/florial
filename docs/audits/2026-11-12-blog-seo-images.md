# Florial — SEO и изображения блога: аудит и редакционный пакет

**Дата:** 12.11.2026  
**Источник данных:** Sanity `bxvcy0qs/production`, perspective `published`; GitHub `main` на `d878f661a45947a373c55dc137a66440f8b62168`.  
**Статус:** read-only аудит и предлагаемые тексты. Никаких изменений Sanity Production не выполнялось.

## 1. Объём и подтверждённые результаты

- Проверены 14 опубликованных `blogPost`, 42 локализованные версии BG/RU/EN.
- Во всех 42 версиях `shortDescription` полностью совпадает с `seoDescription`. Это не даёт отдельного краткого анонса для карточки и уникального описания для поисковой выдачи.
- Все 42 `seoDescription` используют один общий шаблон «Полезна информация от Florial / Useful advice from Florial» и общий хвост про сад, озеленение и полив.
- 24 из 42 SEO title длиннее 60 символов; два длиннее 70: BG у `landshaften-dizain-proekt-zasazhdenie` (75) и EN у `etapi-montazh-avtomatichna-polivna-instalatsiya` (73). Длина — ориентир, не самостоятельная ошибка.
- Во всех 14 документах заполнены `coverAlt` для BG/RU/EN; у всех проверенных Portable Text image blocks есть ALT во всех трёх языковых версиях. Не следует массово переписывать корректные ALT.
- В 4 из 14 болгарских версий (`kupete-travna-plosht`, `landshaften-dizain-proekt-zasazhdenie`, `landshaften-proekt-nesebar`, `maslina-sredizemnomorie`) есть Markdown-подобные фрагменты `![...]` в Portable Text. Текущий `BlogContent.tsx` не разбирает Markdown: обычные блоки выводятся как абзацы, изображения выводятся только для `_type == "image"`. Следовательно, эти фрагменты не превращаются в изображения автоматически.
- В четырёх BG-версиях обнаружено 6 старых Wix CDN URL в `markDefs.href`: `kupete-travna-plosht` (1), `landshaften-dizain-proekt-zasazhdenie` (1), `landshaften-proekt-nesebar` (1), `maslina-sredizemnomorie` (3). RU/EN matching Wix URL в этих документах не обнаружены.
- В 9 из 14 статей обложка повторно используется как изображение внутри Portable Text. Это может быть намеренным повтором, поэтому автоматически удалять нельзя.
- Один Sanity asset 1000×638 используется как обложка в двух статьях: `landshaften-proekt-nesebar` и `landshaften-proekt-zima-burgas`. Нужно визуально подтвердить, что это уместно для обеих публикаций.
- Минимальные размеры, требующие ручного просмотра: 179×131 (эскиз в `etapi-landshaften-proekt-nesebar`), 220×120 GIF (`rain-bird-oborudvane`), 266×246 (`cena-sistema-avtomatichno-napoyavane-burgas`). Размер не доказывает плохое качество, но может быть недостаточен для крупного отображения.

## 2. Проверка кода и способ отображения

- `src/lib/blog.ts`: локализованные версии получают собственные `title`, `shortDescription`, `body`, `seoTitle`, `seoDescription`, `coverAlt`; локализованные значения выбираются перед BG fallback.
- `src/pages/BlogPostPage.tsx`: H1 страницы — `content.title`; SEO title/description передаются в `applyPageSeo`; cover alt берётся из `content.coverAlt`; галерея использует `blogImageAlt`.
- `src/components/BlogContent.tsx`: Portable Text image blocks отображаются с `blogImageAlt`; ссылки из `markDefs` рендерятся как ссылки только при наличии соответствующего mark у span. Markdown image syntax не парсится.
- В текущей схеме `blogPost` нет отдельного поля H1. Не добавлять его. Текущий H1 — локализованное `translations.*.title`.
- Для SEO metadata используются `translations.*.seoTitle` и `translations.*.seoDescription`. Поэтому предлагаемый пакет заполняет именно существующие поля; схема и frontend не требуют изменения.

## 3. Предлагаемые SEO-тексты

Тексты ниже — редакционный вариант для проверки владельцем. Они не опубликованы. `shortDescription` предназначен для карточки/вводного анонса; `seoDescription` описывает конкретное содержание страницы. Цены, наличие и гарантии намеренно не упоминаются, поскольку часть исходных публикаций содержит старые коммерческие сведения.

### cena-sistema-avtomatichno-napoyavane-burgas

**BG**

- `shortDescription`: Разберете кои фактори формират цената на автоматичната поливна система: форма на терена, зони, разпръсквачи, капково напояване и водно налягане.
- `seoTitle`: Цена на автоматична поливна система в Бургас | Florial
- `seoDescription`: Вижте как формата на двора, пътеките, растенията и водното налягане влияят върху цената на автоматичния полив. Консултация в района на Несебър.

**RU**

- `shortDescription`: Разберитесь, из чего складывается стоимость автоматического полива: форма участка, зоны, дождеватели, капельные линии и давление воды.
- `seoTitle`: Стоимость автоматического полива в Бургасской области | Florial
- `seoDescription`: Узнайте, как форма участка, дорожки, растения и давление воды влияют на стоимость автоматического полива. Обсудим решение для вашего сада в районе Несебра.

**EN**

- `shortDescription`: Learn what shapes an automatic irrigation estimate, from garden layout and paths to watering zones, sprinklers, drip lines and available water pressure.
- `seoTitle`: Automatic Irrigation Cost in the Burgas Region | Florial
- `seoDescription`: See how garden layout, paths, planting and water pressure affect an automatic irrigation system. Florial helps assess irrigation needs around Nessebar.

### sistema-magluvane-terasa-besedka

**BG**

- `shortDescription`: Вижте как работи системата за мъглуване за тераси и беседки, от какви компоненти се състои и как създава по-комфортна прохлада на открито.
- `seoTitle`: Система за мъглуване за тераса и беседка | Florial
- `seoDescription`: Разгледайте принципа на работа и компонентите на система за мъглуване за тераси, беседки и зони около басейни. Вижте демонстрацията в градински център Florial.

**RU**

- `shortDescription`: Как устроена система туманообразования для террасы или беседки, из каких компонентов она состоит и где её удобно использовать на открытом воздухе.
- `seoTitle`: Система туманообразования для террасы и беседки | Florial
- `seoDescription`: Узнайте, как работает система туманообразования для террас и зон отдыха у бассейна. Демонстрационный комплект можно увидеть в садовом центре Florial.

**EN**

- `shortDescription`: Discover how an outdoor misting system works, which components it uses and how it can make terraces, gazebos and poolside seating more comfortable.
- `seoTitle`: Outdoor Misting System for Terraces and Gazebos | Florial
- `seoDescription`: Explore an outdoor misting system for terraces, gazebos and poolside areas. See the demonstration setup at Florial Garden Centre.

### rozi-sympathy

**BG**

- `shortDescription`: Запознайте се с катерливата роза Sympathy: особености на цъфтежа, подходящи опори и основни насоки за избор и отглеждане в градината.
- `seoTitle`: Катерлива роза Sympathy: цъфтеж и грижи | Florial
- `seoDescription`: Научете повече за катерливата роза Sympathy, нейния цъфтеж и приложението ѝ при арки, перголи и огради. Практични насоки за избор и отглеждане.

**RU**

- `shortDescription`: Познакомьтесь с плетистой розой Sympathy: особенности цветения, подходящие опоры и основные рекомендации по выбору и выращиванию в саду.
- `seoTitle`: Плетистая роза Sympathy: цветение и уход | Florial
- `seoDescription`: Узнайте о плетистой розе Sympathy, её цветении и использовании у арок, пергол и ограждений. Практические рекомендации по выбору и уходу за растением.

**EN**

- `shortDescription`: Meet the Sympathy climbing rose, with notes on its flowering habit, suitable supports and practical considerations for choosing and growing it in a garden.
- `seoTitle`: Sympathy Climbing Rose: Flowers and Care | Florial
- `seoDescription`: Learn about the Sympathy climbing rose and its use on arches, pergolas and fences, with practical guidance for choosing and caring for the plant.

### nov-vnos-palmi-2025

**BG**

- `shortDescription`: Архивен материал за доставката на палми през 2025 г. и видовете, представени тогава. Проверете актуалната наличност и пригодността на вида преди покупка.
- `seoTitle`: Палми за градината: избор и грижи | Florial
- `seoDescription`: Материалът представя вноса на палми през 2025 г. и насоки за избор според мястото, светлината и зимните условия. Актуалната наличност се потвърждава отделно.

**RU**

- `shortDescription`: Архивный материал о поставке пальм в 2025 году и представленных тогда видах. Перед покупкой уточняйте текущую доступность и пригодность растения для вашего участка.
- `seoTitle`: Пальмы для сада: выбор и уход | Florial
- `seoDescription`: В статье рассматривается поставка пальм 2025 года и выбор видов с учётом места, освещения и зимних условий. Актуальное наличие растений уточняется отдельно.

**EN**

- `shortDescription`: An archive of Florial’s 2025 palm shipment, with an overview of the species featured and points to consider when choosing palms for outdoor or indoor spaces.
- `seoTitle`: Palm Trees for Gardens: Selection and Care | Florial
- `seoDescription`: A look back at Florial’s 2025 palm shipment, with selection tips for location, light and winter conditions. Current availability must be confirmed separately.

### maslina-sredizemnomorie

**BG**

- `shortDescription`: Как да изберете място за маслина край морето: слънце, защита от студен вятър, подходяща почва, поливане и грижи след засаждане.
- `seoTitle`: Маслина в градината: избор и засаждане | Florial
- `seoDescription`: Практични насоки за избор и засаждане на маслина край морето: слънчево място, защита от студен вятър, дренирана почва и умерено поливане.

**RU**

- `shortDescription`: Как выбрать место для оливы у моря: солнечное освещение, защита от холодного ветра, подходящая почва, полив и уход после посадки.
- `seoTitle`: Олива в саду: выбор и посадка в Несебре | Florial
- `seoDescription`: Практические рекомендации по выбору и посадке оливы на побережье: солнечное место, защита от холодного ветра, дренированная почва и умеренный полив.

**EN**

- `shortDescription`: How to choose a place for an olive tree by the coast, considering sunlight, protection from cold winds, soil drainage, watering and care after planting.
- `seoTitle`: Olive Trees: Choosing and Planting in Nessebar | Florial
- `seoDescription`: Practical guidance for choosing and planting an olive tree on the coast, including sunlight, shelter from cold winds, well-drained soil and moderate watering.

### prodavane-traven-chim

**BG**

- `shortDescription`: Какво представлява рулонният тревен чим, как се подготвя теренът и какво е важно при доставката, полагането и първоначалното поливане.
- `seoTitle`: Рулонен тревен чим в Несебър: доставка и полагане | Florial
- `seoDescription`: Научете какво включва полагането на рулонен тревен чим — подготовка на основата, доставка, монтаж и първоначално поливане за добро прихващане.

**RU**

- `shortDescription`: Что представляет собой рулонный газон, как подготовить основание и на что обратить внимание при доставке, укладке и первом поливе.
- `seoTitle`: Рулонный газон в Несебре: доставка и укладка | Florial
- `seoDescription`: Узнайте, что включает укладка рулонного газона: подготовка основания, доставка, монтаж и первоначальный полив для успешного укоренения.

**EN**

- `shortDescription`: Learn what turf rolls are, how to prepare the ground and what matters during delivery, installation and the first watering period after laying.
- `seoTitle`: Rolled Turf in Nessebar: Delivery and Installation | Florial
- `seoDescription`: Find out what rolled turf installation involves, from ground preparation and delivery to laying and the initial watering needed for establishment.

### kiparis-totem

**BG**

- `shortDescription`: Описание на кипарис Тотем с тясна колонна корона и вечнозелена листна маса, плюс насоки за слънчево място, дренирана почва и поливане.
- `seoTitle`: Кипарис Тотем: характеристики и грижи | Florial
- `seoDescription`: Запознайте се с кипарис Тотем и неговата характерна колонна форма. Вижте основните изисквания за място, почва, поливане и поддръжка в градината.

**RU**

- `shortDescription`: Описание кипариса Тотем с узкой колонновидной кроной и вечнозелёной хвоей, а также рекомендации по освещению, дренажу почвы и поливу.
- `seoTitle`: Кипарис Тотем: особенности и уход | Florial
- `seoDescription`: Познакомьтесь с кипарисом Тотем и его характерной колонновидной формой. В статье собраны основные рекомендации по месту посадки, почве, поливу и уходу.

**EN**

- `shortDescription`: An introduction to Totem cypress, its narrow columnar shape and evergreen foliage, with guidance on sunlight, well-drained soil, watering and garden care.
- `seoTitle`: Totem Cypress: Features and Garden Care | Florial
- `seoDescription`: Discover the columnar Totem cypress and the main considerations for planting and caring for it, including site selection, soil drainage and watering.

### kupete-travna-plosht

**BG**

- `shortDescription`: Как да планирате покупката и полагането на рулонен газон в Слънчев бряг: сезон, подготовка на основата, доставка и поливане след монтажа.
- `seoTitle`: Рулонен газон в Слънчев бряг: доставка и полагане | Florial
- `seoDescription`: Планирате рулонен газон в Слънчев бряг? Вижте какво да предвидите при подготовката на терена, доставката, полагането и поливането след монтажа.

**RU**

- `shortDescription`: Как спланировать покупку и укладку рулонного газона в Солнечном Береге: сезон, подготовка основания, доставка и полив после монтажа.
- `seoTitle`: Рулонный газон в Солнечном Береге: доставка и укладка | Florial
- `seoDescription`: Планируете рулонный газон в Солнечном Береге? Узнайте, что предусмотреть при подготовке участка, доставке, укладке и поливе после монтажа.

**EN**

- `shortDescription`: How to plan rolled turf in Sunny Beach, from choosing the season and preparing the ground to delivery, installation and watering after the work.
- `seoTitle`: Rolled Turf in Sunny Beach: Delivery and Laying | Florial
- `seoDescription`: Planning rolled turf in Sunny Beach? See what to consider when preparing the site, arranging delivery, laying the turf and watering it after installation.

### etapi-montazh-avtomatichna-polivna-instalatsiya

**BG**

- `shortDescription`: Проследете основните етапи на изграждане на автоматична поливна система — от подготовката и изкопите до монтажа на оборудването, настройката и теста.
- `seoTitle`: Монтаж на автоматична поливна система: етапи | Florial
- `seoDescription`: Вижте как протича монтажът на автоматична поливна система — маркиране, полагане на тръби, монтаж на клапани и контролер, настройка и проверка.

**RU**

- `shortDescription`: Основные этапы монтажа автоматического полива: подготовка участка, траншеи, прокладка труб, установка оборудования, настройка и проверка системы.
- `seoTitle`: Монтаж автоматического полива: основные этапы | Florial
- `seoDescription`: Узнайте, как проходит монтаж автоматического полива: разметка участка, прокладка труб, установка клапанов и контроллера, настройка и проверка системы.

**EN**

- `shortDescription`: Follow the main stages of an automatic irrigation installation, from site preparation and trenching to equipment fitting, controller setup and system testing.
- `seoTitle`: Automatic Irrigation Installation: Main Steps | Florial
- `seoDescription`: See how an automatic irrigation system is installed, including site marking, pipework, valve and controller fitting, setup and final system checks.

### rain-bird-oborudvane

**BG**

- `shortDescription`: Преглед на оборудването Rain Bird за автоматично напояване: контролери, капкови тръби и функции за управление на отделните поливни зони.
- `seoTitle`: Оборудване Rain Bird за автоматично напояване | Florial
- `seoDescription`: Разгледайте основни решения Rain Bird за автоматично напояване — контролери, капкови тръби и функции за управление на поливните зони в градината.

**RU**

- `shortDescription`: Обзор оборудования Rain Bird для автоматического полива: контроллеры, капельные трубки и функции управления отдельными зонами орошения.
- `seoTitle`: Оборудование Rain Bird для автоматического полива | Florial
- `seoDescription`: Познакомьтесь с решениями Rain Bird для автоматического полива: контроллерами, капельными трубками и функциями управления зонами сада.

**EN**

- `shortDescription`: An overview of Rain Bird irrigation equipment, including controllers, dripline and features that help manage separate watering zones in a garden.
- `seoTitle`: Rain Bird Equipment for Automatic Irrigation | Florial
- `seoDescription`: Explore Rain Bird automatic irrigation equipment, including controllers, dripline and features for managing separate watering zones around the garden.

### landshaften-dizain-proekt-zasazhdenie

**BG**

- `shortDescription`: Как се създава цялостен ландшафтен проект: зониране, подбор на растения, поливна система, подготовка на терена и последователност на озеленяването.
- `seoTitle`: Ландшафтен дизайн: от проекта до озеленяването | Florial
- `seoDescription`: Вижте как ландшафтният проект свързва зонирането, избора на растения, автоматичното напояване и подготовката на терена в цялостен план за озеленяване.

**RU**

- `shortDescription`: Как создаётся ландшафтный проект: зонирование, подбор растений, система полива, подготовка участка и последовательность работ по озеленению.
- `seoTitle`: Ландшафтный дизайн: от проекта до озеленения | Florial
- `seoDescription`: Узнайте, как ландшафтный проект объединяет зонирование, подбор растений, автоматический полив и подготовку участка в единый план благоустройства.

**EN**

- `shortDescription`: How a complete landscape design takes shape, bringing together garden zoning, plant selection, irrigation planning, site preparation and planting work.
- `seoTitle`: Landscape Design: From Plan to Planting | Florial
- `seoDescription`: See how a landscape plan brings together garden zones, plant selection, automatic irrigation and site preparation to guide the landscaping process.

### landshaften-proekt-zima-burgas

**BG**

- `shortDescription`: Защо зимата е подходящ момент за планиране на градината: концепция, зониране, подбор на растения и подготовка за пролетното озеленяване.
- `seoTitle`: Ландшафтен дизайн през зимата в Бургас | Florial
- `seoDescription`: Планирането през зимата дава време за концепция, зониране и избор на растения преди пролетните работи. Идеи за ландшафтен проект в района на Бургас.

**RU**

- `shortDescription`: Почему зима подходит для планирования сада: разработка концепции, зонирование, подбор растений и подготовка к весеннему озеленению.
- `seoTitle`: Ландшафтный дизайн зимой в Бургасе | Florial
- `seoDescription`: Зимнее планирование оставляет время для концепции, зонирования и выбора растений до начала весенних работ. Идеи для ландшафтного проекта в районе Бургаса.

**EN**

- `shortDescription`: Why winter can be a useful time to plan a garden, develop its concept, define zones, select plants and prepare for spring landscaping.
- `seoTitle`: Winter Landscape Design Planning in Burgas | Florial
- `seoDescription`: Winter planning allows time to develop a garden concept, define zones and select plants before spring work begins. Ideas for landscape design around Burgas.

### landshaften-proekt-nesebar

**BG**

- `shortDescription`: Как протича разработването на ландшафтен проект в Несебър: оглед на имота, скица, функционални зони, работни планове и подготовка за изпълнение.
- `seoTitle`: Ландшафтен проект в Несебър: етапи и съдържание | Florial
- `seoDescription`: Научете какво включва ландшафтният проект в Несебър — оглед, концепция, зониране, дендроплан, работни чертежи и подготовка за озеленяване.

**RU**

- `shortDescription`: Как разрабатывается ландшафтный проект в Несебре: осмотр участка, эскиз, функциональные зоны, рабочие планы и подготовка к реализации.
- `seoTitle`: Ландшафтный проект в Несебре: этапы и состав | Florial
- `seoDescription`: Узнайте, что включает ландшафтный проект в Несебре: осмотр участка, концепцию, зонирование, дендроплан, рабочие чертежи и подготовку к озеленению.

**EN**

- `shortDescription`: How a landscape design project develops in Nessebar, from the site visit and concept sketch to garden zones, working plans and preparation for implementation.
- `seoTitle`: Landscape Design Project in Nessebar: Stages | Florial
- `seoDescription`: Learn what a landscape design project in Nessebar can include, from a site visit and concept to garden zoning, planting plans and preparation for landscaping.

### etapi-landshaften-proekt-nesebar

**BG**

- `shortDescription`: Подробно представяне на етапите на ландшафтното проектиране — от скица и генерален план до дендроплан, списък с растения и 3D визуализация.
- `seoTitle`: Етапи на ландшафтно проектиране в Несебър | Florial
- `seoDescription`: Проследете етапите на ландшафтното проектиране в Несебър: скица, генерален план, разпределение, дендроплан, асортимент на растенията и визуализация.

**RU**

- `shortDescription`: Подробно об этапах ландшафтного проектирования: от эскиза и генерального плана до дендроплана, ведомости растений и 3D-визуализации.
- `seoTitle`: Этапы ландшафтного проектирования в Несебре | Florial
- `seoDescription`: Разберитесь в этапах ландшафтного проектирования в Несебре: эскиз, генеральный план, планировка, дендроплан, подбор растений и визуализация.

**EN**

- `shortDescription`: A detailed look at landscape design stages, from the initial sketch and master plan to layout drawings, planting plans, plant schedules and 3D visualisation.
- `seoTitle`: Landscape Design Stages in Nessebar | Florial
- `seoDescription`: Explore the stages of landscape design in Nessebar, including the concept sketch, master plan, layout, planting plan, plant schedule and visualisation.

## 4. Изображения: точечные рекомендации

### 4.1. Старые Wix-вставки

Нужно восстановить шесть исходных изображений из Wix CDN как реальные Sanity image blocks либо удалить их, если после проверки они не добавляют самостоятельной ценности:

- `kupete-travna-plosht`: один Wix URL; сейчас блок содержит текстовую конструкцию `![...](/)`.
- `landshaften-dizain-proekt-zasazhdenie`: один Wix URL; тот же тип legacy-вставки.
- `landshaften-proekt-nesebar`: один Wix URL; тот же тип legacy-вставки.
- `maslina-sredizemnomorie`: три Wix URL; подписи относятся к рулонному газону, кипарису Тотем и юкке рострата, то есть это скорее старые навигационные/превью-картинки, а не ключевые изображения статьи об оливе.

Не заменять эти URL догадками и не загружать изображения в Sanity, пока оригиналы не проверены визуально. Firecrawl live scrape на момент аудита недоступен из-за исчерпанного лимита; HTTP-доступность оригинальных Wix URL и визуальное содержание не подтверждены.

### 4.2. ALT, которые нужно исправить после визуальной сверки

- `cena-sistema-avtomatichno-napoyavane-burgas`: болгарский ALT одного изображения содержит русский текст и географию Одессы. Предлагаемый вариант после подтверждения сюжета: `План на тревна площ с алеи при проектиране на автоматично напояване`.
- `sistema-magluvane-terasa-besedka`: один BG ALT написан по-русски (`Система туманообразования Равда`). Предлагаемый болгарский вариант: `Система за мъглуване в Равда`.
- `maslina-sredizemnomorie`: BG ALT `olive tree несебър` смешивает языки. Предлагаемый вариант: `Маслиново дърво в Несебър`.
- `kupete-travna-plosht`: BG ALT `Купувам рулонна тревна площ Слънчев бряг Несебър` неестествен. Предлагаемый вариант: `Рулонна тревна площ в Слънчев бряг`.

ALT должен описывать фактическое изображение, а не быть списком ключевых слов. Предложения выше требуют подтверждения визуального содержания.

### 4.3. Повторы и качество исходников

- 9 статей повторяют cover asset в body. Сначала проверить визуальный порядок и роль повторного изображения; удалить только явные дубли, не затрагивая полезные иллюстрации.
- `landshaften-proekt-nesebar` и `landshaften-proekt-zima-burgas` используют один cover asset 1000×638. Проверить, что фотография действительно иллюстрирует обе темы.
- `etapi-landshaften-proekt-nesebar`: эскиз 179×131 — рекомендуется найти исходник большего разрешения или оставить его только как небольшой иллюстративный thumbnail.
- `rain-bird-oborudvane`: GIF 220×120 — проверить, несёт ли анимация смысл; при необходимости заменить более качественным оригиналом или статичным изображением.
- `cena-sistema-avtomatichno-napoyavane-burgas`: изображение 266×246 — проверить, читаемо ли оно на мобильном и desktop.

### 4.4. Что не делать

- Не удалять Sanity assets: один asset может использоваться в нескольких документах.
- Не заменять все cover images только из-за повторения в body.
- Не создавать altEn/altRu на каждом image object, если язык уже представлен отдельной версией Portable Text и frontend получает локализованный `alt` из соответствующего языка.
- Не менять схему, URL статей, CTA, существующие коммерческие ссылки и опубликованный текст без отдельной проверки.

## 5. Дополнительные редакционные риски, не включённые в SEO-поля

- `nov-vnos-palmi-2025` — историческая публикация о поставке 2025 года; не позиционировать как подтверждение текущего наличия.
- Статья о системе мъглуване содержит старую цену в лева; не переносить её в сниппет до проверки актуальной цены в EUR.
- Статьи о розе и кипарисе также содержат коммерческие цены/наличие, которые нужно сверить с текущим каталогом Sanity перед обновлением основного текста.
- Статья Rain Bird содержит упоминание склада/сезона 2020; этот фрагмент требует отдельной редакционной актуализации.
- В нескольких старых статьях остаются внешние контакты/адреса и фрагменты ссылок DROP. Их проверка не входит в изменение SEO-полей и должна выполняться отдельно, чтобы не потерять нужные исторические сведения.

## 6. Предлагаемый порядок реализации после согласования

1. Владелец утверждает SEO-тексты или отмечает правки.
2. Перед Sanity write экспортировать точные 14 опубликованных документов и сохранить backup в GitHub.
3. Создать drafts для 14 документов, обновить только `translations.bg/ru/en.shortDescription`, `seoTitle`, `seoDescription` и отдельно согласованные ALT/legacy image blocks.
4. Проверить draft-документы по deployed schema и повторно прочитать все изменённые поля.
5. Публиковать только после отдельного согласования владельца.
6. После публикации проверить 14 URL на BG/RU/EN: H1, title, meta description, canonical/hreflang, карточку блога, изображения и отсутствие буквальных Markdown image fragments.
7. Обновить release notes, CHANGELOG, Technical Passport и Open Questions с точными IDs, backup path, Sanity validation и результатом live QA.

**Границы этого аудита:** Sanity Production не изменялся; schema, код, Cloudflare и маршруты не изменялись. Визуальное содержимое файлов изображений и HTTP status старых Wix URL остаются неподтверждёнными.
