# Florial anonymous analytics report

Run in the Supabase SQL editor after the `site_events` migration has been reviewed and applied:

```sql
select
  (created_at at time zone 'UTC')::date as event_day,
  event_type,
  lang,
  count(*) as event_count
from public.site_events
group by 1, 2, 3
order by 1 desc, 2, 3;
```

The table is intended to store only event type, interface language, page path (up to 200 characters), and timestamp. Do not add IP addresses, user-agent strings, referrers, visitor identifiers, device fingerprints or form contents.
