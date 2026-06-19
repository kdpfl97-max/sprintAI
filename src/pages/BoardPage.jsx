import { useState } from 'react'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'

const PRIORITY_STYLE = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const COLUMNS = [
  { id: 'todo',       label: 'To Do',      color: '#9CA3AF', bg: '#F9FAFB' },
  { id: 'inprogress', label: 'In Progress', color: '#2563EB', bg: '#F0F6FF' },
  { id: 'done',       label: 'Done',        color: '#10B981', bg: '#F0FDF9' },
]

function TaskCard({ task, onMove, onProgressChange }) {
  const [hovered, setHovered] = useState(false)
  const nextStatus = task.status === 'todo' ? 'inprogress' : task.status === 'inprogress' ? 'done' : null
  const prevStatus = task.status === 'done' ? 'inprogress' : task.status === 'inprogress' ? 'todo' : null
  const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE["Won't"]
  const nextCol = COLUMNS.find(c => c.id === nextStatus)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#D1D5DB' : '#E8EAED'}`,
        borderRadius: 14,
        padding: '14px 14px 12px',
        boxShadow: hovered ? '0 2px 8px rgba(17,24,39,0.08)' : '0 1px 2px rgba(17,24,39,0.04)',
        transition: 'box-shadow 150ms, border-color 150ms',
      }}
    >
      {/* 헤더: 우선순위 + 아바타 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
          background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
        }}>{task.priority}</span>
        {task.member && (
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: task.member.color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
          }}>{task.member.initials}</div>
        )}
      </div>

      {/* 제목 */}
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: '20px', marginBottom: 10 }}>
        {task.title}
      </p>

      {/* 진행률 (inprogress) */}
      {task.status === 'inprogress' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 4, background: '#E8EAED', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: 2, width: `${task.progress}%`, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', width: 28, textAlign: 'right' }}>
              {task.progress}%
            </span>
          </div>
          <input type="range" min="0" max="100" step="10"
            value={task.progress}
            onChange={e => onProgressChange(task.id, Number(e.target.value))}
            style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }} />
        </div>
      )}

      {/* 완료 바 (done) */}
      {task.status === 'done' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: '#D1FAE5', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#10B981', borderRadius: 2, width: '100%' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>100%</span>
          </div>
        </div>
      )}

      {/* 푸터: SP + 이동 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{task.points}sp</span>
        <div style={{ display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}>
          {prevStatus && (
            <button onClick={() => onMove(task.id, prevStatus)}
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      border: '1px solid #E8EAED', borderRadius: 8,
                      background: '#F4F5F7', color: '#4B5563', cursor: 'pointer',
                    }}
                    className="btn-press-soft">
              이전
            </button>
          )}
          {nextStatus && (
            <button onClick={() => onMove(task.id, nextStatus)}
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      border: 'none', borderRadius: 8,
                      background: nextCol?.color || '#2563EB', color: 'white', cursor: 'pointer',
                    }}
                    className="btn-press-soft">
              {nextStatus === 'done' ? '완료' : '시작'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { sprint, moveTask, updateProgress } = useSprintStore()

  const todo       = sprint.tasks.filter(t => t.status === 'todo')
  const inprogress = sprint.tasks.filter(t => t.status === 'inprogress')
  const done       = sprint.tasks.filter(t => t.status === 'done')
  const colData    = { todo, inprogress, done }

  const totalSP = sprint.tasks.reduce((s, t) => s + (t.points || 0), 0)
  const doneSP  = done.reduce((s, t) => s + (t.points || 0), 0)
  const pct     = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar title="칸반 보드" subtitle={sprint.name}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#6B7280' }}>
          <span>{sprint.startDate} ~ {sprint.endDate}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 96, height: 4, background: '#E8EAED', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: 2, width: `${pct}%`, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontWeight: 700, color: '#2563EB' }}>{pct}%</span>
          </div>
          <span>{done.length}/{sprint.tasks.length} 완료</span>
        </div>
      </Topbar>

      {/* 통계 바 */}
      <div style={{
        borderBottom: '1px solid #E8EAED', background: '#FFFFFF',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
      }}>
        {COLUMNS.map(col => {
          const tasks = colData[col.id]
          const sp    = tasks.reduce((s, t) => s + (t.points || 0), 0)
          return (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>{col.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{tasks.length}개</span>
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{sp}sp</span>
            </div>
          )
        })}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
          총 <strong style={{ color: '#1F2937' }}>{totalSP}sp</strong> 중{' '}
          <strong style={{ color: '#10B981' }}>{doneSP}sp</strong> 완료
        </div>
      </div>

      {/* 칸반 컬럼 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {COLUMNS.map((col, idx) => {
          const tasks = colData[col.id]
          return (
            <div key={col.id} style={{
              display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
              borderRight: idx < COLUMNS.length - 1 ? '1px solid #E8EAED' : 'none',
              background: col.bg,
            }}>
              {/* 컬럼 헤더 */}
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid #E8EAED',
                background: 'rgba(255,255,255,0.8)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{col.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 9999,
                    background: col.color, color: 'white',
                  }}>{tasks.length}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
                  {tasks.reduce((s, t) => s + (t.points || 0), 0)}sp
                </span>
              </div>

              {/* 카드 목록 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.length === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 80, fontSize: 12, color: '#9CA3AF',
                    border: '1.5px dashed #E8EAED', borderRadius: 12, margin: '4px 0',
                  }}>
                    태스크 없음
                  </div>
                )}
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} onMove={moveTask} onProgressChange={updateProgress} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
