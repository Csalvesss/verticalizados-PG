export function ChurchBadge({ name, district }: { name: string; district?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: 13,
        color: '#e7e9ea',
      }}>
        {name}
      </span>
      {district && (
        <span style={{
          fontFamily: 'Barlow, sans-serif',
          fontSize: 11,
          color: '#185FA5',
          background: 'rgba(24,95,165,0.12)',
          border: '1px solid rgba(24,95,165,0.25)',
          padding: '2px 8px',
          borderRadius: 20,
          fontWeight: 600,
        }}>
          {district}
        </span>
      )}
    </div>
  );
}
