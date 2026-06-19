---
name: 쏘카
design_system_name: SOCAR Frame 2.0
slug: socar
category: mobility
last_updated: "2026-06-02"
created_at: "2026-05-22"
---

# SOCAR Frame 2.0 — SprintAI 적용 디자인 시스템

## 핵심 원칙
- "복잡함을 덜어내고 본질에 집중" — 더 뺄 것이 없을 때까지 덜어냄
- 그라디언트·텍스처·이모지 아이콘 금지, 플랫 필 표면
- 위계는 색이 아니라 **크기와 굵기**로 표현
- 라이트 모드 전용 (다크 모드 없음)

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
예: 64 h / 80h → "64" semibold, "h / 80h" regular
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

## Sidebar (SprintAI 적용)

```
bg: white / border-right: 1px #E8EAED
width: 240px

Logo area:
  padding: 20px / border-bottom: 1px #E8EAED

Nav item:
  height: 44px / padding: 0 12px / radius: 10px / gap: 10px
  default: text #4B5563 / bg transparent
  active:  text #2563EB / bg #EFF6FF / font-weight 600
  hover:   bg #F4F5F7

Sprint card (하단):
  bg: #F4F5F7 / radius: 12px / padding: 12px

User area:
  border-top: 1px #E8EAED / padding: 16px
```

## Priority 배지 (SprintAI 도메인)

```
Must:   bg #FEE2E2 / text #DC2626 / border 1px #FECACA
Should: bg #FEF3C7 / text #D97706 / border 1px #FDE68A
Could:  bg #D1FAE5 / text #059669 / border 1px #A7F3D0
Won't:  bg #F4F5F7 / text #6B7280 / border 1px #E8EAED
```

## Do / Don't (SprintAI 적용 기준)

**Do**
- 카드 분리는 그림자보다 `1px #E8EAED` 헤어라인 우선
- 버튼은 `fill/primary → secondary → tertiary` 위계 준수
- 숫자(SP·시간·%)는 semibold, 단위는 regular
- 입력 필드는 filled variant(gray-100 배경) 기본
- 활성 상태는 `#EFF6FF` 배경 + `#2563EB` 텍스트/보더

**Don't**
- 그라디언트 배경 금지 (버튼·카드·사이드바 모두)
- 강한 드롭섀도 금지 (`box-shadow: 0 4px 12px ...` 금지)
- 이모지를 아이콘으로 사용 금지 (텍스트 레이블로 대체)
- 다크 배경 사이드바 금지 (라이트 모드 전용)
- 보라색(`#8B5CF6`) 브랜드 accent 금지 (멤버 아바타 전용으로만 허용)
