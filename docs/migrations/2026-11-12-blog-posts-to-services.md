# Перенос коммерческих материалов блога в услуги — 12.11.2026

**Статус:** контентная часть опубликована; 301-переадресации подготовлены в GitHub branch, но ещё не развернуты. Исходные статьи не удалялись и пока остаются опубликованными.

## Бизнес-структура услуг

Используются четыре уже существующих направления страницы `/services`:

- **Ландшафтный дизайн:** `landscaping`.
- **Системы полива:** `irrigation` + внутренние категории `maintenance` и `delivery`.
- **Услуги садовника:** `planting`.
- **Услуги газонщика:** `lawn`.

Новые услуги не создают пятое направление и не меняют фильтр `ServicesListPage`.

## Перенесённые материалы

Sanity project `bxvcy0qs`, dataset `production`. Все восемь новых документов имеют `isActive=true`, собственные BG/RU/EN тексты, SEO, изображения/галереи и существующую форму заявки.

| Исходная статья | Новый документ service | Направление |
|---|---|---|
| `montazh-podmyana-remont-razpruskvachi-nesebar` — blogPost `4eb9f7c2-8ffe-4e26-881c-4c9aa41a0201` | `8a4ec08b-e064-4d85-8d97-52837afe6d6f` | Системы полива |
| `montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane` — blogPost `5398768e-2661-49b5-9886-54b3d8218ba1` | `078495b7-168f-4b7d-8dbe-f723aeab0cc9` | Системы полива |
| `montazh-remont-elektromagnitni-klapani` | `d6dd1e83-f504-45a2-83de-974e144669e8` | Системы полива |
| `remont-modernizatsiya-polivni-sistemi` | `9f8a5130-49e8-4d34-9f76-c6124503fb5d` | Системы полива (`maintenance`) |
| `godishna-poddruzhka-avtomatichni-sistemi` | `88d0619d-1083-4eb7-b4e6-b22897f6c901` | Системы полива (`maintenance`) |
| `izgrazhdane-tsvetni-lehi` | `e5da8f0d-45ce-41f1-a95b-53ca951dd55c` | Услуги садовника |
| `topiarna-rezitba-rasteniya` | `31fb7746-10c1-48a3-a949-39767f9f0205` | Услуги садовника |
| `podmyana-stara-travna-plosht` | `fe90ae56-594e-45e4-b37f-54eb2c3bf0ed` | Услуги газонщика |

### Материал, оставленный в блоге

`landshaften-dizain-proekt-zasazhdenie` не создаёт девятую страницу услуги: в Sanity уже есть общая услуга «Ландшафтен дизайн» (`c7d2c120-6024-4876-b240-ff6585df91e4`). Исходная публикация оставлена как проектный материал/пример выполненной работы и добавлена в `relatedContent` существующей услуги. Она остаётся в блоге и не входит в список 301.

## Существующие связи Sanity

Существующие документы услуг получили ссылки на специализированные страницы через `relatedContent`:

- монтаж автоматических систем — дождеватели, программаторы, клапаны;
- ремонт и обслуживание систем — ремонт/модернизация, годовая профилактика, дождеватели и клапаны;
- посадка растений — цветники и топиарная стрижка;
- рулонная трава — замена старого газона;
- ландшафтный дизайн — оставленный в блоге проектный материал.

### Входящие ссылки из товаров

Read-only GROQ `references(blogPostId)` в Production обнаружил:

- статья о разпръсквачах — 46 документов `product`;
- статья о программаторах — 23 документа `product`;
- статья об электромагнитных клапанах — 17 документов `product`;
- статья о ремонте/модернизации — 13 документов `product`;
- остальные переносимые статьи — 0 входящих ссылок из других документов;
- проектная статья о ландшафтном дизайне — 1 ссылка из документа `service`.

Это 99 найденных обращений из товарных документов по четырём статьям (46+23+17+13). **Массовая перезапись этих товарных ссылок не выполнялась.** Ссылки продолжают указывать на существующие blogPost документы; после включения 301 они будут вести на новые service URL. Это позволяет не переписывать десятки товарных документов и не терять ссылки.

## Backup перед записью

Сохранены точные JSON snapshots опубликованных документов в GitHub:

- исходные 9 blogPost: `docs/backups/sanity-blog-to-services-2026-11-12/`;
- 5 затрагиваемых существующих service: `docs/backups/sanity-services-before-blog-migration-2026-11-12/`.

Это целевые snapshots затронутых документов, не полный export dataset.

## Переадресация и совместимость

В ветке `content/blog-posts-to-services-2026-11-12` подготовлены:

- `src/lib/blogServiceRedirects.mjs` — allowlist ровно восьми перенесённых slug;
- `src/lib/blogServiceRedirects.d.mts` — типы;
- `functions/_middleware.ts` — HTTP 301 до обработки старой blog-страницы;
- `tests/blog-service-redirects.test.mjs` — тесты восьми URL, незатронутого блога, trailing slash и encoded path.

Переадресация меняет только pathname, сохраняя исходные query parameters, включая `?lang=ru` и `?lang=en`. Используется Pages Functions middleware, а не статический `_redirects`, потому что проект обслуживает запросы через Functions middleware.

**До Production deployment старые статьи нельзя снимать с публикации.** После merge/deployment необходимо проверить все восемь старых URL на HTTP 301 и соответствующие новые URL на HTTP 200. Только после этого выставить `isPublished=false` для восьми перенесённых blogPost документов. Документы и их IDs сохраняются; физическое удаление запрещено. Проектная статья `landshaften-dizain-proekt-zasazhdenie` остаётся опубликованной.

## SEO и изображение

- Для новых услуг заполнены BG/RU/EN `seo.metaTitle`, `seo.metaDescription`, `noIndex=false`; тексты адаптированы к услугам и географии Несебър/Равда/Слънчев бряг/Южное Черноморье.
- В новые документы перенесены исходные assets, локализованные ALT, Portable Text BG и Markdown RU/EN.
- В live smoke до кода PR обнаружено, что client-side `ServicePage` перезаписывает `og:image` логотипом, даже когда у услуги есть основное фото. В ветку добавлено исправление: передавать `service.imageUrl || service.hero?.imageUrl` в `applyPageSeo`. Проверить итоговый OG image после Production deployment.

## Проверки на 12.11.2026

- Sanity: 8 новых документов опубликованы; 8/8 прошли доступную schema validation со статусом `valid`. Валидация неполная: custom validation callbacks и custom slug isUnique callbacks инструментом не запускались; встроенные правила и встроенная уникальность slug проверены. Требуется ручной осмотр Studio.
- Sanity: пять существующих service документов с обновлёнными `relatedContent` опубликованы после backup и revision guard.
- Live Firecrawl: новые страницы дождевателей (BG), топиарной стрижки (RU), замены газона (EN) — HTTP 200, `robots=index, follow`, локализованные title/description.
- Live Firecrawl: `/services` — HTTP 200, показывает 20 услуг и все восемь новых service slug в четырёх существующих направлениях.
- Live sitemap — HTTP 200; содержит восемь новых service URL и пока содержит старые blog URL, так как исходные статьи ещё опубликованы.
- Старый URL статьи о дождевателях пока отвечает HTTP 200 — это ожидаемо, пока redirect branch не объединена и не развёрнута.
- Cloudflare Pages Production на момент проверки: deployment `46473f2b-5f04-4d83-9611-2e5b68f0dbd0`, commit `74fe0b9da63413cfde586782532637b558954a5f`, status success. Preview deployments выключены (`preview_deployments_enabled` отсутствует, `preview_deployment_setting=none`); branch preview skipped.
- Код, редиректы и исправление OG image пока не в Production. Merge/Production release не выполнялись.

## Незавершённые действия

1. Завершить GitHub PR, получить CI по точному HEAD SHA: tests, lint, website build и Pages Functions syntax.
2. После разрешённого merge проверить Production deployment точного commit.
3. Проверить все восемь 301, сохранение `lang`/UTM query parameters, новые URL, canonical/hreflang, OG image и sitemap.
4. После успешной проверки отключить публикацию восьми старых blogPost документов, сохранив документы и ссылки.
5. Выполнить ручной осмотр новых услуг в Studio на BG/RU/EN.
