import { useState, useEffect, useCallback } from 'react';
import { collectionGroup, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import type { Song, Screen } from '../types';

function detectSectionType(label: string): 'verse' | 'chorus' | 'bridge' {
  const l = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (l.includes('refrao') || l.includes('coro') || l.includes('chorus') || l.includes('final')) return 'chorus';
  if (l.includes('bridge') || l.includes('ponte')) return 'bridge';
  return 'verse';
}

function parseLetra(letra: string) {
  const sections: { label: string; type: 'verse' | 'chorus' | 'bridge'; lines: string[] }[] = [];
  const rawLines = letra.split('\n');
  let currentLabel = '';
  let currentType: 'verse' | 'chorus' | 'bridge' = 'verse';
  let currentLines: string[] = [];

  for (const line of rawLines) {
    const tagMatch = line.trim().match(/^\[(.+)\]$/);
    if (tagMatch) {
      if (currentLines.length > 0 || currentLabel) {
        sections.push({ label: currentLabel, type: currentType, lines: currentLines });
      }
      currentLabel = tagMatch[1];
      currentType = detectSectionType(currentLabel);
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0 || currentLabel) {
    sections.push({ label: currentLabel, type: currentType, lines: currentLines });
  }
  return sections;
}

// For plain text without [tags]: group by blank lines, detect repeated blocks as chorus
function parseLetraPlain(letra: string) {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const line of letra.split('\n')) {
    if (line.trim() === '') {
      if (current.length > 0) { groups.push(current); current = []; }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) groups.push(current);

  const groupTexts = groups.map(g => g.join('\n').trim());
  const counts: Record<string, number> = {};
  groupTexts.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const chorusTexts = new Set(Object.keys(counts).filter(t => counts[t] > 1));

  let verseNum = 1;
  const seen = new Set<string>();
  return groups.map((lines, i) => {
    const text = groupTexts[i];
    const isChorus = chorusTexts.has(text);
    let label = '';
    if (isChorus) {
      label = seen.has(text) ? 'REFRÃO' : 'REFRÃO';
      seen.add(text);
    } else {
      label = `VERSO ${verseNum}`;
      verseNum++;
    }
    return { label, type: isChorus ? 'chorus' as const : 'verse' as const, lines };
  });
}

// ── Song card (shared between tabs) ──────────────────────────────────────────
function SongCard({
  song,
  idx,
  showChurch = false,
  onOpen,
}: {
  song: Song;
  idx: number;
  showChurch?: boolean;
  onOpen?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && onOpen) onOpen(song.id);
  };

  const temSections = song.sections && song.sections.length > 0;
  const temLetra = song.letra && song.letra.trim().length > 0;
  const hasTags = temLetra && /^\[.+\]$/m.test(song.letra!);

  return (
    <div style={s.card}>
      <div style={{ ...s.cardTop, cursor: 'pointer' }} onClick={handleToggle}>
        <div style={s.cardNum}>
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700, color: '#F07830', opacity: 0.6 }}>
            {idx + 1}
          </span>
        </div>
        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={s.cardTag}>MÚSICA</div>
          <div style={s.cardTitle}>{song.title}</div>
          {showChurch && song.churchName && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#555', marginTop: 2 }}>
              {song.churchName}
            </div>
          )}
          <div style={s.cardHint}>
            {open ? 'Toque para fechar' : temSections || temLetra ? 'Toque para ver a letra' : 'Sem letra cadastrada'}
          </div>
        </div>
        {(temSections || temLetra) && Ico.chevron(open)}
        <div style={{ width: 16 }} />
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #2f3336', padding: '20px 16px 4px', background: 'rgba(255,255,255,0.02)' }}>
          {temSections && (song.sections || []).map((sec, i) => (
            <div key={i} style={{
              marginBottom: 20,
              ...(sec.type === 'chorus' ? { background: 'rgba(240,120,48,0.1)', borderRadius: 12, padding: '16px', border: '1px solid rgba(240,120,48,0.1)' } : {}),
              ...(sec.type === 'bridge' ? { borderLeft: '4px solid #F07830', paddingLeft: 16 } : {}),
            }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, color: '#F07830' }}>
                {sec.label}
              </div>
              {sec.lines.map((line, j) => (
                <div key={j} style={{ fontFamily: 'Barlow', fontSize: 15, lineHeight: 1.6, fontWeight: sec.type === 'chorus' ? 600 : 400, color: '#e7e9ea' }}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          ))}

          {!temSections && temLetra && hasTags && parseLetra(song.letra!).map((sec, i) => (
            <div key={i} style={{
              marginBottom: 20,
              ...(sec.type === 'chorus' ? { background: 'rgba(240,120,48,0.1)', borderRadius: 12, padding: '16px', border: '1px solid rgba(240,120,48,0.1)' } : {}),
              ...(sec.type === 'bridge' ? { borderLeft: '4px solid #F07830', paddingLeft: 16 } : {}),
            }}>
              {sec.label && (
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, color: '#F07830' }}>
                  {sec.label.toUpperCase()}
                </div>
              )}
              {sec.lines.map((line, j) => (
                <div key={j} style={{ fontFamily: 'Barlow', fontSize: 15, lineHeight: 1.6, fontWeight: sec.type === 'chorus' ? 600 : 400, color: '#e7e9ea' }}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          ))}

          {!temSections && temLetra && !hasTags && parseLetraPlain(song.letra!).map((sec, i) => (
            <div key={i} style={{
              marginBottom: 20,
              ...(sec.type === 'chorus' ? { background: 'rgba(240,120,48,0.1)', borderRadius: 12, padding: '16px', border: '1px solid rgba(240,120,48,0.1)' } : {}),
            }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, color: '#F07830' }}>
                {sec.label}
              </div>
              {sec.lines.map((line, j) => (
                <div key={j} style={{ fontFamily: 'Barlow', fontSize: 15, lineHeight: 1.6, fontWeight: sec.type === 'chorus' ? 600 : 400, color: '#e7e9ea' }}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          ))}

          {!temSections && !temLetra && (
            <div style={{ fontFamily: 'Barlow', fontSize: 14, color: '#555', textAlign: 'center', padding: '20px 0' }}>
              Letra não cadastrada ainda.
            </div>
          )}
        </div>
      )}

      <div style={{ background: '#16181c', padding: '12px 16px', display: 'flex', gap: 12, borderTop: '1px solid #2f3336' }}>
        {song.spotify && (
          <a href={song.spotify} target="_blank" rel="noreferrer" style={s.btnSpotify}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            Spotify
          </a>
        )}
        {song.youtube && (
          <a href={song.youtube} target="_blank" rel="noreferrer" style={s.btnYoutube}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
            YouTube
          </a>
        )}
      </div>
    </div>
  );
}

// ── Global tab: Músicas para você ─────────────────────────────────────────────
function MusicasParaVoce() {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch all songs across all churches and sort client-side
    // (avoids needing a composite Firestore index and handles missing playCount field)
    getDocs(collectionGroup(db, 'songs'))
      .then(snap => {
        const songs: Song[] = snap.docs.map(d => {
          // Extract churchId from path: churches/{churchId}/songs/{songId}
          const pathParts = d.ref.path.split('/');
          const churchId = pathParts[1] || '';
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            spotify: data.spotify,
            youtube: data.youtube,
            ordem: data.ordem ?? 0,
            sections: data.sections,
            letra: data.letra,
            playCount: data.playCount ?? 0,
            churchId,
            churchName: data.churchName || churchId,
          } as Song;
        });
        // Sort by playCount descending
        songs.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
        setAllSongs(songs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Increment playCount when a song is opened
  const handleOpen = useCallback((songId: string, churchId: string) => {
    if (!churchId) return;
    updateDoc(doc(db, 'churches', churchId, 'songs', songId), {
      playCount: increment(1),
    }).catch(() => {});
  }, []);

  const filtered = search
    ? allSongs.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : allSongs;

  const top5 = filtered.slice(0, 5);
  const rest = [...filtered.slice(5)].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>
        Carregando músicas...
      </div>
    );
  }

  if (allSongs.length === 0) {
    return (
      <div style={s.empty}>Nenhuma música cadastrada ainda.</div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ padding: '12px 16px 4px', position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar música pelo nome..."
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

      {/* Top 5 */}
      {!search && top5.length > 0 && (
        <>
          <div style={{ padding: '16px 16px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 2, color: '#F07830', textTransform: 'uppercase' }}>
            TOP 5 MAIS ACESSADAS
          </div>
          {top5.map((song, idx) => (
            <SongCard
              key={`top-${song.id}-${song.churchId}`}
              song={song}
              idx={idx}
              showChurch
              onOpen={id => handleOpen(id, song.churchId || '')}
            />
          ))}
          {rest.length > 0 && (
            <div style={{ padding: '16px 16px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 2, color: '#71767b', textTransform: 'uppercase' }}>
              TODAS AS MÚSICAS
            </div>
          )}
        </>
      )}

      {/* Rest alphabetically (or search results) */}
      {(search ? filtered : rest).map((song, idx) => (
        <SongCard
          key={`all-${song.id}-${song.churchId}`}
          song={song}
          idx={search ? idx : idx + 5}
          showChurch
          onOpen={id => handleOpen(id, song.churchId || '')}
        />
      ))}

      {search && filtered.length === 0 && (
        <div style={s.empty}>Nenhuma música encontrada para "{search}".</div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function MusicasScreen({
  songs,
  goTo,
}: {
  songs: Song[];
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
        <div style={s.pageTitle}>MÚSICAS</div>
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
            {songs.length === 0 && <div style={s.empty}>Nenhuma música cadastrada ainda.</div>}
            {songs.map((song, idx) => (
              <SongCard key={song.id} song={song} idx={idx} />
            ))}
          </>
        )}

        {tab === 'global' && <MusicasParaVoce />}
      </div>
    </div>
  );
}
