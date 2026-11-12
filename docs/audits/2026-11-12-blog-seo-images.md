# Florial — SEO и изображения блога: аудит и редакционный пакет

**Дата:** 12.11.2026  
**Источник данных:** Sanity `bxvcy0qs/production`, perspective `published`; GitHub `main` на `d878f661a45947a373c55dc137a66440f8b62168`.  
**Статус:** SEO-аудит завершён; 14 статей опубликованы с обновлёнными SEO-полями 12.11.2026. Проверены 42 локализованные версии и 126 значений; post-publish read-back подтвердил 14/14. Шесть Wix originals восстановлены в Sanity Production 12.11.2026; подробности и ограничения — в разделе 8.

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

- `shortDescription`: Архивный материал о поставке пальм в 2025 году и представленных тогда видах. Перед покупкой уточняйте наличие и пригодность растения для участка.
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
- `seoTitle`: Winter Landscape Design in Burgas | Florial
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

Нужно восстановить шесть исходных изображений из Wix CDN как реальные Sanity image blocks либо удалить их, если после проверки они не добавляют самостоятельной ценности. Идентификаторы исходных Wix-файлов:

- `kupete-travna-plosht`: `1b6ca6_f2f038a39ea943b8964c6bb0c1423da2~mv2.jpg`.
- `landshaften-dizain-proekt-zasazhdenie`: `1b6ca6_c11c0aafe3574885bb942353fc16cd4f~mv2_d_1564_1564_s_2.jpg`.
- `landshaften-proekt-nesebar`: `1b6ca6_395078e18de74a14836bee8546e85872~mv2_d_1564_1564_s_2.jpeg`.
- `maslina-sredizemnomorie`: `1b6ca6_405e8b2ec7ef40baaee15d4fc677d3e0~mv2.jpg`, `1b6ca6_a668e1d25df74ae5ac333a71b9587e88~mv2.jpg`, `1b6ca6_d17f2bd62105424ca7831141e9d05daa~mv2.jpg`.



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

1. **Выполнено:** владелец одобрил запись SEO-полей в drafts; 14 опубликованных документов сохранены до записи.
2. **Выполнено:** полный snapshot 14 опубликованных документов (все поля и локализованные Portable Text массивы) сохранён в `docs/backups/2026-11-12-blog-seo-before-draft-write.json`.
3. **Выполнено:** созданы 14 drafts; изменены только `translations.bg/ru/en.shortDescription`, `seoTitle`, `seoDescription` — 126 значений. ALT, body, cover, gallery и schema не менялись.
4. **Выполнено:** повторное чтение подтвердило 14 drafts, 126/126 заполненных полей; сравнение с backup подтвердило, что все 126 SEO-полей опубликованных документов остались неизменными. Revision guard использован для каждого документа. Schema validation: 14/14 `valid`, но `complete=false`, так как beta validator не выполняет custom validation callbacks; требуется финальная проверка в Studio.
5. **Выполнено 12.11.2026:** владелец поручил исправить и опубликовать SEO-черновики; опубликованы все 14 документов с revision guards. После публикации read-back подтвердил 14/14, 0 drafts.
6. **Ожидает визуальной проверки:** восстановление шести Wix image references в четырёх BG-статьях как настоящих Sanity image blocks; проверка четырёх ALT-кандидатов, повторов cover и трёх небольших изображений.
7. **Ограничение проверки:** Firecrawl сообщил об исчерпании кредитов до выполнения запросов; прямое открытие Sanity CDN через доступный web viewer также недоступно. HTTP-доступность и визуальное содержимое старых Wix originals НЕ ПОДТВЕРЖДЕНЫ. Не заменять их без оригиналов/подтверждения владельца.
8. **PR #235 остаётся draft и не объединён.** Ветка содержит audit и полный backup; после визуальной проверки изображений обновить image follow-up и отдельно рассмотреть готовность документационного PR.

**Границы выполненных изменений:** в Sanity Production опубликованы только SEO/анонсные поля 14 blogPost (с уточнением 9 BG значений в четырёх документах). Исходные body, H1/title, cover, gallery, ALT, Wix href, schema, frontend, routes, Cloudflare settings и Production deployment не менялись. Полный backup исходных документов находится в ветке PR #235. Изображения остаются отдельной незавершённой задачей.


## 7. Повторная проверка изображений — 12.11.2026

Повторно сверены опубликованные Sanity Production документы и код именно актуального GitHub `main`:

- `src/components/BlogContent.tsx` (blob `c81ea2dd6fe2c106b8d1ebefa285b31320edae65`): изображения выводятся только для Portable Text block с `_type == "image"` и разрешённым `assetUrl`; Markdown image syntax в обычном тексте не разбирается.
- `src/lib/blog.ts` (blob `b788777c7c209bc20313972a00dbc083a85c3cdc`): Sanity image blocks получают URL через `asset->url`; исходные Markdown-ссылки не преобразуются в image blocks.

### Подтверждённые live-данные

- В четырёх болгарских статьях действительно остались 6 Wix CDN href в link markDefs. В самих Portable Text блоках это Markdown-текст вида `![описание](/)`, помеченный ссылкой на Wix URL, а не Sanity image block. Следовательно, текущий frontend не отображает их как изображения; текст Markdown выводится как обычный текст.
- Распределение: `kupete-travna-plosht` — 1; `landshaften-dizain-proekt-zasazhdenie` — 1; `landshaften-proekt-nesebar` — 1; `maslina-sredizemnomorie` — 3.
- Sanity assets, уже существующие в этих публикациях, прочитаны read-only. Например, в `cena-sistema-avtomatichno-napoyavane-burgas` действительно имеется image asset 266×246 с ALT, содержащим русский текст и Одессу; в `maslina-sredizemnomorie` три Wix-ссылки сопровождают markdown-подобные текстовые блоки, в то время как два других изображения уже являются настоящими Sanity image blocks.
- Повторный cover asset 1000×638 в статьях `landshaften-proekt-nesebar` и `landshaften-proekt-zima-burgas` также подтверждён по Sanity asset ID. Само по себе совпадение asset ID не доказывает визуальную уместность или неуместность повтора.

### Ограничение и решение по безопасности

- Firecrawl live retrieval на повторной проверке не выполнился: connected account исчерпал доступные кредиты; инструмент указал время восстановления суточного лимита 13.11.2026 06:10:06 UTC. Web viewer также не смог открыть Wix CDN и Sanity CDN image URLs. Прямой сетевой запрос из рабочей среды завершился DNS resolution error.
- Поэтому HTTP-доступность, визуальное содержимое и качество шести Wix originals **НЕ ПОДТВЕРЖДЕНЫ**. Нельзя достоверно сопоставить ALT с изображениями, загрузить оригиналы в Sanity или безопасно решить, что именно следует удалить/заменить.
- ALT-кандидаты из раздела 4.2 не менялись: для каждого требуется увидеть изображение. Никакие опубликованные Sanity документы и assets в этой повторной проверке не изменялись.
- Следующий безопасный шаг после восстановления доступа к источникам: получить визуальные копии оригиналов, сопоставить их с местом в тексте и затем перенести только полезные изображения в Sanity как image blocks с проверенными BG ALT. Перед любым Sanity write сохранить backup каждого затрагиваемого документа; после patch выполнить read-back и Studio preview. Не удалять исходные assets.


## 8. Восстановление шести изображений из Wix DROP — 12.11.2026

### Получение и визуальная сверка оригиналов

Предыдущая попытка через Firecrawl/CDN была неполной: она не использовала подключённый Wix-коннектор. Через Wix Media Manager сайта **DROP ландшафт сервис** выполнен read-only поиск точных file IDs, ранее сохранённых в Portable Text. Все шесть оригиналов существуют в медиатеке со статусами `state=OK`, `operationStatus=READY`. Получены визуальные превью и сопоставлены с исходными подписями.

| Статья / исходное назначение | Wix file ID | Новый Sanity asset | Размер |
|---|---|---|---:|
| `kupete-travna-plosht` — крупный план рулонной травы | `1b6ca6_f2f038a39ea943b8964c6bb0c1423da2~mv2.jpg` | `image-58cbaf809dfa5883067ea788477c891fdcef51ff-720x1169-jpg` | 720×1169 |
| `landshaften-dizain-proekt-zasazhdenie` — коллаж «от проекта до посадки» | `1b6ca6_c11c0aafe3574885bb942353fc16cd4f~mv2_d_1564_1564_s_2.jpg` | `image-d3fd144b938c3e9c67c3883d1d683c85cada39d0-1564x1564-jpg` | 1564×1564 |
| `landshaften-proekt-nesebar` — этапы ландшафтного проекта | `1b6ca6_395078e18de74a14836bee8546e85872~mv2_d_1564_1564_s_2.jpeg` | `image-0bb24a4f41c62ab97d270ce660227f1ad4796243-1564x1564-jpg` | 1564×1564 |
| `maslina-sredizemnomorie` — рулоны газона | `1b6ca6_405e8b2ec7ef40baaee15d4fc677d3e0~mv2.jpg` | `image-fab83fa1629a16e4c55e24e71cf63ca7b97a4a32-600x800-jpg` | 600×800 |
| `maslina-sredizemnomorie` — кипарисы Тотем | `1b6ca6_a668e1d25df74ae5ac333a71b9587e88~mv2.jpg` | `image-b8578d79532be0b53646b767084e31d39abbff10-1384x3000-jpg` | 1384×3000 |
| `maslina-sredizemnomorie` — юкка рострата | `1b6ca6_d17f2bd62105424ca7831141e9d05daa~mv2.jpg` | `image-44077349f1be666c383d730d4b920d5cf9098127-3000x2250-jpg` | 3000×2250 |

Оригинальные файлы загружены из Wix CDN непосредственно в Content Lake `bxvcy0qs/production`; Sanity сохранил исходные размеры/метаданные. У assets заполнена source attribution на Wix file ID. Сжатые превью использовались только для визуальной проверки; в Sanity загружены оригинальные файлы, не превью.

### Backup, запись и публикация

- Перед записью считаны и сохранены четыре полных опубликованных документа, все локали и Portable Text: `docs/backups/2026-11-12-blog-images-before-write.json` (260 475 байт, commit в ветке PR #235).
- Revision guard использован для четырёх документов. Шесть Markdown-подобных блоков заменены на настоящие Portable Text `_type: "image"` blocks с Sanity asset references, ALT BG/EN/RU и caption. Существующие `_key` сохранены, чтобы не менять порядок контента.
- Опубликованы четыре документа: `blogPost-kupete-travna-plosht`, `blogPost-landshaften-dizain-proekt-zasazhdenie`, `blogPost-landshaften-proekt-nesebar`, `blogPost-maslina-sredizemnomorie`.
- Post-publish read-back: 4/4 опубликованы; 0 drafts; шесть ожидаемых image blocks имеют asset references, CDN URL и размеры; прямой поиск Wix CDN href в целевых BG Portable Text блоках вернул 0 результатов.
- Beta schema validation: 4/4 `valid`, `complete=false` из-за того, что validator не выполняет custom validation callbacks. Hosted Studio visual QA отдельно не выполнена.

### Редакционная оговорка

В конце `maslina-sredizemnomorie` три исходных изображения показывают не оливу, а рулонный газон, кипарисы Тотем и юкку рострата. Они находились в исходном опубликованном body и были восстановлены в прежнем порядке и месте, без удаления контента. Их дальнейшая уместность в статье об оливе требует отдельного решения владельца; можно сохранить, перенести в тематические материалы или удалить после согласования.

### Границы и ограничения проверки

- Проверены по коду актуального `main`: `src/components/BlogContent.tsx` выводит Sanity image blocks, использует локализованный ALT и caption; `src/lib/blog.ts` получает asset URL. Поэтому изменения frontend/schema не требовались.
- Изменены только опубликованные Sanity assets и body четырёх blogPost; Wix сайт не менялся. Cloudflare Pages deployment не запускался и не нужен для content-only изменения.
- Независимый HTTP smoke к `cdn.sanity.io` через Wix proxy заблокирован самим proxy с HTTP 403 (`requests to cdn.sanity.io not allowed`). Sanity asset records и CDN URL подтверждены read-back, но отдельная внешняя проверка загрузки CDN остаётся неподтверждённой.
- GitHub `main` не изменялся. PR #235 остаётся Draft; backup и обновлённая документация находятся в ветке `docs/blog-seo-image-audit-2026-11-12`.



## 9. Проверка миниатюр, повторов и ALT — 12.11.2026

### 9.1. Восстановление оригиналов для малых изображений

Через Sanity asset metadata получены точные Wix source IDs и исходные file URLs; в Wix Media Manager проверены file descriptors, затем оригиналы скачаны Wix CDN напрямую и загружены в Sanity Production.

| Статья / изображение | Wix file | Старый asset | Новый asset | Решение |
|---|---|---:|---:|---|
| cena-sistema-avtomatichno-napoyavane-burgas — схема полива и дорожек | 1b6ca6_b2e82f467885441fa0736d60f62e1265~mv2.jpg | 266×246 | 925×855 | Заменён thumbnail оригиналом |
| godishna-poddruzhka-avtomatichni-sistemi — сад с работающим дождевателем | 1b6ca6_e202f6fce28846d4b7f0b0c4518e3e31~mv2.jpg | 147×147 | 2048×2048 | Заменён thumbnail оригиналом |
| etapi-landshaften-proekt-nesebar — эскизный план | 1b6ca6_bf0fd1fc9b6b4fe5a63de83499a01066~mv2.jpg | 179×131 | 640×468 | Заменён thumbnail исходным файлом Wix |

Размеры нового файла подтверждены Sanity asset metadata после загрузки. Оригинальный файл эскиза весит 25 372 байта; это доступный оригинал по точному Wix file ID, поэтому больший исходник для этого файла не подтверждён. Изображение остаётся техническим эскизом с мелкими подписями; для читаемости полного плана потребуется отдельный более качественный файл от владельца/дизайнера.

### 9.2. GIF Rain Bird

- Wix Media Manager подтверждает RainBirdLogo.gif, 3 116 байт, состояние OK, READY.
- Визуальная проверка показала, что это логотип Rain Bird, а не фотография оборудования. BG ALT исправлен на «Лого на Rain Bird».
- Текущий asset 220×120 оставлен без замены: формат GIF сам по себе не является проблемой для маленького inline logo; frame count/наличие анимации не подтверждены.

### 9.3. Исправленные ALT после визуального просмотра оригиналов

- cena-sistema-avtomatichno-napoyavane-burgas, блок b19: «Влияние на алеите в тревната площ върху цената на автоматичното напояване». Убраны русский язык и Одесса; описание согласовано с содержанием блока.
- kupete-travna-plosht, блок bx7: «Поливане на рулонна тревна площ с разпръсквач» — оригинал показывает полив рулонного газона.
- maslina-sredizemnomorie, блок bnb: «Маслиново дърво в Несебър».
- sistema-magluvane-terasa-besedka, блок b4y: «Тръба за система за мъглуване» — визуально это бухта трубы/шланга, а не готовая система туманообразования.
- rain-bird-oborudvane, блок b11r: «Лого на Rain Bird».
- kiparis-totem, блок brr: «Кипарис Тотем в градина в Несебър».

### 9.4. Точные повторы cover в body

Повторный запрос опубликованной выборки вернул 22 документа blogPost и 44 body image blocks. В 12 случаях translations.bg.body[].asset._ref точно совпадает с cover.asset._ref той же статьи. Это точные повторы asset reference, а не визуальное сравнение похожих фотографий. Не удалялись автоматически: в ряде статей inline image может быть намеренно привязано к конкретному разделу, а удаление меняет ритм/структуру материала.

Дополнительно cover asset image-8a3511916dcffd3d1e2502bc119413ff027817ce-1000x638-jpg используется в качестве cover в двух статьях: landshaften-proekt-nesebar и landshaften-proekt-zima-burgas; в обеих статьях этот же asset присутствует и в body. Требуется визуальное решение владельца: оставить общий project photo как релевантный кейс или заменить cover одной статьи на отдельный оригинал. Не удалять asset.

### 9.5. Backup, публикация и границы

- Полные backups до записи: docs/backups/2026-11-12-blog-small-images-before-write.json (2 docs), docs/backups/2026-11-12-blog-alt-before-write.json (6 docs), docs/backups/2026-11-12-blog-sketch-before-write.json (1 doc).
- Все соответствующие drafts опубликованы с revision guards. Post-publish read-back подтвердил новые asset refs/размеры и ALT; соответствующих drafts нет.
- Sanity validator: все затронутые документы valid, complete=false — custom callbacks не выполняются beta validator.
- Открытие страниц florial-bg.com и Sanity CDN через доступный browser viewer вернуло internal error; visual QA опубликованных страниц не подтверждена.
- Изменены только Sanity assets и content fields. GitHub code/schema, Wix site, Cloudflare Pages settings и deployment не менялись.

