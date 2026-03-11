import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { perguntasQuiz, type PerguntaQuiz } from '../data/perguntasQuiz';
import type { Screen, CurrentUser } from '../types';
import { Avatar } from '../components/Avatar';

type Nivel = 'iniciante' | 'intermediario' | 'avancado' | 'aleatorio';
type GameState = 'menu' | 'playing' | 'result';

const MULT: Record<Nivel, number> = { iniciante: 1, intermediario: 2, avancado: 3, aleatorio: 1 };
const COR: Record<Nivel, string> = { iniciante: '#22c55e', intermediario: '#eab308', avancado: '#ef4444', aleatorio: '#8b5cf6' };
const LABEL: Record<Nivel, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado', aleatorio: 'Aleatório' };
const EMOJI: Record<Nivel, string> = { iniciante: '🟢', intermediario: '🟡', avancado: '🔴', aleatorio: '⚡' };
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
  const [answered, setAnswered] = useState<number | null>(null); // -1 = timeout
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [pontosSessao, setPontosSessao] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalResp, setTotalResp] = useState(0);
  const [totalAcertos, setTotalAcertos] = useState(0);
  const [qNum, setQNum] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load user stats
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

  const iniciar = (nivelEscolhido: Nivel) => {
    setNivel(nivelEscolhido);
    const filtered = nivelEscolhido === 'aleatorio' ? perguntasQuiz : perguntasQuiz.filter(p => p.nivel === nivelEscolhido);
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
    setAnswered(null);
    setTimeLeft(30);
    setTimerActive(true);
    setGameState('playing');
  };

  // Timer
  useEffect(() => {
    if (!timerActive || answered !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setAnswered(-1);
          setTimerActive(false);
          setStreak(0);
          setTotalResp(prev => prev + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerActive, answered]);

  const responder = (idx: number) => {
    if (answered !== null || !q) return;
    clearInterval(timerRef.current!);
    setTimerActive(false);
    setAnswered(idx);
    setTotalResp(prev => prev + 1);
    if (idx === q.correta) {
      const mult = MULT[nivel];
      let pts = 10 * mult;
      if (timeLeft > 20) pts += 5;
      const newStreak = streak + 1;
      if (newStreak >= 3) pts += 15;
      setPontosSessao(prev => prev + pts);
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      setTotalAcertos(prev => prev + 1);
    } else {
      setStreak(0);
    }
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
    setAnswered(null);
    setTimeLeft(30);
    setTimerActive(true);
    setQNum(n => n + 1);
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
    return (
      <div style={{ background: '#000', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 60, marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: '#F07830', letterSpacing: 3, marginBottom: 4 }}>SESSÃO ENCERRADA!</div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: '#555', letterSpacing: 2, marginBottom: 32 }}>
          NÍVEL: {LABEL[nivel].toUpperCase()}
        </div>

        <div style={{ background: '#16181c', border: '1px solid #2f3336', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Big score */}
          <div style={{ textAlign: 'center', borderBottom: '1px solid #2f3336', paddingBottom: 16 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: '#555', letterSpacing: 2 }}>PONTOS DA SESSÃO</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 56, color: '#F07830', lineHeight: 1 }}>{pontosSessao}</div>
          </div>

          {/* Stats */}
          {[
            { label: 'Acertos', value: `${totalAcertos} / ${totalResp}` },
            { label: 'Precisão', value: `${pct}%` },
            { label: 'Maior sequência', value: `🔥 ${maxStreak}` },
            { label: 'Total acumulado', value: `${pontosAcumulados + pontosSessao > pontosAcumulados ? pontosAcumulados : pontosAcumulados} pts` },
            ...(pontosSessao >= recorde && pontosSessao > 0 ? [{ label: 'Novo recorde!', value: '🏆 ' + pontosSessao }] : [{ label: 'Recorde pessoal', value: `🏆 ${recorde}` }]),
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#71767b' }}>{s.label}</span>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 16, fontWeight: 700, color: '#e7e9ea' }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: 360, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { setGameState('menu'); }} style={btnStyle('#F07830')}>
            Jogar Novamente
          </button>
          <button onClick={() => goTo('home')} style={btnStyle('transparent', '#555', '1px solid #2f3336')}>
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (gameState === 'playing' && q) {
    const timerPct = (timeLeft / 30) * 100;
    const timerCor = timeLeft > 15 ? '#22c55e' : timeLeft > 7 ? '#eab308' : '#ef4444';
    const isCorrect = answered === q.correta;
    const timedOut = answered === -1;

    return (
      <div style={{ background: '#000', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid #1a1a1a', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={encerrar} style={{ background: 'transparent', border: 'none', color: '#F07830', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: '#e7e9ea', letterSpacing: 2 }}>
                JOGANDO EM COMUNHÃO
              </div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: COR[nivel], letterSpacing: 1 }}>
                {LABEL[nivel].toUpperCase()} • {MULT[nivel]}×
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {streak >= 3 && (
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                  🔥{streak}
                </div>
              )}
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#F07830' }}>{pontosSessao}</div>
            </div>
          </div>

          {/* Timer bar */}
          <div style={{ background: '#1a1a1a', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${timerPct}%`,
              background: timerCor,
              transition: 'width 1s linear, background 0.5s',
            }} />
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'Barlow Condensed', fontSize: 12, color: timerCor, marginTop: 3, letterSpacing: 1 }}>
            {answered === null ? `${timeLeft}s` : ''}
          </div>
        </div>

        {/* Question body */}
        <div style={{ flex: 1, padding: '16px 16px 120px' }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#555', letterSpacing: 2, marginBottom: 12 }}>
            PERGUNTA {qNum}
          </div>

          <div style={{
            fontFamily: 'Barlow, sans-serif', fontSize: 20, fontWeight: 700,
            color: '#e7e9ea', lineHeight: 1.4, marginBottom: 24,
          }}>
            {q.pergunta}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opcoes.map((op, i) => {
              let bg = '#16181c', border = '1px solid #2f3336', color = '#e7e9ea';
              if (answered !== null) {
                if (i === q.correta) { bg = 'rgba(34,197,94,0.15)'; border = '1px solid #22c55e'; color = '#22c55e'; }
                else if (i === answered && answered !== q.correta) { bg = 'rgba(239,68,68,0.15)'; border = '1px solid #ef4444'; color = '#ef4444'; }
                else { color = '#444'; }
              }
              return (
                <button
                  key={i}
                  onClick={() => responder(i)}
                  disabled={answered !== null}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 14,
                    background: bg, border, color,
                    cursor: answered !== null ? 'default' : 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'all 0.25s',
                    fontFamily: 'Barlow, sans-serif',
                  }}
                >
                  <span style={{
                    fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14,
                    width: 24, height: 24, borderRadius: '50%',
                    background: answered !== null && i === q.correta ? '#22c55e' : answered !== null && i === answered ? '#ef4444' : '#2f3336',
                    color: (answered !== null && (i === q.correta || i === answered)) ? '#fff' : '#888',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.25s',
                  }}>
                    {answered !== null && i === q.correta ? '✓' : answered !== null && i === answered && i !== q.correta ? '✗' : OPTS[i]}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1.4 }}>{op}</span>
                </button>
              );
            })}
          </div>

          {/* Timeout message */}
          {timedOut && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: '#ef4444', letterSpacing: 1, marginBottom: 4 }}>⏱ TEMPO ESGOTADO</div>
            </div>
          )}

          {/* Explanation */}
          {answered !== null && (
            <div style={{
              marginTop: 16, padding: '14px 16px', borderRadius: 14,
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 12, letterSpacing: 2, color: isCorrect ? '#22c55e' : '#ef4444', marginBottom: 6 }}>
                {isCorrect ? '✓ CORRETO!' : timedOut ? 'TEMPO ESGOTADO' : '✗ ERROU'}
                {isCorrect && timeLeft > 20 && ' +5 VELOCIDADE'}
                {isCorrect && streak >= 3 && ` +15 SEQUÊNCIA (${streak})`}
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#ccc', lineHeight: 1.5, marginBottom: 8 }}>
                {q.explicacao}
              </div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 12, color: '#F07830', letterSpacing: 0.5 }}>
                📖 {q.referencia}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {answered !== null && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 20px', background: 'rgba(0,0,0,0.95)', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 10 }}>
            <button onClick={proxima} style={{ ...btnStyle('#F07830'), flex: 1 }}>
              Próxima Pergunta →
            </button>
            <button onClick={encerrar} style={{ ...btnStyle('transparent', '#555', '1px solid #2f3336'), width: 56, padding: 0, flexShrink: 0 }}>
              ⏹
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── MENU ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#000', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => goTo('home')} style={{ background: 'transparent', border: 'none', color: '#F07830', cursor: 'pointer', padding: 6, marginRight: 8, display: 'flex', borderRadius: '50%' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#fff', letterSpacing: 2, lineHeight: 1 }}>JOGANDO EM COMUNHÃO</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#555', letterSpacing: 2 }}>QUIZ BÍBLICO</div>
        </div>
        <button onClick={() => { setShowRanking(true); loadRanking(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 9, color: '#F07830', letterSpacing: 1 }}>TOP 10</span>
        </button>
      </div>

      <div style={{ padding: '24px 16px' }}>
        {/* Bible icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(240,120,48,0.1)', border: '1px solid rgba(240,120,48,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 36 }}>
            📖
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#555' }}>
            Escolha a dificuldade e teste seus conhecimentos bíblicos
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total de pontos', value: pontosAcumulados, icon: '⭐' },
            { label: 'Meu recorde', value: recorde, icon: '🏆' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#16181c', border: '1px solid #2f3336', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: '#F07830', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, color: '#555', letterSpacing: 1, marginTop: 2 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Level buttons */}
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 12 }}>ESCOLHA O NÍVEL</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {(['iniciante', 'intermediario', 'avancado'] as Nivel[]).map(n => (
            <button
              key={n}
              onClick={() => iniciar(n)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', borderRadius: 16,
                background: '#16181c', border: `1px solid #2f3336`,
                cursor: 'pointer', width: '100%',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{EMOJI[n]}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 16, color: '#e7e9ea' }}>{LABEL[n]}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: COR[n], letterSpacing: 1, marginTop: 1 }}>
                    ×{MULT[n]} PTS — {n === 'iniciante' ? '25 perguntas' : n === 'intermediario' ? '25 perguntas' : '25 perguntas'}
                  </div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          ))}

          <button
            onClick={() => iniciar('aleatorio')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: 16,
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
              cursor: 'pointer', width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 16, color: '#e7e9ea' }}>Aleatório</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#8b5cf6', letterSpacing: 1, marginTop: 1 }}>MISTURA TODOS OS NÍVEIS</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Rules */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 10 }}>COMO PONTUAR</div>
          {[
            ['✅ Acerto', '10 pts × multiplicador'],
            ['⚡ Responder em <10s', '+5 pts bônus'],
            ['🔥 3 acertos seguidos', '+15 pts bônus'],
            ['❌ Erro / ⏱ Tempo', 'Sequência volta a 0'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#555' }}>{k}</span>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#e7e9ea', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking Modal */}
      {showRanking && (
        <div onClick={() => setShowRanking(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d0d', border: '1px solid #2f3336', borderBottom: 'none', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
              <button onClick={() => setShowRanking(false)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: 20, color: '#e7e9ea', letterSpacing: 2 }}>🏆 TOP 10</div>
              <div style={{ width: 28 }} />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 24px' }}>
              {rankingLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#555', fontFamily: 'Barlow, sans-serif' }}>Carregando...</div>
              ) : ranking.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#555', fontFamily: 'Barlow, sans-serif' }}>Nenhuma pontuação ainda. Seja o primeiro! 🎯</div>
              ) : (
                ranking.map((r, i) => {
                  const isMe = r.uid === currentUser.uid;
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                  return (
                    <div key={r.uid} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                      background: isMe ? 'rgba(240,120,48,0.08)' : 'transparent',
                      border: isMe ? '1px solid rgba(240,120,48,0.3)' : '1px solid transparent',
                    }}>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: i < 3 ? '#F07830' : '#555', width: 28, textAlign: 'center' }}>{medal}</div>
                      <Avatar src={r.photo} name={r.name} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: isMe ? '#F07830' : '#e7e9ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name} {isMe && '(você)'}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#F07830' }}>{r.quizPontos}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string, color = '#fff', border = 'none'): React.CSSProperties {
  return {
    padding: '14px',
    borderRadius: 999,
    background: bg,
    color,
    fontFamily: 'Barlow, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    border,
    cursor: 'pointer',
    width: '100%',
  };
}
