import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import { LANCHES } from '../constants';
import type { Evento, Confirmacao, CurrentUser, Screen } from '../types';

interface Props {
  eventos: Evento[];
  confirmacoes: Confirmacao[];
  currentUser: CurrentUser;
  uid: string;
  goTo: (sc: Screen) => void;
}

export function EventosScreen({
  eventos,
  confirmacoes,
  currentUser,
  uid,
  goTo,
}: Props) {
  const [lanche, setLanche] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const prox = eventos[0] || null;
  const euConfirmei = confirmacoes.find(
    (c) => c.userId === uid && c.eventoId === prox?.id
  );
  const lista = confirmacoes.filter((c) => c.eventoId === prox?.id);

  const confirmar = async () => {
    if (!prox) return;
    await addDoc(collection(db, 'confirmacoes'), {
      userId: uid,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      eventoId: prox.id,
      lanche,
      hora: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    setLanche(null);
  };

  return (
    <div className="fade">
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>
          {Ico.back()}
        </button>
        <div style={s.pageTitle}>EVENTOS</div>
      </div>

      <div style={s.page}>
        {!prox && <div style={s.empty}>Nenhum evento cadastrado ainda.</div>}

        {prox && (
          <>
            <div
              style={{
                background: '#F07830',
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                boxShadow: '0 8px 24px rgba(240, 120, 48, 0.25)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Barlow Condensed',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: 'rgba(0,0,0,0.5)',
                  marginBottom: 8,
                }}
              >
                PRÓXIMO ENCONTRO
              </div>
              <div
                style={{
                  fontFamily: 'Barlow Condensed',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#000',
                  letterSpacing: 0.5,
                  lineHeight: 1.1,
                  marginBottom: 16,
                }}
              >
                {prox.tema}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['📅', prox.data],
                  ['🕖', prox.hora],
                  ['📍', prox.local],
                ].map(([icon, val]) =>
                  val ? (
                    <div
                      key={String(val)}
                      style={{
                        fontFamily: 'Barlow',
                        fontSize: 14,
                        color: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ fontWeight: 600 }}>{val}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {!euConfirmei || editando ? (
              <div style={{ ...s.card, padding: 20 }}>
                <div style={s.cardTag}>{editando ? 'EDITAR PRESENÇA' : 'CONFIRMAR PRESENÇA'}</div>
                <div style={{ fontFamily: 'Barlow', fontSize: 14, color: '#71767b', margin: '8px 0 20px', lineHeight: 1.5 }}>
                  {editando ? 'Altere o que vai levar.' : 'Você vai comparecer? Selecione o que pode levar.'}{' '}
                  <span style={{ opacity: 0.5 }}>(opcional)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {LANCHES.map((l: string) => (
                    <button key={l} onClick={() => setLanche(lanche === l ? null : l)} style={{
                      fontFamily: 'Barlow', fontSize: 13, padding: '8px 16px', borderRadius: 999,
                      border: `1px solid ${lanche === l ? '#F07830' : '#2f3336'}`,
                      background: lanche === l ? 'rgba(240,120,48,0.1)' : 'transparent',
                      color: lanche === l ? '#F07830' : '#71767b', fontWeight: lanche === l ? 700 : 500,
                    }}>{l}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editando && (
                    <button onClick={() => setEditando(false)} style={{
                      flex: 1, padding: '12px', borderRadius: 999, border: '1px solid #333',
                      background: 'transparent', color: '#888', fontFamily: 'Barlow', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    }}>Cancelar</button>
                  )}
                  <button
                    onClick={async () => {
                      if (editando && euConfirmei) {
                        await updateDoc(doc(db, 'confirmacoes', euConfirmei.id), { lanche });
                        setEditando(false);
                        setLanche(null);
                      } else {
                        await confirmar();
                      }
                    }}
                    style={{ ...s.btnOrange, flex: 2, justifyContent: 'center' }}
                  >
                    {Ico.check()} {editando ? 'Salvar' : 'Confirmar Presença'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ ...s.card, padding: 20, border: '1px solid #1DB954', background: 'rgba(29, 185, 84, 0.05)' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, background: '#1DB954', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {Ico.check()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 17, color: '#1DB954', letterSpacing: 0.5 }}>
                      PRESENÇA CONFIRMADA!
                    </div>
                    <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#71767b', marginTop: 2 }}>
                      {euConfirmei.lanche ? `Você vai levar ${euConfirmei.lanche}` : 'Sem lanche selecionado'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setLanche(euConfirmei.lanche || null); setEditando(true); }} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid #2f3336',
                    background: 'transparent', color: '#e7e9ea', fontFamily: 'Barlow', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>Editar lanche</button>
                  <button onClick={async () => {
                    if (window.confirm('Cancelar sua presença?')) {
                      await deleteDoc(doc(db, 'confirmacoes', euConfirmei.id));
                    }
                  }} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid #331111',
                    background: 'transparent', color: '#f4212e', fontFamily: 'Barlow', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>Cancelar presença</button>
                </div>
              </div>
            )}

            <div style={{ ...s.card, padding: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={s.cardTag}>CONFIRMADOS</div>
                <div
                  style={{
                    background: '#F07830',
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontFamily: 'Barlow Condensed',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#fff',
                  }}
                >
                  {lista.length}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lista.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom:
                        i < lista.length - 1 ? '1px solid #2f3336' : 'none',
                    }}
                  >
                    <img
                      src={c.userPhoto}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                      alt=""
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'Barlow',
                          fontWeight: 700,
                          fontSize: 15,
                          color: '#fff',
                        }}
                      >
                        {c.userName}
                        {c.lanche && (
                          <span
                            style={{
                              color: '#F07830',
                              fontWeight: 500,
                              fontSize: 13,
                            }}
                          >
                            {' '}
                            · {c.lanche}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Barlow',
                          fontSize: 12,
                          color: '#71767b',
                          marginTop: 1,
                        }}
                      >
                        Confirmado às {c.hora}
                      </div>
                    </div>
                  </div>
                ))}
                {lista.length === 0 && (
                  <div
                    style={{
                      fontFamily: 'Barlow',
                      fontSize: 14,
                      color: '#71767b',
                      padding: '10px 0',
                    }}
                  >
                    Ninguém confirmou ainda.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
