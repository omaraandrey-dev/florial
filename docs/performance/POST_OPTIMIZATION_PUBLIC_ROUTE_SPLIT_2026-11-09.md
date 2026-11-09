# Florial — public page code splitting report (09.11.2026)

**PR:** https://github.com/omaraandrey-dev/florial/pull/147  
**Merge commit:** `b35b5e499700d0330a7ea43ca1ca09e4f6cad7e8`  
**Production deployment:** `20836dfd-7536-4379-be50-2c865800c814` — success  
**Changed runtime file:** `src/App.tsx`

## Change

- HomePage remains statically imported in the public entry.
- Ten non-home page components now use React.lazy dynamic imports: AboutPage, CartPage, ContactsPage, ServicesListPage, ServicePage, CategoryPage, ProductPage, BlogPage, BlogPostPage and IrrigationSupportPage.
- One Suspense boundary wraps route content. Header and Footer remain outside.
- Route predicates, navigation callbacks, state, data queries, props and page-level SEO were not changed.

## CI

- Blog and Studio validation `42592562970`: success — lint, utility tests, website build, migration syntax, read-only migration dry-run, Studio dependency install/build.
- D1 validation `42592563158`: success.

## Production build artifact sizes

| Main entry | Raw | gzip |
|---|---:|---:|
| Before PR #147 (PR #146 build) | 620.15 kB | 163.82 kB |
| After PR #147 | 388.90 kB | 106.91 kB |
| Difference | −231.25 kB | −56.91 kB |

Main entry gzip reduction: approximately 34.74%.

Route chunks (raw / gzip):
- BlogPage 3.67 / 1.68 kB
- ContactsPage 7.23 / 2.48 kB
- BlogPostPage 8.67 / 3.27 kB
- ServicesListPage 12.21 / 4.28 kB
- CartPage 23.14 / 6.16 kB
- IrrigationSupportPage 24.19 / 7.31 kB
- ServicePage 26.27 / 8.35 kB
- AboutPage 35.76 / 9.59 kB
- ProductPage 46.80 / 12.52 kB
- CategoryPage 47.41 / 12.60 kB

These are Vite build artifact sizes, not live transfer bytes, and do not establish an overall page-speed percentage.

## Live direct-route smoke

All rendered successfully without a persistent Suspense/loading placeholder:
- Homepage BG/RU/EN
- /about, /cart (empty), /contacts, /services
- /services/zasazhdane-na-rasteniya
- /services/dostavka-poliv
- /category/rastenia
- /category/vsichko-za-polivane
- /product/rain-bird-100-pga-9v
- /product/trachycarpus-fortunei
- /blog
- /blog/rain-bird-oborudvane
- /search?q=Rain%20Bird (130 results)

## Not yet verified

- Full SPA navigation and scroll restoration across lazy route transitions.
- Live PerformanceResourceTiming for every new route chunk; Firecrawl browser interaction was unavailable at the time due its concurrent-job limit.
- Controlled mobile CDP capture, Lighthouse, LCP, INP and CLS.

## Scope

Only `src/App.tsx` changed. No Sanity schema/documents, D1, API, Manager, cart/checkout, Header/menu/Footer layout or Cloudflare settings/secrets changed. No real order or form was submitted.
