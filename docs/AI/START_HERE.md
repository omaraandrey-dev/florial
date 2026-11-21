# Florial — START HERE

Единая точка входа для ChatGPT, Claude, Gemini и разработчиков. Актуальность определяется текущим GitHub `main` и соответствующими живыми сервисами.

## Порядок чтения
1. [AI_INSTRUCTIONS.md](../../AI_INSTRUCTIONS.md)
2. [WORK_PROTOCOL.md](WORK_PROTOCOL.md)
3. [MASTER_SPEC.md](MASTER_SPEC.md)
4. [TECHNICAL_PASSPORT.md](../TECHNICAL_PASSPORT.md)
5. [CHANGELOG.md](../../CHANGELOG.md), начиная с верхних записей
6. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
7. Исходники, тесты и профильные документы по задаче

## Источники истины
| Объект | Источник |
|---|---|
| Код и документация | GitHub main |
| Товары, растения, категории, услуги, контент | Опубликованные документы Sanity |
| Схемы Sanity | Studio source + фактически опубликованная схема |
| Заказы и Manager | Cloudflare D1 |
| Применённые миграции | Живой D1 migration ledger |
| Публикация | Cloudflare Pages deployment |
| Email-доставка | Resend и фактический тест |
| История | CHANGELOG.md |

## Главная ветка и архивные refs
`main` — единственная главная и авторитетная ветка Florial. Все остальные ветки — исторические/вспомогательные; в обычной работе их не проверять, не возобновлять и не чистить. Новые изменения начинать от актуального HEAD `main`. Production публикуется из `main`.

## Архитектура
GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. Supabase исключён из действующего проекта. Исторические SQL/документы сохранены в [archive/supabase](../archive/supabase/README.md), выполнять их нельзя. Legacy-переменные `SUPABASE_*` / `VITE_SUPABASE_*`, если сохранены в Cloudflare Pages, являются намеренно оставленными неактивными резервными переменными по подтверждению владельца; не считать их интеграцией, не перепроверять, не читать, не изменять и не удалять.

## Исторические инструкции
Корневой AI_INSTRUCTIONS, START HERE, Technical Passport и Changelog — актуальные документы. Файлы `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_*_rev*.md` — исторические снимки, не конкурирующие источники. Последний снимок перед новой системой: [rev74](../%D0%98%D0%9D%D0%A1%D0%A2%D0%A0%D0%A3%D0%9A%D0%A6%D0%98%D0%AF%282%29_FLORIAL_%D0%90%D0%9A%D0%A2%D0%A3%D0%90%D0%9B%D0%AC%D0%9D%D0%90%D0%AF_11-11-2026_rev74.md).

## Текущая готовность и ветки
- [CURRENT_STATE.md](CURRENT_STATE.md) — краткий актуальный handoff.
- [Repository release readiness](../operations/REPOSITORY_RELEASE_READINESS_2026-11-18.md) — точный CI/Production baseline.
- [Branch hygiene](../operations/BRANCH_HYGIENE.md) — правила использования main и старых веток.

## Профильные документы
- Plant editor UX: [role-based workflow and interface rules](../manager/PLANT_EDITOR_UX.md).
Manager: [FLORIAL_MANAGER_ARCHITECTURE](../FLORIAL_MANAGER_ARCHITECTURE.md); [Seller Orders quick guides (RU/BG)](../manager/SELLER_ORDERS_QUICK_GUIDES.md); [Manager Web Push rollout roadmap](../roadmaps/MANAGER_PUSH_NOTIFICATIONS_ROADMAP_2026-11-21.md); checkout: [CHECKOUT_SETUP](../../CHECKOUT_SETUP.md); content: [SERVICE_CONTENT_PLAYBOOK](../SERVICE_CONTENT_PLAYBOOK.md); performance: [ROADMAP_PERFORMANCE_OPTIMIZATION](../ROADMAP_PERFORMANCE_OPTIMIZATION.md); Google Shopping / SEO visibility: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md) — обязательный план для всех последующих чатов по этой задаче; D1 migrations: [docs/migrations](../migrations/0013_manager_product_audit.sql).

При конфликте определить, относится ли факт к коду, бизнес-требованию или живому сервису. Для бизнес-требований использовать утверждённое решение владельца; для кода — main; для live состояния — соответствующий сервис. Расхождение записывать в OPEN_QUESTIONS.md.


## Paused work handoff — irrigation engineer assistant

The irrigation-engineering assistant / Rain Bird 3500 work is intentionally paused after stage 7. PR #349 is merged into main at `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`. Do not begin stage 8 until the owner explicitly resumes this engineering work. For the exact pause state, decisions, verified merge, technical limits and roadmap, read [PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md](PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md).
