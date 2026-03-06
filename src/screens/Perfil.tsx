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

export function PerfilScreen({
  currentUser,
  isAdmin,
  posts,
  uid,
  songsCount,
  sorteioSemana,
  goTo,
}: Props) {
  const meusPosts = posts.filter((p) => p.userId === uid).length;
  const oracoes = sorteioSemana?.historico?.length || 0;

  return (
    <div className="fade">
      <div style={s.pageHeader}>
        <button style={s.backBtn} onClick={() => goTo('home')}>
          {Ico.back()}
        </button>
        <div style={s.pageTitle}>MEU PERFIL</div>
      </div>

      <div style={s.page}>
        <div style={{ ...s.card, padding: '32px 24px', textAlign: 'center' }}>
          <img
            src={currentUser.photo}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              border: '3px solid #F07830',
              objectFit: 'cover',
              margin: '0 auto 16px',
              display: 'block',
            }}
            alt=""
          />
          <div
            style={{
              fontFamily: 'Barlow Condensed',
              fontSize: 26,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 0.5,
            }}
          >
            {currentUser.fullName}
          </div>
          <div
            style={{
              fontFamily: 'Barlow',
              fontSize: 14,
              color: '#71767b',
              marginBottom: 24,
            }}
          >
            {currentUser.email}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              marginBottom: 32,
              borderTop: '1px solid #2f3336',
              borderBottom: '1px solid #2f3336',
              padding: '16px 0',
            }}
          >
            {[
              { n: meusPosts, label: 'Posts' },
              { n: songsCount, label: 'Músicas' },
              { n: oracoes, label: 'Orações' },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontFamily: 'Barlow Condensed',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {item.n}
                </div>
                <div
                  style={{
                    fontFamily: 'Barlow',
                    fontSize: 12,
                    color: '#71767b',
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(240,120,48,0.1)',
              borderRadius: 16,
              padding: '16px',
              textAlign: 'left',
              marginBottom: 24,
              border: '1px solid rgba(240,120,48,0.1)',
            }}
          >
            <div
              style={{
                fontFamily: 'Barlow Condensed',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#F07830',
                marginBottom: 4,
              }}
            >
              MEMBRO DO PG
            </div>
            <div
              style={{
                fontFamily: 'Barlow Condensed',
                fontSize: 18,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: 0.5,
              }}
            >
              VERTICALIZADOS · MJA ESPLANADA
            </div>
          </div>

          {isAdmin && (
            <div
              style={{
                background: '#16181c',
                borderRadius: 12,
                padding: '12px 16px',
                textAlign: 'left',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid #2f3336',
              }}
            >
              {Ico.admin('#F07830')}
              <div
                style={{
                  fontFamily: 'Barlow Condensed',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#F07830',
                  letterSpacing: 1,
                }}
              >
                ADMINISTRADOR
              </div>
            </div>
          )}

          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 999,
              background: 'transparent',
              border: '1px solid #2f3336',
              color: '#f4212e',
              fontFamily: 'Barlow',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {Ico.logout()} Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
