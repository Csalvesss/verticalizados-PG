import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  setDoc,
  getDoc,
  arrayRemove,
  where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import { ADMIN_EMAIL } from '../constants';
import { Avatar } from './Avatar';
import { useChurch } from '../contexts/ChurchContext';
import type { Song, Cifra, Evento, UserProfile, ChurchJoinRequest } from '../types';

type Tab = 'songs' | 'cifras' | 'eventos' | 'membros' | 'usuarios' | 'solicitacoes' | 'diretores';

interface Props {
  goHome: () => void;
  songs: Song[];
  cifras: Cifra[];
  eventos: Evento[];
  membros: string[];
  adminEmails: string[];
  currentUserUid: string;
  currentUserEmail: string;
  solicitacoesPendentes: ChurchJoinRequest[];
}

// ── ChurchDirectorRow (used in DIRETORES tab) ─────────────────────────────────
function ChurchDirectorRow({
  church,
  usuarios,
  usuariosLoaded,
  loadUsuarios,
  onAssign,
  onRemove,
}: {
  church: { id: string; name: string; district: string; directorUid: string | null };
  usuarios: UserProfile[];
  usuariosLoaded: boolean;
  loadUsuarios: () => void;
  onAssign: (uid: string, name: string) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const currentDirector = church.directorUid
    ? usuarios.find(u => u.uid === church.directorUid)
    : null;

  const filteredUsers = usuarios.filter(u =>
    !searchUser ||
    (u.fullName || u.name || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer' }}
        onClick={() => {
          setExpanded(e => !e);
          if (!usuariosLoaded) loadUsuarios();
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {church.name}
          </div>
          <div style={{ fontFamily: 'Barlow', fontSize: 10, color: '#555' }}>{church.district}</div>
        </div>
        {church.directorUid ? (
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#F07830', background: 'rgba(240,120,48,0.12)', borderRadius: 99, padding: '2px 7px' }}>
            DIRETOR
          </span>
        ) : (
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#555', background: '#111', borderRadius: 99, padding: '2px 7px' }}>
            SEM DIRETOR
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px' }}>
          {church.directorUid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: 'rgba(240,120,48,0.06)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#F07830', fontWeight: 700 }}>Diretor atual</div>
                {currentDirector ? (
                  <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#e7e9ea' }}>{currentDirector.fullName || currentDirector.name} · {currentDirector.email}</div>
                ) : (
                  <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555' }}>UID: {church.directorUid}</div>
                )}
              </div>
              <button onClick={onRemove} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(244,33,46,0.3)', background: 'transparent', color: '#f4212e', fontFamily: 'Barlow Condensed', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
                Remover
              </button>
            </div>
          )}

          <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#71767b', marginBottom: 8 }}>Selecionar novo diretor:</div>
          <input
            type="text"
            placeholder="Buscar usuário por nome ou email..."
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            style={{ background: '#000', border: '1px solid #2f3336', borderRadius: 8, padding: '8px 10px', fontFamily: 'Barlow', fontSize: 12, width: '100%', color: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          />
          {!usuariosLoaded ? (
            <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#555' }}>Carregando usuários...</div>
          ) : (
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredUsers.slice(0, 20).map(u => (
                <button
                  key={u.uid}
                  onClick={() => onAssign(u.uid, u.fullName || u.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 7, cursor: 'pointer', textAlign: 'left' }}
                >
                  <Avatar src={u.photo} name={u.name || '?'} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 12, color: '#e7e9ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.fullName || u.name}
                    </div>
                    <div style={{ fontFamily: 'Barlow', fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPanel({ goHome, songs, cifras, eventos, membros, adminEmails, currentUserUid, currentUserEmail, solicitacoesPendentes }: Props) {
  const { selectedChurch } = useChurch();
  const cRef = (col: string) => collection(db, 'churches', selectedChurch!.id, col);
  const cDoc = (col: string, id: string) => doc(db, 'churches', selectedChurch!.id, col, id);

  // Verifica se o usuário pode editar esta igreja específica
  const isSuperAdmin = currentUserEmail === ADMIN_EMAIL;
  const isChurchDirector = selectedChurch?.directorUid === currentUserUid;
  const canEditThisChurch = isSuperAdmin || isChurchDirector;

  const [tab, setTab] = useState<Tab>('songs');
  const [form, setForm] = useState<Partial<Song & Cifra & Evento & { nome: string }> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [usuariosLoaded, setUsuariosLoaded] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const solicitacoes = solicitacoesPendentes;
  const [churchSearch, setChurchSearch] = useState('');
  const [allChurches, setAllChurches] = useState<{ id: string; name: string; district: string; directorUid: string | null; directorName?: string }[]>([]);
  const [churchesLoaded, setChurchesLoaded] = useState(false);

  const loadAllChurches = async () => {
    if (churchesLoaded) return;
    const snap = await getDocs(collection(db, 'churches'));
    const list = snap.docs.map(d => {
      const data = d.data();
      return { id: d.id, name: data.name || d.id, district: data.district || '', directorUid: data.directorUid || null };
    });
    // Sort alphabetically
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    setAllChurches(list);
    setChurchesLoaded(true);
  };

  const aprovarSolicitacao = async (req: ChurchJoinRequest) => {
    if (!window.confirm(`Aprovar ${req.fromName} para entrar em ${req.toChurchName}?`)) return;
    // Update request status
    await updateDoc(doc(db, 'churchJoinRequests', req.id), { status: 'approved' });
    // Update user's churchId in Firestore
    await setDoc(doc(db, 'users', req.fromUid), { churchId: req.toChurchId }, { merge: true });
    // Register as member in the new church
    const membrosRef = collection(db, 'churches', req.toChurchId, 'membros');
    const existing = await getDocs(query(membrosRef, where('nome', '==', req.fromName)));
    if (existing.empty) await addDoc(membrosRef, { nome: req.fromName });
    alert(`${req.fromName} foi aprovado e adicionado à ${req.toChurchName}.`);
  };

  const rejeitarSolicitacao = async (req: ChurchJoinRequest) => {
    if (!window.confirm(`Rejeitar solicitação de ${req.fromName}?`)) return;
    await updateDoc(doc(db, 'churchJoinRequests', req.id), { status: 'rejected' });
  };

  const atribuirDiretor = async (churchId: string, uid: string, name: string) => {
    if (!window.confirm(`Definir ${name} como diretor de ${churchId}?`)) return;
    await setDoc(doc(db, 'churches', churchId), { directorUid: uid }, { merge: true });
    setAllChurches(prev => prev.map(c => c.id === churchId ? { ...c, directorUid: uid, directorName: name } : c));
    alert(`${name} agora é diretor de ${churchId}.`);
  };

  const removerDiretor = async (churchId: string) => {
    if (!window.confirm(`Remover diretor de ${churchId}?`)) return;
    await setDoc(doc(db, 'churches', churchId), { directorUid: null }, { merge: true });
    setAllChurches(prev => prev.map(c => c.id === churchId ? { ...c, directorUid: null, directorName: undefined } : c));
  };

  const set = (f: string, v: string) =>
    setForm((x) => ({ ...x, [f]: v }));

  const loadUsuarios = async () => {
    if (usuariosLoaded) return;
    const snap = await getDocs(collection(db, 'users'));
    setUsuarios(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
    setUsuariosLoaded(true);
  };

  const salvar = async () => {
    if (!form) return;
    if (!selectedChurch) { alert('Nenhuma igreja selecionada.'); return; }
    try {
      if (tab === 'songs' && form.title) {
        const normalizar = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
        if (!editId) {
          const titleNorm = normalizar(form.title);
          const letraNorm = normalizar(form.letra || '');
          const duplicado = songs.find((s) => {
            if (normalizar(s.title) === titleNorm) return true;
            if (letraNorm && s.letra && normalizar(s.letra) === letraNorm) return true;
            return false;
          });
          if (duplicado) {
            alert(`Já existe uma música com esse título ou letra: "${duplicado.title}"`);
            return;
          }
        }
        const d = {
          title: form.title,
          letra: form.letra || '',
          spotify: form.spotify || '',
          youtube: form.youtube || '',
          ordem: editId ? (form.ordem ?? songs.length) : songs.length,
          sections: form.sections || [],
        };
        if (editId) {
          await updateDoc(cDoc('songs', editId), d);
        } else {
          await addDoc(cRef('songs'), d);
        }
      }
      if (tab === 'cifras' && form.title) {
        const d = {
          title: form.title,
          tom: form.tom || '',
          cifra: form.cifra || '',
          ordem: editId ? (form.ordem ?? cifras.length) : cifras.length,
        };
        if (editId) {
          await updateDoc(cDoc('cifras', editId), d);
        } else {
          await addDoc(cRef('cifras'), d);
        }
      }
      if (tab === 'eventos' && form.tema) {
        const d = {
          tema: form.tema,
          data: form.data || '',
          hora: form.hora || '',
          local: form.local || '',
        };
        if (editId) {
          await updateDoc(cDoc('eventos', editId), d);
        } else {
          await addDoc(cRef('eventos'), d);
        }
      }
      if (tab === 'membros' && form.nome)
        await addDoc(cRef('membros'), { nome: form.nome });
      setForm(null);
      setEditId(null);
    } catch (e: any) {
      alert('Erro ao salvar: ' + (e?.message || 'verifique sua conexão e tente novamente'));
    }
  };

  const deletar = async (col: string, id: string) => {
    if (!window.confirm('Apagar?')) return;
    await deleteDoc(cDoc(col, id));
  };

  const limparDuplicatas = async () => {
    const normalizar = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
    const grupos = new Map<string, Song[]>();
    for (const s of songs) {
      const k = normalizar(s.title);
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(s);
    }
    const paraApagar: string[] = [];
    for (const grupo of grupos.values()) {
      if (grupo.length <= 1) continue;
      // Mantém o mais completo (maior letra + sections)
      const melhor = grupo.reduce((a, b) => {
        const scoreA = (a.letra?.length ?? 0) + (a.sections?.length ?? 0) * 10;
        const scoreB = (b.letra?.length ?? 0) + (b.sections?.length ?? 0) * 10;
        return scoreB > scoreA ? b : a;
      });
      grupo.filter((s) => s.id !== melhor.id).forEach((s) => paraApagar.push(s.id));
    }
    if (paraApagar.length === 0) { alert('Nenhuma duplicata encontrada!'); return; }
    if (!window.confirm(`Apagar ${paraApagar.length} música(s) duplicada(s)?`)) return;
    await Promise.all(paraApagar.map((id) => deleteDoc(cDoc('songs', id))));
    alert(`${paraApagar.length} duplicata(s) removida(s).`);
  };

  const deletarMembro = async (nome: string) => {
    if (!window.confirm(`Remover ${nome}?`)) return;
    const snap = await getDocs(query(cRef('membros')));
    const found = snap.docs.find((d) => d.data().nome === nome);
    if (found) await deleteDoc(found.ref);
  };

  const deletarUsuario = async (user: UserProfile) => {
    if (!window.confirm(`Excluir TODOS os dados de ${user.fullName || user.name}?\n\nIsso remove posts, presenças, dados do perfil e a conta de acesso. Esta ação não pode ser desfeita.`)) return;
    setDeletingUid(user.uid);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Você precisa estar logado');

      const idToken = await currentUser.getIdToken();
      const res = await fetch('/.netlify/functions/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, targetUid: user.uid, churchId: selectedChurch?.id }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error(`Resposta inválida do servidor (${res.status}): ${text.slice(0, 200)}`); }
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir');

      setUsuarios((prev) => prev.filter((u) => u.uid !== user.uid));
      alert(`Dados de ${user.fullName || user.name} removidos com sucesso.`);
    } catch (e: any) {
      alert('Erro ao excluir: ' + (e?.message || 'tente novamente'));
    } finally {
      setDeletingUid(null);
    }
  };

  const grantAdmin = async (user: UserProfile) => {
    if (!window.confirm(`Dar permissão de administrador para ${user.fullName || user.name}?`)) return;
    const ref = doc(db, 'config', 'admins');
    const snap = await getDoc(ref);
    const current: string[] = snap.exists() ? (snap.data().emails || []) : [];
    if (!current.includes(user.email)) {
      await setDoc(ref, { emails: [...current, user.email] }, { merge: true });
    }
    alert(`${user.fullName || user.name} agora é administrador.`);
  };

  const revokeAdmin = async (user: UserProfile) => {
    if (user.email === ADMIN_EMAIL) {
      alert('Não é possível remover o administrador principal.');
      return;
    }
    if (!window.confirm(`Remover permissão de administrador de ${user.fullName || user.name}?`)) return;
    const ref = doc(db, 'config', 'admins');
    await updateDoc(ref, { emails: arrayRemove(user.email) });
    alert(`Permissão de ${user.fullName || user.name} removida.`);
  };

  const inp = (field: keyof (Song & Cifra & Evento & { nome: string }), placeholder: string, multi = false) =>
    multi ? (
      <textarea
        value={(form?.[field] as string) || ''}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        style={{
          ...s.textarea,
          marginBottom: 12,
          background: '#000',
          borderColor: '#2f3336',
          fontSize: 14,
        }}
        rows={6}
      />
    ) : (
      <input
        value={(form?.[field] as string) || ''}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#000',
          border: '1px solid #2f3336',
          borderRadius: 10,
          padding: '12px',
          fontFamily: 'Barlow',
          fontSize: 14,
          width: '100%',
          marginBottom: 12,
          color: '#fff',
          outline: 'none',
        }}
      />
    );

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'songs', label: 'MÚSICAS' },
    { id: 'cifras', label: 'CIFRAS' },
    { id: 'eventos', label: 'EVENTOS' },
    { id: 'membros', label: 'MEMBROS' },
    { id: 'usuarios', label: 'USUÁRIOS' },
    ...(canEditThisChurch ? [{ id: 'solicitacoes' as Tab, label: 'SOLICITAÇÕES', badge: solicitacoes.length }] : []),
    ...(isSuperAdmin ? [{ id: 'diretores' as Tab, label: 'DIRETORES' }] : []),
  ];

  return (
    <div className="fade">
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={goHome}>
          {Ico.back()}
        </button>
        <div style={s.pageTitle}>Painel Admin</div>
      </div>

      {/* Igreja atual sendo editada */}
      {selectedChurch && (
        <div style={{
          padding: '10px 16px',
          background: canEditThisChurch ? 'rgba(240,120,48,0.06)' : 'rgba(244,33,46,0.08)',
          borderBottom: `1px solid ${canEditThisChurch ? 'rgba(240,120,48,0.15)' : 'rgba(244,33,46,0.2)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
            stroke={canEditThisChurch ? '#F07830' : '#f4212e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13,
              color: canEditThisChurch ? '#e7e9ea' : '#f4212e',
            }}>
              {selectedChurch.name}
            </span>
            {!canEditThisChurch && (
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: '#f4212e', marginTop: 1 }}>
                Você não é o diretor desta igreja — acesso somente leitura
              </div>
            )}
          </div>
          {canEditThisChurch && (
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
              letterSpacing: 1, color: '#F07830',
              background: 'rgba(240,120,48,0.12)', borderRadius: 99, padding: '2px 7px',
            }}>
              {isSuperAdmin ? 'SUPER ADMIN' : 'DIRETOR'}
            </span>
          )}
        </div>
      )}

      <div style={s.page}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setForm(null);
                setEditId(null);
                if (t.id === 'usuarios') loadUsuarios();
                if (t.id === 'diretores') loadAllChurches();
              }}
              style={{
                fontFamily: 'Barlow Condensed',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1,
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: tab === t.id ? '#F07830' : '#16181c',
                color: tab === t.id ? '#fff' : '#71767b',
                whiteSpace: 'nowrap',
                transition: '0.2s',
                position: 'relative',
              }}
            >
              {t.label}
              {t.badge && t.badge > 0 ? (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#f4212e', color: '#fff', borderRadius: 999,
                  fontSize: 9, fontWeight: 700, minWidth: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {form !== null && tab !== 'usuarios' && (
          <div style={{ ...s.card, padding: 20, marginBottom: 20 }}>
            <div
              style={{
                fontFamily: 'Barlow Condensed',
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: 0.5,
                marginBottom: 16,
              }}
            >
              {editId ? 'EDITAR' : 'NOVO'}{' '}
              {tab === 'songs'
                ? 'MÚSICA'
                : tab === 'cifras'
                ? 'CIFRA'
                : tab === 'eventos'
                ? 'EVENTO'
                : 'MEMBRO'}
            </div>
            {tab === 'songs' && (
              <>
                {inp('title', 'Título da música')}
                {inp('letra', 'Letra completa...', true)}
                {inp('spotify', 'Link Spotify')}
                {inp('youtube', 'Link YouTube')}
              </>
            )}
            {tab === 'cifras' && (
              <>
                {inp('title', 'Título')}
                {inp('tom', 'Tom (ex: D, G, A)')}
                {inp('cifra', 'Cifra completa...', true)}
              </>
            )}
            {tab === 'eventos' && (
              <>
                {inp('tema', 'Tema do evento')}
                {inp('data', 'Data (ex: Sexta-feira, 14 de março)')}
                {inp('hora', 'Hora (ex: 19h30)')}
                {inp('local', 'Local')}
              </>
            )}
            {tab === 'membros' && <>{inp('nome', 'Nome do membro')}</>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={salvar} disabled={!canEditThisChurch} style={{
                ...s.btnOrange,
                opacity: canEditThisChurch ? 1 : 0.4,
                cursor: canEditThisChurch ? 'pointer' : 'not-allowed',
              }}>
                {Ico.check()} Salvar
              </button>
              <button
                onClick={() => {
                  setForm(null);
                  setEditId(null);
                }}
                style={{
                  ...s.btnOrange,
                  background: 'transparent',
                  border: '1px solid #2f3336',
                  color: '#71767b',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* USUÁRIOS tab */}
        {tab === 'usuarios' && (
          <div style={{ ...s.card, padding: 20 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
            }}>
              <div style={s.cardTag}>{usuarios.length} USUÁRIOS</div>
              <button
                onClick={() => { setUsuariosLoaded(false); loadUsuarios(); }}
                style={{ ...s.btnOrange, padding: '6px 14px', fontSize: 12, gap: 6 }}
              >
                Atualizar
              </button>
            </div>

            {!usuariosLoaded && (
              <div style={{ textAlign: 'center', padding: 20, color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                Carregando usuários...
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {usuarios.map((user) => {
                const isUserAdmin = adminEmails.includes(user.email);
                const isSuperAdmin = user.email === ADMIN_EMAIL;
                return (
                  <div key={user.uid} style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: 12,
                    padding: '12px 14px',
                    opacity: deletingUid === user.uid ? 0.5 : 1,
                  }}>
                    {/* User info row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Avatar src={user.photo} name={user.name || user.fullName || '?'} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                            {user.fullName || user.name}
                          </div>
                          {isUserAdmin && (
                            <div style={{
                              background: 'rgba(240,120,48,0.15)',
                              border: '1px solid rgba(240,120,48,0.3)',
                              borderRadius: 6,
                              padding: '1px 6px',
                              fontSize: 9,
                              fontFamily: 'Barlow Condensed',
                              fontWeight: 700,
                              letterSpacing: 1,
                              color: '#F07830',
                            }}>
                              {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
                            </div>
                          )}
                        </div>
                        <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#555' }}>{user.email}</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isSuperAdmin && (
                        isUserAdmin ? (
                          <button
                            onClick={() => revokeAdmin(user)}
                            style={{
                              flex: 1, padding: '7px 10px', borderRadius: 8,
                              border: '1px solid rgba(240,120,48,0.3)',
                              background: 'transparent', color: '#F07830',
                              fontFamily: 'Barlow Condensed', fontWeight: 700,
                              fontSize: 11, letterSpacing: 0.5, cursor: 'pointer',
                            }}
                          >
                            Tirar admin
                          </button>
                        ) : (
                          <button
                            onClick={() => grantAdmin(user)}
                            style={{
                              flex: 1, padding: '7px 10px', borderRadius: 8,
                              border: '1px solid #2f3336',
                              background: 'transparent', color: '#888',
                              fontFamily: 'Barlow Condensed', fontWeight: 700,
                              fontSize: 11, letterSpacing: 0.5, cursor: 'pointer',
                            }}
                          >
                            Dar admin
                          </button>
                        )
                      )}
                      {!isSuperAdmin && (
                        <button
                          onClick={() => deletarUsuario(user)}
                          disabled={deletingUid === user.uid}
                          style={{
                            flex: 1, padding: '7px 10px', borderRadius: 8,
                            border: '1px solid rgba(244,33,46,0.3)',
                            background: 'transparent', color: '#f4212e',
                            fontFamily: 'Barlow Condensed', fontWeight: 700,
                            fontSize: 11, letterSpacing: 0.5,
                            cursor: deletingUid === user.uid ? 'default' : 'pointer',
                          }}
                        >
                          {deletingUid === user.uid ? 'Removendo...' : 'Excluir tudo'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SOLICITAÇÕES tab */}
        {tab === 'solicitacoes' && (
          <div style={{ ...s.card, padding: 20 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5, marginBottom: 16 }}>
              SOLICITAÇÕES DE ENTRADA
            </div>
            {solicitacoes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>
                Nenhuma solicitação pendente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {solicitacoes.map(req => (
                  <div key={req.id} style={{ background: '#0a0a0a', border: '1px solid rgba(240,120,48,0.2)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Avatar src={req.fromPhoto} name={req.fromName} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 14, color: '#fff' }}>{req.fromName}</div>
                        {req.fromChurchName ? (
                          <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#71767b' }}>
                            De: {req.fromChurchName} → {req.toChurchName}
                          </div>
                        ) : (
                          <div style={{ fontFamily: 'Barlow', fontSize: 11, color: '#71767b' }}>
                            Quer entrar em: {req.toChurchName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => aprovarSolicitacao(req)}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none', background: '#F07830', color: '#fff', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, cursor: 'pointer' }}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => rejeitarSolicitacao(req)}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(244,33,46,0.3)', background: 'transparent', color: '#f4212e', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, cursor: 'pointer' }}
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIRETORES tab (super admin only) */}
        {tab === 'diretores' && isSuperAdmin && (
          <div style={{ ...s.card, padding: 20 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.5, marginBottom: 4 }}>
              DIRETORES POR IGREJA
            </div>
            <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#71767b', marginBottom: 16 }}>
              Para atribuir um diretor, cole o UID do usuário no campo abaixo.
            </div>

            {/* Search filter */}
            <input
              type="text"
              placeholder="Filtrar por nome da igreja..."
              value={churchSearch}
              onChange={e => setChurchSearch(e.target.value)}
              style={{
                background: '#000', border: '1px solid #2f3336', borderRadius: 10,
                padding: '10px 12px', fontFamily: 'Barlow', fontSize: 13,
                width: '100%', marginBottom: 16, color: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
            />

            {!churchesLoaded ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#555', fontFamily: 'Barlow', fontSize: 14 }}>Carregando igrejas...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allChurches
                  .filter(c => !churchSearch || c.name.toLowerCase().includes(churchSearch.toLowerCase()) || c.district.toLowerCase().includes(churchSearch.toLowerCase()))
                  .map(church => (
                    <ChurchDirectorRow
                      key={church.id}
                      church={church}
                      usuarios={usuarios}
                      usuariosLoaded={usuariosLoaded}
                      loadUsuarios={loadUsuarios}
                      onAssign={(uid, name) => atribuirDiretor(church.id, uid, name)}
                      onRemove={() => removerDiretor(church.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Other tabs */}
        {tab !== 'usuarios' && tab !== 'solicitacoes' && tab !== 'diretores' && (
          <div style={{ ...s.card, padding: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div style={s.cardTag}>
                {tab === 'songs'
                  ? `${songs.length} MÚSICAS`
                  : tab === 'cifras'
                  ? `${cifras.length} CIFRAS`
                  : tab === 'eventos'
                  ? `${eventos.length} EVENTOS`
                  : `${membros.length} MEMBROS`}
              </div>
              {canEditThisChurch && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {tab === 'songs' && (
                    <button
                      onClick={limparDuplicatas}
                      style={{ ...s.btnOrange, padding: '6px 14px', fontSize: 12, gap: 6, background: '#555' }}
                    >
                      Limpar duplicatas
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setForm({});
                      setEditId(null);
                    }}
                    style={{
                      ...s.btnOrange,
                      padding: '6px 14px',
                      fontSize: 12,
                      gap: 6,
                    }}
                  >
                    {Ico.plus()} Novo
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tab === 'songs' &&
                songs.map((item) => (
                  <div key={item.id} style={s.adminRow}>
                    <div style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 15, color: '#fff', flex: 1 }}>
                      {item.title}
                    </div>
                    {canEditThisChurch && (
                      <>
                        <button onClick={() => { setForm({ ...item }); setEditId(item.id); }} style={s.adminActionBtn}>
                          {Ico.edit()}
                        </button>
                        <button onClick={() => deletar('songs', item.id)} style={{ ...s.adminActionBtn, color: '#f4212e' }}>
                          {Ico.trash()}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              {tab === 'cifras' &&
                cifras.map((item) => (
                  <div key={item.id} style={s.adminRow}>
                    <div style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 15, color: '#fff', flex: 1 }}>
                      {item.title}{' '}
                      <span style={{ color: '#71767b', fontWeight: 400, fontSize: 13 }}>· Tom {item.tom}</span>
                    </div>
                    {canEditThisChurch && (
                      <>
                        <button onClick={() => { setForm({ ...item }); setEditId(item.id); }} style={s.adminActionBtn}>
                          {Ico.edit()}
                        </button>
                        <button onClick={() => deletar('cifras', item.id)} style={{ ...s.adminActionBtn, color: '#f4212e' }}>
                          {Ico.trash()}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              {tab === 'eventos' &&
                eventos.map((item) => (
                  <div key={item.id} style={s.adminRow}>
                    <div style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 15, color: '#fff', flex: 1 }}>
                      {item.tema}{' '}
                      <span style={{ color: '#71767b', fontWeight: 400, fontSize: 12 }}>· {item.data}</span>
                    </div>
                    {canEditThisChurch && (
                      <>
                        <button onClick={() => { setForm({ ...item }); setEditId(item.id); }} style={s.adminActionBtn}>
                          {Ico.edit()}
                        </button>
                        <button onClick={() => deletar('eventos', item.id)} style={{ ...s.adminActionBtn, color: '#f4212e' }}>
                          {Ico.trash()}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              {tab === 'membros' &&
                membros.map((nome, i) => (
                  <div key={i} style={s.adminRow}>
                    <div style={{ fontFamily: 'Barlow', fontSize: 15, color: '#fff', flex: 1 }}>
                      {nome}
                    </div>
                    {canEditThisChurch && (
                      <button onClick={() => deletarMembro(nome)} style={{ ...s.adminActionBtn, color: '#f4212e' }}>
                        {Ico.trash()}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
