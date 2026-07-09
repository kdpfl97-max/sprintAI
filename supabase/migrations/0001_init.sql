-- SprintAI 초기 스키마
-- 팀 코드 초대 유지, 팀당 활성 스프린트 1개 제한, Realtime 활성화

-- ── 팀 ─────────────────────────────────────────
create table teams (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  team_code       text unique not null,
  discord_webhook text,
  created_at      timestamptz not null default now()
);

-- ── 프로필 (auth.users 확장) ─────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#2563EB',
  initials   text not null,
  created_at timestamptz not null default now()
);

-- ── 팀 멤버십 (팀 코드로 가입) ─────────────────────
create table team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null check (role in ('PM','member')),
  job_role   text,
  capacity   int not null default 80,
  status     text not null default 'active',
  joined_at  timestamptz not null default now(),
  unique (team_id, user_id)
);

-- ── 백로그 ─────────────────────────────────────
create table backlog_items (
  id              bigint generated always as identity primary key,
  team_id         uuid not null references teams(id) on delete cascade,
  title           text not null,
  description     text,
  category        text,
  stage           text,
  priority        text not null default 'Should',
  estimated_hours numeric default 0,
  difficulty      text default '보통',
  status          text not null default '미배정',
  due_date        date,
  done_condition  text,
  output_link     text,
  captured_by     uuid references profiles(id),
  created_at      timestamptz not null default now(),
  last_updated_at timestamptz
);

create table backlog_item_assignees (
  backlog_item_id bigint not null references backlog_items(id) on delete cascade,
  member_id       uuid not null references team_members(id) on delete cascade,
  primary key (backlog_item_id, member_id)
);

create table backlog_item_blockers (
  backlog_item_id bigint not null references backlog_items(id) on delete cascade,
  blocked_by_id   bigint not null references backlog_items(id) on delete cascade,
  primary key (backlog_item_id, blocked_by_id)
);

-- ── 스프린트 ───────────────────────────────────
create table sprints (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  name       text not null,
  goal       text,
  status     text not null default 'active' check (status in ('active','completed')),
  start_date date not null,
  end_date   date not null,
  started_at timestamptz not null default now(),
  closed_at  timestamptz
);

-- 팀당 활성(active) 스프린트는 최대 1개만 허용
create unique index sprints_one_active_per_team
  on sprints (team_id)
  where status = 'active';

-- ── 스프린트 태스크 ─────────────────────────────
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  sprint_id       uuid not null references sprints(id) on delete cascade,
  backlog_item_id bigint references backlog_items(id),
  title           text not null,
  priority        text not null default 'Should',
  estimated_hours numeric default 0,
  status          text not null default 'todo',
  progress        int not null default 0,
  member_id       uuid references team_members(id),
  blocker_id      uuid references tasks(id),
  start_date      date,
  due_date        date,
  note            text,
  output_link     text,
  created_at      timestamptz not null default now()
);

-- ── 회고 ───────────────────────────────────────
create table retro_entries (
  id         bigint generated always as identity primary key,
  sprint_id  uuid not null references sprints(id) on delete cascade,
  section    text not null check (section in ('liked','learned','lacked','longed')),
  author_id  uuid not null references profiles(id),
  text       text not null,
  created_at timestamptz not null default now()
);

-- ── 일정(캘린더) ────────────────────────────────
create table schedule_events (
  id         bigint generated always as identity primary key,
  team_id    uuid not null references teams(id) on delete cascade,
  event_date date not null,
  title      text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ── 알림 ───────────────────────────────────────
create table notifications (
  id         bigint generated always as identity primary key,
  team_id    uuid not null references teams(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── 캐파 학습 이력 (뷰) ──────────────────────────
create view capacity_history as
select
  s.team_id, s.id as sprint_id, s.name as sprint_name, s.closed_at,
  t.member_id,
  count(*) filter (where t.status <> 'done') as overdue_count,
  count(*) as total_count
from tasks t
join sprints s on s.id = t.sprint_id
where s.status = 'completed'
  and t.due_date < s.closed_at
group by s.team_id, s.id, s.name, s.closed_at, t.member_id;

-- ══════════════════════════════════════════════
-- Row Level Security — 팀 스코프
-- ══════════════════════════════════════════════
alter table teams enable row level security;
alter table profiles enable row level security;
alter table team_members enable row level security;
alter table backlog_items enable row level security;
alter table backlog_item_assignees enable row level security;
alter table backlog_item_blockers enable row level security;
alter table sprints enable row level security;
alter table tasks enable row level security;
alter table retro_entries enable row level security;
alter table schedule_events enable row level security;
alter table notifications enable row level security;

-- 헬퍼: 현재 사용자가 속한 team_id 목록
create or replace function my_team_ids()
returns setof uuid
language sql stable security definer
as $$
  select team_id from team_members where user_id = auth.uid()
$$;

create policy "본인 프로필 조회/수정" on profiles for all
  using (id = auth.uid());

create policy "가입한 팀만 조회" on teams for select
  using (id in (select my_team_ids()));

-- 팀 코드로 신규 가입은 team_code를 알고 있으면 누구나 조회 가능해야 하므로
-- teams는 select를 team_code 조건으로 한 번 더 열어줌 (가입 전 조회용)
create policy "팀 코드로 팀 조회(가입 전)" on teams for select
  using (true);

create policy "같은 팀 멤버십 조회" on team_members for select
  using (team_id in (select my_team_ids()));
create policy "본인 멤버십 생성(가입)" on team_members for insert
  with check (user_id = auth.uid());
create policy "PM만 멤버 수정/삭제" on team_members for update
  using (team_id in (select team_id from team_members where user_id = auth.uid() and role = 'PM'));
create policy "PM만 멤버 삭제" on team_members for delete
  using (team_id in (select team_id from team_members where user_id = auth.uid() and role = 'PM'));

create policy "팀 스코프 전체" on backlog_items for all
  using (team_id in (select my_team_ids()));
create policy "팀 스코프 전체" on schedule_events for all
  using (team_id in (select my_team_ids()));
create policy "팀 스코프 전체" on notifications for all
  using (team_id in (select my_team_ids()));
create policy "팀 스코프 전체" on sprints for all
  using (team_id in (select my_team_ids()));

create policy "팀 스코프 전체" on tasks for all
  using (sprint_id in (select id from sprints where team_id in (select my_team_ids())));
create policy "팀 스코프 전체" on retro_entries for all
  using (sprint_id in (select id from sprints where team_id in (select my_team_ids())));

create policy "팀 스코프 전체" on backlog_item_assignees for all
  using (backlog_item_id in (select id from backlog_items where team_id in (select my_team_ids())));
create policy "팀 스코프 전체" on backlog_item_blockers for all
  using (backlog_item_id in (select id from backlog_items where team_id in (select my_team_ids())));

-- ══════════════════════════════════════════════
-- Realtime 활성화 (PM/팀원 대시보드 실시간 동기화 대상)
-- ══════════════════════════════════════════════
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table sprints;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table schedule_events;
