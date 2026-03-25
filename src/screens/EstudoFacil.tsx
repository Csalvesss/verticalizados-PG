import { useState, useEffect } from 'react';
import { Ico } from '../icons';
import type { Screen } from '../types';
import { CURSOS, type CursoId } from '../data/cursos';
import { DANIEL } from '../data/daniel';
import { APOCALIPSE } from '../data/apocalipse';
import type { Licao } from '../data/daniel';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProgressoCurso {
  concluidas: number[]; // índices das lições concluídas
  ultimaLicao: number;
}

type EstudoProgresso = Record<CursoId, ProgressoCurso>;

type PlayerView = 'versiculo' | 'resumo' | 'pontos' | 'reflexao' | 'concluida';

const PROGRESS_KEY = 'estudo:progresso';

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadProgress(): EstudoProgresso {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    daniel: { concluidas: [], ultimaLicao: 0 },
    apocalipse: { concluidas: [], ultimaLicao: 0 },
  };
}

function saveProgress(p: EstudoProgresso) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value, total, cor }: { value: number; total: number; cor: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div style={{ position: 'relative', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, height: '100%',
        width: `${pct}%`, borderRadius: 2,
        background: cor,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Tela: Lista de Cursos ─────────────────────────────────────────────────────

function CursoListView({
  progresso,
  goTo,
  onSelectCurso,
}: {
  progresso: EstudoProgresso;
  goTo: (sc: Screen) => void;
  onSelectCurso: (id: CursoId) => void;
}) {
  const totalConcluidas = Object.values(progresso).reduce((s, p) => s + p.concluidas.length, 0);
  const totalLicoes = CURSOS.reduce((s, c) => s + c.totalLicoes, 0);

  return (
    <div className="fade" style={{ minHeight: '100vh', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button
          onClick={() => goTo('home')}
          style={{ padding: 6, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8 }}
        >
          {Ico.back()}
        </button>
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            fontSize: 18, color: '#fff', letterSpacing: 0.5,
          }}>
            Estudo Fácil
          </span>
        </div>
        {totalConcluidas > 0 && (
          <div style={{
            fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700,
            color: '#F07830', letterSpacing: 0.5,
          }}>
            {totalConcluidas}/{totalLicoes} lições
          </div>
        )}
      </div>

      {/* Hero */}
      <div style={{
        margin: '20px 16px 8px',
        background: 'linear-gradient(135deg, rgba(240,120,48,0.15), rgba(186,117,23,0.08))',
        border: '1px solid rgba(240,120,48,0.2)',
        borderRadius: 16,
        padding: '20px 20px 16px',
      }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#F07830', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Cursos Bíblicos
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, color: '#fff', fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>
          Aprofunde sua fé<br />passo a passo
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#888', lineHeight: 1.5 }}>
          Lições guiadas com versículo, resumo, pontos-chave e reflexão pessoal.
        </div>
        {totalConcluidas > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555' }}>Progresso geral</span>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#F07830', fontWeight: 700 }}>{totalConcluidas}/{totalLicoes}</span>
            </div>
            <ProgressBar value={totalConcluidas} total={totalLicoes} cor="linear-gradient(90deg, #F07830, #BA7517)" />
          </div>
        )}
      </div>

      {/* Curso cards */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CURSOS.map(curso => {
          const prog = progresso[curso.id];
          const pct = Math.round((prog.concluidas.length / curso.totalLicoes) * 100);
          const proximaLicao = prog.ultimaLicao < curso.totalLicoes ? prog.ultimaLicao : curso.totalLicoes - 1;

          return (
            <button
              key={curso.id}
              onClick={() => onSelectCurso(curso.id)}
              style={{
                width: '100%',
                background: `linear-gradient(135deg, ${curso.cor}44, ${curso.corSecundaria}66)`,
                border: `1px solid ${curso.cor}55`,
                borderRadius: 16,
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${curso.cor}33`,
                    border: `1px solid ${curso.cor}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, flexShrink: 0,
                  }}>
                    {curso.icone}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}>
                      {curso.titulo}
                    </div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                      {curso.descricao}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Barlow', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {prog.concluidas.length === 0
                        ? curso.subtitulo
                        : `${prog.concluidas.length}/${curso.totalLicoes} concluídas`}
                    </span>
                    {pct > 0 && (
                      <span style={{ fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700, color: '#F07830' }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                  <ProgressBar value={prog.concluidas.length} total={curso.totalLicoes} cor={curso.cor} />
                </div>

                {prog.concluidas.length < curso.totalLicoes && (
                  <div style={{
                    marginTop: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `${curso.cor}33`,
                    border: `1px solid ${curso.cor}44`,
                    borderRadius: 99, padding: '5px 12px',
                  }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: 12, fontWeight: 700, color: '#F07830' }}>
                      {prog.concluidas.length === 0
                        ? '▶ Começar'
                        : `▶ Lição ${proximaLicao + 1}`}
                    </span>
                  </div>
                )}
                {prog.concluidas.length === curso.totalLicoes && (
                  <div style={{
                    marginTop: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(100,200,100,0.15)',
                    border: '1px solid rgba(100,200,100,0.3)',
                    borderRadius: 99, padding: '5px 12px',
                  }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: 12, fontWeight: 700, color: '#6dc86d' }}>
                      ✓ Curso concluído!
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela: Detalhe do Curso (lista de lições) ──────────────────────────────────

function CursoDetailView({
  cursoId,
  progresso,
  onSelectLicao,
  onBack,
}: {
  cursoId: CursoId;
  progresso: EstudoProgresso;
  onSelectLicao: (idx: number) => void;
  onBack: () => void;
}) {
  const curso = CURSOS.find(c => c.id === cursoId)!;
  const licoes: Licao[] = cursoId === 'daniel' ? DANIEL : APOCALIPSE;
  const prog = progresso[cursoId];

  return (
    <div className="fade" style={{ minHeight: '100vh', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button onClick={onBack} style={{ padding: 6, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8 }}>
          {Ico.back()}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {curso.titulo}
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555' }}>
            {prog.concluidas.length}/{curso.totalLicoes} concluídas
          </div>
        </div>
        <div style={{ fontSize: 24 }}>{curso.icone}</div>
      </div>

      {/* Progresso */}
      {prog.concluidas.length > 0 && (
        <div style={{ padding: '12px 16px 4px' }}>
          <ProgressBar value={prog.concluidas.length} total={curso.totalLicoes} cor={curso.cor} />
        </div>
      )}

      {/* Lista de lições */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {licoes.map((licao, idx) => {
          const concluida = prog.concluidas.includes(idx);
          const proxima = !concluida && (idx === 0 || prog.concluidas.includes(idx - 1));
          const bloqueada = !concluida && !proxima && idx > (prog.concluidas.length);

          return (
            <button
              key={idx}
              onClick={() => !bloqueada && onSelectLicao(idx)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 14,
                background: concluida
                  ? `${curso.cor}22`
                  : proxima
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                border: concluida
                  ? `1px solid ${curso.cor}44`
                  : proxima
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: '14px 14px',
                cursor: bloqueada ? 'default' : 'pointer',
                textAlign: 'left',
                opacity: bloqueada ? 0.4 : 1,
              }}
            >
              {/* Número / ícone */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: concluida ? curso.cor : proxima ? 'rgba(240,120,48,0.15)' : 'rgba(255,255,255,0.05)',
                border: proxima ? '1px solid rgba(240,120,48,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14,
                color: concluida ? '#fff' : proxima ? '#F07830' : '#444',
              }}>
                {concluida ? '✓' : idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Barlow, sans-serif', fontSize: 14, fontWeight: 600,
                  color: concluida ? '#aaa' : proxima ? '#fff' : '#555',
                  lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {licao.titulo}
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#444', marginTop: 2 }}>
                  {licao.referencia}
                </div>
              </div>

              {proxima && (
                <div style={{
                  fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700,
                  color: '#F07830', background: 'rgba(240,120,48,0.1)',
                  border: '1px solid rgba(240,120,48,0.2)',
                  borderRadius: 99, padding: '3px 8px', flexShrink: 0,
                }}>
                  Próxima
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela: Player da Lição ─────────────────────────────────────────────────────

const PLAYER_STEPS: { id: PlayerView; label: string }[] = [
  { id: 'versiculo', label: 'Versículo' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'pontos', label: 'Pontos-chave' },
  { id: 'reflexao', label: 'Reflexão' },
];

function LicaoPlayerView({
  cursoId,
  licaoIdx,
  licao,
  totalLicoes,
  progresso,
  onConcluir,
  onBack,
}: {
  cursoId: CursoId;
  licaoIdx: number;
  licao: Licao;
  totalLicoes: number;
  progresso: EstudoProgresso;
  onConcluir: () => void;
  onBack: () => void;
}) {
  const curso = CURSOS.find(c => c.id === cursoId)!;
  const [step, setStep] = useState<PlayerView>('versiculo');
  const [ponto, setPonto] = useState(0);
  const jaConcluida = progresso[cursoId].concluidas.includes(licaoIdx);

  const stepIdx = PLAYER_STEPS.findIndex(s => s.id === step);
  const isLast = step === 'reflexao';

  function avancar() {
    if (step === 'versiculo') setStep('resumo');
    else if (step === 'resumo') { setStep('pontos'); setPonto(0); }
    else if (step === 'pontos') {
      if (ponto < licao.pontos.length - 1) setPonto(p => p + 1);
      else setStep('reflexao');
    } else if (step === 'reflexao') {
      setStep('concluida' as PlayerView);
      if (!jaConcluida) onConcluir();
    }
  }

  if (step === ('concluida' as PlayerView)) {
    return (
      <div className="fade" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
        textAlign: 'center', gap: 0,
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Lição concluída!
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, color: '#F07830', marginBottom: 4 }}>
          {licao.titulo}
        </div>
        <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#555', marginBottom: 32, lineHeight: 1.6 }}>
          Continue estudando para aprofundar<br />seu conhecimento bíblico.
        </div>
        <button
          onClick={onBack}
          style={{
            background: `linear-gradient(135deg, ${curso.cor}, ${curso.corSecundaria})`,
            color: '#fff', border: 'none', borderRadius: 99,
            fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700,
            padding: '12px 32px', cursor: 'pointer',
          }}
        >
          Ver todas as lições
        </button>
      </div>
    );
  }

  return (
    <div className="fade" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <button onClick={onBack} style={{ padding: 6, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', marginRight: 8 }}>
          {Ico.back()}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {licao.titulo}
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 10, color: '#555' }}>
            Lição {licaoIdx + 1} de {totalLicoes}
          </div>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 11, color: '#555' }}>
          {licao.referencia}
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 6 }}>
        {PLAYER_STEPS.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIdx ? curso.cor : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>

      {/* Step label */}
      <div style={{ padding: '10px 16px 0', fontFamily: 'Barlow Condensed', fontSize: 12, fontWeight: 700, color: curso.cor, letterSpacing: 1, textTransform: 'uppercase' }}>
        {PLAYER_STEPS[stepIdx]?.label}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 16px 0' }}>

        {/* Versículo */}
        {step === 'versiculo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: `${curso.cor}22`,
              border: `1px solid ${curso.cor}44`,
              borderRadius: 16, padding: '20px 20px',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 16, left: 18, fontFamily: 'Georgia, serif', fontSize: 48, color: `${curso.cor}33`, lineHeight: 1 }}>"</div>
              <div style={{
                fontFamily: 'Georgia, serif', fontSize: 16, color: '#e7e9ea',
                lineHeight: 1.7, fontStyle: 'italic', padding: '16px 8px 0',
              }}>
                {licao.versiculo}
              </div>
              <div style={{ marginTop: 12, textAlign: 'right', fontFamily: 'Barlow Condensed', fontSize: 13, color: curso.cor, fontWeight: 700 }}>
                {licao.referencia}
              </div>
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#555', textAlign: 'center', marginTop: 8 }}>
              Leia o versículo com atenção e respire.
            </div>
          </div>
        )}

        {/* Resumo */}
        {step === 'resumo' && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '20px',
          }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              {licao.titulo}
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 15, color: '#ccc', lineHeight: 1.75 }}>
              {licao.resumo}
            </div>
          </div>
        )}

        {/* Pontos-chave */}
        {step === 'pontos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 13, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {ponto + 1} de {licao.pontos.length}
            </div>
            {licao.pontos.map((pt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 12, padding: '14px 16px',
                  background: i === ponto
                    ? `${curso.cor}22`
                    : i < ponto
                      ? 'rgba(255,255,255,0.02)'
                      : 'transparent',
                  border: i === ponto
                    ? `1px solid ${curso.cor}44`
                    : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 12,
                  opacity: i > ponto ? 0.25 : 1,
                  transition: 'all 0.3s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: i < ponto ? curso.cor : i === ponto ? `${curso.cor}44` : 'rgba(255,255,255,0.06)',
                  border: i === ponto ? `1px solid ${curso.cor}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Barlow Condensed', fontSize: 11, fontWeight: 700,
                  color: i < ponto ? '#fff' : curso.cor,
                  marginTop: 1,
                }}>
                  {i < ponto ? '✓' : i + 1}
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: 14, color: i === ponto ? '#e7e9ea' : '#777', lineHeight: 1.6 }}>
                  {pt}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reflexão */}
        {step === 'reflexao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🤔</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#F07830', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                Questão para reflexão
              </div>
              <div style={{ fontFamily: 'Barlow', fontSize: 16, color: '#e7e9ea', lineHeight: 1.75 }}>
                {licao.reflexao}
              </div>
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#444', textAlign: 'center', lineHeight: 1.6 }}>
              Reserve um momento para pensar sobre isso antes de prosseguir.
            </div>
          </div>
        )}
      </div>

      {/* Botão de avançar */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 500, padding: '12px 16px 20px', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={avancar}
          style={{
            width: '100%', background: isLast
              ? 'linear-gradient(135deg, #F07830, #BA7517)'
              : `linear-gradient(135deg, ${curso.cor}, ${curso.corSecundaria})`,
            color: '#fff', border: 'none', borderRadius: 14,
            fontFamily: 'Barlow Condensed', fontSize: 17, fontWeight: 700,
            padding: '14px 0', cursor: 'pointer',
            letterSpacing: 0.5,
          }}
        >
          {step === 'pontos' && ponto < licao.pontos.length - 1
            ? 'Próximo ponto →'
            : isLast
              ? jaConcluida ? 'Ver lições ✓' : 'Concluir lição ✓'
              : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

type MainView = 'list' | 'curso' | 'licao';

export function EstudoFacilScreen({ goTo }: { goTo: (sc: Screen) => void }) {
  const [view, setView] = useState<MainView>('list');
  const [cursoId, setCursoId] = useState<CursoId>('daniel');
  const [licaoIdx, setLicaoIdx] = useState(0);
  const [progresso, setProgresso] = useState<EstudoProgresso>(loadProgress);

  useEffect(() => {
    saveProgress(progresso);
  }, [progresso]);

  function concluirLicao() {
    setProgresso(prev => {
      const prog = prev[cursoId];
      if (prog.concluidas.includes(licaoIdx)) return prev;
      const novasConcluidas = [...prog.concluidas, licaoIdx];
      const proximaIdx = licaoIdx + 1;
      return {
        ...prev,
        [cursoId]: {
          concluidas: novasConcluidas,
          ultimaLicao: Math.max(prog.ultimaLicao, proximaIdx),
        },
      };
    });
  }

  const licoes: Licao[] = cursoId === 'daniel' ? DANIEL : APOCALIPSE;

  if (view === 'licao') {
    return (
      <LicaoPlayerView
        cursoId={cursoId}
        licaoIdx={licaoIdx}
        licao={licoes[licaoIdx]}
        totalLicoes={licoes.length}
        progresso={progresso}
        onConcluir={concluirLicao}
        onBack={() => setView('curso')}
      />
    );
  }

  if (view === 'curso') {
    return (
      <CursoDetailView
        cursoId={cursoId}
        progresso={progresso}
        onSelectLicao={(idx) => { setLicaoIdx(idx); setView('licao'); }}
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <CursoListView
      progresso={progresso}
      goTo={goTo}
      onSelectCurso={(id) => { setCursoId(id); setView('curso'); }}
    />
  );
}
