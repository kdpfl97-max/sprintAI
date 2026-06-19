export default function Topbar({ title, subtitle, children }) {
  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E8EAED',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16, flexShrink: 0,
      minHeight: subtitle ? 60 : 52,
    }}>
      <div style={{ padding: '12px 0' }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: '24px' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 1, lineHeight: '20px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {children}
        </div>
      )}
    </header>
  )
}
