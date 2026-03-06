import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
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

export function EventosScreen({ eventos, confirmacoes, currentUser, uid, goTo }: Props) {
  const [lancheSelecionado, setLancheSelecionado] = useState<string | null>(null);

  const proximoEvento = eventos[0] || null;
  const euConfirmei = confirmacoes.find(c => c.userId === uid && c.eventoId === proximoEvento?.id);
  const confirmacoesEvento = confirmacoes.filter(c => c.eventoId === proximoEvento?.id);

  const confirmarPresenca = async () => {
    if (!proximoEvento) return;
    await addDoc(collection(db, 'confirmacoes'), {
      userId: uid,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      eventoId: proximoEvento.id,
      lanche: lancheSelecionado,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
    setLancheSelecionado(null);
  };

  return (
    <div className="fade" style={s.page}>
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={s.pageTitle}>EVENTOS</div>
      </div>

      {!proximoEvento && <div style={s.empty}>Nenhum evento cadastrado ainda.</div>}

      {proximoEvento && (
        <>
          {/* Card do evento */}
          <div style={{ background: '#F07830', borderRadius: 20, padding: 22, marginBottom: 14 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>PRÓXIMO ENCONTRO</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: '#1A1A1A', letterSpacing: 1, lineHeight: 1.1, marginBottom: 10 }}>{proximoEvento.tema}</div>
            {[['📅', proximoEvento.data], ['🕖', proximoEvento.hora], ['📍', proximoEvento.local]].map(([icon, val]) => val ? (
              <div key={val} style={{ fontFamily: 'Barlow', fontSize: 13, color: 'rgba(0,0,0,0.65)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span>{icon}</span><span>{val}</span>
              </div>
            ) : null)}
          </div>

          {/* Confirmar presença */}
          {!euConfirmei ? (
            <div style={{ ...s.card, padding: 20, marginBottom: 14 }}>
              <div style={s.cardTag}>CONFIRMAR PRESENÇA</div>
              <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#666', margin: '8px 0 16px', lineHeight: 1.5 }}>
                Você vai comparecer? Selecione o que pode levar. <span style={{ color: '#bbb' }}>(opcional)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {LANCHES.map(l => (
                  <button key={l} onClick={() => setLancheSelecionado(lancheSelecionado === l ? null : l)} style={{ fontFamily: 'Barlow', fontSize: 13, padding: '7px 14px', borderRadius: 50, cursor: 'pointer', border: `1.5px solid ${lancheSelecionado === l ? '#F07830' : '#e0e0e0'}`, background: lancheSelecionado === l ? 'rgba(240,120,48,0.1)' : '#fff', color: lancheSelecionado === l ? '#F07830' : '#555', fontWeight: lancheSelecionado === l ? 700 : 400, transition: 'all 0.15s' }}>
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={confirmarPresenca} style={{ ...s.btnOrange, width: '100%', justifyContent: 'center', gap: 8 }}>
                {Ico.check()} Confirmar Presença
              </button>
            </div>
          ) : (
            <div style={{ ...s.card, padding: 18, marginBottom: 14, border: '2px solid #1DB954' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: '#1DB954', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {Ico.check()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 15, color: '#1DB954' }}>PRESENÇA CONFIRMADA!</div>
                  <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#888', marginTop: 2 }}>
                    {euConfirmei.lanche ? `Você vai levar ${euConfirmei.lanche}` : 'Sem lanche selecionado'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de confirmados */}
          <div style={{ ...s.card, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={s.cardTag}>CONFIRMADOS</div>
              <div style={{ background: '#F07830', borderRadius: 50, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 14, color: '#fff' }}>
                {confirmacoesEvento.length}
              </div>
            </div>
            {confirmacoesEvento.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < confirmacoesEvento.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <img src={c.userPhoto} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#1A1A1A' }}>
                    {c.userName}{c.lanche ? ` · ${c.lanche}` : ''}
                  </div>
                  <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#bbb' }}>Confirmado às {c.hora}</div>
                </div>
              </div>
            ))}
            {confirmacoesEvento.length === 0 && (
              <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#bbb' }}>Ninguém confirmou ainda.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}