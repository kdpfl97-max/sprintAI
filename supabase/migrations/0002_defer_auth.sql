-- ponytail: 실제 로그인(매직링크 등)은 아직 미구현 — auth.uid()가 없어서
-- profiles→auth.users FK와 팀 스코프 RLS 둘 다 지금은 막힌다.
-- profiles를 auth.users에서 분리하고 RLS를 잠시 끈다.
-- 업그레이드 경로: 매직링크 로그인 추가 시 profiles.id를 auth.users(id)로 다시 묶고
-- 0001의 RLS 정책들을 재활성화(enable row level security)할 것.

alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();

-- captured_by는 profiles.id가 아니라 team_members.id를 저장하도록 사용 중 — FK 제거
alter table backlog_items drop constraint if exists backlog_items_captured_by_fkey;

alter table profiles add column if not exists email text;

alter table teams disable row level security;
alter table profiles disable row level security;
alter table team_members disable row level security;
alter table backlog_items disable row level security;
alter table backlog_item_assignees disable row level security;
alter table backlog_item_blockers disable row level security;
alter table sprints disable row level security;
alter table tasks disable row level security;
alter table retro_entries disable row level security;
alter table schedule_events disable row level security;
alter table notifications disable row level security;
