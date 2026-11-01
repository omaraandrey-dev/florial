-- Owner-only aggregated analytics for the Florial Manager.
-- No visitor-level records or additional personal data are returned.

create or replace function public.manager_site_analytics(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_since timestamptz;
  v_result jsonb;
begin
  if (select auth.uid()) is null
     or not private.has_catalog_role(array['owner']) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  if p_days is null or p_days not in (7, 30, 90) then
    raise exception 'Unsupported analytics period' using errcode = '22023';
  end if;

  v_since := now() - make_interval(days => p_days);

  select jsonb_build_object(
    'period_days', p_days,
    'totals', (
      select jsonb_build_object(
        'page_views', count(*) filter (where event_type = 'page_view'),
        'call_bg', count(*) filter (where event_type = 'call_bg'),
        'call_en_ru', count(*) filter (where event_type = 'call_en_ru'),
        'chat_click', count(*) filter (where event_type = 'chat_click'),
        'contact_clicks', count(*) filter (where event_type in ('call_bg', 'call_en_ru', 'chat_click')),
        'total_events', count(*)
      )
      from public.site_events
      where created_at >= v_since
    ),
    'daily', (
      select coalesce(jsonb_agg(to_jsonb(d) order by d.event_day), '[]'::jsonb)
      from (
        select
          (created_at at time zone 'Europe/Sofia')::date as event_day,
          count(*) filter (where event_type = 'page_view') as page_views,
          count(*) filter (where event_type = 'call_bg') as call_bg,
          count(*) filter (where event_type = 'call_en_ru') as call_en_ru,
          count(*) filter (where event_type = 'chat_click') as chat_click
        from public.site_events
        where created_at >= v_since
        group by 1
      ) d
    ),
    'by_event', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.event_count desc), '[]'::jsonb)
      from (
        select event_type, count(*) as event_count
        from public.site_events
        where created_at >= v_since
        group by event_type
      ) e
    ),
    'by_language', (
      select coalesce(jsonb_agg(to_jsonb(l) order by l.event_count desc), '[]'::jsonb)
      from (
        select lang, count(*) as event_count
        from public.site_events
        where created_at >= v_since
        group by lang
      ) l
    ),
    'top_pages', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.page_views desc), '[]'::jsonb)
      from (
        select page_path, count(*) as page_views
        from public.site_events
        where created_at >= v_since
          and event_type = 'page_view'
        group by page_path
        order by count(*) desc
        limit 10
      ) p
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.manager_site_analytics(integer) from public, anon;
grant execute on function public.manager_site_analytics(integer) to authenticated;
