-- Enforce complete seller plant intake before a submission enters owner review.
-- Additive validation only; existing drafts and published catalogue data are untouched.

create or replace function private.validate_plant_submission_before_submit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant jsonb;
  v_images jsonb;
  v_has_uploaded_image boolean;
  v_height numeric;
  v_volume numeric;
  v_price numeric;
  v_quantity numeric;
begin
  if new.catalog <> 'plants'
     or new.operation <> 'create'
     or new.status <> 'submitted'
     or old.status not in ('draft', 'changes_requested') then
    return new;
  end if;

  if length(trim(coalesce(new.payload->>'name', new.title, ''))) < 2 then
    raise exception 'Въведете име на растението.';
  end if;

  if length(trim(coalesce(new.payload->>'productType', ''))) = 0
     or new.payload->>'productType' not in (
       'plant', 'tree', 'shrub', 'flower', 'perennial', 'indoor', 'citrus',
       'palm', 'conifer', 'fruit', 'succulent', 'climber', 'ornamentalGrass',
       'groundcover', 'bulb', 'herb', 'aquatic', 'other'
     ) then
    raise exception 'Изберете валиден тип растение.';
  end if;

  if length(trim(coalesce(new.payload->>'categoryId', ''))) = 0 then
    raise exception 'Изберете категория на растението.';
  end if;

  v_images := new.payload->'images';
  if jsonb_typeof(v_images) is distinct from 'array' then
    raise exception 'Добавете поне една снимка на растението.';
  end if;
  if jsonb_array_length(v_images) = 0 then
    raise exception 'Добавете поне една снимка на растението.';
  end if;

  select exists (
    select 1
    from jsonb_array_elements(v_images) as image_item(value)
    join storage.objects as stored
      on stored.bucket_id = 'florial-manager-intake'
     and stored.name = image_item.value->>'path'
    where image_item.value->>'path' like new.created_by::text || '/' || new.id::text || '/%'
      and coalesce(image_item.value->>'type', '') in ('image/jpeg', 'image/png', 'image/webp')
  ) into v_has_uploaded_image;

  if not v_has_uploaded_image then
    raise exception 'Снимката не е намерена в хранилището. Качете я отново.';
  end if;

  if jsonb_typeof(new.payload->'saleVariants') is distinct from 'array' then
    raise exception 'Попълнете данните за продажба на растението.';
  end if;
  if jsonb_array_length(new.payload->'saleVariants') = 0 then
    raise exception 'Попълнете данните за продажба на растението.';
  end if;
  if jsonb_typeof(new.payload->'saleVariants'->0) is distinct from 'object' then
    raise exception 'Попълнете данните за продажба на растението.';
  end if;

  v_variant := new.payload->'saleVariants'->0;

  if jsonb_typeof(v_variant->'priceEUR') is distinct from 'number' then
    raise exception 'Въведете цена в EUR.';
  end if;
  v_price := (v_variant->>'priceEUR')::numeric;
  if v_price <= 0 then
    raise exception 'Цената трябва да е по-голяма от 0 EUR.';
  end if;

  if jsonb_typeof(v_variant->'saleHeightCm') is distinct from 'number' then
    raise exception 'Въведете височината на растението при продажба.';
  end if;
  v_height := (v_variant->>'saleHeightCm')::numeric;
  if v_height <= 0 then
    raise exception 'Височината трябва да е по-голяма от 0 см.';
  end if;

  if jsonb_typeof(v_variant->'containerVolumeL') is distinct from 'number' then
    raise exception 'Въведете обема на контейнера.';
  end if;
  v_volume := (v_variant->>'containerVolumeL')::numeric;
  if v_volume <= 0 then
    raise exception 'Обемът на контейнера трябва да е по-голям от 0 литра.';
  end if;

  if jsonb_typeof(v_variant->'stockQuantity') is distinct from 'number' then
    raise exception 'Въведете количеството растения.';
  end if;
  v_quantity := (v_variant->>'stockQuantity')::numeric;
  if v_quantity < 0 or v_quantity <> trunc(v_quantity) then
    raise exception 'Количеството трябва да е цяло число от 0 нагоре.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_plant_submission_before_submit() from public, anon, authenticated;

drop trigger if exists catalog_submission_validate_plant_before_submit on public.catalog_submissions;
create trigger catalog_submission_validate_plant_before_submit
  before update of status on public.catalog_submissions
  for each row
  execute function private.validate_plant_submission_before_submit();
