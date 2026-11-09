# Florial — результат оптимизации изображений главной страницы

**Дата:** 09.11.2026  
**PR:** [#141 — responsive images on homepage](https://github.com/omaraandrey-dev/florial/pull/141)  
**Merge commit:** `b635aa4e307da86b11f70595f9da8a3c3d444074`  
**Файл runtime:** `src/pages/HomePage.tsx`  
**Production deployment:** `81b26460-1c58-408c-9cc3-c485e256ec45`, status `success`; aliases `florial-bg.com` и `www.florial-bg.com`.

## 1. Что изменено

- Добавлен локальный helper `getHomepageImageProps` для публичных изображений Sanity project `bxvcy0qs`; прочие URL остаются без изменений.
- Для карточек услуг, категорий растений и оборудования используются responsive Sanity CDN URLs: widths 320, 480, 640, 800, 960 и 1200 px; `fit=max`, `auto=format`, `q=75`.
- Добавлены `srcSet` и `sizes`, чтобы браузер выбирал размер по ширине карточки и viewport.
- Добавлены явные `loading="lazy"`, `decoding="async"`, `width="800"`, `height="600"` для карточных изображений.
- Существующие ALT/TITLE, ссылки, контейнеры, `object-cover` / `object-contain` сохранены.
- Hero CSS background намеренно не изменён: его роль в LCP ещё не подтверждена.
- Изменён только один runtime-файл. Новые зависимости не добавлялись.

## 2. Production smoke

- Production deployment commit `b635aa4e307da86b11f70595f9da8a3c3d444074` — success.
- BG `/`, RU `/?lang=ru`, EN `/?lang=en` — HTTP 200; локализованные заголовки страницы присутствуют.
- В живом DOM болгарской главной: 38 элементов `img`; 34 имеют `srcSet` и `sizes`; 37 используют `loading="lazy"` (логотип остаётся eager).
- Преобразованные Sanity image URLs действительно присутствуют в DOM; браузер выбирает вариант 320w для карточек, отрисованных примерно на 164 CSS px в мобильном viewport.
- Hero background сохранил прежний URL.
- Полный визуальный review скриншотов и scroll-through проверки всех изображений не выполнены в этой сессии; не считать их подтверждёнными. Lighthouse/CrUX/LCP/INP также остаются открытыми.

## 3. Повторный mobile network capture

**Профиль:** Chromium viewport 390×844, CPU slowdown 4×, latency 150 ms, download 10 Mbps, upload 1.5 Mbps; browser cache отключён; 3 последовательных прогона; измерен initial load до прокрутки всей страницы.

| Показатель | До оптимизации | После: прогон 1 | После: прогон 2 | После: прогон 3 | После: медиана |
|---|---:|---:|---:|---:|---:|
| Общий transfer | 42,874,746 B | 15,790,388 B | 12,927,532 B | 12,929,319 B | **12,929,319 B** |
| Image transfer | 38,921,410 B | 11,841,602 B | 8,980,653 B | 8,980,844 B | **8,980,844 B** |
| Image responses | 38 | 23 | 21 | 21 | **21** |
| Sanity XHR transfer | 3,726,573 B | 3,725,893 B | 3,724,885 B | 3,725,884 B | **3,725,884 B** |

**Изменение медианы initial transfer:**
- Общий сетевой объём: примерно **−69.8%**.
- Передача изображений: примерно **−76.9%**.
- Sanity XHR остался практически без изменений — это ожидаемо, так как GROQ-запросы не менялись.
- В DOM по-прежнему 38 изображений, но на initial load в медианном прогоне браузер получил 21 image response; остальная часть отложена native lazy loading. Сравнение относится к начальному открытию, не к полному скачиванию всех изображений после прокрутки.

## 4. CI и границы

GitHub Actions для PR #141:
- Blog and Studio validation run `42582485634` — success: lint, tests, website build, syntax checks, read-only migration dry-run, Sanity Studio build.
- D1 migration validation run `42582485603` — success.
- PR #141 merged squash; только `src/pages/HomePage.tsx` изменён.

Не менялись: Sanity schema/documents, D1, API, checkout, cart, Manager, Header, menu, Footer, BlogSection, Cloudflare settings/secrets и production data. D1 workflow выполнял только валидацию; миграции не запускались.

## 5. Что дальше

1. Отдельно получить Lighthouse/LCP и выполнить desktop post-measurement, когда измерительная среда будет доступна.
2. Не менять Hero, пока не установлен реальный LCP element.
3. Следующий кодовый этап — карта всех потребителей глобальных массивов в `src/App.tsx` и план лёгких Sanity projections. Уменьшать каталожные запросы без этой карты нельзя.
4. Отдельно запланировать изображения BlogSection и остальных страниц; текущая реализация касается только карточных изображений HomePage.
