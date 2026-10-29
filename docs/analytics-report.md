# Florial anonymous analytics report

Run in the Supabase SQL editor to see visits and contact clicks, with the exact phone number shown for each phone-click event. Dates use Bulgaria local time.

```sql
select
  (created_at at time zone 'Europe/Sofia')::date as event_day,
  event_type,
  case event_type
    when 'page_view' then 'Page view'
    when 'call_bg' then '+359 876 777 902 (BG)'
    when 'call_en_ru' then '+359 885 834 860 (ENG / UA / RU)'
    when 'chat_click' then 'WhatsApp +380 67 480 74 86'
    else event_type
  end as contact_target,
  lang,
  count(*) as event_count
from public.site_events
where created_at >= now() - interval '30 days'
group by 1, 2, 3, 4
order by 1 desc, 2, 4;
```

To compare only phone-number clicks over the last 30 days:

```sql
select
  case event_type
    when 'call_bg' then '+359 876 777 902 (BG)'
    when 'call_en_ru' then '+359 885 834 860 (ENG / UA / RU)'
  end as phone_number,
  count(*) as click_count
from public.site_events
where event_type in ('call_bg', 'call_en_ru')
  and created_at >= now() - interval '30 days'
group by event_type
order by click_count desc;
```

The table is intended to store only event type, interface language, page path (up to 200 characters), and timestamp. The phone number is derived in these reports from the event type; no phone number or additional personal data is stored per visitor. Do not add IP addresses, user-agent strings, referrers, visitor identifiers, device fingerprints or form contents.
