# Florial — текущие открытые вопросы и проверки

Дата сверки: 2026-11-18. Этот файл содержит только вопросы, которые остаются актуальными. Полная предыдущая история, включая закрытые задачи и старые проверки, сохранена без изменений в [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).

Перед закрытием любого пункта требуется доказательство: commit/file, CI run, deployment ID, live query или browser smoke. Не считать старую запись доказательством текущего состояния.

## 1. GitHub и управление релизом

- **Защита main:** GitHub branch listing возвращает для `main` `protected=false`; repository rulesets endpoint вернул пустой список. Текущая интеграция не имеет доступа к чтению branch-protection details и не предоставляет изменение защиты. Владелец должен настроить protection/ruleset: запрет прямого push и force-push, обязательный PR, требование успешных checks `Blog and Studio validation` и `Florial D1 migration validation`, запрет удаления main. Не менять настройки без доступа владельца.
- **Старые ветки:** в GitHub найдено 416 refs, включая `main` (415 других веток); открытых PR — 0. Эти refs не являются источником текущего состояния. Продолжать работу только от актуального `main`. Старые ветки сохранены как исторические ссылки; массовое удаление небезопасно без сравнения каждой ветки с main. Удаление веток недоступно через текущий GitHub connector; см. [BRANCH_HYGIENE.md](../operations/BRANCH_HYGIENE.md).

## 2. Cloudflare Pages — legacy Supabase variables

- Live Pages project `florial` повторно проверен 2026-11-18. В Production остаются имена переменных `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; в Preview — две `VITE_SUPABASE_*` переменные. Значения и секреты в документацию не записывались.
- Текущий корневой `package.json` не содержит Supabase SDK. Полный статический поиск по всем актуальным runtime/workflow/config files в рамках этой сверки не завершён. Не использовать Supabase и не удалять эти Production/Preview variables до полного аудита ссылок и отдельного явного разрешения владельца.

## 3. Текущие QA и технические вопросы

- **Hreflang услуг:** ранее Production QA выявил неполные alternates для `avtomatizirano-kapkovo-napoyavane`. Проверить текущие BG/RU/EN HTML, исправить только SEO projection при подтверждении дефекта и повторно проверить все локали.
- **Растения и статьи:** Sanity Published read-back подтверждён, но live rendered HTML/browser QA остаётся неподтверждённым для категории `/category/rastenia` и статьи об оливе BG/RU/EN; для зимней статьи BG проверен, RU/EN остаются pending. Google recrawl/indexing не подтверждены. См. соответствующие audits в `docs/audits/`.
- **Hosted Sanity Studio:** проверить фактический hosted Studio deployment после последних schema updates, если работа затронет Studio; успешный Studio build в CI сам по себе не доказывает hosted deployment.
- **Gemini Manager smoke:** повторить только с авторизованной Manager-сессией и согласованной тестовой записью; root cause прежней ошибки не подтверждён.
- **D1 migration ledger:** последняя задокументированная read-only сверка 2026-11-11 видела миграции `0001–0014`, но исторические roadmap записи расходились по статусу `0014`. Также было расхождение между `sqlite_master` (17 таблиц) и Cloudflare metadata (`num_tables: 0`). Перед следующей D1 migration/write выполнить read-only сверку live ledger/schema; полная SQLite integrity/foreign-key проверка не подтверждена.
- **Irrigation product SEO:** базовый аудит 2026-11-13 выявил 193/275 товаров без отдельного локализованного H1 и 143 с неполными RU/EN meta-полями. Это исторические counts, не актуальная перепись. Перед любым исправлением повторно получить live inventory; bulk apply, перезаписывающий заполненные поля, не использовать.
- **Google Search Console:** recrawl, Google-selected canonical и фактическая индексация отдельных локализованных URL не подтверждены. Не заявлять индексацию на основании sitemap/HTTP alone.
- **Performance:** несколько старых release audits не имеют сопоставимых post-release Lighthouse/CLS/INP замеров. Не приписывать улучшение производительности без повторных измерений.

## 4. Намеренно приостановленная инженерная работа

- **Irrigation engineer assistant / Rain Bird 3500:** stage 7 (#349) уже объединён в `main` commit `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`. Workstream намеренно paused; stage 8 не начинать без отдельной просьбы владельца. Инженерные ограничения и порядок возобновления: [PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md](PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md).

## 5. Подтверждённое закрытие

- PR #383 (Manager plant catalog search controls / Seller permissions) merged в `main` commit `1716996c487c3dbfa6995b4eaa7a617cb90ad480`; не считать его открытой задачей.
- На момент сверки открытых PR: 0.
- Актуальный build/deployment статус зафиксирован в [REPOSITORY_RELEASE_READINESS_2026-11-18.md](../operations/REPOSITORY_RELEASE_READINESS_2026-11-18.md).
