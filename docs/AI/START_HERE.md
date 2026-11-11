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

## Архитектура
GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. Supabase исключён. Исторические SQL/документы сохранены в [archive/supabase](../archive/supabase/README.md), выполнять их нельзя.

## Исторические инструкции
Корневой AI_INSTRUCTIONS, START HERE, Technical Passport и Changelog — актуальные документы. Файлы `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_*_rev*.md` — исторические снимки, не конкурирующие источники. Последний снимок перед новой системой: [rev74](../%D0%98%D0%9D%D0%A1%D0%A2%D0%A0%D0%A3%D0%9A%D0%A6%D0%98%D0%AF%282%29_FLORIAL_%D0%90%D0%9A%D0%A2%D0%A3%D0%90%D0%9B%D0%AC%D0%9D%D0%90%D0%AF_11-11-2026_rev74.md).

## Профильные документы
Manager: [FLORIAL_MANAGER_ARCHITECTURE](../FLORIAL_MANAGER_ARCHITECTURE.md); checkout: [CHECKOUT_SETUP](../../CHECKOUT_SETUP.md); content: [SERVICE_CONTENT_PLAYBOOK](../SERVICE_CONTENT_PLAYBOOK.md); performance: [ROADMAP_PERFORMANCE_OPTIMIZATION](../ROADMAP_PERFORMANCE_OPTIMIZATION.md); D1 migrations: [docs/migrations](../migrations/0013_manager_product_audit.sql).

При конфликте определить, относится ли факт к коду, бизнес-требованию или живому сервису. Для бизнес-требований использовать утверждённое решение владельца; для кода — main; для live состояния — соответствующий сервис. Расхождение записывать в OPEN_QUESTIONS.md.
