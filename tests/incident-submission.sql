begin;

do $$
declare
  reporter uuid := gen_random_uuid();
  request_key uuid := gen_random_uuid();
  created record;
  replay record;
  field_name text;
begin
  insert into auth.users (id) values (reporter);
  perform set_config('request.jwt.claim.sub', reporter::text, true);

  select * into strict created from public.create_incident_once_v2(
    request_key, null, repeat('가', 240), repeat('😀', 80), repeat('가', 5000), '긴급', now());
  assert created.was_created and created.priority = '긴급';

  select * into strict replay from public.create_incident_once_v2(
    request_key, null, '다른 위치', '다른 제목', '재시도', '보통', now());
  assert not replay.was_created and replay.id = created.id and replay.priority = '긴급';
  assert (select count(*) = 1 from public.incidents where reporter_id = reporter and idempotency_key = request_key);
  assert (select id = created.id from public.create_incident_once(
    request_key, null, '위치', '제목', '내용', '보통', now()));

  foreach field_name in array array['title', 'description', 'location', 'priority'] loop
    begin
      perform public.create_incident_once_v2(
        gen_random_uuid(), null,
        case when field_name = 'location' then repeat('가', 241) else '위치' end,
        case when field_name = 'title' then repeat('😀', 80) || '가' else '제목' end,
        case when field_name = 'description' then repeat('가', 5001) else '내용' end,
        case when field_name = 'priority' then repeat('가', 41) else '보통' end,
        now());
      raise exception 'Expected length rejection for %', field_name;
    exception when string_data_right_truncation then null;
    end;
  end loop;

  begin
    update public.incidents set title = repeat('가', 161) where id = created.id;
    raise exception 'Expected length rejection on update';
  exception when string_data_right_truncation then null;
  end;
end;
$$;

rollback;
