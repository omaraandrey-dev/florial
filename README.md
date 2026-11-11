# Florial — интернет-магазин Болгарии

Florial продаёт оборудование для автоматического полива, готовые комплекты и растения; дополнительные направления — проектирование, монтаж и обслуживание полива, ландшафтный дизайн и озеленение.

- Production: https://florial-bg.com
- Рынок: Болгария, включая Черноморское побережье
- Языки: болгарский (основной), русский, английский
- Валюта: EUR

## Документация
Начинайте с [AI_INSTRUCTIONS.md](AI_INSTRUCTIONS.md), затем [docs/AI/START_HERE.md](docs/AI/START_HERE.md).

**GitHub repository `omaraandrey-dev/florial`, branch `main` — единственное постоянное хранилище технической документации Florial.** ChatGPT Library и параллельные копии не являются источниками истины.

## Действующая архитектура
GitHub — код и документация; Sanity — каталог и контент; Cloudflare Pages/Functions — сайт и серверные API; Cloudflare D1 — заказы и Manager; Resend — email. Supabase исключён. Исторические материалы находятся в [docs/archive/supabase](docs/archive/supabase/README.md); выполнять их нельзя.

## Основные документы
- [Технический паспорт](docs/TECHNICAL_PASSPORT.md)
- [Журнал изменений](CHANGELOG.md)
- [Мастер-спецификация](docs/AI/MASTER_SPEC.md)
- [Открытые вопросы](docs/AI/OPEN_QUESTIONS.md)
- [Протокол работы](docs/AI/WORK_PROTOCOL.md)
