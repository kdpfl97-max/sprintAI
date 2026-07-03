import { useState } from 'react'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useIsMobile } from '../hooks/useIsMobile'

const PRIORITY_STYLE = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const COLUMNS = [
  { id: 'todo',       label: '시작 전',  color: '#9CA3AF', bg: '#F9FAFB' },
  { id: 'inprogress', label: '진행 중',  color: '#2563EB', bg: '#F0F6FF' },
  { id: 'review',     label: '검토 중',  color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'done',       label: '완료',     color: '#10B981', bg: '#F0FDF9' },
]

// 날짜 임박 여부 (3일 이내)
function isDueSoon(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d - now) / 86400000)
  return diff >= 0 && diff <= 3
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return d < now
}

function TaskCard({ task, allTasks, onMove, onProgressChange, onNoteChange, onOutputLink, isOwner, isPM }) {
  const [hovered,       setHovered]       = useState(false)
  const [progress,      setProgress]      = useState(task.progress)
  const [note,          setNote]          = useState(task.note || '')
  const [outputLink,    setOutputLink]    = useState(task.outputLink || '')
  const [editOutput,    setEditOutput]    = useState(false)
  const [saved,         setSaved]         = useState(false)

  const isDirty = progress !== task.progress || note !== (task.note || '')

  function handleSave() {
    onProgressChange(task.id, progress)
    onNoteChange(task.id, note)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleOutputSave() {
    onOutputLink(task.id, outputLink)
    setEditOutput(false)
  }

  const nextStatus = task.status === 'todo' ? 'inprogress' : task.status === 'inprogress' ? 'done' : null
  const prevStatus = task.status === 'done' ? 'inprogress' : task.status === 'inprogress' ? 'todo' : null
  const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE["Won't"]

  // 선행 업무 찾기
  const blockerTask = task.blocker ? allTasks.find(t => t.id === task.blocker) : null
  const isBlocked   = !!blockerTask && blockerTask.status !== 'done'

  const dueSoon  = isDueSoon(task.dueDate)
  const overdue  = isOverdue(task.dueDate)
  const hasDue   = !!task.dueDate && task.status !== 'done'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${isBlocked ? '#FECACA' : hovered ? '#D1D5DB' : '#E8EAED'}`,
        borderLeft: isBlocked ? '4px solid #EF4444' : undefined,
        borderRadius: 14,
        padding: isBlocked ? '14px 14px 12px 12px' : '14px 14px 12px',
        boxShadow: hovered ? '0 2px 8px rgba(17,24,39,0.08)' : '0 1px 2px rgba(17,24,39,0.04)',
        transition: 'box-shadow 150ms, border-color 150ms',
      }}
    >
      {/* 블로커 배지 */}
      {isBlocked && (
        <div style={{ marginBottom: 8, padding: '7px 10px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: 9999 }}>🔴 블로커</span>
          </div>
          <p style={{ fontSize: 11, color: '#DC2626', lineHeight: 1.5 }}>
            선행 업무 완료 전까지 시작 불가:<br />
            <strong>{blockerTask.title}</strong> ({blockerTask.member?.name || '미배정'})
          </p>
        </div>
      )}

      {/* 헤더: 우선순위 + 아바타 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
          background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
        }}>{task.priority}</span>
        {task.member && (
          <div title={task.member.name} style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: task.member.color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
          }}>{task.member.initials}</div>
        )}
      </div>

      {/* 제목 */}
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: '20px', marginBottom: 8 }}>
        {task.title}
      </p>

      {/* 마감일 */}
      {hasDue && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8,
          fontSize: 11, fontWeight: 600,
          color: overdue ? '#DC2626' : dueSoon ? '#D97706' : '#9CA3AF',
          background: overdue ? '#FEE2E2' : dueSoon ? '#FEF3C7' : '#F4F5F7',
          border: `1px solid ${overdue ? '#FECACA' : dueSoon ? '#FDE68A' : '#E8EAED'}`,
          padding: '2px 8px', borderRadius: 9999,
        }}>
          📅 {overdue ? '기한 초과' : dueSoon ? '마감 임박'  : '마감'} · {task.dueDate}
        </div>
      )}

      {/* 완료 조건 */}
      {task.doneCondition && task.status !== 'done' && (
        <div style={{ marginBottom: 8, padding: '7px 10px', borderRadius: 8, background: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: 11, color: '#0369A1' }}>
          ✅ 완료 기준: {task.doneCondition}
        </div>
      )}

      {/* 진행률 (inprogress) */}
      {task.status === 'inprogress' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 4, background: '#E8EAED', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', width: 28, textAlign: 'right' }}>
              {progress}%
            </span>
          </div>
          {isOwner ? (
            <>
              <input type="range" min="0" max="100" step="10"
                value={progress}
                onChange={e => { setProgress(Number(e.target.value)); setSaved(false) }}
                style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }} />
              <textarea
                placeholder="진행 상황을 간단히 메모해요..."
                value={note}
                onChange={e => { setNote(e.target.value); setSaved(false) }}
                rows={2}
                style={{
                  width: '100%', marginTop: 8, padding: '8px 10px',
                  fontSize: 12, color: '#1F2937', lineHeight: '18px',
                  background: '#F4F5F7', border: '1px solid #E8EAED',
                  borderRadius: 10, resize: 'none', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
                onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                {saved && <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>저장됨 ✓</span>}
                <button onClick={handleSave} disabled={!isDirty}
                  style={{
                    padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    border: 'none', borderRadius: 8, cursor: isDirty ? 'pointer' : 'default',
                    background: isDirty ? '#2563EB' : '#E8EAED',
                    color: isDirty ? 'white' : '#9CA3AF',
                  }} className="btn-press-soft">
                  저장
                </button>
              </div>
            </>
          ) : (
            task.note && (
              <p style={{
                marginTop: 8, padding: '7px 10px', fontSize: 12, color: '#4B5563',
                background: '#F4F5F7', borderRadius: 10, lineHeight: '18px',
              }}>{task.note}</p>
            )
          )}
        </div>
      )}

      {/* 검토 중 */}
      {task.status === 'review' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 4, background: '#FDE68A', borderRadius: 2 }}>
              <div style={{ height: '100%', background: '#F59E0B', borderRadius: 2, width: `${progress}%` }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>검토 중</span>
          </div>
          {task.note && (
            <p style={{ marginBottom: 8, padding: '7px 10px', fontSize: 12, color: '#4B5563', background: '#F4F5F7', borderRadius: 10, lineHeight: '18px' }}>{task.note}</p>
          )}
          {isPM ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => onMove(task.id, 'done')}
                style={{ flex: 1, padding: '6px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer' }}
                className="btn-press-soft">✅ 승인</button>
              <button onClick={() => onMove(task.id, 'inprogress')}
                style={{ flex: 1, padding: '6px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}
                className="btn-press-soft">↩️ 반려</button>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>PM 검토 중...</p>
          )}
        </div>
      )}

      {/* 완료 상태 */}
      {task.status === 'done' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 4, background: '#D1FAE5', borderRadius: 2 }}>
              <div style={{ height: '100%', background: '#10B981', borderRadius: 2, width: '100%' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>완료</span>
          </div>
          {/* 산출물 링크 */}
          {task.outputLink ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: '#F0FDF9', border: '1px solid #A7F3D0' }}>
              <span style={{ fontSize: 11 }}>🔗</span>
              <a href={task.outputLink} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, fontWeight: 600, color: '#059669', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                산출물 보기
              </a>
              {isOwner && (
                <button onClick={() => setEditOutput(true)}
                  style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>
              )}
            </div>
          ) : isOwner ? (
            editOutput ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={outputLink} onChange={e => setOutputLink(e.target.value)}
                  placeholder="산출물 링크 (URL)" autoFocus
                  style={{ flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #BFDBFE', outline: 'none' }} />
                <button onClick={handleOutputSave}
                  style={{ padding: '0 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer' }}>저장</button>
                <button onClick={() => setEditOutput(false)}
                  style={{ padding: '0 10px', fontSize: 11, borderRadius: 8, border: '1px solid #E8EAED', background: '#F4F5F7', color: '#6B7280', cursor: 'pointer' }}>취소</button>
              </div>
            ) : (
              <button onClick={() => setEditOutput(true)}
                style={{ width: '100%', padding: '6px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1.5px dashed #A7F3D0', background: 'transparent', color: '#059669', cursor: 'pointer' }}>
                + 산출물 링크 등록
              </button>
            )
          ) : (
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>산출물 링크 없음</p>
          )}
        </div>
      )}

      {/* 푸터: 예상 시간 + 이동 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
          {task.estimatedHours > 0 ? `${task.estimatedHours}시간` : '—'}
        </span>
        <div style={{ display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}>
          {prevStatus && (
            <button onClick={() => onMove(task.id, prevStatus)}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                border: '1px solid #E8EAED', borderRadius: 8,
                background: '#F4F5F7', color: '#4B5563', cursor: 'pointer',
              }} className="btn-press-soft">
              이전
            </button>
          )}
          {nextStatus && !isBlocked && (
            <button onClick={() => onMove(task.id, nextStatus)}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                border: 'none', borderRadius: 8,
                background: nextStatus === 'done' ? '#10B981' : '#2563EB',
                color: 'white', cursor: 'pointer',
              }} className="btn-press-soft">
              {nextStatus === 'done' ? '완료' : '시작'}
            </button>
          )}
          {nextStatus && isBlocked && (
            <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, padding: '4px 6px' }}>선행 대기 중</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { sprint, moveTask, updateProgress, updateNote, updateTask } = useSprintStore()
  const { currentUser } = useAuthStore()
  const isMobile = useIsMobile()
  const isPM = currentUser?.role === 'PM'
  const [showAll, setShowAll] = useState(() => currentUser?.role === 'PM')
  const [mobileCol, setMobileCol] = useState('todo')

  function handleOutputLink(taskId, link) {
    updateTask(taskId, { outputLink: link })
  }

  if (!sprint?.status || sprint.status === 'completed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Topbar title="진행 현황판" subtitle="진행 중인 계획 없음" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#F4F5F7' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📋</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>진행 중인 계획이 없어요</p>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              {sprint?.status === 'completed' ? '이번 계획이 종료됐어요. 회고 후 새 계획을 시작해보세요.' : '이번 계획 만들기에서 계획을 만들어보세요.'}
            </p>
          </div>
          <a href={sprint?.status === 'completed' ? '/retro' : '/sprint/builder'} style={{
            padding: '0 20px', height: 40, borderRadius: 12, background: '#2563EB', color: '#fff',
            fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center',
          }}>
            {sprint?.status === 'completed' ? '회고 시작하기' : '이번 계획 만들기로 이동'}
          </a>
        </div>
      </div>
    )
  }

  const allTasks = sprint.tasks

  const visibleTasks = showAll
    ? allTasks
    : allTasks.filter(t => t.member?.name === currentUser?.name)

  const todo       = visibleTasks.filter(t => t.status === 'todo')
  const inprogress = visibleTasks.filter(t => t.status === 'inprogress')
  const review     = visibleTasks.filter(t => t.status === 'review')
  const done       = visibleTasks.filter(t => t.status === 'done')
  const colData    = { todo, inprogress, review, done }

  const totalH = visibleTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH  = done.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const pct    = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  // 블로커 수 (전체 기준)
  const blockerCount = allTasks.filter(t => {
    if (!t.blocker) return false
    const dep = allTasks.find(x => x.id === t.blocker)
    return dep && dep.status !== 'done'
  }).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar title="진행 현황판" subtitle={sprint.name}>
        {blockerCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
            🔴 블로커 {blockerCount}개
          </span>
        )}
        <button onClick={() => setShowAll(p => !p)} style={{
          padding: '0 14px', height: 36, borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
          background: showAll ? '#F4F5F7' : '#EFF6FF',
          color:      showAll ? '#4B5563' : '#2563EB',
          borderColor: showAll ? '#E8EAED' : '#BFDBFE',
          whiteSpace: 'nowrap',
        }} className="btn-press-soft">
          {showAll ? '내 업무만' : '전체 보기'}
        </button>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 4, background: '#E8EAED', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: 2, width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{pct}%</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{done.length}/{visibleTasks.length}</span>
          </div>
        )}
      </Topbar>

      {/* 통계 바 — 모바일: 탭 전환, 데스크탑: 가로 통계 */}
      {isMobile ? (
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #E8EAED', flexShrink: 0 }}>
          {COLUMNS.map(col => {
            const isActive = mobileCol === col.id
            return (
              <button key={col.id} onClick={() => setMobileCol(col.id)} style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                background: isActive ? col.bg : '#fff',
                borderBottom: isActive ? `2px solid ${col.color}` : '2px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#111827' : '#9CA3AF' }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: isActive ? col.color : '#6B7280', lineHeight: 1 }}>
                  {colData[col.id].length}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{ borderBottom: '1px solid #E8EAED', background: '#FFFFFF', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          {COLUMNS.map(col => {
            const tasks = colData[col.id]
            const hours = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
            return (
              <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>{col.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{tasks.length}개</span>
                {hours > 0 && <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{hours}시간</span>}
              </div>
            )
          })}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
            총 <strong style={{ color: '#1F2937' }}>{totalH}시간</strong> 중{' '}
            <strong style={{ color: '#10B981' }}>{doneH}시간</strong> 완료
          </div>
        </div>
      )}

      {/* 칸반 컬럼 */}
      {isMobile ? (
        // 모바일: 선택된 열만 표시
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {COLUMNS.filter(col => col.id === mobileCol).map(col => {
            const tasks = colData[col.id]
            return (
              <div key={col.id} style={{ flex: 1, overflow: 'hidden', background: col.bg, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tasks.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 140, border: '1.5px dashed #E8EAED', borderRadius: 14, color: '#9CA3AF' }}>
                      <span style={{ fontSize: 28 }}>{col.id === 'todo' ? '📋' : col.id === 'inprogress' ? '⚡' : col.id === 'review' ? '🔍' : '✅'}</span>
                      <span style={{ fontSize: 12 }}>{col.id === 'todo' ? '대기 중인 업무 없음' : col.id === 'inprogress' ? '진행 중인 업무 없음' : col.id === 'review' ? '검토 중인 업무 없음' : '완료된 업무 없음'}</span>
                    </div>
                  )}
                  {tasks.map(task => (
                    <TaskCard key={task.id} task={task} allTasks={allTasks}
                      onMove={moveTask} onProgressChange={updateProgress}
                      onNoteChange={updateNote} onOutputLink={handleOutputLink}
                      isOwner={isPM || task.member?.name === currentUser?.name}
                      isPM={isPM}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // 데스크탑: 3열 나란히
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {COLUMNS.map((col, idx) => {
            const tasks = colData[col.id]
            return (
              <div key={col.id} style={{
                display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
                borderRight: idx < COLUMNS.length - 1 ? '1px solid #E8EAED' : 'none',
                background: col.bg,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8EAED', background: 'rgba(255,255,255,0.8)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{col.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: col.color, color: 'white' }}>{tasks.length}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
                    {tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)}시간
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tasks.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, fontSize: 12, color: '#9CA3AF', border: '1.5px dashed #E8EAED', borderRadius: 12, margin: '4px 0' }}>
                      업무 없음
                    </div>
                  )}
                  {tasks.map(task => (
                    <TaskCard key={task.id} task={task} allTasks={allTasks}
                      onMove={moveTask} onProgressChange={updateProgress}
                      onNoteChange={updateNote} onOutputLink={handleOutputLink}
                      isOwner={isPM || task.member?.name === currentUser?.name}
                      isPM={isPM}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
