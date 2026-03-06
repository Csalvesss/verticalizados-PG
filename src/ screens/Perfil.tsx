import { getAuth, signOut } from 'firebase/auth';
import { Ico } from '../icons';
import { s } from '../styles';
import type { CurrentUser, Screen, Post, Sorteio } from '../types';

const auth = getAuth();

interface Props {
  currentUser: CurrentUser;
  isAdmin: boolean;
  posts: Post[];
  uid: string;
  songsCount: number;
  sorteioSemana: Sorteio | null;
  goTo: (sc: Screen) => void;
}

export function PerfilScreen({ currentUser, isAdmin, posts, uid, songsCount, sorteioSemana, goTo }: Props) {
  const meusPosts = posts.filter(p => p.userId === uid).length;
  const oracoesFeitas = sorteioSemana?.historico?.length || 0;

  return (
    <div className="fade" style={s.page}>
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>{Ico.back()}</button>
        <div style={s.pageTitle}>MEU PERFIL</div>
      </div>

      <div style={{ ...s.card, padding: 28, textAlign: 'center', marginBottom: 14 }}>
        <img
          src={currentUser.photo}
          style={{ width: 90, height: 90, borderRadius: '50%', border: '4px solid #F07830', objectFit: 'cover', margin: '0 auto 16px', display: 'block' }}
          alt="foto"
        />
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#1A1A1A', letterSpacing: 2 }}>
          {currentUser.fullName.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'Barlow', fontSize: 13, color: '#999', marginBottom: 22 }}>{currentUser.email}</div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 22 }}>
          {[
            { n: meusPosts, label: 'Posts' },
            { n: songsCount, label: 'Músicas' },
            { n: oracoesFeitas, label: 'Orações' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: '#F07830' }}>{item.n}</div>
              <div style={{ fontFamily: 'Barlow', fontSize: 12, color: '#999' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Badge PG */}
        <div style={{ background: '#F07830', borderRadius: 12, padding: '12px 16px', textAlign: 'left', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: 'rgba(0,0,0,0.4)', marginBottom: 3 }}>MEMBRO DO PG</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#1A1A1A' }}>VERTICALIZADOS · MJA ESPLANADA</div>
        </div>

        {/* Badge Admin */}
        {isAdmin && (
          <div style={{ background: '#1A1A1A', borderRadius: 12, padding: '10px 16px', textAlign: 'left', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {Ico.admin('#F07830')}
            <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 14, color: '#F07830', letterSpacing: 1 }}>ADMINISTRADOR</div>
          </div>
        )}

        <button onClick={() => signOut(auth)} style={{ width: '100%', padding: '12px', borderRadius: 50, background: 'transparent', border: '1.5px solid #e0e0e0', color: '#999', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {Ico.logout()} Sair da conta
        </button>
      </div>
    </div>
  );
}