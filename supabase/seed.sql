-- Development-only sample records. Safe to run repeatedly in the dev project.
do $$
declare
  v_admin_id uuid;
begin
  select p.id
  into v_admin_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = 'admin@admin.com'
    and p.role = 'admin'
    and p.is_active = true
  limit 1;

  if v_admin_id is null then
    raise exception 'Active admin@admin.com profile is required before seeding demo data';
  end if;

  insert into public.assets (asset_name, asset_number, asset_type, location, created_by)
  values
    ('본관 네트워크 스위치', 'DEMO-NET-001', '네트워크 장비', '본관 3층 전산실', v_admin_id),
    ('민원실 CCTV 저장장치', 'DEMO-CCTV-002', '영상 장비', '본관 1층 민원실', v_admin_id),
    ('별관 승강기 비상통화 설비', 'DEMO-FAC-003', '공공 시설', '별관 1호기 승강기', v_admin_id),
    ('회의실 무선 AP', 'DEMO-WIFI-004', '네트워크 장비', '본관 2층 대회의실', v_admin_id)
  on conflict (asset_number) do nothing;

  insert into public.incidents (
    idempotency_key, reporter_id, asset_id, location_snapshot, title,
    description, priority, status, assignee_id, occurred_at, due_at,
    completed_at, resolution_summary
  )
  select
    sample.idempotency_key,
    v_admin_id,
    asset.id,
    asset.location,
    sample.title,
    sample.description,
    sample.priority,
    sample.status::public.incident_status,
    case when sample.assigned then v_admin_id else null end,
    now() - sample.occurred_ago,
    case when sample.due_in is null then null else now() + sample.due_in end,
    case when sample.status = 'completed' then now() - interval '3 hours' else null end,
    sample.resolution_summary
  from (values
    ('a1100000-0000-4000-8000-000000000001'::uuid, 'DEMO-NET-001', '본관 3층 유선망 간헐 끊김', '회의실 좌측 유선 포트에서 네트워크가 간헐적으로 끊깁니다. 다른 포트와 스위치 링크 상태 확인이 필요합니다.', '높음', 'received', false, interval '2 hours', interval '8 hours', null::text),
    ('a1100000-0000-4000-8000-000000000002'::uuid, 'DEMO-CCTV-002', '민원실 CCTV 저장 지연', '저장장치 상태 화면에서 일부 채널의 기록이 지연되는 현상이 확인됐습니다. 녹화 보존 상태를 확인해 주세요.', '긴급', 'in_progress', true, interval '1 day', interval '-2 hours', null::text),
    ('a1100000-0000-4000-8000-000000000003'::uuid, 'DEMO-FAC-003', '승강기 비상통화 음량 저하', '승강기 내부 비상통화 시험 중 수신 음량이 작게 들립니다. 통화 장치와 회선을 점검해 주세요.', '보통', 'completed', true, interval '3 days', interval '-1 day', '통화 장치 단자 연결을 보정하고 시험 통화를 완료했습니다.'),
    ('a1100000-0000-4000-8000-000000000004'::uuid, 'DEMO-WIFI-004', '대회의실 무선 접속 불안정', '회의실 뒤쪽 좌석에서 무선 연결이 자주 끊깁니다. AP 상태와 주변 간섭 여부를 확인해 주세요.', '낮음', 'received', false, interval '5 hours', null::interval, null::text)
  ) as sample(idempotency_key, asset_number, title, description, priority, status, assigned, occurred_ago, due_in, resolution_summary)
  join public.assets asset on asset.asset_number = sample.asset_number and asset.is_active = true
  on conflict (reporter_id, idempotency_key) do nothing;

  insert into public.incident_updates (id, incident_id, author_id, visibility, body, created_at)
  select sample.update_id, incident.id, v_admin_id, sample.visibility, sample.body, now() - sample.created_ago
  from (values
    ('a1100000-0000-4000-8000-000000000002'::uuid, 'a1200000-0000-4000-8000-000000000001'::uuid, 'public', '담당자가 저장장치 상태와 채널별 기록을 확인하고 있습니다.', interval '30 minutes'),
    ('a1100000-0000-4000-8000-000000000002'::uuid, 'a1200000-0000-4000-8000-000000000002'::uuid, 'internal', '기한 초과 예시 신고입니다. 상태 변경 및 안내 기능을 확인해 주세요.', interval '20 minutes'),
    ('a1100000-0000-4000-8000-000000000003'::uuid, 'a1200000-0000-4000-8000-000000000003'::uuid, 'public', '점검과 시험 통화를 마쳤습니다. 현재 정상 동작을 확인했습니다.', interval '3 hours')
  ) as sample(idempotency_key, update_id, visibility, body, created_ago)
  join public.incidents incident
    on incident.reporter_id = v_admin_id and incident.idempotency_key = sample.idempotency_key
  on conflict (id) do nothing;

  insert into public.incident_audit_logs (id, incident_id, actor_id, action, old_values, new_values, created_at)
  select sample.log_id, incident.id, v_admin_id, sample.action, sample.old_values, sample.new_values, now() - sample.created_ago
  from (values
    ('a1100000-0000-4000-8000-000000000002'::uuid, 'a1300000-0000-4000-8000-000000000001'::uuid, 'status_changed', '{"status":"received"}'::jsonb, '{"status":"in_progress"}'::jsonb, interval '1 day'),
    ('a1100000-0000-4000-8000-000000000002'::uuid, 'a1300000-0000-4000-8000-000000000002'::uuid, 'assignment_updated', '{"priority":"보통"}'::jsonb, '{"priority":"긴급"}'::jsonb, interval '1 day'),
    ('a1100000-0000-4000-8000-000000000003'::uuid, 'a1300000-0000-4000-8000-000000000003'::uuid, 'status_changed', '{"status":"in_progress"}'::jsonb, '{"status":"completed"}'::jsonb, interval '3 hours')
  ) as sample(idempotency_key, log_id, action, old_values, new_values, created_ago)
  join public.incidents incident
    on incident.reporter_id = v_admin_id and incident.idempotency_key = sample.idempotency_key
  on conflict (id) do nothing;
end;
$$;
