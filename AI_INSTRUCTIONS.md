## Completed and released — whole-polygon irrigation layout (27.11.2026)

The owner-authorized whole-polygon sequential lawn-layout scope is complete. PR [#551](https://github.com/omaraandrey-dev/florial/pull/551) was merged into `main` on 2026-11-27; merge commit: `97d4188abeeaaa7842a9924e1e30eccc20e3202e`. Cloudflare Pages Production deployment `09ab6446-e488-42a0-967f-0f7e0f05e44b` succeeded from that exact commit and serves the production aliases, including https://florial-bg.com. The exact code/test head was `4cbc21173f5dc4dff3195f7c4e2d4a9b10dcba96`; final documentation/verification head before merge was `79bb1af61583359a8bd8bba5aa4f25a715caebbc`. The branch was fast-forward synchronized after merge.

The released sequence is: (1) Rain Bird 3504-PC rotors across the complete polygon, (2) rotor sector expansion, (3) safe rotor-only redundancy reduction before R-VAN, (4) R-VAN only for residual uncovered areas, (5) exact 1 m / 2 m directional strip patterns for residual strips, and (6) one final global coverage / overspray / mixed-family Head-to-Head / clearance validation. Main-polygon rotor/R-VAN placement is not decomposed into independent rectangles. The authoritative design, code map, safeguards, regression cases and exact release evidence are in [IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md](docs/engineering/IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md).

Verification: exact code/test validation passed 581/581 Node tests, application/Pages type-check, lint, website build, Studio type-check/build; the main-merge CI checks and full SSR/SEO regression passed; the Production Pages build/deploy and BG/RU/EN raw-HTTP smoke passed. Full run/deployment identifiers are recorded in the engineering specification. This is sampled geometric planning, not a continuous-coverage proof or hydraulic calculation.

**Workstream status: PAUSED after completion.** Do not proactively refactor, optimize or change this solver again unless the owner supplies a new task or observed issue. Do not broaden the scope to hydraulic calculations, manufacturer performance interpolation, new sprinkler families or unrelated UI/geometry features. Keep exact manufacturer data, sampled coverage, overspray and Head-to-Head checks mandatory. The earlier 2026-11-24 pause is superseded only for the completed PR #551 scope and is now reinstated. Shared project documents are maintained through the normal sequential integration workflow on `develop`; no historical or temporary PR is a standing reason to freeze them.

---

---

# FLORIAL — обязательные инструкции для ИИ и разработчиков

Repo: `omaraandrey-dev/florial` · source branch: `main` · Production: https://florial-bg.com

## Единый источник истины
Вся постоянная документация Florial хранится только в этом GitHub-репозитории: инструкции, технический паспорт, бизнес-ТЗ, конфигурации, changelog и открытые вопросы. GitHub main — источник истины для кода и документации. Sanity — опубликованный каталог и контент. Cloudflare Pages — публикация и runtime. Cloudflare D1 — заказы и Manager. Resend — email.

ChatGPT Project instructions задают правила поведения ChatGPT, но не заменяют GitHub-документацию. ChatGPT Library не использовать для хранения, копий, синхронизации или проверки документации Florial.

## Обязательный старт технического чата
1. Получить актуальный HEAD `main`.
2. Прочитать этот файл и `docs/AI/START_HERE.md`.
3. Прочитать `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, релевантные разделы `docs/TECHNICAL_PASSPORT.md`.
4. Проверить актуальные записи `CHANGELOG.md` и `docs/AI/OPEN_QUESTIONS.md`.
5. Проверить соответствующие исходники, тесты, workflows, схемы и конфигурации.
6. При необходимости проверить живые Sanity, Cloudflare Pages/D1 и Resend.
Если GitHub недоступен или документы нельзя прочитать — сообщить и остановить рискованные изменения. Не подменять проверку памятью, старыми чатами или копиями.

## Действующая архитектура
GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. **Supabase полностью исключён из действующей архитектуры и кода Florial.** Не добавлять Supabase SDK, Auth, Storage, PostgreSQL, RLS, Data API или migrations в действующий runtime/workflows. Материалы `docs/archive/supabase/` — только исторические; не выполнять их и не восстанавливать по ним инфраструктуру.

### Dormant Cloudflare environment variables — owner-confirmed policy (18.11.2026)
В Cloudflare Pages могут сохраняться legacy-переменные с именами `SUPABASE_*` и `VITE_SUPABASE_*`. Владелец подтвердил, что они не используются проектом и намеренно оставлены в Cloudflare как неактивный резерв на случай возможной будущей потребности. Считать их **dormant / intentionally retained**, а не действующей интеграцией или зависимостью Florial. Не проводить повторные аудиты только из-за наличия этих имён, не удалять и не изменять их. Не читать и не раскрывать значения. Если когда-либо появится задача активировать Supabase, это будет отдельное архитектурное решение владельца с новым аудитом и явным согласованием.

## Безопасность
## Защита опубликованного контента — обязательное разрешение владельца (15.11.2026)

Существующие опубликованные документы услуг (`service`), статей блога (`blogPost`) и проектов портфолио являются защищённым контентом. Перед ЛЮБЫМ изменением существующего документа — текста и переводов, SEO, slug/URL, изображений/галерей, внутренних ссылок/references, порядка, активности, публикации, снятия с публикации или удаления — сначала показать владельцу точный план с ID, slug/URL, полями и последствиями и запросить отдельное явное подтверждение. **До подтверждения не выполнять никаких записей в Sanity.** Общая просьба по другой задаче, предыдущие согласования и желание «улучшить SEO» не являются разрешением на изменение других опубликованных материалов. Read-only аудит разрешён. Создание отдельного нового документа допускается только в пределах конкретно запрошенной/подтверждённой задачи. Предпочитать сохранение исходной страницы и создание отдельной новой страницы, а не замену существующего документа.

- Не выдумывать файлы, функции, ID, настройки, данные и результаты проверок.
- Разделять «проверено по коду», «проверено в живом сервисе», «проверено тестом/CI», «не подтверждено».
- Не раскрывать секреты, ключи, токены или персональные данные.
- Не удалять/перезаписывать данные без явного согласования.
- Перед Sanity write делать backup затрагиваемых документов и проверять project/dataset/ID.
- Не менять Production secrets, bindings, DNS, Cloudflare settings, D1 schema/data, Sanity schema/data без согласования.
- Не менять Header, основное меню, Footer, глобальную оболочку и маршрутизацию без согласования.
- Не использовать Wix или Lovable как основу Florial. Не запускать исторические Supabase SQL.

## Ветки разработки и релизов Florial — обязательное правило

- **`main` — Production:** единственная ветка, из которой Cloudflare Pages публикует рабочий сайт. В main попадают только проверенные и принятые изменения.
- **`develop` — единственная постоянная ветка развития всего сайта:** здесь ведётся вся дальнейшая разработка Florial — SSR, каталог, растения, услуги, Manager, SEO, checkout и новые функции. Не создавать отдельные долгоживущие feature/fix/docs ветки для обычных задач.
- Новую задачу начинать с актуального HEAD `develop`. Работать последовательно в этой ветке; перед изменениями сверять статус и незавершённые изменения.
- Релиз выполняется одним интеграционным PR `develop → main` после тестов, Preview, проверок и согласования владельца. После merge обновить `develop` до актуального `main` без потери новых коммитов.
- Не отправлять незавершённую разработку в Production. Не выполнять force-push и не переписывать историю `main` или `develop`.
- Уже открытые task-specific PR/ветки (включая PR #543) считать переходными исключениями: завершить их в согласованном порядке, затем перенести развитие на единый `develop`. Не открывать новые параллельные ветки.
- Старые refs не удалять массово и не восстанавливать без прямого указания владельца. Их наличие само по себе не означает незавершённую задачу.
- Общие документы (`CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/OPEN_QUESTIONS.md`, инструкции и протоколы) изменять последовательно в одном потоке, без параллельных копий.
- PR #409 закрыт владельцем как временный/устаревший переходный PR. Не использовать его ветку, diff или Preview как актуальную основу, не переносить из него изменения и не возобновлять работу по нему. Текущая работа ведётся от актуального `develop`, релизная база — `main`.
- Перед релизом проверить точные SHA, diff, тесты, Preview, mergeability и отсутствие конфликтов. После релиза сверить Production deployment и raw HTTP smoke по точному SHA.

## Изменения и проверка
Перед существенной работой объяснить план, файлы/сервисы и риски. Работать в отдельной ветке, проверять diff, тесты, ссылки и отсутствие секретов. Merge и Production deployment — только в пределах явного разрешения для конкретной задачи. По применимости проверять lint, tests, website build, Pages Functions, D1 dry-run, Sanity Studio build, CI по точному SHA, Pages deployment по точному commit и безопасные live smoke tests. Локальная сборка не доказывает Production deployment; deployment не доказывает корректность данных.

## Завершение
Обновить `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, связанные журналы и `docs/AI/OPEN_QUESTIONS.md`; зафиксировать commit/PR, проверки, затронутые файлы/сервисы и незавершённые действия. Далее читать [START_HERE](docs/AI/START_HERE.md).
