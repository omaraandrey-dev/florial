# Озеленяване на терени — обновление услуги

Дата: 2026-11-17

## Исходное состояние и backup

- Sanity project: `bxvcy0qs`, dataset: `production`.
- Документ: `e86d4175-e74e-4200-a4bd-e56a56672e0e`, slug: `ozelenyavane`.
- URL: `/services/ozelenyavane`; ID и slug не менялись.
- Перед записью создан полный snapshot: `docs/backups/sanity/2026-11-17-ozelenyavane-before-editorial-refresh.xml`.
- В качестве исходного материала использована существующая DROP-страница с болгарским текстом `https://www.drop.od.ua/bg/landscapelanding`. Переданный пользователем URL `/bg/landscaping` открывает другую страницу/маршрут; в редактуру перенесены релевантные темы об озеленении, а не устаревшие цены, украинские геоданные или неподтверждённые заявления.

## Контент

- BG: полноценный Portable Text.
- RU/EN: самостоятельные локализованные Markdown-версии.
- Основные темы: подготовка участка, рулонный газон, деревья и кустарники, цветники, живые изгороди, пальмы и маслины, автоматический полив, этапы работ, уход и FAQ.
- Не переносились устаревшие цены, неподтверждённые объёмы проектов/опыт/собственный питомник и украинские/одесские географические формулировки.

## Галерея

- Существующие non-hero gallery keys `img1`–`img4` → группа `intro`.
- Новые фото:
  - `fbecf7b03cff` → `lawn` (рулонный газон);
  - `ed96b4f74e1a` → `lawn`;
  - `6f4c8223f1c0` → `lawn`;
  - `bc772eab7d78` → `flowerbeds` (цветник).
- Hero image сохранено. Галерея hero duplicate `img0` исключается renderer из article gallery.
- ALT BG/RU/EN заполнены для всех gallery records, включая hero duplicate.
- В текущей схеме услуги нет отдельных `title/titleRu/titleEn` для изображений. Неподдерживаемые поля не добавлялись; локализованы ALT.

## Runtime

- PR #372: https://github.com/omaraandrey-dev/florial/pull/372
- Merge commit: `12fea68f6c4df068ab628d9cb95982bc3d493f93`.
- Изменён `src/pages/ServicePage.tsx`: группы `lawn` и `flowerbeds`, синхронное сопоставление H2 BG/RU/EN, отключение верхней полной галереи и дублирующих нижних image-text блоков для `ozelenyavane`.
- Регрессионный тест: `tests/service-ozelenyavane-inline-gallery.test.mjs`.
- CI: website type-check, lint, tests, build, Studio type-check/build и D1 validation — success.
- Cloudflare Pages Production deployment: `f4c355cd-62b4-4b41-acb0-60674e350f93`, environment `production`, branch `main`, commit `12fea68f6c4df068ab628d9cb95982bc3d493f93`, final stage `success`.

## Sanity Production

- Опубликованы root BG description, RU/EN descriptions, hero/name/shortDescription, SEO для трёх языков, image ALT, advantages/steps, CTA, lead form и relatedContent.
- SEO: уникальные metaTitle/metaDescription/keywords BG/RU/EN; `noIndex=false` во всех локалях.
- Контекстные ссылки: категории деревьев и кустарников, цветов и роз, многолетников, живых изгородей, пальм и юкк, оборудование полива; услуги рулонного газона, посадки растений, цветников и автоматического полива; статьи о газонных покрытиях, маслинах и пальмах.
- Нижний relatedContent: услуга рулонного газона, услуга посадки растений, статья о маслинах, статья о пальмах.
- Lead form технические field names сохранены: `name`, `phone`, `email`, `location`, `details`; локализованы labels, placeholders, title, submit и success message.
- Заявка через форму не отправлялась; API/Manager не менялись.

## QA

- Cloudflare Pages Production deploy exact SHA: success.
- Browser Rendering BG metadata check: HTTP 200; title, description, robots, canonical и JSON-LD Service присутствуют. RU/EN и проверка отрисованных H2/inline image placement/ALT/form — ожидают завершения live QA.
- PageSpeed/Lighthouse и Google Search Console recrawl/indexing не выполнялись и не подтверждены.
- Schema, Studio deploy, Header, navigation, Footer, D1, Manager, API, Resend и Cloudflare settings/secrets не менялись.
