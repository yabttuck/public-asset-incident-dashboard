create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null check (length(trim(asset_name)) > 0),
  asset_number text unique check (asset_number is null or length(trim(asset_number)) > 0),
  asset_type text,
  location text,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_active_name_idx on public.assets (is_active, asset_name);

create function public.set_asset_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute procedure public.set_asset_updated_at();

alter table public.assets enable row level security;

revoke all on table public.assets from anon, authenticated;
grant select, insert, update on table public.assets to authenticated;

create policy "Active users can read asset records"
  on public.assets
  for select
  to authenticated
  using ((select public.current_app_role()) is not null);

create policy "Admins can create assets"
  on public.assets
  for insert
  to authenticated
  with check (
    (select public.current_app_role()) = 'admin'
    and created_by = (select auth.uid())
  );

create policy "Admins can update assets"
  on public.assets
  for update
  to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');
