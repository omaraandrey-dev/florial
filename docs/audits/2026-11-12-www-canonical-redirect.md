# WWW → non-WWW canonical redirect — 2026-11-12

## Итог

Исправлено production-правило Cloudflare Redirect Rules для перенаправления www.florial-bg.com на основной домен florial-bg.com.

- Zone: florial-bg.com (zone ID 4419b96d6622eaff8689d8bc729ff57e)
- Ruleset: 70edcde1f86a4cdb97324f426a5ea53e
- Rule: 58851ae78926478aa7bb05dac1480abf
- Rule description: WWW to non-WWW
- До исправления: version 4, condition: (http.request.full_uri eq "www.florial-bg.com")
- После исправления: version 5, condition: (http.host eq "www.florial-bg.com")
- Action: redirect; status code: 301
- Target expression: concat("https://florial-bg.com", http.request.uri.path)
- Query string: preserve_query_string = true
- Rule remains enabled.

## Проверки

### Cloudflare API — live configuration

1. До изменения прочитан текущий ruleset и единственное правило; сохранены его ID, action, target expression, query preservation и enabled state.
2. Cloudflare API dry-run для изменённого ruleset вернул success: true, без ошибок.
3. Production PUT завершился success: true.
4. Повторный GET подтвердил version 5, исправленное условие, неизменные 301/target/path/query параметры и enabled state.

### Cloudflare Request Tracer — simulated requests

После изменения отправлены безопасные симуляции запросов (без обращения к origin):

- GET https://www.florial-bg.com/services → simulated status 301.
- GET https://www.florial-bg.com/?utm_source=redirect-test → simulated status 301.
- GET https://florial-bg.com/services → simulated status 200.

Это подтверждает срабатывание redirect rule для www и отсутствие перенаправления для apex host в Cloudflare Request Tracer. Tracer не является полноценным внешним HTTP smoke test и в этих результатах не предоставил проверяемый клиентский Location header.

### Внешний HTTP и Google

- Прямой live HTTP smoke test не завершён: Firecrawl подключение исчерпало дневной и командный лимиты; web viewer не смог получить страницы; прямой сетевой запрос из контейнера недоступен.
- Google Search Console не проверен в рамках этой операции.
- Фактический Google-selected canonical и полнота индексации НЕ ПОДТВЕРЖДЕНЫ. Их следует проверить в Search Console через URL Inspection для www и apex вариантов главной страницы и /services.

## Существующая SEO-конфигурация в GitHub main до изменения Cloudflare

Проверено по исходникам ветки main на HEAD 36f37ef824a6118af55fddda5f8f8d8626dd94af:

- index.html: homepage canonical — https://florial-bg.com/.
- src/lib/seo.ts: SITE_URL = 'https://florial-bg.com'; динамический canonical строится от apex.
- functions/_middleware.ts: SITE_URL = 'https://florial-bg.com'; middleware задаёт canonical/OG URL на apex, включая service pages.
- functions/sitemap.xml.ts: SITE_URL = 'https://florial-bg.com'; sitemap строит абсолютные URL на apex.
- public/robots.txt: sitemap указан как https://florial-bg.com/sitemap.xml.

## Scope и ограничения

- Изменено только одно production Cloudflare Ruleset rule condition.
- Не изменялись DNS records, Pages domains, Pages variables/secrets, Pages source code, GitHub application code, Sanity, D1, Resend или sitemap.
- Оба custom domains ранее подтверждены как active в одном Cloudflare Pages project florial; production branch — main.
- Наличие www в Pages custom domains нормально для приёма трафика; единый URL достигается redirect rule и canonical, а не удалением www-домена из Pages.
- Google canonical consolidation происходит не мгновенно и окончательно определяется Google. После подтверждённого внешнего HTTP 301 следует проверить URL Inspection и при необходимости запросить indexing для canonical URL.
