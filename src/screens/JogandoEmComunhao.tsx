import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { perguntasQuiz, type PerguntaQuiz } from '../data/perguntasQuiz';
import type { Screen, CurrentUser } from '../types';
import { Avatar } from '../components/Avatar';

type Nivel = 'iniciante' | 'intermediario' | 'avancado' | 'aleatorio';
type GameState = 'menu' | 'playing' | 'result';

const MULT: Record<Nivel, number> = { iniciante: 1, intermediario: 2, avancado: 3, aleatorio: 1 };
const COR: Record<Nivel, string> = { iniciante: '#22c55e', intermediario: '#eab308', avancado: '#ef4444', aleatorio: '#F07830' };
const LABEL: Record<Nivel, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado', aleatorio: 'Aleatório' };
const OPTS = ['A', 'B', 'C', 'D'];

interface RankingEntry { uid: string; name: string; photo: string; quizPontos: number; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// SVG icons inline (no emojis)
const IcoTrophy = ({ size = 20, color = '#F07830' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IcoStar = ({ size = 20, color = '#F07830' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IcoBook = ({ size = 28, color = '#F07830' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="12" y1="6" x2="12" y2="14" /><line x1="9" y1="9" x2="15" y2="9" />
  </svg>
);


interface Props { currentUser: CurrentUser; goTo: (sc: Screen) => void; }

export function JogandoEmComunhaoScreen({ currentUser, goTo }: Props) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [nivel, setNivel] = useState<Nivel>('iniciante');

  // Menu
  const [pontosAcumulados, setPontosAcumulados] = useState(0);
  const [recorde, setRecorde] = useState(0);
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Playing
  const [pool, setPool] = useState<PerguntaQuiz[]>([]);
  const [poolIdx, setPoolIdx] = useState(0);
  const [q, setQ] = useState<PerguntaQuiz | null>(null);
  const [selected, setSelected] = useState<number | null>(null);   // option user tapped
  const [answered, setAnswered] = useState(false);                  // confirmed answer
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [pontosSessao, setPontosSessao] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalResp, setTotalResp] = useState(0);
  const [totalAcertos, setTotalAcertos] = useState(0);
  const [qNum, setQNum] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPontosAcumulados(d.quizPontos || 0);
        setRecorde(d.quizRecorde || 0);
      }
    });
  }, [currentUser.uid]);

  const loadRanking = async () => {
    setRankingLoading(true);
    const snap = await getDocs(query(collection(db, 'users'), orderBy('quizPontos', 'desc'), limit(10)));
    const r: RankingEntry[] = snap.docs
      .map(d => ({ uid: d.id, name: d.data().fullName || d.data().name || 'Anônimo', photo: d.data().photoData || d.data().photo || '', quizPontos: d.data().quizPontos || 0 }))
      .filter(e => e.quizPontos > 0);
    setRanking(r);
    setRankingLoading(false);
  };

  const iniciar = (n: Nivel) => {
    setNivel(n);
    const filtered = n === 'aleatorio' ? perguntasQuiz : perguntasQuiz.filter(p => p.nivel === n);
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setPoolIdx(0);
    setQ(shuffled[0]);
    setPontosSessao(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalResp(0);
    setTotalAcertos(0);
    setQNum(1);
    setSelected(null);
    setAnswered(false);
    setTimedOut(false);
    setTimeLeft(30);
    setTimerActive(true);
    setGameState('playing');
  };

  // Timer
  useEffect(() => {
    if (!timerActive || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          setTimedOut(true);
          setAnswered(true);
          setStreak(0);
          setTotalResp(prev => prev + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerActive, answered]);

  const confirmar = () => {
    if (selected === null || answered || !q) return;
    clearInterval(timerRef.current!);
    setTimerActive(false);
    setAnswered(true);
    setTotalResp(prev => prev + 1);
    if (selected === q.correta) {
      const mult = MULT[nivel];
      let pts = 10 * mult;
      if (timeLeft > 20) pts += 5;
      const ns = streak + 1;
      if (ns >= 3) pts += 15;
      setPontosSessao(prev => prev + pts);
      setStreak(ns);
      setMaxStreak(prev => Math.max(prev, ns));
      setTotalAcertos(prev => prev + 1);
    } else {
      setStreak(0);
    }
    // Scroll to bottom so explanation + button are visible
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const proxima = () => {
    let nextPool = pool;
    let nextIdx = poolIdx + 1;
    if (nextIdx >= pool.length) {
      const filtered = nivel === 'aleatorio' ? perguntasQuiz : perguntasQuiz.filter(p => p.nivel === nivel);
      nextPool = shuffle(filtered);
      setPool(nextPool);
      nextIdx = 0;
    }
    setPoolIdx(nextIdx);
    setQ(nextPool[nextIdx]);
    setSelected(null);
    setAnswered(false);
    setTimedOut(false);
    setTimeLeft(30);
    setTimerActive(true);
    setQNum(n => n + 1);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const encerrar = async () => {
    setTimerActive(false);
    clearInterval(timerRef.current!);
    const novoRecorde = Math.max(recorde, pontosSessao);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        quizPontos: increment(pontosSessao),
        quizRecorde: novoRecorde,
      }, { merge: true });
    } catch { /* silent */ }
    setPontosAcumulados(prev => prev + pontosSessao);
    setRecorde(novoRecorde);
    setGameState('result');
  };

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (gameState === 'result') {
    const pct = totalResp > 0 ? Math.round((totalAcertos / totalResp) * 100) : 0;
    const newRecord = pontosSessao > recorde && pontosSessao > 0;

    return (
      <div style={{ background: '#000', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #1a1a1a' }}>
          <button onClick={() => goTo('home')} style={backBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: 2 }}>RESULTADO</div>
          </div>
          <div style={{ width: 34 }} />
        </div>

        <div style={{ flex: 1, padding: '32px 20px 24px' }}>
          {/* Big score */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#555', letterSpacing: 3, marginBottom: 8 }}>
              {LABEL[nivel].toUpperCase()} — SESSÃO ENCERRADA
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 80, color: '#F07830', lineHeight: 1 }}>{pontosSessao}</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#555', letterSpacing: 2 }}>PONTOS</div>
            {newRecord && (
              <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(240,120,48,0.15)', border: '1px solid rgba(240,120,48,0.4)', borderRadius: 99, padding: '4px 14px' }}>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#F07830', letterSpacing: 2 }}>NOVO RECORDE!</span>
              </div>
            )}
          </div>

          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'ACERTOS', value: `${totalAcertos}/${totalResp}`, accent: '#22c55e' },
              { label: 'PRECISÃO', value: `${pct}%`, accent: '#F07830' },
              { label: 'SEQUÊNCIA', value: maxStreak, accent: '#eab308' },
              { label: 'RECORDE', value: Math.max(recorde, pontosSessao), accent: '#F07830' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, color: '#888', letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setGameState('menu')} style={primaryBtn}>
              JOGAR NOVAMENTE
            </button>
            <button onClick={() => goTo('home')} style={secondaryBtn}>
              VOLTAR AO INÍCIO
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (gameState === 'playing' && q) {
    const timerPct = (timeLeft / 30) * 100;
    const timerCor = timeLeft > 15 ? '#F07830' : timeLeft > 7 ? '#eab308' : '#ef4444';
    const isCorrect = answered && selected === q.correta;
    const isWrong = answered && !timedOut && selected !== q.correta;
    const feedbackBg = isCorrect ? 'rgba(34,197,94,0.08)' : (isWrong || timedOut) ? 'rgba(239,68,68,0.08)' : 'transparent';
    const feedbackBorder = isCorrect ? 'rgba(34,197,94,0.25)' : (isWrong || timedOut) ? 'rgba(239,68,68,0.25)' : 'transparent';
    const feedbackAccent = isCorrect ? '#22c55e' : '#ef4444';
    const ptsGanhos = (() => {
      if (!isCorrect) return 0;
      let pts = 10 * MULT[nivel];
      if (timeLeft > 20) pts += 5;
      if (streak >= 3) pts += 15;
      return pts;
    })();

    return (
      <div style={{ background: '#000', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {/* Top bar */}
        <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <button onClick={encerrar} style={backBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {/* Progress bar */}
            <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${timerPct}%`, background: timerCor, transition: 'width 1s linear, background 0.5s' }} />
            </div>

            {/* Streak / pts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 56, justifyContent: 'flex-end' }}>
              {streak >= 3 && (
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: '#ef4444', letterSpacing: 1 }}>
                  {streak}×
                </div>
              )}
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#F07830', letterSpacing: 1 }}>{pontosSessao}</div>
            </div>
          </div>

          {/* Subtitle: level + question num */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: COR[nivel], letterSpacing: 2 }}>
              {LABEL[nivel].toUpperCase()} · {MULT[nivel]}×
            </div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#555', letterSpacing: 1 }}>
              {answered ? '' : `${timeLeft}s`}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 0' }}>
          {/* Question */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#555', letterSpacing: 3, marginBottom: 10 }}>
              PERGUNTA {qNum}
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
              {q.pergunta}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opcoes.map((op, i) => {
              // Colors
              let bg = '#111', border = '#2a2a2a', textColor = '#ccc', badgeBg = '#1e1e1e', badgeColor = '#666';
              if (answered) {
                if (i === q.correta) {
                  bg = 'rgba(34,197,94,0.12)'; border = '#22c55e'; textColor = '#22c55e';
                  badgeBg = '#22c55e'; badgeColor = '#fff';
                } else if (i === selected && selected !== q.correta) {
                  bg = 'rgba(239,68,68,0.12)'; border = '#ef4444'; textColor = '#ef4444';
                  badgeBg = '#ef4444'; badgeColor = '#fff';
                } else {
                  textColor = '#444'; border = '#1a1a1a';
                }
              } else if (selected === i) {
                bg = 'rgba(240,120,48,0.12)'; border = '#F07830'; textColor = '#F07830';
                badgeBg = '#F07830'; badgeColor = '#fff';
              }

              return (
                <button
                  key={i}
                  onClick={() => { if (!answered) setSelected(i); }}
                  disabled={answered}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 16px', borderRadius: 16,
                    background: bg, border: `2px solid ${border}`,
                    cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: badgeBg, color: badgeColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1,
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    {OPTS[i]}
                  </div>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 16, fontWeight: 500, color: textColor, lineHeight: 1.4, transition: 'color 0.2s' }}>
                    {op}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation (shown after answering) */}
          {answered && (
            <div style={{
              marginTop: 16, marginBottom: 4, padding: '16px',
              background: feedbackBg, border: `1px solid ${feedbackBorder}`,
              borderRadius: 16,
            }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: 700, letterSpacing: 2, color: feedbackAccent, marginBottom: 8 }}>
                {isCorrect
                  ? `CORRETO! +${ptsGanhos} PTS${timeLeft > 20 ? ' · BÔNUS VELOCIDADE' : ''}${streak >= 3 ? ` · SEQUÊNCIA ${streak}×` : ''}`
                  : timedOut ? 'TEMPO ESGOTADO' : 'ERROU'}
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15, color: '#bbb', lineHeight: 1.55, marginBottom: 10 }}>
                {q.explicacao}
              </div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#F07830', letterSpacing: 0.5 }}>
                {q.referencia}
              </div>
            </div>
          )}
        </div>

        {/* Bottom action — always visible, not fixed */}
        <div style={{
          flexShrink: 0, padding: '12px 16px 16px',
          background: answered ? (isCorrect ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)') : '#000',
          borderTop: `1px solid ${answered ? feedbackBorder : '#1a1a1a'}`,
        }}>
          {!answered ? (
            <button
              onClick={confirmar}
              disabled={selected === null}
              style={{
                width: '100%', padding: '16px',
                borderRadius: 16, border: 'none',
                background: selected !== null ? '#F07830' : '#1a1a1a',
                color: selected !== null ? '#fff' : '#444',
                fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3,
                cursor: selected !== null ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              VERIFICAR
            </button>
          ) : (
            <button onClick={proxima} style={{
              width: '100%', padding: '16px',
              borderRadius: 16, border: 'none',
              background: isCorrect ? '#22c55e' : '#F07830',
              color: '#fff',
              fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3,
              cursor: 'pointer',
            }}>
              CONTINUAR
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── MENU ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#000', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => goTo('home')} style={backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F07830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ flex: 1, marginLeft: 4 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#fff', letterSpacing: 3, lineHeight: 1 }}>JOGANDO EM COMUNHÃO</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#777', letterSpacing: 3 }}>QUIZ BÍBLICO</div>
        </div>
        <button onClick={() => { setShowRanking(true); loadRanking(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 8px' }}>
          <IcoTrophy size={22} color="#F07830" />
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 9, color: '#F07830', letterSpacing: 1.5 }}>TOP 10</span>
        </button>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Icon + description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(240,120,48,0.1)', border: '1px solid rgba(240,120,48,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcoBook size={28} color="#F07830" />
          </div>
          <div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#e7e9ea', marginBottom: 3 }}>Quiz Bíblico</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#888', lineHeight: 1.4 }}>
              Escolha o nível e teste seus conhecimentos. Pontos acumulam no ranking.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { icon: <IcoStar size={18} />, label: 'TOTAL', value: pontosAcumulados },
            { icon: <IcoTrophy size={18} />, label: 'RECORDE', value: recorde },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: '#F07830', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 9, color: '#888', letterSpacing: 2, marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Level buttons */}
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#666', letterSpacing: 3, marginBottom: 12 }}>ESCOLHA O NÍVEL</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {([
            { n: 'iniciante' as Nivel, desc: 'Histórias e personagens bíblicos' },
            { n: 'intermediario' as Nivel, desc: 'Doutrinas adventistas e profecias' },
            { n: 'avancado' as Nivel, desc: 'Teologia profunda e profecias' },
            { n: 'aleatorio' as Nivel, desc: 'Todos os 75 temas embaralhados' },
          ]).map(({ n, desc }) => (
            <button
              key={n}
              onClick={() => iniciar(n)}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                padding: 0, borderRadius: 16, overflow: 'hidden',
                background: '#0d0d0d', border: '1px solid #222',
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              {/* Color accent bar */}
              <div style={{ width: 4, alignSelf: 'stretch', background: COR[n], flexShrink: 0, borderRadius: '0' }} />

              {/* Content */}
              <div style={{ flex: 1, padding: '16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                      {LABEL[n]}
                    </span>
                    <span style={{
                      fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 1,
                      color: COR[n], background: `${COR[n]}20`,
                      border: `1px solid ${COR[n]}50`,
                      padding: '1px 8px', borderRadius: 99,
                    }}>
                      ×{MULT[n]}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#888' }}>{desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </button>
          ))}
        </div>

        {/* Rules */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#666', letterSpacing: 3, marginBottom: 14 }}>COMO PONTUAR</div>
          {[
            { desc: 'Resposta correta', val: '10 pts × multiplicador', color: '#22c55e' },
            { desc: 'Responder em menos de 10s', val: '+5 pts bônus', color: '#F07830' },
            { desc: '3 acertos seguidos', val: '+15 pts bônus', color: '#eab308' },
            { desc: 'Erro ou tempo esgotado', val: 'Sequência vai a 0', color: '#ef4444' },
          ].map(({ desc, val, color }) => (
            <div key={desc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, borderRadius: 99, background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#bbb' }}>{desc}</span>
              </div>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking Modal */}
      {showRanking && (
        <div onClick={() => setShowRanking(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderBottom: 'none', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
              <button onClick={() => setShowRanking(false)} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 6px 0 0' }}>×</button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: 20, color: '#e7e9ea', letterSpacing: 3 }}>RANKING</div>
              <div style={{ width: 28 }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 24px' }}>
              {rankingLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>Carregando...</div>
              ) : ranking.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>Nenhuma pontuação ainda. Seja o primeiro!</div>
              ) : ranking.map((r, i) => {
                const isMe = r.uid === currentUser.uid;
                const pos = i === 0 ? '1°' : i === 1 ? '2°' : i === 2 ? '3°' : `${i + 1}°`;
                const posColor = i === 0 ? '#F07830' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#555';
                return (
                  <div key={r.uid} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                    background: isMe ? 'rgba(240,120,48,0.08)' : '#111',
                    border: isMe ? '1px solid rgba(240,120,48,0.3)' : '1px solid transparent',
                  }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: posColor, width: 28, textAlign: 'center', flexShrink: 0 }}>{pos}</div>
                    <Avatar src={r.photo} name={r.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: isMe ? '#F07830' : '#e7e9ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}{isMe && ' (você)'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#F07830', letterSpacing: 1 }}>{r.quizPontos}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const backBtn: React.CSSProperties = {
  background: 'transparent', border: 'none',
  cursor: 'pointer', padding: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', flexShrink: 0,
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '16px',
  borderRadius: 16, border: 'none',
  background: '#F07830', color: '#fff',
  fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px',
  borderRadius: 16, border: '1px solid #2a2a2a',
  background: 'transparent', color: '#555',
  fontFamily: 'Barlow Condensed', fontSize: 14, letterSpacing: 2,
  cursor: 'pointer',
};
