import { useState } from 'react';
import { doc, setDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import { getWeekKey } from '../constants';
import type { Screen, Sorteio } from '../types';

interface Props {
  goTo: (sc: Screen) => void;
  currentUserName: string;
  membrosLista: string[];
  sorteioSemana: Sorteio | null;
  isAdmin: boolean;
}

export function OracaoScreen({
  goTo,
  currentUserName,
  membrosLista,
  sorteioSemana,
  isAdmin,
}: Props) {
  const [sorteando, setSorteando] = useState(false);
  const sorteadoAtual = sorteioSemana?.sorteado || null;
  const jaOrou = sorteioSemana?.historico || [];
  const disponiveis = membrosLista.filter(
    (m) => m !== currentUserName && !jaOrou.includes(m)
  );

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

  return (
    <div className="fade">
      <div
        style={{
          ...s.pageHeader,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.backBtn} onClick={() => goTo('home')}>
            {Ico.back()}
          </button>
          <div style={s.pageTitle}>ORAÇÃO DA SEMANA</div>
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
            </svg>
            RESETAR
          </button>
        )}
      </div>

      <div style={s.page}>
        <div style={{ ...s.card, padding: 24, marginBottom: 16 }}>
          <div
            style={{
              fontFamily: 'Barlow Condensed',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#F07830',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            ESTA SEMANA VOCÊ ORA POR
          </div>
          <div
            style={{
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
            }}
          >
            {sorteadoAtual ? (
              <>
                <div
                  style={{
                    fontFamily: 'Barlow Condensed',
                    fontSize: 42,
                    fontWeight: 900,
                    color: '#F07830',
                    letterSpacing: 1,
                  }}
                >
                  {sorteadoAtual.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: 'Barlow',
                    fontSize: 13,
                    color: '#71767b',
                    marginTop: 8,
                  }}
                >
                  Interceda por {sorteadoAtual} esta semana 🙏
                </div>
              </>
            ) : (
              <div
                style={{
                  fontFamily: 'Barlow',
                  fontSize: 15,
                  color: '#71767b',
                }}
              >
                {sorteando ? 'Sorteando...' : 'Nenhum sorteio ainda'}
              </div>
            )}
          </div>

          {!sorteadoAtual && disponiveis.length > 0 && (
            <button
              onClick={sortear}
              disabled={sorteando}
              style={{
                ...s.btnOrange,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
            <div
              style={{
                background: 'rgba(240,120,48,0.1)',
                borderRadius: 12,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Barlow',
                  fontSize: 13,
                  color: '#e7e9ea',
                  lineHeight: 1.5,
                }}
              >
                Ore por <strong style={{ color: '#F07830' }}>{sorteadoAtual}</strong>{' '}
                durante toda a semana!
              </div>
            </div>
          )}
        </div>

        <div style={{ ...s.card, padding: 20 }}>
          <div style={s.cardTag}>MEMBROS DO PG</div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 16,
            }}
          >
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
                    background: m === sorteadoAtual ? '#F07830' : '#16181c',
                    border: `1px solid ${
                      m === sorteadoAtual ? '#F07830' : '#2f3336'
                    }`,
                    color: m === sorteadoAtual ? '#fff' : '#71767b',
                    opacity: jaOrou.includes(m) && m !== sorteadoAtual ? 0.4 : 1,
                    textDecoration:
                      jaOrou.includes(m) && m !== sorteadoAtual
                        ? 'line-through'
                        : 'none',
                  }}
                >
                  {m}
                </div>
              ))}
          </div>
          {jaOrou.length > 0 && (
            <div
              style={{
                fontFamily: 'Barlow',
                fontSize: 12,
                color: '#71767b',
                marginTop: 16,
                fontStyle: 'italic',
              }}
            >
              Riscados = já foram sorteados anteriormente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
