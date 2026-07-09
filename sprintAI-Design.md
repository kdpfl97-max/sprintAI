---
name: 쏘카
design_system_name: SOCAR Frame 2.0
slug: socar
category: mobility
last_updated: "2026-07-07"
created_at: "2026-05-22"
---

# SOCAR Frame 2.0 — SprintAI 적용 디자인 시스템

> ⚠️ 2026-07-02~07 모바일 브랜드 통일 작업 이후 원안(라이트 모드 전용, 이모지 금지, 그라디언트 금지)에서 벗어난 부분이 있다. 아래 "원안 대비 변경 사항"을 실제 기준으로 참고할 것.

## 핵심 원칙
- "복잡함을 덜어내고 본질에 집중" — 더 뺄 것이 없을 때까지 덜어냄
- 카드·버튼·인풋 등 콘텐츠 표면은 플랫 필 유지 (그라디언트·텍스처 금지)
- 위계는 색이 아니라 **크기와 굵기**로 표현
- 콘텐츠 영역은 라이트 모드 전용. 단 브랜드 표면(사이드바·모바일 헤더·랜딩 배경)은 네이비 다크를 허용 (아래 참고)

## 원안 대비 변경 사항 (2026-07-02~07)

| 항목 | 원안 | 실제 적용 | 사유 |
|---|---|---|---|
| 사이드바 배경 | `white` | `#1D4ED8` (네이비) | 모바일 상단 헤더·하단 탭바와 브랜드 색 통일 |
| 로그인/온보딩 배경 | 그라디언트 금지 | `linear-gradient(150deg, #1D4ED8 → #1E40AF → #1e3a8a)` | 포트폴리오 랜딩 임팩트를 위한 의도적 예외 (콘텐츠 표면엔 미적용, 배경 전용) |
| 아이콘 | 이모지 금지, 텍스트 레이블 | 상태·알림 아이콘에 이모지 사용 (🔍 검토 요청, 🚀 시작 가능, 📅 마감, ⏰ 일정 초과, 📌 일정 등) | 별도 아이콘 세트 없이 빠르게 의미 전달, 텍스트 레이블과 병기 |
| Capacity 용어 | 가용 시간 | 작업 가능 시간 | 팀원 인터뷰 후 더 명확한 표현으로 재변경 |

콘텐츠 표면(카드, 인풋, 버튼, 배지)은 원안 그대로 화이트 배경·플랫 필을 유지한다. 위 변경은 **브랜드 표면**(사이드바/헤더/랜딩)과 **아이콘 표기**에 한정된 예외다.

## Colors

```
/* Primary */
--primary:        #2563EB   /* blue-500, 유일한 브랜드 색 */
--primary-strong: #1D4ED8   /* blue-600, 눌림·강한 CTA */
--primary-heavy:  #1E40AF   /* blue-700 */
--blue-50:        #EFF6FF
--blue-100:       #DBEAFE
--blue-200:       #BFDBFE   /* input focus border */

/* Gray (옅은 파란 기) */
--gray-50:   #F9FAFB
--gray-100:  #F4F5F7   /* background-regular, input 배경 */
--gray-200:  #E8EAED   /* border-regular, divider */
--gray-300:  #D1D5DB
--gray-400:  #9CA3AF   /* text-disabled */
--gray-500:  #6B7280   /* text-tertiary */
--gray-600:  #4B5563   /* text-secondary */
--gray-700:  #374151
--gray-800:  #1F2937   /* text-primary */
--gray-900:  #111827   /* text-strong */

/* Semantic Text */
--text-strong:     #111827
--text-primary:    #1F2937   /* 기본 본문 */
--text-secondary:  #4B5563
--text-tertiary:   #6B7280
--text-disabled:   #9CA3AF

/* Semantic Surface */
--bg-app:     #F4F5F7   /* 앱 배경 */
--surface:    #FFFFFF   /* 카드·패널 */
--border:     #E8EAED   /* 1px 구분선 */
--divider:    #E8EAED

/* Status */
--positive:   #10B981
--caution:    #F59E0B
--negative:   #EF4444
--info:       #2563EB

/* Overlay */
--dimmed:     rgba(17,24,39,0.44)
--pressed:    rgba(17,24,39,0.06)

/* 멤버 아바타 (도메인 색, 유지) */
--member-blue:   #2563EB
--member-green:  #10B981
--member-purple: #7C3AED
--member-amber:  #D97706
```

## Typography

```
font-family: "Pretendard Variable", Pretendard, -apple-system,
             BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue",
             "Apple SD Gothic Neo", "Noto Sans KR", sans-serif

/* 토큰: size / line-height / weight */
heading2:  24px / 34px / 700
heading3:  22px / 30px / 700
heading4:  20px / 28px / 700
title1:    18px / 26px / 600
title2:    16px / 24px / 600   ← 페이지 제목
title3:    14px / 22px / 600   ← 카드 제목·레이블
title4:    13px / 20px / 600   ← 작은 제목·배지
body2:     16px / 24px / 400   ← 기본 본문
body3:     14px / 22px / 400   ← 보조 본문
body4:     13px / 20px / 400
caption1:  12px / 18px / 600
caption2:  12px / 18px / 500
caption3:  10px / 16px / 600

/* 규칙 */
숫자: semibold(600) / 단위라벨: regular(400)
예: 64시간 / 80시간 → "64" semibold, "시간" regular
```

## Spacing (4px 기반)

```
4px  → 컴포넌트 내 소형 gap
8px  → 인라인 아이템 gap
12px → 카드 내부 섹션 gap
16px → 컨테이너 수평 패딩
18px → 컨테이너 수직 패딩, 섹션 간 gap
20px → 대형 섹션 패딩
24px → 페이지 수평 패딩
```

## Border Radius

```
4px  → 태그·텍스트버튼
6px  → 소형 컴포넌트
8px  → xSmall 버튼
10px → 인풋 선택박스
12px → medium 버튼·체크박스 그룹
14px → large 버튼·input filled/outlined
16px → 카드 (기본)
20px → 대형 카드
24px → 바텀시트 상단
9999px → Chip·pill 배지
```

## Elevation (절제된 그림자)

```
/* 카드: 그림자 대신 1px divider 우선 */
shadow-sm:    0 1px 2px rgba(17,24,39,0.04)
shadow-tip:   0 2px 4px rgba(0,0,0,0.12)
shadow-sheet: 0 0 20px rgba(0,0,0,0.25)

/* 원칙: 강한 드롭섀도 금지 → 1px #E8EAED 헤어라인으로 분리 */
```

## Buttons

```
/* ActionButton fill/primary (주 행동) */
bg: #2563EB / text: white / radius: 14px(large) 12px(medium)
hover: none / active: scale(0.92) + pressed-ripple

/* ActionButton fill/secondary (보조 확정) */
bg: #DBEAFE / text: #1D4ED8 / 같은 radius

/* ActionButton fill/tertiary (취소·중립) */
bg: #F4F5F7 / text: #1F2937 / 같은 radius

/* ActionButton outlined/primary */
bg: white / border: 1px #E8EAED / text: #2563EB

/* 금지: 그라디언트 버튼 */
```

## Input

```
/* filled (기본) */
bg: #F4F5F7 / border: 1px transparent / radius: 14px
focus: border 1px #BFDBFE (blue-200)

/* outlined */
bg: white / border: 1px #E8EAED / radius: 14px
focus: border 1px #BFDBFE

높이: 48px / padding: 12px 16px / gap: 10px
label: caption1(12px/600) / #4B5563
helper: body4(13px/400) / #6B7280
```

## Chip

```
radius: 9999px (pill 고정)
padding: 8px 12px / gap: 6px
높이: 36-40px

선택: bg #EFF6FF / border 1px #2563EB / text #2563EB
비선택: bg white / border 1px #E8EAED / text #4B5563
active: scale(0.95)
```

## Card

```
bg: white / border: 1px #E8EAED / radius: 16px
shadow: 0 1px 2px rgba(17,24,39,0.04)  /* 또는 shadow 없이 border만 */
padding: 20px

/* 카드 헤더 구분선: 1px #F4F5F7 border-bottom */
```

## Sidebar (SprintAI 적용 — 네이비 다크, 2026-07 갱신)

```
bg: #1D4ED8 / 구분선: rgba(255,255,255,0.12)
width: 240px

Logo area:
  padding: 20px 20px 16px / border-bottom: 1px rgba(255,255,255,0.12)
  클릭 시 /dashboard 이동

Nav item:
  text-main: #FFFFFF / text-sub: rgba(255,255,255,0.65)
  active:  bg rgba(255,255,255,0.15)
  hover:   bg rgba(255,255,255,0.08)

Sprint card (하단):
  bg: rgba(255,255,255,0.1) 계열 / 진행률 바는 흰색 progressFill

User area:
  border-top: 1px rgba(255,255,255,0.12) / padding: 16px
```

모바일 상단 헤더 + 하단 탭바도 동일 네이비(`#1D4ED8`)로 통일, 탭바 아이콘은 흰색 SVG.

## Priority 배지 (SprintAI 도메인)

```
Must:   bg #FEE2E2 / text #DC2626 / border 1px #FECACA
Should: bg #FEF3C7 / text #D97706 / border 1px #FDE68A
Could:  bg #D1FAE5 / text #059669 / border 1px #A7F3D0
Won't:  bg #F4F5F7 / text #6B7280 / border 1px #E8EAED
```

## 태스크 상태 배지 (전체 할 일 — BacklogPage)

```
미배정: bg #F4F5F7 / text #6B7280 / border 1px #E8EAED
예정:   bg #DBEAFE / text #1D4ED8 / border 1px #BFDBFE
진행 중: bg #D1FAE5 / text #059669 / border 1px #A7F3D0
검토 중: bg #FEF3C7 / text #D97706 / border 1px #FDE68A
완료:   bg #F4F5F7 / text #6B7280 / border 1px #E8EAED
블로커:  bg #FEE2E2 / text #DC2626 / border 1px #FECACA
```

## 난이도 배지 (전체 할 일 / 이번 계획 만들기)

```
낮음: bg #D1FAE5 / text #059669
보통: bg #FEF3C7 / text #D97706
높음: bg #FEE2E2 / text #DC2626
```

## 칸반 컬럼 (BoardPage)

```
시작 전  id: 'todo'
진행 중  id: 'inprogress'
완료     id: 'done'
```

블로커 카드: left-border 4px solid #EF4444 + 🔴 배지  
마감 임박 카드: "마감 임박" badge (bg #FEF3C7 / text #D97706)  
기한 초과 카드: "기한 초과" badge (bg #FEE2E2 / text #DC2626)

## 확인 알림 배지 (이번 계획 만들기 — AlertBadge)

```
warning: bg #FEF3C7 / text #D97706 / icon ⚠️
error:   bg #FEE2E2 / text #DC2626 / icon 🔴
```

조건:
- ⚠️ 담당자 미배정
- ⚠️ 예상 시간 없음
- ⚠️ 20시간+ 분할 권장
- 🔴 담당자 과부하

## Do / Don't (SprintAI 적용 기준)

**Do**
- 카드 분리는 그림자보다 `1px #E8EAED` 헤어라인 우선
- 버튼은 `fill/primary → secondary → tertiary` 위계 준수
- 숫자(시간·%)는 semibold, 단위("시간")는 regular
- 입력 필드는 filled variant(gray-100 배경) 기본
- 활성 상태는 `#EFF6FF` 배경 + `#2563EB` 텍스트/보더
- 시간 단위는 항상 "시간" (영문 "h" 금지, 비개발 직군 고려)

**Don't**
- 콘텐츠 표면(카드·버튼·인풋)에 그라디언트 금지 — 브랜드 표면(로그인/온보딩 배경)만 예외
- 강한 드롭섀도 금지 (`box-shadow: 0 4px 12px ...` 금지)
- 이모지는 보조 신호로만 — 항상 텍스트 레이블과 함께 쓰고 이모지 단독으로 의미 전달하지 않기
- 콘텐츠 카드·인풋에 다크 배경 금지 (사이드바/헤더 등 브랜드 표면 제외)
- 보라색(`#8B5CF6`) 브랜드 accent 금지 (멤버 아바타 전용으로만 허용)
- 접속 시간·체류 시간·생산성 점수 UI 금지 (프라이버시 원칙)
- 팀원 순위·성과 비교 표시 금지

## 주요 용어 (SprintAI 공식 표기)

| 이전 표현 | 현재 표현 | 적용 파일 |
|---|---|---|
| 백로그 | 전체 할 일 | Sidebar, BacklogPage |
| AI 스프린트 빌더 | 이번 계획 만들기 | Sidebar, SprintBuilderPage |
| AI 분석 / AI 분석 실행 | AI 계획 초안 만들기 | SprintBuilderPage |
| AI 인사이트 | 확인이 필요한 항목 | SprintBuilderPage, DashboardPage |
| 작업량 / SP | 예상 시간 + 난이도 | 전체 |
| Capacity | 작업 가능 시간 | SprintBuilderPage, TeamPage |
| h (단위) | 시간 | 전체 |
| 태스크 없음 | 업무 없음 | BoardPage |
| 추가 (버튼) | 등록 | RetroPage |
| 대시보드 | 대시보드(웹) / 홈(모바일 탭바만) | Sidebar, AppLayout |
| 스프린트 | 이번 계획 | 전체 |
| 칸반 보드 | 진행 현황판 | Sidebar, BoardPage |
| 아이디어 캡처 | 할일 작성 | Sidebar, CapturePage |

## 주요 데이터 필드 (2026-06-28 기준)

### 전체 할 일 (Backlog) 아이템

```js
{
  id, title, priority,          // 기존 유지
  estimatedHours: number,       // 예상 시간 (hours, 구 points/작업량)
  difficulty: '낮음'|'보통'|'높음', // 난이도 (신규)
  status: '미배정'|'예정'|'진행 중'|'검토 중'|'완료'|'블로커', // 신규
  assignee: string|null,        // 담당자 (신규)
  dueDate: string|null,         // 마감일 YYYY-MM-DD (신규)
  doneCondition: string,        // 완료 조건 (신규)
  outputLink: string,           // 산출물 링크 (신규)
  blockedBy: string[],          // 선행 업무 id 배열 (신규)
  lastUpdatedAt: string|null,   // 마지막 업데이트 ISO 시각 (신규)
  category, reason,             // 기존 유지
}
```

### 스프린트 태스크 (Sprint Task)

```js
{
  id, title, assignee, week,    // 기존 유지
  estimatedHours: number,       // 예상 시간 (구 points)
  status: 'todo'|'inprogress'|'done', // 칸반 상태
  dueDate: string|null,         // 마감일 (신규)
  blocker: string|null,         // 선행 태스크 id (신규)
  progress: number,             // 진행률 0-100 (신규)
  note: string,                 // 메모 (신규)
  outputLink: string,           // 산출물 링크 (신규)
}
```

### localStorage 키

```
'sprintai_backlog_v2'   // BacklogStore (구 v1에서 변경)
```
