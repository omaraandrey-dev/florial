# Florial Manager — първоначално активиране

**Статус към 01.11.2026:** кодът е обединен в `main` чрез PR #39, production deployment е успешен и SQL миграцията е приложена. Auth потребителите и ролите още не са създадени.

## Какво влиза в първата версия

- Отделен React интерфейс на `/manager`, извън публичната обвивка Header/Footer.
- Вход с email и парола чрез Supabase Auth; няма публична регистрация.
- Роли `seller`, `manager`, `owner`, записани в сървърно управлявана таблица.
- Чернови на растенията, снимки в private Storage bucket, журнал на събитията.
- Изпращане на заявка до собственика по Resend email.
- Собственикът може да одобри или да върне заявка за корекция; мениджърът може да връща за корекция, но не може да одобрява.
- Одобрението в тази итерация **не публикува** автоматично документ в Sanity. Sanity publishing ще бъде отделен следващ етап.

## Задължителни стъпки за включване

1. Кодът вече е публикуван в production чрез PR #39 (merge commit `7d13d25ad7f8f1396d1033a221813058bef28f6b`); Cloudflare deployment `98ba0318-dfc6-419a-9906-62e90f7980de` е със статус success.
2. Миграцията `create_florial_manager` вече е приложена към Supabase production project `shzbflgqfffgzzgpwjxt`, version `20261101080656`. Таблиците и private Storage bucket са създадени.
3. В Supabase Auth създайте първо акаунта на собственика и потвърдете email адреса. След това създайте акаунтите на служителите. Не включвайте публична регистрация.
4. В SQL Editor изпълнете bootstrap insert за собственика, като замените UUID с реалния Auth user ID от Supabase Dashboard → Authentication → Users:

```sql
insert into public.catalog_staff_profiles (user_id, role, display_name)
values ('REPLACE_WITH_OWNER_AUTH_USER_UUID', 'owner', 'Florial Owner');
```

5. Добавете служителите със същия принцип и роля `seller` или `manager`:

```sql
insert into public.catalog_staff_profiles (user_id, role, display_name)
values
  ('REPLACE_WITH_SELLER_AUTH_USER_UUID', 'seller', 'Име на служителя'),
  ('REPLACE_WITH_MANAGER_AUTH_USER_UUID', 'manager', 'Име на мениджъра');
```

Не изпълнявайте примерите с placeholder текст; използвайте реалните UUID от Auth. Не давайте роля `owner` на служители.

6. В Cloudflare production environment трябва да присъстват съществуващите сървърни bindings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (Secret)
   - `RESEND_API_KEY` (Secret)
   - `EMAIL_FROM`
   - `ORDER_NOTIFICATION_EMAIL`

   При проверката на 01.11.2026 тези bindings бяха открити в production. `CATALOG_REVIEW_EMAIL` не беше открита; функцията използва `ORDER_NOTIFICATION_EMAIL` като fallback. Не добавяйте Preview secrets и не копирайте production secrets в Preview.

7. Отворете `https://florial-bg.com/manager` и влезте с един от създадените акаунти. Първо проверете собственика, след това отделен seller account.

## Права

| Действие | Seller | Manager | Owner |
|---|---:|---:|---:|
| Създаване на чернова | Да | Да (чрез следващ интерфейсен етап) | Да |
| Четене на собствените заявки | Да | Да | Да |
| Четене на всички заявки | Не | Да | Да |
| Качване/преглед на снимки | Само свои | Всички заявки | Всички заявки |
| Връщане за корекция | Не | Да | Да |
| Одобрение | Не | Не | Да |
| Публикация в Sanity | Не | Не | Не е включена в тази итерация |
| Управление на роли | Не | Не | Чрез администраторска процедура |

## Ограничения и оставащи задачи

- Първата форма създава нови растения. Предложенията за промяна на вече публикувано растение ще бъдат добавени след реализиране на търсене и безопасно сравнение на Sanity revision.
- Категорията засега се записва като текстово предложение; свързването с точните Sanity category IDs е следваща стъпка.
- Един вариант за продажба се въвежда във формата; интерфейсът за множество варианти ще бъде разширен.
- Не е правено реално изпращане на email от production и не са създавани Auth users/roles. Миграцията вече е приложена.
- Настройките Supabase Auth (разрешени доставчици, signup policy и URL allowlist) не са потвърдени през API; проверете ги в Dashboard преди пилота.

## Контролен тест преди използване

1. Seller влиза и създава чернова с една снимка.
2. Seller вижда само собствената чернова; друг seller не я вижда.
3. Снимката не е достъпна през публичен URL; signed URL се издава само за разрешен staff user.
4. Seller изпраща заявката; в таблицата се записва `submitted`, появява се audit event и собственикът получава email.
5. Manager може да върне заявката с коментар, но не може да я одобри.
6. Owner може да одобри; публичният каталог Sanity остава непроменен.
7. Изходът прекратява сесията; анонимен посетител не вижда съдържанието на панела или API.


## Production статус — 01.11.2026

- GitHub PR #39 е MERGED; PR #38 е CLOSED (superseded).
- Cloudflare Pages production deployment е успешен: `98ba0318-dfc6-419a-9906-62e90f7980de`.
- Supabase migration `create_florial_manager` version `20261101080656` е приложена.
- Проверени са таблиците, RLS и private bucket. Данни в тях няма; Auth accounts/roles още не са създадени.
- Преди да се използва панелът, създайте акаунт на собственика в Supabase Dashboard → Authentication → Users и добавете неговия UUID с роля `owner` чрез SQL:

```sql
insert into public.catalog_staff_profiles (user_id, role, display_name)
values ('UUID_FROM_AUTH_USERS', 'owner', 'Florial Owner');
```

- Не използвайте placeholder UUID. След това създайте отделни Auth accounts за служителите и добавете им роли `seller` или `manager`.
- Не изпращайте пароли, access tokens или service-role keys в чат. Публичната регистрация не трябва да се използва за добавяне на служители.
- Проверка на Auth signup/redirect settings и реално получаване на email остават **НЕ ИЗВЕСТНО — нужно уточнить**.
