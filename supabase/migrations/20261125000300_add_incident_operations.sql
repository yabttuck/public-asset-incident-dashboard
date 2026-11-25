create function public.update_incident_assignment(
  p_incident_id uuid,
  p_expected_updated_at timestamptz,
  p_assignee_id uuid,
  p_priority text,
  p_due_at timestamptz
)
returns setof public.incidents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident public.incidents%rowtype;
  v_old_values jsonb;
  v_new_values jsonb;
begin
  if coalesce(public.current_app_role() in ('operator', 'admin'), false) = false then
    raise exception 'Insufficient role' using errcode = '42501';
  end if;

  select i.* into v_incident
  from public.incidents i
  where i.id = p_incident_id
  for update;

  if not found then
    raise exception 'Incident not found' using errcode = 'P0002';
  end if;

  if v_incident.updated_at is distinct from p_expected_updated_at then
    raise exception 'Incident changed; reload before updating' using errcode = '40001';
  end if;

  if v_incident.status = 'completed' then
    raise exception 'Completed incidents require an administrator correction flow' using errcode = '42501';
  end if;

  if p_priority is null or length(trim(p_priority)) = 0 or length(trim(p_priority)) > 40 then
    raise exception 'Priority is required' using errcode = '22023';
  end if;

  if p_assignee_id is not null and not exists (
    select 1 from public.profiles p
    where p.id = p_assignee_id
      and p.role in ('operator', 'admin')
      and p.is_active = true
  ) then
    raise exception 'Assignee is unavailable' using errcode = '22023';
  end if;

  v_old_values := jsonb_build_object(
    'assignee_id', v_incident.assignee_id,
    'priority', v_incident.priority,
    'due_at', v_incident.due_at
  );

  update public.incidents i
  set assignee_id = p_assignee_id,
      priority = trim(p_priority),
      due_at = p_due_at
  where i.id = p_incident_id
  returning i.* into v_incident;

  v_new_values := jsonb_build_object(
    'assignee_id', v_incident.assignee_id,
    'priority', v_incident.priority,
    'due_at', v_incident.due_at
  );

  insert into public.incident_audit_logs (incident_id, actor_id, action, old_values, new_values)
  values (p_incident_id, auth.uid(), 'assignment_updated', v_old_values, v_new_values);

  return next v_incident;
end;
$$;

revoke all on function public.update_incident_assignment(uuid, timestamptz, uuid, text, timestamptz) from public, anon;
grant execute on function public.update_incident_assignment(uuid, timestamptz, uuid, text, timestamptz) to authenticated;

create function public.transition_incident(
  p_incident_id uuid,
  p_expected_updated_at timestamptz,
  p_target_status public.incident_status,
  p_resolution_summary text,
  p_public_update text,
  p_internal_note text
)
returns setof public.incidents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident public.incidents%rowtype;
  v_old_status public.incident_status;
  v_old_values jsonb;
  v_new_values jsonb;
  v_update_id uuid;
begin
  if coalesce(public.current_app_role() in ('operator', 'admin'), false) = false then
    raise exception 'Insufficient role' using errcode = '42501';
  end if;

  select i.* into v_incident
  from public.incidents i
  where i.id = p_incident_id
  for update;

  if not found then
    raise exception 'Incident not found' using errcode = 'P0002';
  end if;

  if v_incident.updated_at is distinct from p_expected_updated_at then
    raise exception 'Incident changed; reload before updating' using errcode = '40001';
  end if;

  v_old_status := v_incident.status;
  if p_target_status is null
    or v_old_status = 'completed'
    or not (
      (v_old_status = 'received' and p_target_status in ('in_progress', 'completed'))
      or (v_old_status = 'in_progress' and p_target_status = 'completed')
    )
  then
    raise exception 'Invalid status transition' using errcode = '22023';
  end if;

  if p_target_status = 'completed'
    and length(trim(coalesce(p_resolution_summary, ''))) = 0
  then
    raise exception 'A resolution summary is required' using errcode = '22023';
  end if;

  if length(coalesce(p_resolution_summary, '')) > 5000
    or length(coalesce(p_public_update, '')) > 5000
    or length(coalesce(p_internal_note, '')) > 5000
  then
    raise exception 'Update text is too long' using errcode = '22023';
  end if;

  v_old_values := jsonb_build_object(
    'status', v_incident.status,
    'completed_at', v_incident.completed_at,
    'resolution_summary', v_incident.resolution_summary
  );

  update public.incidents i
  set status = p_target_status,
      completed_at = case when p_target_status = 'completed' then now() else null end,
      resolution_summary = case
        when p_target_status = 'completed' then trim(p_resolution_summary)
        else null
      end
  where i.id = p_incident_id
  returning i.* into v_incident;

  v_new_values := jsonb_build_object(
    'status', v_incident.status,
    'completed_at', v_incident.completed_at,
    'resolution_summary', v_incident.resolution_summary
  );

  insert into public.incident_audit_logs (incident_id, actor_id, action, old_values, new_values)
  values (p_incident_id, auth.uid(), 'status_changed', v_old_values, v_new_values);

  if length(trim(coalesce(p_public_update, ''))) > 0 then
    insert into public.incident_updates (incident_id, author_id, visibility, body)
    values (p_incident_id, auth.uid(), 'public', trim(p_public_update))
    returning id into v_update_id;

    insert into public.incident_audit_logs (incident_id, actor_id, action, new_values)
    values (
      p_incident_id,
      auth.uid(),
      'public_update_added',
      jsonb_build_object('update_id', v_update_id, 'visibility', 'public')
    );
  end if;

  if length(trim(coalesce(p_internal_note, ''))) > 0 then
    insert into public.incident_updates (incident_id, author_id, visibility, body)
    values (p_incident_id, auth.uid(), 'internal', trim(p_internal_note))
    returning id into v_update_id;

    insert into public.incident_audit_logs (incident_id, actor_id, action, new_values)
    values (
      p_incident_id,
      auth.uid(),
      'internal_note_added',
      jsonb_build_object('update_id', v_update_id, 'visibility', 'internal')
    );
  end if;

  return next v_incident;
end;
$$;

revoke all on function public.transition_incident(uuid, timestamptz, public.incident_status, text, text, text) from public, anon;
grant execute on function public.transition_incident(uuid, timestamptz, public.incident_status, text, text, text) to authenticated;

create function public.add_incident_update(
  p_incident_id uuid,
  p_visibility text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_update_id uuid;
  v_status public.incident_status;
begin
  if coalesce(public.current_app_role() in ('operator', 'admin'), false) = false then
    raise exception 'Insufficient role' using errcode = '42501';
  end if;
  if coalesce(p_visibility not in ('public', 'internal'), true)
    or length(trim(coalesce(p_body, ''))) = 0
    or length(p_body) > 5000
  then
    raise exception 'Invalid update' using errcode = '22023';
  end if;

  select i.status into v_status
  from public.incidents i
  where i.id = p_incident_id
  for update;

  if not found then
    raise exception 'Incident not found' using errcode = 'P0002';
  end if;
  if v_status = 'completed' then
    raise exception 'Completed incidents are read-only' using errcode = '42501';
  end if;

  insert into public.incident_updates (incident_id, author_id, visibility, body)
  values (p_incident_id, auth.uid(), p_visibility, trim(p_body))
  returning id into v_update_id;

  insert into public.incident_audit_logs (incident_id, actor_id, action, new_values)
  values (
    p_incident_id,
    auth.uid(),
    'update_added',
    jsonb_build_object('update_id', v_update_id, 'visibility', p_visibility)
  );

  update public.incidents i
  set updated_at = now()
  where i.id = p_incident_id;

  return v_update_id;
end;
$$;

revoke all on function public.add_incident_update(uuid, text, text) from public, anon;
grant execute on function public.add_incident_update(uuid, text, text) to authenticated;
