create function public.incident_input_fits(value text, max_units integer)
returns boolean
language sql immutable strict
set search_path = ''
as $$
  select char_length(regexp_replace(left(value, max_units + 1), U&'[\+010000-\+10FFFF]', '..', 'g')) <= max_units;
$$;

create function public.check_incident_input_lengths()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if ((tg_op = 'INSERT' or new.title is distinct from old.title) and not public.incident_input_fits(new.title, 160))
    or ((tg_op = 'INSERT' or new.description is distinct from old.description) and not public.incident_input_fits(new.description, 5000))
    or ((tg_op = 'INSERT' or new.location_snapshot is distinct from old.location_snapshot) and not public.incident_input_fits(new.location_snapshot, 240))
    or ((tg_op = 'INSERT' or new.priority is distinct from old.priority) and not public.incident_input_fits(new.priority, 40))
  then
    raise exception 'Incident input is too long' using errcode = '22001';
  end if;
  return new;
end;
$$;

create trigger incidents_check_input_lengths
  before insert or update of title, description, location_snapshot, priority on public.incidents
  for each row execute function public.check_incident_input_lengths();

create function public.create_incident_once_v2(
  p_idempotency_key uuid, p_asset_id uuid, p_location_snapshot text,
  p_title text, p_description text, p_priority text, p_occurred_at timestamptz
)
returns table (
  id uuid, incident_number text, status public.incident_status, created_at timestamptz,
  priority text, was_created boolean
)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reporter uuid := auth.uid();
  v_location text := nullif(trim(p_location_snapshot), '');
begin
  if v_reporter is null or public.current_app_role() is distinct from 'reporter' then
    raise exception 'Insufficient role' using errcode = '42501';
  end if;

  return query select i.id, i.incident_number, i.status, i.created_at, i.priority, false
    from public.incidents i where i.reporter_id = v_reporter and i.idempotency_key = p_idempotency_key;
  if found then return; end if;

  if p_idempotency_key is null or nullif(trim(p_title), '') is null
    or nullif(trim(p_description), '') is null or nullif(trim(p_priority), '') is null
    or p_occurred_at is null then
    raise exception 'Required incident fields are missing' using errcode = '22023';
  end if;

  if p_asset_id is not null then
    select coalesce(v_location, a.location) into v_location
      from public.assets a where a.id = p_asset_id and a.is_active;
    if not found then
      raise exception 'Asset is unavailable' using errcode = '22023';
    end if;
  elsif v_location is null then
    raise exception 'Location is required when no asset is selected' using errcode = '22023';
  end if;

  return query
    insert into public.incidents as i
      (idempotency_key, reporter_id, asset_id, location_snapshot, title, description, priority, occurred_at)
    values
      (p_idempotency_key, v_reporter, p_asset_id, v_location, trim(p_title), trim(p_description), trim(p_priority), p_occurred_at)
    on conflict on constraint incidents_idempotency_per_reporter do nothing
    returning i.id, i.incident_number, i.status, i.created_at, i.priority, true;

  if not found then
    return query select i.id, i.incident_number, i.status, i.created_at, i.priority, false
      from public.incidents i where i.reporter_id = v_reporter and i.idempotency_key = p_idempotency_key;
  end if;
end;
$$;

revoke all on function public.create_incident_once_v2(uuid, uuid, text, text, text, text, timestamptz) from public, anon;
grant execute on function public.create_incident_once_v2(uuid, uuid, text, text, text, text, timestamptz) to authenticated;

create or replace function public.create_incident_once(
  p_idempotency_key uuid, p_asset_id uuid, p_location_snapshot text,
  p_title text, p_description text, p_priority text, p_occurred_at timestamptz
)
returns table (id uuid, incident_number text, status public.incident_status, created_at timestamptz)
language sql security invoker
set search_path = ''
as $$
  select r.id, r.incident_number, r.status, r.created_at
    from public.create_incident_once_v2(p_idempotency_key, p_asset_id, p_location_snapshot,
      p_title, p_description, p_priority, p_occurred_at) r;
$$;
