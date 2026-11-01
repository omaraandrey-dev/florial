-- Florial Manager: private plant intake workflow.
-- Additive only: does not alter orders, products, categories, or existing catalog data.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.catalog_staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('seller', 'manager', 'owner')),
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_submissions (
  id uuid primary key default gen_random_uuid(),
  catalog text not null default 'plants' check (catalog in ('plants', 'production')),
  operation text not null default 'create' check (operation in ('create', 'update')),
  target_document_id text,
  target_revision text,
  title text not null default '',
  sku text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'publishing', 'published', 'publish_failed', 'rejected')),
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  publish_error text,
  idempotency_key uuid not null default gen_random_uuid(),
  notification_sent_at timestamptz,
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_submissions_update_target check (
    (operation = 'create' and target_document_id is null) or
    (operation = 'update' and target_document_id is not null)
  )
);

create index if not exists catalog_submissions_creator_status_idx
  on public.catalog_submissions (created_by, status, updated_at desc);
create index if not exists catalog_submissions_review_queue_idx
  on public.catalog_submissions (status, submitted_at desc);
create unique index if not exists catalog_submissions_idempotency_idx
  on public.catalog_submissions (idempotency_key);

create table if not exists public.catalog_submission_events (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.catalog_submissions(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists catalog_submission_events_submission_idx
  on public.catalog_submission_events (submission_id, created_at desc);

create or replace function private.has_catalog_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_staff_profiles p
    where p.user_id = (select auth.uid())
      and p.is_active = true
      and p.role = any (allowed_roles)
  );
$$;
revoke all on function private.has_catalog_role(text[]) from public, anon;
grant execute on function private.has_catalog_role(text[]) to authenticated;

alter table public.catalog_staff_profiles enable row level security;
alter table public.catalog_submissions enable row level security;
alter table public.catalog_submission_events enable row level security;

grant select on public.catalog_staff_profiles to authenticated;
grant select, insert, update on public.catalog_submissions to authenticated;
grant select on public.catalog_submission_events to authenticated;
revoke all on public.catalog_submission_events from anon, authenticated;
grant select on public.catalog_submission_events to authenticated;

drop policy if exists "staff can read own profile or owner reads all" on public.catalog_staff_profiles;
create policy "staff can read own profile or owner reads all"
  on public.catalog_staff_profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.has_catalog_role(array['owner']));

drop policy if exists "staff can read permitted submissions" on public.catalog_submissions;
create policy "staff can read permitted submissions"
  on public.catalog_submissions for select to authenticated
  using (
    created_by = (select auth.uid())
    or private.has_catalog_role(array['manager', 'owner'])
  );

drop policy if exists "active staff can create own submissions" on public.catalog_submissions;
create policy "active staff can create own submissions"
  on public.catalog_submissions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
    and status = 'draft'
  );

drop policy if exists "seller edits own drafts" on public.catalog_submissions;
create policy "seller edits own drafts"
  on public.catalog_submissions for update to authenticated
  using (
    created_by = (select auth.uid())
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
    and status in ('draft', 'changes_requested')
  )
  with check (
    created_by = (select auth.uid())
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
    and status in ('draft', 'changes_requested', 'submitted')
  );

drop policy if exists "owner manages submissions" on public.catalog_submissions;
create policy "owner manages submissions"
  on public.catalog_submissions for all to authenticated
  using (private.has_catalog_role(array['owner']))
  with check (private.has_catalog_role(array['owner']));

drop policy if exists "staff reads events for permitted submissions" on public.catalog_submission_events;
create policy "staff reads events for permitted submissions"
  on public.catalog_submission_events for select to authenticated
  using (
    exists (
      select 1 from public.catalog_submissions s
      where s.id = submission_id
        and (
          s.created_by = (select auth.uid())
          or private.has_catalog_role(array['manager', 'owner'])
        )
    )
  );

create or replace function private.log_catalog_submission_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.catalog_submission_events
      (submission_id, actor_id, event_type, to_status, metadata)
    values
      (new.id, (select auth.uid()), 'created', new.status,
       jsonb_build_object('catalog', new.catalog, 'operation', new.operation));
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.catalog_submission_events
      (submission_id, actor_id, event_type, from_status, to_status, note)
    values
      (new.id, (select auth.uid()), 'status_changed', old.status, new.status, new.review_note);
  end if;
  return new;
end;
$$;

drop trigger if exists catalog_submission_audit on public.catalog_submissions;
create trigger catalog_submission_audit
  after insert or update of status on public.catalog_submissions
  for each row execute function private.log_catalog_submission_event();

create or replace function public.manager_request_catalog_changes(
  submission_id uuid,
  request_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_catalog_role(array['manager', 'owner']) then
    raise exception 'Insufficient role';
  end if;
  if length(trim(coalesce(request_note, ''))) < 3 then
    raise exception 'A review note is required';
  end if;

  update public.catalog_submissions
  set status = 'changes_requested',
      review_note = left(trim(request_note), 2000),
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = submission_id
    and status in ('submitted', 'in_review');

  if not found then
    raise exception 'Submission not found or not reviewable';
  end if;
end;
$$;
revoke all on function public.manager_request_catalog_changes(uuid, text) from public, anon;
grant execute on function public.manager_request_catalog_changes(uuid, text) to authenticated;

-- Private temporary image bucket. Existing bucket configuration is not overwritten.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('florial-manager-intake', 'florial-manager-intake', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "manager staff upload intake photos" on storage.objects;
create policy "manager staff upload intake photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'florial-manager-intake'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
  );

drop policy if exists "manager staff read intake photos" on storage.objects;
create policy "manager staff read intake photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'florial-manager-intake'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.has_catalog_role(array['manager', 'owner'])
    )
  );

drop policy if exists "manager staff update own intake photos" on storage.objects;
create policy "manager staff update own intake photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'florial-manager-intake'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
  )
  with check (
    bucket_id = 'florial-manager-intake'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
  );

drop policy if exists "manager staff delete own intake photos" on storage.objects;
create policy "manager staff delete own intake photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'florial-manager-intake'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.has_catalog_role(array['seller', 'manager', 'owner'])
  );
