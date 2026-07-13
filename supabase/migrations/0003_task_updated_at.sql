-- 대시보드 "48h+ 미업데이트" 경고에 필요한 갱신 시각 컬럼
alter table tasks add column if not exists updated_at timestamptz not null default now();
