alter table public.catalog_staff_profiles
  add column if not exists permissions jsonb not null
  default '{"canCreatePlant": true, "canAddPlantVariant": false, "canEditPlantPrice": false}'::jsonb;
alter table public.catalog_staff_profiles drop constraint if exists catalog_staff_profiles_permissions_shape_check;
alter table public.catalog_staff_profiles add constraint catalog_staff_profiles_permissions_shape_check
check (jsonb_typeof(permissions) = 'object'
  and jsonb_typeof(permissions -> 'canCreatePlant') = 'boolean'
  and jsonb_typeof(permissions -> 'canAddPlantVariant') = 'boolean'
  and jsonb_typeof(permissions -> 'canEditPlantPrice') = 'boolean');
drop policy if exists "active staff can create own submissions" on public.catalog_submissions;
create policy "active staff can create permitted plant submissions"
on public.catalog_submissions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_catalog_role(array['seller'::text, 'manager'::text, 'owner'::text])
  and status = 'draft' and catalog = 'plants' and operation = 'create'
  and exists (select 1 from public.catalog_staff_profiles p
    where p.user_id = (select auth.uid()) and p.is_active = true
      and p.permissions @> '{"canCreatePlant": true}'::jsonb)
);
drop policy if exists "seller edits own drafts" on public.catalog_submissions;
create policy "seller edits own permitted plant drafts"
on public.catalog_submissions for update to authenticated
using (
  created_by = (select auth.uid())
  and private.has_catalog_role(array['seller'::text, 'manager'::text, 'owner'::text])
  and status = any(array['draft'::text, 'changes_requested'::text])
  and catalog = 'plants' and operation = 'create'
  and exists (select 1 from public.catalog_staff_profiles p
    where p.user_id = (select auth.uid()) and p.is_active = true
      and p.permissions @> '{"canCreatePlant": true}'::jsonb)
)
with check (
  created_by = (select auth.uid())
  and private.has_catalog_role(array['seller'::text, 'manager'::text, 'owner'::text])
  and status = any(array['draft'::text, 'changes_requested'::text, 'submitted'::text])
  and catalog = 'plants' and operation = 'create'
  and exists (select 1 from public.catalog_staff_profiles p
    where p.user_id = (select auth.uid()) and p.is_active = true
      and p.permissions @> '{"canCreatePlant": true}'::jsonb)
);
