## Актуальный статус — 23.11.2026 (после desktop-only GSC review)

**Текущий статус семи этапов определяется единым [реестром дорожных карт](ROADMAP_STATUS_INDEX_2026-11-23.md).** Этот актуальный блок имеет приоритет над первоначальными статусами ниже.

- Step 1 — **не блокирует дальнейшую работу**. Production sample показывает `index, follow` и self-canonical; исторические GSC URL Inspection anomalies не подтверждены повторным live test и остаются на плановой read-only перепроверке примерно через месяц.
- Step 2 — владелец подтвердил успешную Rich Results проверку без замечаний; отдельный отчёт/скриншот результата пока не сохранён здесь.
- Step 3 — GA4 ecommerce integration PR #488 merged и Production deployment подтверждён; фактический приём событий остаётся на наблюдении владельца.
- Step 4 — частично выполнен; дальнейшие массовые правки контента не назначены. Изменения Sanity требуют точного плана и отдельного approval.
- Step 5 — **предварительный desktop-only GSC анализ выполнен** за 24.10–20.11.2026: 392 impressions, 10 clicks, CTR 2,55%, average position 22,9. Детальные query/page данные частичны, истории пока мало. Повторить анализ около 23.12.2026; до этого не назначать контентную remediation только на основании малой выборки. Подробности: [desktop GSC preliminary analysis](../audits/2026-11-23-gsc-desktop-preliminary-analysis.md).
- Step 6 — **следующий активный этап: Local SEO**, read-only аудит Google Business Profile, NAP, service areas и citations.
- Step 7 — Core Web Vitals остаётся отдельным этапом; не заявлять улучшения без измерений.

---

# Florial — SEO remediation roadmap (23.11.2026)

Статус: read-only audit завершён по доступным источникам; remediation не начиналась. Основной отчёт: [Комплексный SEO-аудит 23.11.2026](../audits/2026-11-23-comprehensive-seo-audit.md).

## Принципы

- Сначала подтверждаем причину, затем предлагаем исправление.
- Не менять опубликованные услуги, blogPost и portfolio без отдельного явного approval владельца.
- Не менять опубликованные Sanity product/category SEO-поля без точного списка document IDs, полей и последствий, а также отдельного подтверждения. Перед write — backup.
- Не создавать doorway pages, не добавлять Sozopol, не выдумывать GTIN/MPN/reviews/ratings/shipping/availability.
- Не использовать Browser connector без предварительного разрешения владельца.
- Все результаты фиксировать в GitHub main; PR #409 остаётся открытым, его не закрывать и не изменять в рамках этого аудита.

## Phase 0 — P1: разрешить noindex/canonical расхождение

<badge color="warning">НЕ БЛОКИРУЕТ</badge>

Повторная выборка 17 URL (23.11.2026): 11 исключены по noindex, три BG product URL имеют Google-selected canonical на другие товары. Три страницы, выбранные Google как canonical, при отдельной проверке сами тоже noindex. Текущие опубликованные Sanity данные и middleware не объясняют результат.

- [ ] Получить разрешение владельца на Browser-проверку.
- [ ] Сравнить raw HTTP status и response headers для Washingtonia, Brahea, Rakat na Buda, Rain Bird 200-PGA, а также контрольных URL Yucca, Kumquat и Rain Bird 100-PGA.
- [ ] Проверить meta robots, X-Robots-Tag, canonical, hreflang, Product JSON-LD и начальный H1.
- [ ] Проверить, что фактический Production deployment соответствует текущему main и что cache не отдаёт устаревший HTML.
- [ ] Сверить все 17 сохранённых URL Inspection результатов и повторить выборочную проверку после подтверждённого исправления; сейчас 11/17 noindex, 3 canonical mismatch.
- [ ] Сопоставить live HTML с текущими опубликованными Sanity noIndex и кодом middleware.
- [ ] Если проблема подтверждена — подготовить точный технический план и показать владельцу до изменения кода/данных.
- [ ] После одобренного исправления проверить exact-SHA CI/Preview/Production и запросить повторный crawl через GSC.

**Критерий закрытия:** нет необъяснимого noindex; self-canonical корректен; Google canonical совпадает с выбранным URL после повторного crawl; sitemap и robots согласованы.

## Phase 1 — P2: GA4 measurement decision

- [ ] Подтвердить, что `florial-29eac` — целевое GA4 property.
- [ ] Согласовать Web Data Stream, measurement ID, currency EUR, timezone Europe/Sofia (сейчас property стоит на fixed Etc/GMT-3) и consent model.
- [ ] Согласовать события: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `generate_lead`.
- [ ] Сопоставить GA4 с существующими D1/PostHog событиями, не создавая двойной учёт.
- [ ] Реализовать только после approval; затем проверить реальные события и key events.

**Критерий закрытия:** GA4 receives events from Production after consent rules, currency EUR, event mapping and key events verified.

## Phase 2 — P2: Product rich results validation

- [ ] После Phase 0 выполнить Google Rich Results Test на Production equipment и plant pages.
- [ ] Проверить Product, Offer, BreadcrumbList, Organization и GardenStore nodes.
- [ ] Повторно проверить availability для реального stockStatus; `onRequest` не считать PreOrder.
- [ ] ShippingDetails/return policy добавлять только по подтверждённым коммерческим условиям.
- [ ] Не добавлять AggregateRating/Review без фактических отзывов; не придумывать GTIN/MPN/variant SKU.
- [ ] Зафиксировать Google test result, crawl date и URL.

**Критерий закрытия:** актуальные Production результаты сохранены; обязательные ошибки отсутствуют; warnings либо устранены законно, либо документированы как не применимые/неподтверждённые.

## Phase 3 — P2: targeted content improvements

**Status on 23.11.2026:** this remains the content/SEO workstream corresponding to Step 4 in the unified roadmap index. The next pass is read-only. Four documents already received the narrowly approved SEO updates described in [the partial remediation audit](../audits/2026-11-23-sanity-seo-partial-remediation.md). Do not repeat those writes.

- [ ] Read-only review of 13 plant product meta descriptions >160 characters and 2 plant category descriptions >160. 160 characters is an editorial guideline, not a Google limit. Do not rewrite plant descriptions from the separately stopped editorial pilot.
- [ ] Read-only review of the 12 irrigation-kit localized full descriptions. Their BG/RU/EN descriptions were refreshed in the separate product-description stream; do not rewrite them as part of this SEO pass.
- [ ] Review full RU/EN descriptions for service `dostavka-poliv` (Sanity ID `9e4efe1b-e434-4cfe-a646-1cc9d9c93bce`); short descriptions exist.
- [ ] Inspect frontend ALT fallback and read-only ALT state for 2 equipment products and 2 equipment categories. Nipel-mufa category ALT is already published; do not overwrite it.
- [x] Two Irritec Connecto elbow localized metaTitle values (female SKU IQ21820F0N25B / male SKU IQ21920M0N25B) were separated and published; read-only verify only.
- [ ] Evaluate homepage and Rotor Sprinklers snippets against a sufficient GSC query sample. Rotor category metaTitle is already updated; CTR/intent review remains open.
- [ ] No Sanity writes during this Step 4 pass. Any future content change requires an exact ID/field proposal, backup where required by project protocol, and separate owner approval.

**Criterion for closure:** the published values and frontend output have been checked, remaining gaps are listed with exact IDs/fields and BG/RU/EN proposals, and no unapproved data is changed.

## Phase 4 — P2: search opportunity pages

**Статус 23.11.2026:** первоначальный desktop-only GSC opportunity review завершён как предварительный. Данных мало; повторить через месяц. Этот пункт не блокирует переход к Local SEO (Step 6). Не назначать content remediation только на основе единичных показов. Подробности: [desktop GSC review](../audits/2026-11-23-gsc-desktop-preliminary-analysis.md).

Приоритеты ниже — исторические кандидаты для повторной оценки, а не утверждённый список текущих изменений. Приоритет после накопления данных:

1. Yucca rostrata — индексируется; 33 impressions, 1 click, average position 12,5.
2. Rotor sprinklers category — индексируется; 36 impressions, 0 clicks; mobile average position 36,7. Проверить интент и содержимое категории.
3. Сильные service pages по автоматическому поливу — homepage/service visibility уже есть.
4. Buddha's hand citron — только после разрешения noindex/canonical anomaly (28 impressions, position 9,6 в page report).
5. Brahea armata — только после разрешения noindex/canonical anomaly (11 impressions, position 10,2).
6. Washingtonia — только после разрешения noindex/canonical anomaly (16 impressions, position 8,8).

Не проводить контентные изменения на страницах с noindex/canonical anomalies до Phase 0.

Для каждой страницы проверить query intent, CTR, title/snippet, content depth, product availability, internal links и conversion path. Не считать одну позицию GSC гарантией стабильного рейтинга.

## Phase 5 — P3: local SEO and authority

**READ-ONLY AUDIT COMPLETED (23.11.2026).** See [Local SEO audit](../audits/2026-11-23-local-seo-readonly-audit.md). Public Google Maps listings, website NAP/hours, live GardenStore JSON-LD, service-area statements and indexed external mentions were checked. No profile, directory, site, Sanity or Production changes were made.

Confirmed findings:
- Two public Google Maps records are linked from the current Contacts page: Nessebar and Ravda. Public owner/manager verification status is not visible.
- Nessebar: public Maps phone +359876777902; current GardenStore JSON-LD uses +359885834860. The page says 09:00–18:00 Mon–Sat; Maps says 08:00–17:00 Mon–Sat and 09:00–17:00 Sunday; JSON-LD says 09:00–17:00 Mon–Fri.
- Ravda: public Maps and JSON-LD use +359877055605 and address Чешме тарла, 8238; current Contacts card only displays “Ravda, Bulgaria”, the global phone block omits this local number, and hours in Maps contain anomalous Friday/Saturday values.
- iBusiness.bg still links to legacy drop.od.ua and has no phone; legacy DROP and another Florial-branded plant site expose older hours/service-area data. The relationship/status of those properties requires owner confirmation.
- Prior geo-filtered GSC sample was only 3 impressions / 0 clicks; too small for local-demand conclusions. No authoritative backlink-index report was available.

**Owner confirmation update (23.11.2026):**
- **CLOSED:** the owner confirmed Ravda is a new, active customer-facing Florial garden centre where customers can visit. Retain its separate Google Maps record and `GardenStore` entity; do not merge it with Nessebar or classify it as service-area-only.
- **CLOSED:** the owner confirmed that Bulgarian-language legacy DROP pages redirect to the current Bulgarian Florial website. Do not treat the old DROP URL in an external citation as a separate active-site conflict solely because the legacy URL is displayed. Exact redirect chains and page-to-page destinations have not been independently tested.
- **OPEN:** confirm actual opening hours separately for Nessebar and Ravda, including Sunday/seasonal schedules.
- **OPEN:** confirm the primary local phone assignment for each centre; current public evidence is +359876777902 for Nessebar and +359877055605 for Ravda, while +359885834860 is the additional ENG/UA/RU number.
- **OPEN:** confirm current on-site service areas (especially Burgas/Varna) separately from delivery-only coverage, and confirm canonical official social profiles / the status of `palmandolivetrees.com`.
- After remaining facts are confirmed, prepare exact code/profile/listing changes for separate approval. Do not edit Google profiles or external listings without approval.
- Do not create thin city doorway pages or claim on-site service where Florial only delivers.

**Status:** audit closed; remediation remains pending owner confirmation.

## Phase 6 — P3: Core Web Vitals and performance

- [ ] Измерить Lighthouse/PageSpeed для homepage, category, product и service templates.
- [ ] Получить CrUX field data, если достаточный объём данных существует.
- [ ] Сравнить mobile и desktop; проверить LCP, INP, CLS и image loading.
- [ ] Составить отдельный план исправлений с привязкой к шаблонам и метрикам.

## Контрольные KPI

- Indexability: доля indexable canonical URLs; noindex anomalies = 0.
- Sitemap: submitted URLs без errors/warnings; исключения соответствуют намерению.
- GSC: clicks, impressions, CTR, position по BG/RU/EN, стране, устройству, типу страницы.
- GA4 (после подключения): sessions, key events, ecommerce funnel и leads.
- Content: 100% обязательных SEO полей и локализаций; описания соответствуют правилам Florial.
- Rich results: актуальный Google validation evidence.
- Performance: CrUX/Lighthouse mobile and desktop, без неподтверждённых обещаний.

## Change log

- 23.11.2026 — создана дорожная карта по результатам первого аудита SEO Audit Skill. Никаких runtime/Sanity/Cloudflare/Google changes не выполнялось.
- 23.11.2026 — уточнены результаты повторной проверки 17 URL, canonical-target URLs, Sanity full-description/ALT gaps и приоритеты. PR #409 остаётся открытым.


## 2026-11-23 — desktop-only GSC checkpoint and transition to Local SEO

- Step 1 indexability follow-up is no longer a blocker. Keep the historical URL Inspection anomalies for a separate read-only recheck around 2026-12-23; do not wait for it before proceeding.
- Step 5 preliminary DESKTOP-only GSC review for 2026-10-24–2026-11-20: 392 impressions, 10 clicks, CTR 2.55%, average position 22.9.
- Query/page rows are partial and the site has a short history; do not use this sample to authorize broad content edits. Revisit GSC in approximately one month using the freshest 28 finalized days.
- Step 6 Local SEO is the next active stage. Begin with read-only Google Business Profile, NAP, service-area and citation checks.
- Evidence: [desktop GSC preliminary analysis](../audits/2026-11-23-gsc-desktop-preliminary-analysis.md).
