> **Irrigation workstream completion notice (2026-11-27):** PR [#551](https://github.com/omaraandrey-dev/florial/pull/551) is merged into `main` as `97d4188abeeaaa7842a9924e1e30eccc20e3202e`. Cloudflare Pages Production deployment `09ab6446-e488-42a0-967f-0f7e0f05e44b` succeeded from that exact commit. The live algorithm is whole-polygon and sequential: 3504-PC rotors first, safe rotor-only redundancy reduction, R-VAN for residual uncovered areas, exact 1 m / 2 m directional strip patterns last, then global mixed-family Head-to-Head / coverage / overspray checks. Main-polygon rotor/R-VAN placement is not split into independent rectangles. The current algorithm, implementation map, limits, regression matrix and release evidence are documented in [the whole-polygon sequential layout specification](../engineering/IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md). **This workstream is paused after completion; do not make further solver changes without a new owner task or observed issue.**
# Florial — START HERE

Единая точка входа для ChatGPT, Claude, Gemini и разработчиков. Актуальность кода и документации определяется GitHub: `develop` — единая ветка развития, `main` — Production; фактическое состояние сервисов проверяется отдельно.

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

## Ветки разработки и релиза
- `develop` — единственная постоянная ветка развития всего Florial. Все новые задачи и изменения ведутся последовательно здесь.
- `main` — стабильная Production-ветка; Cloudflare Pages Production публикует из неё.
- Релиз выполняется PR `develop → main` после точной проверки CI, Preview, smoke и согласования владельца.
- Обычные task-specific ветки не создавать. Существующие открытые PR — временные переходные исключения; сначала завершить текущие задачи, затем работать только через `develop`.
- Старые refs не удалять и не восстанавливать массово.
- [Branch hygiene](../operations/BRANCH_HYGIENE.md) — обязательная схема веток.

## Архитектура
GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. Supabase исключён из действующего проекта. Исторические SQL/документы сохранены в [archive/supabase](../archive/supabase/README.md), выполнять их нельзя. Legacy-переменные `SUPABASE_*` / `VITE_SUPABASE_*`, если сохранены в Cloudflare Pages, являются намеренно оставленными неактивными резервными переменными по подтверждению владельца; не считать их интеграцией, не перепроверять, не читать, не изменять и не удалять.

## Исторические инструкции
Корневой AI_INSTRUCTIONS, START HERE, Technical Passport и Changelog — актуальные документы. Файлы `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_*_rev*.md` — исторические снимки, не конкурирующие источники. Последний снимок перед новой системой: [rev74](../%D0%98%D0%9D%D0%A1%D0%A2%D0%A0%D0%A3%D0%9A%D0%A6%D0%98%D0%AF%282%29_FLORIAL_%D0%90%D0%9A%D0%A2%D0%A3%D0%90%D0%9B%D0%AC%D0%9D%D0%90%D0%AF_11-11-2026_rev74.md).

## Текущая готовность и ветки
- **Единый реестр дорожных карт (23.11.2026):** [ROADMAP_STATUS_INDEX_2026-11-23.md](../roadmaps/ROADMAP_STATUS_INDEX_2026-11-23.md) — главный cross-workstream handoff; перед продолжением любой roadmap-задачи сверить актуальный статус и зависимости.
- [CURRENT_STATE.md](CURRENT_STATE.md) — краткий актуальный handoff.
- [Repository release readiness](../operations/REPOSITORY_RELEASE_READINESS_2026-11-18.md) — точный CI/Production baseline.
- [Branch hygiene](../operations/BRANCH_HYGIENE.md) — правила использования main и старых веток.

- **SEO Audit (23.11.2026):** [comprehensive findings](../audits/2026-11-23-comprehensive-seo-audit.md), [remediation roadmap](../roadmaps/SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md), [installed Agent Skill and Florial guardrails](SEO_AUDIT_SKILL.md).
## Профильные документы
- **Irrigation engineer / lawn designer:** [CURRENT — whole-polygon sequential layout](../engineering/IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md) — rotors → residual R-VAN → residual 1 m / 2 m strips, mixed-family Head-to-Head and one global validation; [perimeter-first implementation guide](../engineering/IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md) — historical R-VAN geometry, mixed/balanced zones, pipe routes and BOM; [L-shape rectangular-zone layout v1](../engineering/IRRIGATION_ASSISTANT_L_SHAPE_RECTANGULAR_ZONES_V1.md) — historical per-rectangle solver; [balanced zones + owner PDF handoff](../engineering/IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md) — checkout snapshot, D1 event persistence, owner email/PDF and verification boundaries; [Rain Bird 3504-PC geometric layout v1](../engineering/IRRIGATION_ASSISTANT_3504PC_GEOMETRIC_LAYOUT_V1.md) — historical rectangle-stage baseline, superseded for the current sequential whole-polygon algorithm.
- Plant editor UX: [role-based workflow and interface rules](../manager/PLANT_EDITOR_UX.md).
Manager: [FLORIAL_MANAGER_ARCHITECTURE](../FLORIAL_MANAGER_ARCHITECTURE.md); [Seller Orders quick guides (RU/BG)](../manager/SELLER_ORDERS_QUICK_GUIDES.md); [Manager Web Push rollout roadmap](../roadmaps/MANAGER_PUSH_NOTIFICATIONS_ROADMAP_2026-11-21.md); checkout: [CHECKOUT_SETUP](../../CHECKOUT_SETUP.md); content: [SERVICE_CONTENT_PLAYBOOK](../SERVICE_CONTENT_PLAYBOOK.md); performance: [ROADMAP_PERFORMANCE_OPTIMIZATION](../ROADMAP_PERFORMANCE_OPTIMIZATION.md); Google Shopping / SEO visibility: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md) — обязательный план для всех последующих чатов по этой задаче; D1 migrations: [docs/migrations](../migrations/0013_manager_product_audit.sql).

При конфликте определить, относится ли факт к коду, бизнес-требованию или живому сервису. Для бизнес-требований использовать утверждённое решение владельца; для кода — main; для live состояния — соответствующий сервис. Расхождение записывать в OPEN_QUESTIONS.md.


## Irrigation engineer assistant — bounded resumption

The owner resumed the bounded lawn-layout work on 2026-11-22. PR #473 delivered the perimeter-first R-VAN layout and cart BOM; PRs #476/#477 added balanced mixed zones and the owner-only order PDF. The current implementation and limitations are documented in the engineering guides above. This does **not** authorize the broader historical Rain Bird 3500 stage-8 roadmap; that work remains paused until separately approved. The historical pause record remains available at [PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md](PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md).
