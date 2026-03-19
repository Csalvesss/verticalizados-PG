import { useState } from 'react';
import type React from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { LANCHES } from '../constants';
import { useUserPhoto, useUserName } from '../contexts/UserPhotos';
import { useChurch } from '../contexts/ChurchContext';
import type { Evento, Confirmacao, CurrentUser, Screen } from '../types';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoClock = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoLocation = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoCheckSm = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoPencil = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ─── Row de confirmação ───────────────────────────────────────────────────────
function ConfirmacaoRow({ c, isLast }: { c: Confirmacao; isLast: boolean }) {
  const resolvedPhoto = useUserPhoto(c.userId, c.userPhoto);
  const resolvedName = useUserName(c.userId, c.userName);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
      borderBottom: isLast ? 'none' : '1px solid #1a1a1a',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #222' }}>
        <img src={resolvedPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: '#e7e9ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {resolvedName}
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#555', marginTop: 1 }}>
          {c.lanche ? c.lanche : 'Sem lanche'} · {c.hora}
        </div>
      </div>
    </div>
  );
}

interface Props {
  eventos: Evento[];
  confirmacoes: Confirmacao[];
  currentUser: CurrentUser;
  uid: string;
  goTo: (sc: Screen) => void;
}

export function EventosScreen({ eventos, confirmacoes, currentUser, uid, goTo }: Props) {
  const [lanche, setLanche] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const { selectedChurch } = useChurch();
  const prox = eventos[0] || null;
  const euConfirmei = confirmacoes.find(c => c.userId === uid && c.eventoId === prox?.id);
  const lista = confirmacoes.filter(c => c.eventoId === prox?.id);

  const confirmar = async () => {
    if (!prox) return;
    await addDoc(collection(db, 'confirmacoes'), {
      userId: uid,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      eventoId: prox.id,
      lanche,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
    setLanche(null);
  };

  return (
    <div className="fade" style={{ background: '#000', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0,
        zIndex: 50, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)',
      }}>
        <button onClick={() => goTo('home')} style={{
          padding: 6, borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', marginRight: 10,
        }}>{Ico.back()}</button>
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: 18, color: '#fff', letterSpacing: 0.5,
          }}>Eventos</span>
          {selectedChurch && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: '#BA7517', marginTop: 1 }}>
              {selectedChurch.name}
            </div>
          )}
        </div>
        {lista.length > 0 && (
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: 13, color: '#F07830', letterSpacing: 0.5,
          }}>
            {lista.length} confirmado{lista.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {!prox ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '80px 20px', gap: 14, textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: '#e7e9ea', marginBottom: 6 }}>
                Nenhum evento cadastrado
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                {selectedChurch
                  ? `O admin de ${selectedChurch.name} ainda não cadastrou eventos.`
                  : 'Ainda não há eventos para sua igreja.'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Próximo evento — card principal */}
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid #2a2a2a', marginBottom: 12,
              background: '#0d0d0d',
            }}>
              {/* Topo com gradiente laranja */}
              <div style={{
                background: 'linear-gradient(135deg, #F07830 0%, #C85010 100%)',
                padding: '18px 20px 16px',
              }}>
                <div style={{
                  fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
                  letterSpacing: 3, color: 'rgba(0,0,0,0.45)', marginBottom: 8,
                }}>
                  PRÓXIMO ENCONTRO
                </div>
                <div style={{
                  fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700,
                  color: '#000', lineHeight: 1.1, letterSpacing: 0.3,
                }}>
                  {prox.tema}
                </div>
              </div>

              {/* Info rows */}
              <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {([
                  [<IcoCalendar />, prox.data],
                  [<IcoClock />, prox.hora],
                  [<IcoLocation />, prox.local],
                ] as [React.ReactElement, string | undefined][]).filter(([, v]) => !!v).map(([icon, val], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#555' }}>
                    {icon}
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#bbb', fontWeight: 500 }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmar / editar presença */}
            {!euConfirmei || editando ? (
              <div style={{
                background: '#0d0d0d', borderRadius: 16, padding: '18px 18px 20px',
                border: '1px solid #1e1e1e', marginBottom: 12,
              }}>
                <div style={{
                  fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
                  letterSpacing: 3, color: '#F07830', marginBottom: 4,
                }}>
                  {editando ? 'EDITAR PRESENÇA' : 'CONFIRMAR PRESENÇA'}
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#444', marginBottom: 16, lineHeight: 1.5 }}>
                  O que você vai levar?{' '}
                  <span style={{ color: '#2a2a2a' }}>(opcional)</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                  {LANCHES.map((l: string) => (
                    <button key={l} onClick={() => setLanche(lanche === l ? null : l)} style={{
                      fontFamily: 'Barlow, sans-serif', fontSize: 13, padding: '7px 14px',
                      borderRadius: 999, cursor: 'pointer',
                      border: `1px solid ${lanche === l ? '#F07830' : '#1e1e1e'}`,
                      background: lanche === l ? 'rgba(240,120,48,0.1)' : 'transparent',
                      color: lanche === l ? '#F07830' : '#555',
                      fontWeight: lanche === l ? 700 : 400,
                    }}>{l}</button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {editando && (
                    <button onClick={() => setEditando(false)} style={{
                      flex: 1, padding: '11px', borderRadius: 999, border: '1px solid #1e1e1e',
                      background: 'transparent', color: '#555', fontFamily: 'Barlow Condensed',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5,
                    }}>CANCELAR</button>
                  )}
                  <button
                    onClick={async () => {
                      if (editando && euConfirmei) {
                        await updateDoc(doc(db, 'confirmacoes', euConfirmei.id), { lanche });
                        setEditando(false); setLanche(null);
                      } else {
                        await confirmar();
                      }
                    }}
                    style={{
                      flex: 2, padding: '11px', borderRadius: 999, border: 'none',
                      background: '#F07830', color: '#fff', fontFamily: 'Barlow Condensed',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <IcoCheckSm /> {editando ? 'SALVAR' : 'CONFIRMAR PRESENÇA'}
                  </button>
                </div>
              </div>
            ) : (
              /* Já confirmado */
              <div style={{
                background: '#0d0d0d', borderRadius: 16, padding: '16px 18px 18px',
                border: '1px solid rgba(46,160,67,0.25)', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(46,160,67,0.1)', border: '1px solid rgba(46,160,67,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2ea043',
                  }}>
                    <IcoCheckSm />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#2ea043', letterSpacing: 0.3 }}>
                      Presença confirmada
                    </div>
                    <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#444', marginTop: 2 }}>
                      {euConfirmei.lanche ? `Levando: ${euConfirmei.lanche}` : 'Sem lanche selecionado'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => { setLanche(euConfirmei.lanche || null); setEditando(true); }} style={{
                    flex: 1, padding: '9px', borderRadius: 999, border: '1px solid #1e1e1e',
                    background: 'transparent', color: '#888', fontFamily: 'Barlow Condensed',
                    fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 0.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                    <IcoPencil /> EDITAR LANCHE
                  </button>
                  <button onClick={async () => {
                    if (window.confirm('Cancelar sua presença?')) {
                      await deleteDoc(doc(db, 'confirmacoes', euConfirmei.id));
                    }
                  }} style={{
                    flex: 1, padding: '9px', borderRadius: 999, border: '1px solid #1a0505',
                    background: 'transparent', color: '#662020', fontFamily: 'Barlow Condensed',
                    fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: 0.5,
                  }}>CANCELAR PRESENÇA</button>
                </div>
              </div>
            )}

            {/* Lista confirmados */}
            <div style={{
              background: '#0d0d0d', borderRadius: 16, padding: '16px 18px 6px',
              border: '1px solid #1a1a1a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#444',
                }}>CONFIRMADOS</span>
                {lista.length > 0 && (
                  <span style={{
                    background: 'rgba(240,120,48,0.12)', border: '1px solid rgba(240,120,48,0.2)',
                    borderRadius: 999, padding: '2px 10px',
                    fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, color: '#F07830',
                  }}>{lista.length}</span>
                )}
              </div>
              {lista.length === 0 ? (
                <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#333', padding: '10px 0 10px', textAlign: 'center' }}>
                  Ninguém confirmou ainda.
                </div>
              ) : (
                lista.map((c, i) => (
                  <ConfirmacaoRow key={c.id || i} c={c} isLast={i === lista.length - 1} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
