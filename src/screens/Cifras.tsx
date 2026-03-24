import { useState, useEffect } from 'react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import type { Cifra, Screen } from '../types';

// ── Card de cifra (reutilizado nas duas abas) ─────────────────────────────────
function CifraCard({ c, idx, showChurch }: { c: Cifra & { churchName?: string }; idx: number; showChurch?: boolean }) {
  const [open, setOpen] = useState(false);
  const temCifra = c.cifra && c.cifra.trim().length > 0;

  return (
    <div style={{ ...s.card, overflow: open ? 'visible' : 'hidden' }}>
      <div style={{ ...s.cardTop, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={s.cardNum}>
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700, color: '#F07830', opacity: 0.6 }}>
            {idx + 1}
          </span>
        </div>
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={s.cardTag}>TOM: {c.tom || '?'}</div>
          <div style={s.cardTitle}>{c.title}</div>
          {showChurch && c.churchName && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#555', marginTop: 2 }}>
              {c.churchName}
            </div>
          )}
          <div style={s.cardHint}>{open ? 'Toque para fechar' : 'Toque para ver a cifra'}</div>
        </div>
        {Ico.chevron(open)}
        <div style={{ width: 16 }} />
      </div>

      {open && (
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
}

// ── Aba global: Cifras para você ──────────────────────────────────────────────
function CifrasParaVoce() {
  const [allCifras, setAllCifras] = useState<(Cifra & { churchName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDocs(collectionGroup(db, 'cifras'))
      .then(snap => {
        const list = snap.docs.map(d => {
          // Extrair churchId do caminho: churches/{churchId}/cifras/{cifraId}
          const churchId = d.ref.path.split('/')[1] || '';
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            tom: data.tom || '',
            cifra: data.cifra || '',
            ordem: data.ordem ?? 0,
            churchName: data.churchName || churchId,
          } as Cifra & { churchName?: string };
        });
        // Ordem alfabética por título
        list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        setAllCifras(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? allCifras.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.tom.toLowerCase().includes(search.toLowerCase())
      )
    : allCifras;

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>
        Carregando cifras...
      </div>
    );
  }

  return (
    <div>
      {/* Barra de busca */}
      <div style={{ padding: '12px 16px 4px', position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar cifra pelo nome ou tom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 12px 11px 36px',
            borderRadius: 12,
            border: '1px solid #2f3336',
            background: '#16181c',
            color: '#fff',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {filtered.length === 0 && (
        <div style={s.empty}>
          {search ? `Nenhuma cifra encontrada para "${search}".` : 'Nenhuma cifra cadastrada ainda.'}
        </div>
      )}

      {filtered.map((c, idx) => (
        <CifraCard key={`${c.id}-${c.churchName}`} c={c} idx={idx} showChurch />
      ))}
    </div>
  );
}

// ── Tela principal ────────────────────────────────────────────────────────────
export function CifrasScreen({
  cifras,
  goTo,
}: {
  cifras: Cifra[];
  goTo: (sc: Screen) => void;
}) {
  const [tab, setTab] = useState<'igreja' | 'global'>('igreja');

  const tabStyle = (active: boolean) => ({
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700 as const,
    fontSize: 13,
    letterSpacing: 1,
    padding: '10px 20px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer' as const,
    background: active ? '#F07830' : '#16181c',
    color: active ? '#fff' : '#71767b',
    transition: '0.2s',
  });

  return (
    <div className="fade">
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={s.pageTitle}>CIFRAS</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 4px' }}>
        <button style={tabStyle(tab === 'igreja')} onClick={() => setTab('igreja')}>
          MINHA IGREJA
        </button>
        <button style={tabStyle(tab === 'global')} onClick={() => setTab('global')}>
          PARA VOCÊ
        </button>
      </div>

      <div style={s.page}>
        {tab === 'igreja' && (
          <>
            {cifras.length === 0 && <div style={s.empty}>Nenhuma cifra cadastrada ainda.</div>}
            {cifras.map((c, idx) => (
              <CifraCard key={c.id} c={c} idx={idx} />
            ))}
          </>
        )}

        {tab === 'global' && <CifrasParaVoce />}
      </div>
    </div>
  );
}
