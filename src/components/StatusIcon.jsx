import {
  ShieldAlert, CheckCircle2, Megaphone, Clock, MessageCircle,
  RefreshCw, PartyPopper, Search, Rocket, Pin, AlertTriangle,
  Info, UserX, ListTodo, Sparkles,
} from 'lucide-react'

// 알림/상태 신호에 쓰는 아이콘 — 의미별로 하나만 매핑해 일관성 유지
export const ICON_MAP = {
  blocker:   { Icon: ShieldAlert,   color: '#DC2626' },
  success:   { Icon: CheckCircle2,  color: '#10B981' },
  announce:  { Icon: Megaphone,     color: '#2563EB' },
  deadline:  { Icon: Clock,         color: '#D97706' },
  overdue:   { Icon: Clock,         color: '#DC2626' },
  comment:   { Icon: MessageCircle, color: '#6B7280' },
  status:    { Icon: RefreshCw,     color: '#2563EB' },
  celebrate: { Icon: PartyPopper,   color: '#7C3AED' },
  review:    { Icon: Search,        color: '#D97706' },
  unblocked: { Icon: Rocket,        color: '#059669' },
  event:     { Icon: Pin,           color: '#7C3AED' },
  warn:      { Icon: AlertTriangle, color: '#D97706' },
  danger:    { Icon: ShieldAlert,   color: '#DC2626' },
  info:      { Icon: Info,          color: '#2563EB' },
  unassigned:{ Icon: UserX,         color: '#D97706' },
  backlog:   { Icon: ListTodo,      color: '#6B7280' },
  ai:        { Icon: Sparkles,      color: '#7C3AED' },
}

export default function StatusIcon({ type, size = 16, style }) {
  const entry = ICON_MAP[type] || ICON_MAP.info
  const { Icon, color } = entry
  return <Icon size={size} color={color} strokeWidth={2.25} style={{ flexShrink: 0, ...style }} />
}
