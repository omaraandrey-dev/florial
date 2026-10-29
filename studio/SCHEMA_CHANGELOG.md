## 2026-10-29 — Исправление детерминированного деплоя Studio

- По логам run `40828538433` подтверждено: сборка обоих workspace завершилась успешно, но команда `npx sanity@4 deploy --yes --schema-required` открыла интерактивный выбор hostname и не выполнила реальный deploy. Команды `undeploy` для двух app ID завершились `Nothing to undeploy`; записи Studio в Sanity Manage остались.
- Workflow `.github/workflows/deploy-sanity-studio.yml` исправлен: основной hostname теперь передаётся явно через `--url florial-admin-bg`, чтобы не зависеть от интерактивного меню в CI.
- Удалены из автоматического workflow ложноположительные шаги удаления. Их нельзя считать выполненными, пока записи приложений не исчезнут из Sanity Manage.
- Целевое состояние: одна размещённая Studio на существующем hostname `florial-admin-bg.sanity.studio`, с workspace `florial-admin` (dataset `production`) и `plants` (dataset `plants`). Не создавать новые datasets и не удалять документы.
- Проверка схемы на текущий момент показывает, что активные Studio-deployed schema snapshots не полностью совпадают с `studio/schemaTypes/index.ts`; в частности, в активном schema snapshot нужно подтвердить локализационные поля услуги и вложенных блоков. Успешная сборка не является подтверждением schema deployment.
- Никакие документы, изображения, цены, заказы, datasets или значения slug не изменялись. После нового workflow проверить hosted Studio, два workspace и активные схемы по API.

