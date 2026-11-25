create type public.incident_status as enum ('received', 'in_progress', 'completed');

create sequence public.incident_number_seq;
revoke all on sequence public.incident_number_seq from public, anon, authenticated;

create function public.assign_incident_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.incident_number is null then
    new.incident_number :=
      'INC-' || to_char(now() at time zone 'Asia/Seoul', 'YYYY') || '-' ||
      lpad(nextval('public.incident_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

revoke all on function public.assign_incident_number() from public, anon, authenticated;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null,
  incident_number text not null unique,
  reporter_id uuid not null default auth.uid() references public.profiles (id),
  asset_id uuid references public.assets (id),
  location_snapshot text,
  title text not null check (length(trim(title)) > 0),
  description text not null check (length(trim(description)) > 0),
  priority text not null,
  status public.incident_status not null default 'received',
  assignee_id uuid references public.profiles (id),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  resolution_summary text,
  follow_up_of uuid references public.incidents (id),
  constraint incidents_location_required check (
    asset_id is not null or length(trim(coalesce(location_snapshot, ''))) > 0
  ),
  constraint incidents_completion_fields check (
    (status = 'completed' and completed_at is not null and length(trim(coalesce(resolution_summary, ''))) > 0)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint incidents_idempotency_per_reporter unique (reporter_id, idempotency_key)
);

create index incidents_reporter_created_idx on public.incidents (reporter_id, created_at desc);
create index incidents_asset_status_idx on public.incidents (asset_id, status);
create index incidents_status_due_idx on public.incidents (status, due_at);

create trigger incidents_assign_number
  before insert on public.incidents
  for each row execute procedure public.assign_incident_number();

create function public.set_incident_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute procedure public.set_incident_updated_at();

alter table public.incidents enable row level security;

revoke all on table public.incidents from anon, authenticated;
grant select on table public.incidents to authenticated;

create policy "Reporters can create their own incidents"
  on public.incidents
  for insert
  to authenticated
  with check (
    (select public.current_app_role()) = 'reporter'
    and reporter_id = (select auth.uid())
    and status = 'received'
    and assignee_id is null
    and due_at is null
    and completed_at is null
    and resolution_summary is null
    and follow_up_of is null
    and (
      asset_id is null
      or exists (
        select 1 from public.assets a
        where a.id = asset_id and a.is_active = true
      )
    )
  );

create policy "Reporters can read their own incidents"
  on public.incidents
  for select
  to authenticated
  using (
    ((select public.current_app_role()) = 'reporter' and reporter_id = (select auth.uid()))
    or (select public.current_app_role()) in ('operator', 'admin')
  );

create table public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  visibility text not null check (visibility in ('public', 'internal')),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index incident_updates_incident_created_idx on public.incident_updates (incident_id, created_at);
alter table public.incident_updates enable row level security;
revoke all on table public.incident_updates from anon, authenticated;
grant select, insert on table public.incident_updates to authenticated;

create policy "Reporters can read public updates on their incidents"
  on public.incident_updates
  for select
  to authenticated
  using (
    visibility = 'public'
    and exists (
      select 1 from public.incidents i
      where i.id = incident_id and i.reporter_id = (select auth.uid())
    )
  );

create policy "Operators can read all incident updates"
  on public.incident_updates
  for select
  to authenticated
  using ((select public.current_app_role()) in ('operator', 'admin'));

create table public.incident_audit_logs (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index incident_audit_incident_created_idx on public.incident_audit_logs (incident_id, created_at);
alter table public.incident_audit_logs enable row level security;
revoke all on table public.incident_audit_logs from anon, authenticated;
grant select on table public.incident_audit_logs to authenticated;

create policy "Operators can read incident audit history"
  on public.incident_audit_logs
  for select
  to authenticated
  using ((select public.current_app_role()) in ('operator', 'admin'));

create function public.find_open_incident_summaries(p_asset_id uuid)
returns table (incident_number text, status public.incident_status, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(public.current_app_role() = 'reporter', false) = false then
    raise exception 'Insufficient role' using errcode = '42501';
  end if;

  if p_asset_id is null then
    return;
  end if;

  return query
  select i.incident_number, i.status, i.created_at
  from public.incidents i
  where i.asset_id = p_asset_id
    and i.status <> 'completed'
    and exists (
      select 1 from public.assets a
      where a.id = p_asset_id and a.is_active = true
    )
  order by i.created_at desc
  limit 5;
end;
$$;

revoke all on function public.find_open_incident_summaries(uuid) from public, anon;
grant execute on function public.find_open_incident_summaries(uuid) to authenticated;

create function public.create_incident_once(
  p_idempotency_key uuid,
  p_asset_id uuid,
  p_location_snapshot text,
  p_title text,
  p_description text,
  p_priority text,
  p_occurred_at timestamptz
)
returns table (id uuid, incident_number text, status public.incident_status, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_location text;
begin
  if auth.uid() is null or coalesce(public.current_app_role() = 'reporter', false) = false then
    raise exception 'Insufficient role' using errcode = '42501';
  end if;

  if p_idempotency_key is null
    or length(trim(coalesce(p_title, ''))) = 0
    or length(trim(coalesce(p_description, ''))) = 0
    or length(trim(coalesce(p_priority, ''))) = 0
    or p_occurred_at is null
  then
    raise exception 'Required incident fields are missing' using errcode = '22023';
  end if;

  if p_asset_id is not null then
    select a.location into v_location
    from public.assets a
    where a.id = p_asset_id and a.is_active = true;

    if not found then
      raise exception 'Asset is unavailable' using errcode = '22023';
    end if;
  elsif length(trim(coalesce(p_location_snapshot, ''))) = 0 then
    raise exception 'Location is required when no asset is selected' using errcode = '22023';
  end if;

  insert into public.incidents (
    idempotency_key,
    reporter_id,
    asset_id,
    location_snapshot,
    title,
    description,
    priority,
    occurred_at
  ) values (
    p_idempotency_key,
    auth.uid(),
    p_asset_id,
    coalesce(nullif(trim(p_location_snapshot), ''), v_location),
    trim(p_title),
    trim(p_description),
    trim(p_priority),
    p_occurred_at
  )
  on conflict (reporter_id, idempotency_key) do nothing;

  return query
  select i.id, i.incident_number, i.status, i.created_at
  from public.incidents i
  where i.reporter_id = auth.uid()
    and i.idempotency_key = p_idempotency_key;
end;
$$;

revoke all on function public.create_incident_once(uuid, uuid, text, text, text, text, timestamptz) from public, anon;
grant execute on function public.create_incident_once(uuid, uuid, text, text, text, text, timestamptz) to authenticated;
