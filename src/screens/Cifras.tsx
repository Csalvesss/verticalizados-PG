import { useState } from 'react';
import { Ico } from '../icons';
import { s } from '../styles';
import type { Cifra, Screen } from '../types';

export function CifrasScreen({
  cifras,
  goTo,
}: {
  cifras: Cifra[];
  goTo: (sc: Screen) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="fade">
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={s.pageTitle}>CIFRAS</div>
      </div>

      <div style={s.page}>
        {cifras.length === 0 && <div style={s.empty}>Nenhuma cifra cadastrada ainda.</div>}

        {cifras.map((c, idx) => {
          const isOpen = open === c.id;
          const temCifra = c.cifra && c.cifra.trim().length > 0;

          return (
            <div key={c.id} style={{ ...s.card, overflow: isOpen ? 'visible' : 'hidden' }}>
              <div style={{ ...s.cardTop, cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : c.id)}>
                <div style={s.cardNum}>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700, color: '#F07830', opacity: 0.6 }}>
                    {idx + 1}
                  </span>
                </div>
                <div style={{ flex: 1, padding: '14px 16px' }}>
                  <div style={s.cardTag}>TOM: {c.tom || '?'}</div>
                  <div style={s.cardTitle}>{c.title}</div>
                  <div style={s.cardHint}>{isOpen ? 'Toque para fechar' : 'Toque para ver a cifra'}</div>
                </div>
                {Ico.chevron(isOpen)}
                <div style={{ width: 16 }} />
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #2f3336', padding: '16px', overflowX: 'auto', background: '#0a0a0a' }}>
                  {temCifra ? (
                    <pre style={{ fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre', display: 'block', margin: 0 }}>
                      {c.cifra.split('\n').map((line, i) => {
                        const isSection = /^\[.+\]$/.test(line.trim());
                        const isChordLine = !isSection && /^[A-G][^\n]*$/.test(line.trim()) && /[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13)?/.test(line);
                        return (
                          <span key={i} style={{
                            display: 'block',
                            color: isSection ? '#fff' : isChordLine ? '#F07830' : '#aaa',
                            fontWeight: isSection ? 700 : 400,
                            marginTop: isSection && i > 0 ? 8 : 0,
                          }}>
                            {line || '\u00A0'}
                          </span>
                        );
                      })}
                    </pre>
                  ) : (
                    <div style={{ fontFamily: 'Barlow', fontSize: 14, color: '#555', textAlign: 'center', padding: '20px 0' }}>
                      Cifra não cadastrada ainda.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
