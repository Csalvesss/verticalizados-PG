import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import type { CurrentUser, Screen } from '../types';

interface Pedido {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  texto: string;
  tipo: 'gratidao' | 'pedido' | 'testemunho';
  createdAt: Timestamp | null;
}

const TIPOS = {
  gratidao: { label: 'Gratidão', emoji: '🙏', color: '#4CAF50' },
  pedido: { label: 'Pedido', emoji: '💛', color: '#F07830' },
  testemunho: { label: 'Testemunho', emoji: '✨', color: '#9C27B0' },
} as const;

export function ComunhaoScreen({
  currentUser,
  isAdmin,
  uid,
  goTo,
}: {
  currentUser: CurrentUser;
  isAdmin: boolean;
  uid: string;
  goTo: (sc: Screen) => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<Pedido['tipo']>('pedido');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const uns = onSnapshot(
      query(collection(db, 'comunhao'), orderBy('createdAt', 'desc')),
      snap => {
        setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Pedido)));
      },
    );
    return () => uns();
  }, []);

  async function enviar() {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, 'comunhao'), {
        userId: uid,
        userName: currentUser.fullName,
        userPhoto: currentUser.photo,
        texto: texto.trim(),
        tipo,
        createdAt: Timestamp.now(),
      });
      setTexto('');
      setShowForm(false);
    } catch {
      // silently fail
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: string) {
    await deleteDoc(doc(db, 'comunhao', id));
  }

  return (
    <div className="fade">
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={s.pageTitle}>COMUNHÃO</div>
      </div>

      <div style={s.page}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(240,120,48,0.15), rgba(240,120,48,0.05))',
          border: '1px solid rgba(240,120,48,0.2)',
          borderRadius: 16, padding: '20px 16px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, color: '#F07830', letterSpacing: 1, marginBottom: 4 }}>
            MURAL DE COMUNHÃO
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#888', lineHeight: 1.5 }}>
            Compartilhe pedidos de oração, gratidões e testemunhos com o grupo.
          </div>
        </div>

        {/* Botão novo */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: showForm ? '#1a1a1a' : '#F07830',
            border: showForm ? '1px solid #333' : 'none',
            color: showForm ? '#888' : '#fff',
            fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14,
            letterSpacing: 1, cursor: 'pointer', marginBottom: 16,
          }}
        >
          {showForm ? 'CANCELAR' : '+ COMPARTILHAR'}
        </button>

        {/* Formulário */}
        {showForm && (
          <div style={{
            background: '#111', border: '1px solid #2f3336',
            borderRadius: 16, padding: 16, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(Object.keys(TIPOS) as Pedido['tipo'][]).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8,
                    background: tipo === t ? TIPOS[t].color + '22' : 'transparent',
                    border: `1px solid ${tipo === t ? TIPOS[t].color : '#333'}`,
                    color: tipo === t ? TIPOS[t].color : '#666',
                    fontFamily: 'Barlow Condensed', fontWeight: 700,
                    fontSize: 11, letterSpacing: 1, cursor: 'pointer',
                  }}
                >
                  {TIPOS[t].emoji} {TIPOS[t].label.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escreva aqui..."
              rows={3}
              style={{
                width: '100%', background: '#1a1a1a', border: '1px solid #2f3336',
                borderRadius: 10, padding: '10px 14px', fontFamily: 'Barlow',
                fontSize: 14, color: '#fff', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', marginBottom: 12,
              }}
            />
            <button
              onClick={enviar}
              disabled={enviando || !texto.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: 50,
                background: texto.trim() ? '#F07830' : '#2a1a0a',
                border: 'none',
                color: texto.trim() ? '#fff' : '#7a5a3a',
                fontFamily: 'Barlow Condensed', fontWeight: 700,
                fontSize: 13, letterSpacing: 1, cursor: enviando ? 'default' : 'pointer',
              }}
            >
              {enviando ? 'ENVIANDO...' : 'ENVIAR'}
            </button>
          </div>
        )}

        {/* Lista */}
        {pedidos.length === 0 && (
          <div style={s.empty}>Nenhum compartilhamento ainda. Seja o primeiro!</div>
        )}

        {pedidos.map(p => {
          const tipoInfo = TIPOS[p.tipo] || TIPOS.pedido;
          const canDelete = p.userId === uid || isAdmin;

          return (
            <div key={p.id} style={{
              background: '#111', border: '1px solid #1a1a1a',
              borderRadius: 16, padding: 16, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img
                  src={p.userPhoto}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #222' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                    {p.userName}
                  </div>
                  <div style={{
                    fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700,
                    letterSpacing: 1.5, color: tipoInfo.color,
                  }}>
                    {tipoInfo.emoji} {tipoInfo.label.toUpperCase()}
                  </div>
                </div>
                {canDelete && (
                  <button
                    onClick={() => remover(p.id)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#333', cursor: 'pointer', fontSize: 16, padding: 4,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{
                fontFamily: 'Barlow', fontSize: 14, color: '#ccc',
                lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {p.texto}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
