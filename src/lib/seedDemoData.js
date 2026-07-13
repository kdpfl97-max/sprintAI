import { supabase } from './supabaseClient'

// ponytail: 실무자 데모용 — 팀이 비어있으면(=신규/초기화된 팀) 항상 같은 더미데이터로 채운다.
// 이미 데이터가 있으면 아무것도 하지 않음 (멱등).
export async function seedDemoDataIfEmpty(teamId) {
  const { data: existing } = await supabase.from('team_members').select('id').eq('team_id', teamId).limit(1)
  if (existing && existing.length) return

  const DEFAULT_MEMBERS = [
    { key: 'm0', name: '곽예리', role: 'PM',        email: 'yeri@team.io',    color: '#2563EB', initials: '곽' },
    { key: 'm1', name: '박준혁', role: '백엔드',    email: 'junhyuk@team.io',  color: '#2E75B6', initials: '박' },
    { key: 'm2', name: '김서연', role: '프론트엔드', email: 'seoyeon@team.io', color: '#22C55E', initials: '김' },
    { key: 'm3', name: '이민수', role: 'AI/백엔드',  email: 'minsu@team.io',   color: '#8B5CF6', initials: '이' },
    { key: 'm4', name: '최지은', role: '디자인',     email: 'jieun@team.io',   color: '#F59E0B', initials: '최' },
  ]
  const idOf = {}
  for (const m of DEFAULT_MEMBERS) {
    const { data: profile, error: pErr } = await supabase.from('profiles')
      .insert({ name: m.name, color: m.color, initials: m.initials, email: m.email }).select('id').single()
    if (pErr) throw pErr
    const { data: tm, error: tErr } = await supabase.from('team_members')
      .insert({ team_id: teamId, user_id: profile.id, role: m.role === 'PM' ? 'PM' : 'member', job_role: m.role, capacity: 80, status: 'active' })
      .select('id').single()
    if (tErr) throw tErr
    idOf[m.key] = tm.id
  }
  const byName = Object.fromEntries(DEFAULT_MEMBERS.map(m => [m.name, idOf[m.key]]))

  const DEFAULT_ITEMS = [
    { oldId: 1, title: '소셜 로그인 (구글)', category: '기능', priority: 'Must', stage: 'MVP', estimatedHours: 8, difficulty: '보통', desc: '구글 OAuth 2.0 연동 로그인', capturedBy: 'm0', doneCondition: '구글 계정으로 로그인 후 팀 페이지에 진입할 수 있다', blockedBy: [] },
    { oldId: 2, title: '팀 생성 및 초대', category: '에픽', priority: 'Must', stage: 'MVP', estimatedHours: 12, difficulty: '보통', desc: '팀 워크스페이스 생성, 이메일 초대', capturedBy: 'm0', doneCondition: '팀장이 팀을 만들고 팀원을 초대해 함께 로그인할 수 있다', blockedBy: [1] },
    { oldId: 3, title: '전체 할 일 CRUD', category: '기능', priority: 'Must', stage: 'MVP', estimatedHours: 10, difficulty: '보통', desc: '에픽/태스크 생성·수정·삭제·정렬', capturedBy: 'm1', doneCondition: '태스크를 추가·수정·삭제하고 필터로 조회할 수 있다', blockedBy: [2] },
    { oldId: 4, title: 'AI 이번 계획 만들기', category: '기능', priority: 'Must', stage: 'MVP', estimatedHours: 20, difficulty: '높음', desc: '전체 할 일 → AI 스프린트 자동 구성 + 추천 이유 표시', capturedBy: 'm0', doneCondition: 'AI 초안에 추천 이유가 표시되고 PM이 수정 후 확정할 수 있다', blockedBy: [3] },
    { oldId: 5, title: 'Capacity 입력', category: '기능', priority: 'Must', stage: 'MVP', estimatedHours: 6, difficulty: '낮음', desc: '팀원별 스프린트 가용 시간 입력', capturedBy: 'm3', doneCondition: '팀원이 이번 기간 참여 가능 시간을 입력하면 AI가 배정에 반영한다', blockedBy: [] },
    { oldId: 6, title: '칸반 보드', category: '기능', priority: 'Must', stage: 'MVP', estimatedHours: 12, difficulty: '보통', desc: '예정 / 진행 중 / 검토 중 / 완료 + 블로커 배지', capturedBy: 'm2', doneCondition: '팀원이 카드를 이동하면 상태가 바뀌고 블로커가 배지로 표시된다', blockedBy: [3] },
    { oldId: 7, title: 'AI 태스크 분해기', category: '기능', priority: 'Must', stage: 'MVP', estimatedHours: 16, difficulty: '높음', desc: '에픽 → 스토리 → 태스크 자동 분해', capturedBy: 'm3', doneCondition: '에픽을 입력하면 AI가 하위 태스크 목록을 제안하고 편집할 수 있다', blockedBy: [3] },
    { oldId: 8, title: '스프린트 대시보드', category: '기능', priority: 'Should', stage: 'MVP', estimatedHours: 12, difficulty: '보통', desc: 'PM용 확인 필요 항목 + 팀원용 내 할 일 중심', capturedBy: 'm4', doneCondition: 'PM은 미배정·블로커를 3분 내 파악하고 팀원은 10초 내 할 일을 찾는다', blockedBy: [6] },
    { oldId: 9, title: '슬랙 연동', category: '기능', priority: 'Should', stage: 'v1.0', estimatedHours: 10, difficulty: '보통', desc: '스프린트 알림, 태스크 상태 업데이트', capturedBy: 'm1', doneCondition: '', blockedBy: [] },
    { oldId: 10, title: '회고 리포트 AI 생성', category: '기능', priority: 'Should', stage: 'v1.0', estimatedHours: 10, difficulty: '보통', desc: 'AI 자동 스프린트 회고 생성', capturedBy: 'm0', doneCondition: '', blockedBy: [] },
    { oldId: 11, title: '노션 연동', category: '기능', priority: 'Should', stage: 'v1.0', estimatedHours: 8, difficulty: '보통', desc: '스프린트 보드 노션 자동 동기화', capturedBy: 'm4', doneCondition: '', blockedBy: [] },
    { oldId: 12, title: '팀원 업무 부하 히트맵', category: '기능', priority: 'Could', stage: 'v1.0', estimatedHours: 6, difficulty: '낮음', desc: '팀원별 업무 부하 시각화', capturedBy: 'm2', doneCondition: '', blockedBy: [] },
    { oldId: 13, title: 'GitHub 이슈 연동', category: '기능', priority: 'Could', stage: 'v2.0', estimatedHours: 12, difficulty: '높음', desc: 'GitHub 이슈 → 전체 할 일 자동 가져오기', capturedBy: 'm1', doneCondition: '', blockedBy: [] },
    { oldId: 14, title: '모바일 앱 (iOS)', category: '기능', priority: 'Could', stage: 'v2.0', estimatedHours: 40, difficulty: '높음', desc: 'iOS 네이티브 앱', capturedBy: 'm0', doneCondition: '', blockedBy: [] },
    { oldId: 15, title: 'AI PM 코치', category: '기능', priority: 'Could', stage: 'v2.0', estimatedHours: 20, difficulty: '높음', desc: '스프린트 개선 조언 AI 코치', capturedBy: 'm3', doneCondition: '', blockedBy: [] },
  ]
  const newIdByOld = {}
  for (const it of DEFAULT_ITEMS) {
    const { data: created, error } = await supabase.from('backlog_items').insert({
      team_id: teamId, title: it.title, description: it.desc, category: it.category, priority: it.priority,
      stage: it.stage, estimated_hours: it.estimatedHours, difficulty: it.difficulty, status: '미배정',
      done_condition: it.doneCondition, captured_by: idOf[it.capturedBy], last_updated_at: new Date().toISOString(),
    }).select('id').single()
    if (error) throw error
    newIdByOld[it.oldId] = created.id
  }
  for (const it of DEFAULT_ITEMS) {
    if (it.blockedBy.length) {
      await supabase.from('backlog_item_blockers').insert(
        it.blockedBy.map(oldId => ({ backlog_item_id: newIdByOld[it.oldId], blocked_by_id: newIdByOld[oldId] }))
      )
    }
  }

  const { data: sprint, error: sErr } = await supabase.from('sprints').insert({
    team_id: teamId, name: 'Sprint 1 — 핵심 AI 기능', status: 'active',
    start_date: '2026-07-01', end_date: '2026-07-14', started_at: '2026-07-01T09:00:00.000Z',
  }).select('id').single()
  if (sErr) throw sErr

  const DEFAULT_TASKS = [
    { oldId: 't1',  title: '구글 소셜 로그인',             priority: 'Must',   estimatedHours: 8,  status: 'done',       member: '박준혁', progress: 100, startDate: '2026-07-01', dueDate: '2026-07-02', blocker: null },
    { oldId: 't2',  title: '팀 생성 API',                  priority: 'Must',   estimatedHours: 8,  status: 'done',       member: '박준혁', progress: 100, startDate: '2026-07-01', dueDate: '2026-07-03', blocker: null },
    { oldId: 't3',  title: '팀 초대 이메일 발송',           priority: 'Must',   estimatedHours: 4,  status: 'done',       member: '박준혁', progress: 100, startDate: '2026-07-02', dueDate: '2026-07-03', blocker: null },
    { oldId: 't4',  title: 'DB 스키마 설계',                priority: 'Must',   estimatedHours: 6,  status: 'done',       member: '이민수', progress: 100, startDate: '2026-07-01', dueDate: '2026-07-02', blocker: null },
    { oldId: 't5',  title: '카카오 로그인 연동',             priority: 'Must',   estimatedHours: 4,  status: 'done',       member: '박준혁', progress: 100, startDate: '2026-07-03', dueDate: '2026-07-04', blocker: null },
    { oldId: 't6',  title: '전체 할 일 CRUD — API 개발',   priority: 'Must',   estimatedHours: 10, status: 'inprogress', member: '박준혁', progress: 70,  startDate: '2026-07-01', dueDate: '2026-07-05', blocker: null },
    { oldId: 't7',  title: '전체 할 일 CRUD — 프론트 UI',  priority: 'Must',   estimatedHours: 6,  status: 'inprogress', member: '김서연', progress: 50,  startDate: '2026-07-02', dueDate: '2026-07-05', blocker: 't6' },
    { oldId: 't8',  title: '스프린트 화면 디자인 시안',      priority: 'Must',   estimatedHours: 6,  status: 'inprogress', member: '최지은', progress: 80,  startDate: '2026-07-01', dueDate: '2026-07-04', blocker: null },
    { oldId: 't9',  title: 'Capacity 입력 화면 구현',       priority: 'Must',   estimatedHours: 8,  status: 'todo',       member: '김서연', progress: 0,   startDate: '2026-07-06', dueDate: '2026-07-08', blocker: 't7' },
    { oldId: 't10', title: 'AI 계획 초안 알고리즘',          priority: 'Must',   estimatedHours: 20, status: 'todo',       member: '이민수', progress: 0,   startDate: '2026-07-05', dueDate: '2026-07-10', blocker: null },
    { oldId: 't11', title: 'AI 계획 초안 UI 연동',           priority: 'Must',   estimatedHours: 8,  status: 'todo',       member: '김서연', progress: 0,   startDate: '2026-07-10', dueDate: '2026-07-12', blocker: 't10' },
    { oldId: 't12', title: '랜딩 페이지 디자인',             priority: 'Should', estimatedHours: 8,  status: 'todo',       member: '최지은', progress: 0,   startDate: '2026-07-08', dueDate: '2026-07-14', blocker: null },
    { oldId: 't13', title: 'AI 태스크 분해 API 연동',        priority: 'Must',   estimatedHours: 12, status: 'inprogress', member: '이민수', progress: 0,   startDate: '2026-07-03', dueDate: '2026-07-08', blocker: null },
    { oldId: 't14', title: '스프린트 확정 화면 구현',         priority: 'Must',   estimatedHours: 8,  status: 'inprogress', member: '김서연', progress: 0,   startDate: '2026-07-07', dueDate: '2026-07-08', blocker: 't9' },
  ]
  const newTaskIdByOld = {}
  for (const t of DEFAULT_TASKS) {
    const { data: created, error } = await supabase.from('tasks').insert({
      sprint_id: sprint.id, title: t.title, priority: t.priority, estimated_hours: t.estimatedHours,
      status: t.status, progress: t.progress, member_id: byName[t.member] || null,
      start_date: t.startDate, due_date: t.dueDate,
    }).select('id').single()
    if (error) throw error
    newTaskIdByOld[t.oldId] = created.id
  }
  for (const t of DEFAULT_TASKS) {
    if (t.blocker) await supabase.from('tasks').update({ blocker_id: newTaskIdByOld[t.blocker] }).eq('id', newTaskIdByOld[t.oldId])
  }

  const ago = (min) => new Date(Date.now() - min * 60 * 1000).toISOString()
  const NOTIF_SEED = [
    { type: 'blocker',   title: '블로커 감지 — 소셜 로그인 구현',       body: '담당자 미배정 상태로 3일째 대기 중입니다. 스프린트 마감까지 4일 남았습니다.', read: false, createdAt: ago(12) },
    { type: 'success',   title: '태스크 완료 — 메인 대시보드 UI',       body: '곽예리님이 "메인 대시보드 UI 구현"을 완료로 변경했습니다.', read: false, createdAt: ago(37) },
    { type: 'announce',  title: 'PM 공지 — 스프린트 리뷰 일정 변경',     body: '스프린트 리뷰가 금요일 오후 2시 → 오후 4시로 변경되었습니다.', read: false, createdAt: ago(95) },
    { type: 'deadline',  title: '마감 임박 — 프론트엔드 UI',            body: '"전체 할 일 CRUD — 프론트엔드 UI" 마감까지 1일 남았습니다.', read: true, createdAt: ago(180) },
    { type: 'comment',   title: '댓글 — Capacity 입력 화면',            body: '이준호님: "API 연동 방식 먼저 논의 필요합니다. 내일 오전에 시간 되세요?"', read: true, createdAt: ago(320) },
    { type: 'status',    title: '태스크 상태 변경 — 소셜 로그인 구현',   body: '김민준님이 상태를 "예정" → "진행 중"으로 변경했습니다.', read: true, createdAt: ago(600) },
    { type: 'celebrate', title: 'Sprint 1 목표 달성률 23%',             body: '현재 5/16개 완료. AI 추천: 블로커 해소 시 달성률 50% 이상 가능합니다.', read: true, createdAt: ago(1440) },
  ]
  await supabase.from('notifications').insert(
    NOTIF_SEED.map(n => ({ team_id: teamId, type: n.type, title: n.title, body: n.body, read: n.read, created_at: n.createdAt }))
  )
}
