# FLORIAL — обязательные инструкции для ИИ и разработчиков

Repo: `omaraandrey-dev/florial` · source branch: `main` · Production: https://florial-bg.com

## Единый источник истины
Вся постоянная документация Florial хранится только в этом GitHub-репозитории: инструкции, технический паспорт, бизнес-ТЗ, конфигурации, changelog и открытые вопросы. GitHub main — источник истины для кода и документации. Sanity — опубликованный каталог и контент. Cloudflare Pages — публикация и runtime. Cloudflare D1 — заказы и Manager. Resend — email.

ChatGPT Project instructions задают правила поведения ChatGPT, но не заменяют GitHub-документацию. ChatGPT Library не использовать для хранения, копий, синхронизации или проверки документации Florial.

## Обязательный старт технического чата
1. Получить актуальный HEAD `main`.
2. Прочитать этот файл и `docs/AI/START_HERE.md`.
3. Прочитать `docs/AI/WORK_PROTOCOL.md`, `MASTER_SPEC.md`, релевантные разделы `docs/TECHNICAL_PASSPORT.md`.
4. Проверить актуальные записи `CHANGELOG.md` и `docs/AI/OPEN_QUESTIONS.md`.
5. Проверить соответствующие исходники, тесты, workflows, схемы и конфигурации.
6. При необходимости проверить живые Sanity, Cloudflare Pages/D1 и Resend.
Если GitHub недоступен или документы нельзя прочитать — сообщить и остановить рискованные изменения. Не подменять проверку памятью, старыми чатами или копиями.

## Действующая архитектура
GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. **Supabase полностью исключён.** Не добавлять Supabase SDK, Auth, Storage, PostgreSQL, RLS, Data API или migrations в действующий runtime/workflows. Материалы `docs/archive/supabase/` — только исторические; не выполнять их и не восстанавливать по ним инфраструктуру.

## Безопасность
- Не выдумывать файлы, функции, ID, настройки, данные и результаты проверок.
- Разделять «проверено по коду», «проверено в живом сервисе», «проверено тестом/CI», «не подтверждено».
- Не раскрывать секреты, ключи, токены или персональные данные.
- Не удалять/перезаписывать данные без явного согласования.
- Перед Sanity write делать backup затрагиваемых документов и проверять project/dataset/ID.
- Не менять Production secrets, bindings, DNS, Cloudflare settings, D1 schema/data, Sanity schema/data без согласования.
- Не менять Header, основное меню, Footer, глобальную оболочку и маршрутизацию без согласования.
- Не использовать Wix или Lovable как основу Florial. Не запускать исторические Supabase SQL.

## Изменения и проверка
Перед существенной работой объяснить план, файлы/сервисы и риски. Работать в отдельной ветке, проверять diff, тесты, ссылки и отсутствие секретов. Merge и Production deployment — только в пределах явного разрешения для конкретной задачи. По применимости проверять lint, tests, website build, Pages Functions, D1 dry-run, Sanity Studio build, CI по точному SHA, Pages deployment по точному commit и безопасные live smoke tests. Локальная сборка не доказывает Production deployment; deployment не доказывает корректность данных.

## Завершение
Обновить `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, связанные журналы и `docs/AI/OPEN_QUESTIONS.md`; зафиксировать commit/PR, проверки, затронутые файлы/сервисы и незавершённые действия. Далее читать [START_HERE](docs/AI/START_HERE.md).
