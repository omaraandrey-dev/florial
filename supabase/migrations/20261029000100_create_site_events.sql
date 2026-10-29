-- Anonymous first-party analytics for Florial.
-- This migration is intentionally not applied automatically.
-- Report: daily event counts grouped by event type and interface language:
-- select (created_at at time zone 'UTC')::date as event_day,
--        event_type, lang, count(*) as event_count
-- from public.site_events
-- group by 1, 2, 3
-- order by 1 desc, 2, 3;

create table public.site_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null
    check (event_type in ('page_view', 'call_bg', 'call_en_ru', 'chat_click')),
  lang text not null
    check (lang in ('bg', 'ru', 'en')),
  page_path text not null
    check (char_length(page_path) <= 200)
);

alter table public.site_events enable row level security;

revoke all privileges on table public.site_events from anon, authenticated, public;
grant all privileges on table public.site_events to service_role;

create index site_events_created_at_idx
  on public.site_events (created_at);

create index site_events_type_created_at_idx
  on public.site_events (event_type, created_at);
