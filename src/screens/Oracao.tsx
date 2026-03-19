import { useState, useEffect } from 'react';
import {
  doc,
  setDoc,
  deleteDoc,
  arrayUnion,
  collection,
  addDoc,
  updateDoc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import { getWeekKey } from '../constants';
import { useChurch } from '../contexts/ChurchContext';
import type { Screen, Sorteio, CurrentUser } from '../types';

interface PrayerRequest {
  id: string;
  text: string;
  anonymous: boolean;
  authorUid: string;
  authorName: string;
  prayedCount: number;
  createdAt: any;
}

interface Props {
  goTo: (sc: Screen) => void;
  currentUser: CurrentUser;
  membrosLista: string[];
  sorteioSemana: Sorteio | null;
  isAdmin: boolean;
}

export function OracaoScreen({
  goTo,
  currentUser,
  membrosLista,
  sorteioSemana,
  isAdmin,
}: Props) {
  const { selectedChurch } = useChurch();
  const currentUserName = currentUser.name;

  // ── Draw state ──────────────────────────────────────────────────────────────
  const [sorteando, setSorteando] = useState(false);
  const sorteadoAtual = sorteioSemana?.sorteado || null;
  const jaOrou = sorteioSemana?.historico || [];
  const disponiveis = membrosLista.filter(
    (m) => m !== currentUserName && !jaOrou.includes(m)
  );

  // ── Prayer requests state ────────────────────────────────────────────────────
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPrayerText, setNewPrayerText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedChurch) return;
    setPrayersLoading(true);
    const prayersRef = collection(db, 'churches', selectedChurch.id, 'prayers');
    const q = query(prayersRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPrayers(snap.docs.map(d => ({ id: d.id, ...d.data() } as PrayerRequest)));
      setPrayersLoading(false);
    }, () => setPrayersLoading(false));
    return () => unsub();
  }, [selectedChurch?.id]);

  const sortear = async () => {
    if (!disponiveis.length) return;
    setSorteando(true);
    let count = 0;
    const pool = [...disponiveis];
    const iv = setInterval(async () => {
      count++;
      if (count > 18) {
        clearInterval(iv);
        const escolhido = pool[Math.floor(Math.random() * pool.length)];
        await setDoc(
          doc(db, 'sorteios', getWeekKey()),
          {
            sorteado: escolhido,
            historico: arrayUnion(escolhido),
            semana: getWeekKey(),
          },
          { merge: true }
        );
        setSorteando(false);
      }
    }, 90);
  };

  const resetar = async () => {
    if (!window.confirm('Resetar o sorteio desta semana?')) return;
    await deleteDoc(doc(db, 'sorteios', getWeekKey()));
  };

  const submitPrayer = async () => {
    if (!newPrayerText.trim() || !selectedChurch) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'churches', selectedChurch.id, 'prayers'), {
        text: newPrayerText.trim(),
        anonymous,
        authorUid: currentUser.uid,
        authorName: anonymous ? 'Anônimo' : currentUser.name,
        prayedCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewPrayerText('');
      setAnonymous(false);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const prayFor = async (prayerId: string) => {
    if (!selectedChurch) return;
    await updateDoc(doc(db, 'churches', selectedChurch.id, 'prayers', prayerId), {
      prayedCount: increment(1),
    });
  };

  const deletePrayer = async (prayer: PrayerRequest) => {
    if (!selectedChurch || prayer.authorUid !== currentUser.uid) return;
    if (!window.confirm('Remover pedido de oração?')) return;
    await deleteDoc(doc(db, 'churches', selectedChurch.id, 'prayers', prayer.id));
  };

  return (
    <div className="fade">
      <div style={{ ...s.pageHeader, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.backBtn} onClick={() => goTo('home')}>
            {Ico.back()}
          </button>
          <div>
            <div style={s.pageTitle}>ORAÇÃO</div>
            {selectedChurch && (
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: '#BA7517', marginTop: 1 }}>
                {selectedChurch.name}
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={resetar}
            style={{
              background: 'rgba(244, 33, 46, 0.1)',
              border: '1px solid rgba(244, 33, 46, 0.2)',
              borderRadius: 999,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'Barlow',
              fontWeight: 700,
              fontSize: 11,
              color: '#f4212e',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
            </svg>
            RESETAR
          </button>
        )}
      </div>

      <div style={s.page}>
        {/* ── Prayer draw ─────────────────────────────────────────── */}
        <div style={{ ...s.card, padding: 24, marginBottom: 16 }}>
          <div style={{
            fontFamily: 'Barlow Condensed',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            color: '#BA7517',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            ESTA SEMANA VOCÊ ORA POR
          </div>
          <div style={{
            background: '#000',
            borderRadius: 20,
            padding: '32px 16px',
            marginBottom: 24,
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #2f3336',
          }}>
            {sorteadoAtual ? (
              <>
                <div style={{
                  fontFamily: 'Barlow Condensed',
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#BA7517',
                  letterSpacing: 1,
                }}>
                  {sorteadoAtual.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#71767b', marginTop: 8 }}>
                  Interceda por {sorteadoAtual} esta semana 🙏
                </div>
              </>
            ) : (
              <div style={{ fontFamily: 'Barlow', fontSize: 15, color: '#71767b' }}>
                {sorteando ? 'Sorteando...' : 'Nenhum sorteio ainda'}
              </div>
            )}
          </div>

          {!sorteadoAtual && disponiveis.length > 0 && (
            <button
              onClick={sortear}
              disabled={sorteando}
              style={{ ...s.btnOrange, width: '100%', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="4" />
                <circle cx="8" cy="8" r="1.5" fill="#fff" />
                <circle cx="16" cy="8" r="1.5" fill="#fff" />
                <circle cx="8" cy="16" r="1.5" fill="#fff" />
                <circle cx="16" cy="16" r="1.5" fill="#fff" />
                <circle cx="12" cy="12" r="1.5" fill="#fff" />
              </svg>
              {sorteando ? 'Sorteando...' : 'Sortear pessoa'}
            </button>
          )}

          {sorteadoAtual && (
            <div style={{
              background: 'rgba(186,117,23,0.1)',
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#e7e9ea', lineHeight: 1.5 }}>
                Ore por <strong style={{ color: '#BA7517' }}>{sorteadoAtual}</strong>{' '}
                durante toda a semana!
              </div>
            </div>
          )}
        </div>

        {/* ── Members list ─────────────────────────────────────────── */}
        <div style={{ ...s.card, padding: 20, marginBottom: 16 }}>
          <div style={s.cardTag}>MEMBROS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {membrosLista
              .filter((m) => m !== currentUserName)
              .map((m) => (
                <div
                  key={m}
                  style={{
                    fontFamily: 'Barlow',
                    fontSize: 13,
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontWeight: 600,
                    background: m === sorteadoAtual ? '#BA7517' : '#16181c',
                    border: `1px solid ${m === sorteadoAtual ? '#BA7517' : '#2f3336'}`,
                    color: m === sorteadoAtual ? '#fff' : '#71767b',
                    opacity: jaOrou.includes(m) && m !== sorteadoAtual ? 0.4 : 1,
                    textDecoration: jaOrou.includes(m) && m !== sorteadoAtual ? 'line-through' : 'none',
                  }}
                >
                  {m}
                </div>
              ))}
          </div>
          {jaOrou.length > 0 && (
            <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#71767b', marginTop: 16, fontStyle: 'italic' }}>
              Riscados = já foram sorteados anteriormente
            </div>
          )}
        </div>

        {/* ── Prayer requests ──────────────────────────────────────── */}
        {selectedChurch && (
          <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 11, letterSpacing: 2, color: '#444', textTransform: 'uppercase' }}>
                Pedidos de Oração · {selectedChurch.name}
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'rgba(186,117,23,0.1)',
                  border: '1px solid rgba(186,117,23,0.25)',
                  borderRadius: 20,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontFamily: 'Barlow, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#BA7517',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 14 }}>+</span> Compartilhar
              </button>
            </div>

            {/* List */}
            {prayersLoading && (
              <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555' }}>
                Carregando...
              </div>
            )}
            {!prayersLoading && prayers.length === 0 && (
              <div style={{ padding: '24px 18px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#444' }}>
                Nenhum pedido de oração ainda. Seja o primeiro a compartilhar!
              </div>
            )}
            {!prayersLoading && prayers.map((prayer, i) => (
              <div
                key={prayer.id}
                style={{
                  padding: '14px 18px',
                  borderBottom: i < prayers.length - 1 ? '1px solid #111' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{
                    fontFamily: 'Barlow, sans-serif',
                    fontWeight: 600,
                    fontSize: 13,
                    color: prayer.anonymous ? '#555' : '#BA7517',
                  }}>
                    {prayer.authorName}
                  </div>
                  {prayer.authorUid === currentUser.uid && (
                    <button
                      onClick={() => deletePrayer(prayer)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#333' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#e7e9ea', lineHeight: 1.5, marginBottom: 10 }}>
                  {prayer.text}
                </div>
                <button
                  onClick={() => prayFor(prayer.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: '1px solid #2a2a2a',
                    borderRadius: 20,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontFamily: 'Barlow, sans-serif',
                    fontSize: 12,
                    color: '#555',
                  }}
                >
                  🙏 Orei por isso
                  {prayer.prayedCount > 0 && (
                    <span style={{ color: '#BA7517', fontWeight: 700 }}>{prayer.prayedCount}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {!selectedChurch && (
          <div style={{
            ...s.card,
            padding: 20,
            textAlign: 'center',
            color: '#555',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 13,
          }}>
            Selecione uma igreja para ver os pedidos de oração
          </div>
        )}
      </div>

      {/* ── Modal: new prayer request ──────────────────────────────── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              borderRadius: '20px 20px 0 0',
              width: '100%',
              maxWidth: 520,
              padding: '20px 20px 40px',
              border: '1px solid #222',
              borderBottom: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <button onClick={() => setShowModal(false)} style={{ color: '#666', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, marginRight: 8 }}>×</button>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
                COMPARTILHAR PEDIDO
              </span>
            </div>

            <textarea
              value={newPrayerText}
              onChange={e => setNewPrayerText(e.target.value.slice(0, 400))}
              placeholder="Escreva seu pedido de oração..."
              rows={4}
              style={{
                width: '100%',
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: 12,
                padding: '12px 14px',
                fontFamily: 'Barlow, sans-serif',
                fontSize: 14,
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            />

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
              cursor: 'pointer',
              fontFamily: 'Barlow, sans-serif',
              fontSize: 14,
              color: '#888',
            }}>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#BA7517', cursor: 'pointer' }}
              />
              Compartilhar como anônimo
            </label>

            <button
              onClick={submitPrayer}
              disabled={!newPrayerText.trim() || submitting}
              style={{
                width: '100%',
                background: newPrayerText.trim() ? '#BA7517' : '#2a1a07',
                border: 'none',
                borderRadius: 50,
                padding: '14px',
                fontFamily: 'Barlow Condensed',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1,
                color: newPrayerText.trim() ? '#fff' : '#664a1a',
                cursor: newPrayerText.trim() ? 'pointer' : 'default',
              }}
            >
              {submitting ? 'ENVIANDO...' : 'COMPARTILHAR'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
