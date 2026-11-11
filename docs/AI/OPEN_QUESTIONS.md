# Florial — открытые вопросы и проверки

Повторно проверять в актуальном main и соответствующих live services. Не считать вопрос закрытым по старой записи.

1. **Hosted Sanity Studio:** hosted build/deployment после добавления plantCare-полей AI-рекомендации и причины пригодности к Черноморскому побережью отдельно не подтверждён в последней записи паспорта.
2. **Gemini live smoke test:** требуется повторить тест с авторизованной Manager-сессией и согласованной тестовой записью. Root cause предыдущей ошибки не подтверждён.
3. **CI для текущего main SHA:** проверять workflow run именно для исследуемого commit; не переносить статус от соседнего PR или раннего commit.
4. **D1 migration 0014:** исторические записи `docs/ROADMAP_SERVICES_AND_LEADS.md` содержат разные статусы. Перед следующей D1 работой сверить живой migration ledger read-only и обновить паспорт/roadmap. Не запускать миграцию в рамках сверки.
5. **Legacy Cloudflare variables:** прежние проверки находили имена `SUPABASE_*` и `VITE_SUPABASE_*`. package.json и поиск SDK не показывают активного Supabase SDK; live variables/workflows требуют отдельного read-only аудита. Не раскрывать значения и не удалять переменные без разрешения.
6. **Старые Manager документы:** setup/mobile QA/часть architecture содержат прежние Supabase Auth/Storage/RLS шаги. Они помечаются как исторические; актуальные рабочие инструкции поддерживать в Manager architecture и Technical Passport.

Закрывать вопрос только с доказательством: commit/file, CI run, deployment ID, live query или smoke test. Production writes, Sanity publish, email, D1 migration и secrets требуют отдельного согласования.
