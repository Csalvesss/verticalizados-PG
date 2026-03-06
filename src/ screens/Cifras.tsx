import { useState } from 'react';
import { Ico } from '../icons';
import { s } from '../styles';
import type { Cifra, Screen } from '../types';

interface Props {
  cifras: Cifra[];
  goTo: (sc: Screen) => void;
}

export function CifrasScreen({ cifras, goTo }: Props) {
  const [openCifra, setOpenCifra] = useState<string | null>(null);

  return (
    <div className="fade" style={s.page}>
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={s.pageTitle}>CIFRAS</div>
      </div>

      {cifras.length === 0 && <div style={s.empty}>Nenhuma cifra cadastrada ainda.</div>}

      {cifras.map((c, idx) => {
        const open = openCifra === c.id;
        return (
          <div key={c.id} style={{ ...s.card, overflow: open ? 'visible' : 'hidden' }}>
            <div style={s.cardTop} onClick={() => setOpenCifra(open ? null : c.id)}>
              <div style={s.cardNum}>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: '#fff', opacity: 0.5 }}>{idx + 1}</span>
              </div>
              <div style={{ flex: 1, padding: '14px 12px' }}>
                <div style={s.cardTag}>TOM: {c.tom}</div>
                <div style={s.cardTitle}>{c.title}</div>
                <div style={s.cardHint}>{open ? 'Toque para fechar' : 'Toque para ver a cifra'}</div>
              </div>
              {Ico.chevron(open)}
              <div style={{ width: 14 }} />
            </div>

            {open && (
              <div style={{ borderTop: '1px dashed rgba(240,120,48,0.25)', padding: '16px', overflowX: 'auto' }}>
                <pre style={{ fontFamily: '"Courier New", monospace', fontSize: 12.5, color: '#1A1A1A', lineHeight: 1.9, whiteSpace: 'pre', display: 'block' }}>
                  {c.cifra}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}