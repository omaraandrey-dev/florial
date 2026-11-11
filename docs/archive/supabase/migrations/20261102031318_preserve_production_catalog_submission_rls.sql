drop policy if exists "active staff can create permitted plant submissions" on public.catalog_submissions;
create policy "active staff can create permitted catalog submissions"
on public.catalog_submissions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_catalog_role(array['seller'::text, 'manager'::text, 'owner'::text])
  and status = 'draft'
  and (
    catalog = 'production'
    or (
      catalog = 'plants'
      and operation = 'create'
      and exists (
        select 1 from public.catalog_staff_profiles p
        where p.user_id = (select auth.uid())
          and p.is_active = true
          and p.permissions @> '{"canCreatePlant": true}'::jsonb
      )
    )
  )
);
drop policy if exists "seller edits own permitted plant drafts" on public.catalog_submissions;
create policy "seller edits own permitted catalog drafts"
on public.catalog_submissions for update to authenticated
using (
  created_by = (select auth.uid())
  and private.has_catalog_role(array['seller'::text, 'manager'::text, 'owner'::text])
  and status = any(array['draft'::text, 'changes_requested'::text])
  and (
    catalog = 'production'
    or (
      catalog = 'plants'
      and operation = 'create'
      and exists (
        select 1 from public.catalog_staff_profiles p
        where p.user_id = (select auth.uid())
          and p.is_active = true
          and p.permissions @> '{"canCreatePlant": true}'::jsonb
      )
    )
  )
)
with check (
  created_by = (select auth.uid())
  and private.has_catalog_role(array['seller'::text, 'manager'::text, 'owner'::text])
  and status = any(array['draft'::text, 'changes_requested'::text, 'submitted'::text])
  and (
    catalog = 'production'
    or (
      catalog = 'plants'
      and operation = 'create'
      and exists (
        select 1 from public.catalog_staff_profiles p
        where p.user_id = (select auth.uid())
          and p.is_active = true
          and p.permissions @> '{"canCreatePlant": true}'::jsonb
      )
    )
  )
);
