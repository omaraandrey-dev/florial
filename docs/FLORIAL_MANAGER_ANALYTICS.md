# Florial Manager — owner analytics

## Scope

The owner-only Analytics tab in `/manager` reads the existing anonymous `public.site_events` dataset. It reports page views, phone clicks, WhatsApp clicks, event counts by interface language, top page paths, and daily page-view counts.

## Access control

The frontend calls `public.manager_site_analytics(integer)` through the existing Supabase client and authenticated owner session. The SQL function is `SECURITY DEFINER`, has an empty search path, checks `auth.uid()` and `private.has_catalog_role(array['owner'])`, and returns aggregate JSON only. Execute is revoked from `PUBLIC` and `anon`, and granted to `authenticated`; non-owner authenticated users are rejected inside the function.

The function is exposed through the Supabase Data API because it lives in `public`. This is intentional: the owner check is enforced inside the function and no raw event rows are returned. Review the corresponding Supabase Security Advisor warning after applying the migration.

## Reporting

Supported periods are today, 7, 30, and 90 days. “Today” starts at 00:00 in `Europe/Sofia` and runs through the current moment; the other periods retain the existing rolling-window behavior. Day grouping uses `Europe/Sofia`. Event types map to:
- `page_view`: page view
- `call_bg`: +359 876 777 902 (BG)
- `call_en_ru`: +359 885 834 860 (ENG / UA / RU)
- `chat_click`: WhatsApp +380 67 480 7486

The report counts recorded events, not unique visitors. No IP addresses, user-agent strings, referrers, visitor IDs, device fingerprints, or form contents are collected.

## Deployment status

The code and migration are prepared in the feature branch. The migration must be applied to the production Supabase project before the Analytics tab can return data. No production database changes have been made by this branch.
