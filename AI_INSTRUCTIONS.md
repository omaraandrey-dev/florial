## Owner-authorized resumption — irrigation-design assistant (26.11.2026)

The owner explicitly resumed a limited irrigation-assistant task on 26.11.2026. Authorized scope: improve rectangular and L-shaped lawn layout behaviour, preserve the restored pre-v2 algorithm, allow continuous fractional geometric planning radii (including the 17 × 17 m / 8.5 m regression), preserve symmetry when minimizing a symmetric rectangular layout (including 20 × 20 m), restore corner-first then uncovered-area Head-to-Head progression for whole-polygon L-shapes, and keep the non-irrigated-area editor temporarily hidden. Work only on `develop`; do not merge PR #551 or deploy to Production without separate owner approval. Do not broaden the task to hydraulic calculations, manufacturer performance interpolation, new sprinkler families, or unrelated UI/geometry features. Existing coverage, Head-to-Head, overspray, and manufacturer-data boundaries remain mandatory. This resumption supersedes the 24.11.2026 pause only for the scope stated above; pause again when that scope is completed or the owner instructs.

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
- **PR #409 заморожен по решению владельца:** не изменять его head/base, не комментировать, не закрывать и не редактировать его файлы до отдельного распоряжения. Пока он открыт, не редактировать файлы, входящие в его diff; уникальные документы и инструкции можно актуализировать отдельно.
- Перед релизом проверить точные SHA, diff, тесты, Preview, mergeability и отсутствие конфликтов. После релиза сверить Production deployment и raw HTTP smoke по точному SHA.

## Изменения и проверка
Перед существенной работой объяснить план, файлы/сервисы и риски. Работать в отдельной ветке, проверять diff, тесты, ссылки и отсутствие секретов. Merge и Production deployment — только в пределах явного разрешения для конкретной задачи. По применимости проверять lint, tests, website build, Pages Functions, D1 dry-run, Sanity Studio build, CI по точному SHA, Pages deployment по точному commit и безопасные live smoke tests. Локальная сборка не доказывает Production deployment; deployment не доказывает корректность данных.

## Завершение
Обновить `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, связанные журналы и `docs/AI/OPEN_QUESTIONS.md`; зафиксировать commit/PR, проверки, затронутые файлы/сервисы и незавершённые действия. Далее читать [START_HERE](docs/AI/START_HERE.md).
