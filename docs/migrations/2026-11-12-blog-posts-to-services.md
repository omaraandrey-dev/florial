# Перенос коммерческих материалов блога в услуги — 12.11.2026

**Статус:** перенос контента, связей Sanity и URL завершён; GitHub PR #226 объединён, Cloudflare Pages Production deployment успешен. Исходные документы не удалялись.

## Структура направлений

Использованы четыре существующих направления страницы \`/services\`:

- **Ландшафтный дизайн:** \`landscaping\`.
- **Системы полива:** \`irrigation\`, включая внутренние категории \`maintenance\` и \`delivery\`.
- **Услуги садовника:** \`planting\`.
- **Услуги газонщика:** \`lawn\`.

Пятое направление и изменения фильтра \`ServicesListPage\` не создавались.

## Перенесённые материалы

Sanity project \`bxvcy0qs\`, dataset \`production\`. Опубликованы восемь специализированных документов \`service\` с \`isActive=true\`, BG/RU/EN контентом, SEO, изображениями/галереями и формами заявки.

| Старая статья блога | Новая услуга | Направление |
|---|---|---|
| \`montazh-podmyana-remont-razpruskvachi-nesebar\` | \`montazh-podmyana-remont-razpruskvachi-nesebar\` | Системы полива |
| \`montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane\` | \`montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane\` | Системы полива |
| \`montazh-remont-elektromagnitni-klapani\` | \`montazh-remont-elektromagnitni-klapani\` | Системы полива |
| \`remont-modernizatsiya-polivni-sistemi\` | \`remont-modernizatsiya-polivni-sistemi\` | Системы полива / maintenance |
| \`godishna-poddruzhka-avtomatichni-sistemi\` | \`godishna-poddruzhka-avtomatichni-sistemi\` | Системы полива / maintenance |
| \`izgrazhdane-tsvetni-lehi\` | \`izgrazhdane-tsvetni-lehi\` | Услуги садовника |
| \`topiarna-rezitba-rasteniya\` | \`topiarna-rezitba-rasteniya\` | Услуги садовника |
| \`podmyana-stara-travna-plosht\` | \`podmyana-stara-travna-plosht\` | Услуги газонщика |

### Статья, оставленная в блоге

\`landshaften-dizain-proekt-zasazhdenie\` — проектный материал/пример выполненной работы. Общая услуга ландшафтного дизайна уже существует (\`c7d2c120-6024-4876-b240-ff6585df91e4\`), поэтому дублирующая услуга не создавалась. Статья остаётся опубликованной в блоге и связана с существующей услугой через \`relatedContent\`. Редирект на неё не настраивается.

## Перенос ссылок Sanity

До миграции обнаружены 99 товарных документов с \`relatedContent\` на четыре коммерческие статьи:

- 46 товаров — дождеватели;
- 23 товара — программаторы;
- 17 товаров — электромагнитные клапаны;
- 13 товаров — ремонт/модернизация полива.

После Production deployment 301 и до деактивации старых публикаций:

1. В 99 документах \`product\` ссылки \`relatedContent\` заменены с исходных \`blogPost\` IDs на соответствующие опубликованные \`service\` IDs.
2. Существующие остальные элементы \`relatedContent\` сохранены; дубликаты целевых ссылок не создавались.
3. Повторная проверка Production подтвердила: **99 товаров с новыми service-ссылками, 0 товаров со старыми ссылками** на четыре статьи.
4. Восемь старых blogPost документов получили \`isPublished=false\`. Документы и их IDs сохранены; физического удаления не было.
5. Проектная статья \`landshaften-dizain-proekt-zasazhdenie\` остаётся \`isPublished=true\`.

Порядок важен: в ProductPage связанные blogPost отображаются только при \`isPublished === true\`, а связанные service — при \`isActive !== false\`. Поэтому сначала ссылки товаров переведены на service IDs, затем старые статьи скрыты из блога.

## Backup

До Sanity writes сохранены:

- JSON snapshots девяти исходных blogPost: \`docs/backups/sanity-blog-to-services-2026-11-12/\`;
- snapshots пяти существующих service: \`docs/backups/sanity-services-before-blog-migration-2026-11-12/\`;
- field-level snapshot исходного \`relatedContent\` 100 документов (99 товаров и существующая услуга): \`docs/backups/sanity-blog-to-services-2026-11-12/related-content-before.json\`.

Это целевые rollback snapshots, не полный export dataset.

## URL и SEO

В GitHub PR #226 добавлен allowlist восьми legacy blog slug в \`src/lib/blogServiceRedirects.mjs\`. Pages Functions middleware \`functions/_middleware.ts\` возвращает HTTP 301 на соответствующие \`/services/:slug\` до загрузки старой blog-страницы. Query parameters сохраняются, включая \`?lang=ru\` и \`?lang=en\`. Неизвестные blog URL и landscape case study не затрагиваются.

Production smoke через Firecrawl проверил все восемь старых URL: source URL разрешается в соответствующий service URL, конечный ответ — HTTP 200; локаль из query string сохраняется. Проверены варианты BG/RU/EN. Код middleware явно возвращает статус 301. Landscape case study проверен отдельно: остаётся на исходном blog URL, HTTP 200, \`robots=index, follow\`.

## GitHub, CI и Production

- PR #226: merged (squash) в \`main\`; merge commit \`7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f\`.
- CI по точному PR head: Blog and Studio validation run \`43170398802\` — success; D1 validation run \`43170398659\` — success. Подтверждены lint, utility tests, website build, Pages Functions syntax, D1 validation/dry-run и Sanity Studio build.
- Cloudflare Pages Production deployment: \`f22c3b8f-6d75-4228-b764-5bf32bbce497\`, commit \`7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f\`, build/deploy success; aliases \`florial-bg.com\` и \`www.florial-bg.com\`.
- Firecrawl metadata новых страниц содержит локализованные title/description и service images; \`robots=index, follow\`.
- Доступная Sanity validation: 8 новых услуг и 99 изменённых product documents имеют статус \`valid\`. Валидация неполная: custom validation callbacks не запускались; это ограничение инструмента, не ошибка документов.

## Ограничения и оставшаяся проверка

- Ручной визуальный осмотр всех восьми услуг в hosted Studio на BG/RU/EN остаётся дополнительной QA-проверкой.
- Исходные blogPost документы не удалять: \`isPublished=false\` скрывает их из списка блога, а middleware сохраняет старые URL через 301.
- Landscape case study должен оставаться опубликованным и без редиректа.
- Не изменялись Sanity schema, D1, Manager, Cloudflare secrets/settings, Header, основное меню и Footer.
