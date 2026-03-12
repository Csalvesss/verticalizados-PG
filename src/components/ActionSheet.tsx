import type { ReactNode } from 'react';

export interface SheetItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export function ActionSheet({ items, onClose }: { items: SheetItem[]; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 600, zIndex: 301,
        background: '#1c1c1e', borderRadius: '16px 16px 0 0',
        overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.6)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#3a3a3c' }} />
        </div>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '15px 20px',
              background: 'transparent', border: 'none',
              borderTop: i === 0 ? 'none' : '1px solid #2c2c2e',
              cursor: 'pointer', textAlign: 'left',
              color: item.destructive ? '#ff453a' : '#e7e9ea',
              fontFamily: 'Barlow, sans-serif', fontSize: 16, fontWeight: 500,
            }}
          >
            <span style={{ color: item.destructive ? '#ff453a' : '#888', flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
