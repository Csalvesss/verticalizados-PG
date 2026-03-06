import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import type { Song, Cifra, Evento } from '../types';

interface Props {
  goHome: () => void;
  songs: Song[];
  cifras: Cifra[];
  eventos: Evento[];
  membros: string[];
}

type Tab = 'songs' | 'cifras' | 'eventos' | 'membros';

export function AdminPanel({ goHome, songs, cifras, eventos, membros }: Props) {
  const [tab, setTab] = useState<Tab>('songs');
  const [form, setForm] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const set = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  const salvar = async () => {
    if (!form) return;
    if (tab === 'songs') {
      if (!form.title) return;
      const data = { title: form.title, letra: form.letra || '', spotify: form.spotify || '', youtube: form.youtube || '', ordem: editId ? form.ordem : songs.length, sections: form.sections || [] };
      if (editId) await updateDoc(doc(db, 'songs', editId), data);
      else await addDoc(collection(db, 'songs'), data);
    }
    if (tab === 'cifras') {
      if (!form.title) return;
      const data = { title: form.title, tom: form.tom || '', cifra: form.cifra || '', ordem: editId ? form.ordem : cifras.length };
      if (editId) await updateDoc(doc(db, 'cifras', editId), data);
      else await addDoc(collection(db, 'cifras'), data);
    }
    if (tab === 'eventos') {
      if (!form.tema) return;
      const data = { tema: form.tema, data: form.data || '', hora: form.hora || '', local: form.local || '' };
      if (editId) await updateDoc(doc(db, 'eventos', editId), data);
      else await addDoc(collection(db, 'eventos'), data);
    }
    if (tab === 'membros') {
      if (!form.nome) return;
      await addDoc(collection(db, 'membros'), { nome: form.nome });
    }
    setForm(null);
    setEditId(null);
  };

  const deletar = async (colecao: string, id: string) => {
    if (!window.confirm('Tem certeza que quer apagar?')) return;
    await deleteDoc(doc(db, colecao, id));
  };

  const deletarMembro = async (nome: string) => {
    if (!window.confirm(`Remover ${nome}?`)) return;
    const snap = await getDocs(query(collection(db, 'membros')));
    const found = snap.docs.find(d => d.data().nome === nome);
    if (found) await deleteDoc(doc(db, 'membros', found.id));
  };

  const inp = (field: string, placeholder: string, multiline = false) =>
    multiline
      ? <textarea value={form?.[field] || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={{ ...s.textarea, marginBottom: 8, color: '#1A1A1A', textAlign: 'left' }} rows={5} />
      : <input value={form?.[field] || ''} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '10px 12px', fontFamily: 'Barlow', fontSize: 13, width: '100%', marginBottom: 8, color: '#1A1A1A', outline: 'none', background: '#fff' }} />;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'songs', label: 'MÚSICAS' },
    { id: 'cifras', label: 'CIFRAS' },
    { id: 'eventos', label: 'EVENTOS' },
    { id: 'membros', label: 'MEMBROS' },
  ];

  return (
    <div className="fade" style={s.page}>
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={goHome}>{Ico.back()}</button>
        <div style={s.pageTitle}>PAINEL ADMIN</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setForm(null); setEditId(null); }} style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, letterSpacing: 1, padding: '8px 16px', borderRadius: 50, border: 'none', cursor: 'pointer', background: tab === t.id ? '#F07830' : '#f0ebe3', color: tab === t.id ? '#fff' : '#888', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Formulário */}
      {form !== null && (
        <div style={{ ...s.card, padding: 16, marginBottom: 14 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#1A1A1A', letterSpacing: 1, marginBottom: 12 }}>
            {editId ? 'EDITAR' : 'NOVO'} {tab === 'songs' ? 'MÚSICA' : tab === 'cifras' ? 'CIFRA' : tab === 'eventos' ? 'EVENTO' : 'MEMBRO'}
          </div>
          {tab === 'songs' && <>{inp('title', 'Título da música')}{inp('letra', 'Letra completa...', true)}{inp('spotify', 'Link Spotify')}{inp('youtube', 'Link YouTube')}</>}
          {tab === 'cifras' && <>{inp('title', 'Título')}{inp('tom', 'Tom (ex: D, G, A)')}{inp('cifra', 'Cifra completa...', true)}</>}
          {tab === 'eventos' && <>{inp('tema', 'Tema do evento')}{inp('data', 'Data (ex: Sexta-feira, 14 de março)')}{inp('hora', 'Hora (ex: 19h30)')}{inp('local', 'Local')}</>}
          {tab === 'membros' && <>{inp('nome', 'Nome do membro')}</>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={salvar} style={s.btnOrange}>{Ico.check()} Salvar</button>
            <button onClick={() => { setForm(null); setEditId(null); }} style={{ ...s.btnOrange, background: '#e0e0e0', color: '#666' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ ...s.card, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={s.cardTag}>
            {tab === 'songs' ? `${songs.length} MÚSICAS` : tab === 'cifras' ? `${cifras.length} CIFRAS` : tab === 'eventos' ? `${eventos.length} EVENTOS` : `${membros.length} MEMBROS`}
          </div>
          <button onClick={() => { setForm({}); setEditId(null); }} style={{ ...s.btnOrange, padding: '6px 14px', fontSize: 11, gap: 4 }}>
            {Ico.plus()} Novo
          </button>
        </div>

        {tab === 'songs' && songs.map(item => (
          <div key={item.id} style={s.adminRow}>
            <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#1A1A1A', flex: 1 }}>{item.title}</div>
            <button onClick={() => { setForm({ ...item }); setEditId(item.id); }} style={s.adminActionBtn}>{Ico.edit()}</button>
            <button onClick={() => deletar('songs', item.id)} style={{ ...s.adminActionBtn, color: '#e53935' }}>{Ico.trash()}</button>
          </div>
        ))}

        {tab === 'cifras' && cifras.map(item => (
          <div key={item.id} style={s.adminRow}>
            <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#1A1A1A', flex: 1 }}>
              {item.title} <span style={{ color: '#aaa', fontWeight: 400 }}>· Tom {item.tom}</span>
            </div>
            <button onClick={() => { setForm({ ...item }); setEditId(item.id); }} style={s.adminActionBtn}>{Ico.edit()}</button>
            <button onClick={() => deletar('cifras', item.id)} style={{ ...s.adminActionBtn, color: '#e53935' }}>{Ico.trash()}</button>
          </div>
        ))}

        {tab === 'eventos' && eventos.map(item => (
          <div key={item.id} style={s.adminRow}>
            <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#1A1A1A', flex: 1 }}>
              {item.tema} <span style={{ color: '#aaa', fontWeight: 400, fontSize: 11 }}>· {item.data}</span>
            </div>
            <button onClick={() => { setForm({ ...item }); setEditId(item.id); }} style={s.adminActionBtn}>{Ico.edit()}</button>
            <button onClick={() => deletar('eventos', item.id)} style={{ ...s.adminActionBtn, color: '#e53935' }}>{Ico.trash()}</button>
          </div>
        ))}

        {tab === 'membros' && membros.map((nome, i) => (
          <div key={i} style={s.adminRow}>
            <div style={{ fontFamily: 'Barlow', fontSize: 14, color: '#1A1A1A', flex: 1 }}>{nome}</div>
            <button onClick={() => deletarMembro(nome)} style={{ ...s.adminActionBtn, color: '#e53935' }}>{Ico.trash()}</button>
          </div>
        ))}

        {tab === 'songs' && songs.length === 0 && <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#bbb' }}>Nenhuma música ainda.</div>}
        {tab === 'cifras' && cifras.length === 0 && <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#bbb' }}>Nenhuma cifra ainda.</div>}
        {tab === 'eventos' && eventos.length === 0 && <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#bbb' }}>Nenhum evento ainda.</div>}
        {tab === 'membros' && membros.length === 0 && <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#bbb' }}>Nenhum membro ainda.</div>}
      </div>
    </div>
  );
}