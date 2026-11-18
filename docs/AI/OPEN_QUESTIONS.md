# Florial — текущие открытые вопросы и проверки

Дата сверки: 2026-11-18. Этот файл содержит только вопросы, которые остаются актуальными. Полная предыдущая история, включая закрытые задачи и старые проверки, сохранена без изменений в [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).

Перед закрытием любого пункта требуется доказательство: commit/file, CI run, deployment ID, live query или browser smoke. Не считать старую запись доказательством текущего состояния.

## 1. Главная ветка и репозиторий

- `main` — единственная главная и авторитетная ветка Florial. Все остальные ветки — исторические/вспомогательные refs; владелец решил не проводить их дальнейшую инвентаризацию, сравнение или удаление. В обычной работе их игнорировать и начинать новые задачи от актуального HEAD `main`.
- На дату последней проверки открытых PR было 0. Наличие старых веток не считается открытой задачей и не влияет на Production.
- GitHub branch metadata на 18.11.2026 показывала `main.protected=false`. Настройка защиты main — отдельная опция GitHub governance; не блокирует использование main как единственного источника истины.

## 2. Cloudflare Pages — dormant legacy variables

- Решение владельца от 18.11.2026: legacy-переменные `SUPABASE_*` / `VITE_SUPABASE_*`, которые могут оставаться в Cloudflare Pages Production/Preview, намеренно сохранены как неактивный резерв «на всякий случай».
- Они не являются частью действующей архитектуры Florial и не используются проектом. Не удалять, не изменять, не читать значения и не проводить повторные проверки только из-за их наличия.
- Возвращаться к этому вопросу только если владелец отдельно решит активировать Supabase или изменить инфраструктурную политику.

## 3. Текущие QA и технические вопросы

- **Manager PostHog on-demand analytics:** PR #405 is merged and deployed in Production (merge commit `a7da7916d2fc728432f116f395cc16038b0258ce`, deployment `0b850f57-8fdb-457e-bae2-2fcc52fe40b6`). Cloudflare Production metadata confirms secret `POSTHOG_API_KEY` (`secret_text`) is present; value not read. Endpoint accepts this alias or preferred `POSTHOG_PERSONAL_API_KEY`. Still verify credential validity/`query:read` scope and actual data rendering through an authenticated Manager session; metadata and successful deployment alone do not prove Query API access.
- **PostHog telemetry coverage:** live ingestion is active and five Florial events are confirmed in project `349453`. The code paths for `florial_phone_click`, `florial_chat_click` and `florial_checkout_start` were not present in the live event schema on 18.11.2026. Investigate delivery/trigger coverage before treating these as available analytics. Dashboard and evidence: `docs/FLORIAL_ANALYTICS_CONSENT_POSTHOG.md`.
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
