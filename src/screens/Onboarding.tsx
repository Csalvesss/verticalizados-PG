import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useChurch, type Church } from '../contexts/ChurchContext';

// ── Lista completa de igrejas da APV ─────────────────────────────────────────
export const APV_CHURCHES: Array<{ name: string; district: string }> = [
  // São José dos Campos
  { name: "Altos de Santana", district: "São José dos Campos" },
  { name: "São José dos Campos", district: "São José dos Campos" },
  { name: "Santana", district: "São José dos Campos" },
  { name: "Monteiro Lobato", district: "São José dos Campos" },
  { name: "Bosque dos Eucaliptos", district: "São José dos Campos" },
  { name: "Bairro dos Freitas", district: "São José dos Campos" },
  { name: "Parque Novo Horizonte", district: "São José dos Campos" },
  { name: "Cidade Soberana", district: "São José dos Campos" },
  // Guaratinguetá
  { name: "Guaratinguetá", district: "Guaratinguetá" },
  { name: "Aparecida", district: "Guaratinguetá" },
  { name: "Potim", district: "Guaratinguetá" },
  { name: "Pedregulho", district: "Guaratinguetá" },
  // Taubaté
  { name: "Taubaté", district: "Taubaté" },
  { name: "Terra Nova", district: "Taubaté" },
  { name: "Gurilândia", district: "Taubaté" },
  { name: "Redenção da Serra", district: "Taubaté" },
  // Jacareí
  { name: "Jacareí", district: "Jacareí" },
  { name: "Jd. Paraíso", district: "Jacareí" },
  { name: "Jd. Colonia", district: "Jacareí" },
  { name: "Santa Branca", district: "Jacareí" },
  // Caraguatatuba
  { name: "Caraguatatuba", district: "Caraguatatuba" },
  { name: "Massaguaçu", district: "Caraguatatuba" },
  { name: "Morro do Algodão", district: "Caraguatatuba" },
  { name: "Rio do Ouro", district: "Caraguatatuba" },
  { name: "Tinga", district: "Caraguatatuba" },
  // São Sebastião
  { name: "São Sebastião", district: "São Sebastião" },
  { name: "Ilhabela", district: "São Sebastião" },
  { name: "Maresias", district: "São Sebastião" },
  { name: "Mirante do Itatinga", district: "São Sebastião" },
  // Ubatuba
  { name: "Ubatuba", district: "Ubatuba" },
  { name: "Ubatumirim", district: "Ubatuba" },
  { name: "Maranduba", district: "Ubatuba" },
  // Atibaia
  { name: "Atibaia", district: "Atibaia" },
  { name: "Bom Jesus dos Perdões", district: "Atibaia" },
  { name: "Nazaré Paulista", district: "Atibaia" },
  { name: "Piracaia", district: "Atibaia" },
  // Bragança Paulista
  { name: "Bragança Paulista", district: "Bragança Paulista" },
  { name: "Jardim São Miguel", district: "Bragança Paulista" },
  { name: "Tanque", district: "Bragança Paulista" },
  { name: "Pedra Bela", district: "Bragança Paulista" },
  // Cruzeiro
  { name: "Cruzeiro", district: "Cruzeiro" },
  { name: "Queluz", district: "Cruzeiro" },
  // Lorena
  { name: "Lorena", district: "Lorena" },
  { name: "Piquete", district: "Lorena" },
  { name: "Canas", district: "Lorena" },
  // Guarulhos
  { name: "Guarulhos", district: "Guarulhos" },
  { name: "Gopoúva", district: "Guarulhos" },
  { name: "Vila Augusta", district: "Guarulhos" },
  { name: "Itapegica", district: "Guarulhos" },
  // Mogi das Cruzes
  { name: "Mogi das Cruzes", district: "Mogi das Cruzes" },
  { name: "Nipônico", district: "Mogi das Cruzes" },
  { name: "Taiaçupeba", district: "Mogi das Cruzes" },
  // Ferraz de Vasconcelos
  { name: "Ferraz de Vasconcelos", district: "Ferraz de Vasconcelos" },
  { name: "Nove de Julho", district: "Ferraz de Vasconcelos" },
  // Poá
  { name: "Poá", district: "Poá" },
  { name: "Arizona", district: "Poá" },
  { name: "Calmon Viana", district: "Poá" },
  // Suzano
  { name: "Suzano", district: "Suzano" },
  { name: "Jd. Leblon", district: "Suzano" },
  // Aruja
  { name: "Aruja", district: "Aruja" },
  { name: "Mirante", district: "Aruja" },
  { name: "Maria Rosa III", district: "Aruja" },
  // Itaquaquecetuba
  { name: "Itaquaquecetuba", district: "Itaquaquecetuba" },
  { name: "Jd. do Vale", district: "Itaquaquecetuba" },
  { name: "Monte Belo", district: "Itaquaquecetuba" },
  // Campos do Jordão
  { name: "Independência", district: "Campos do Jordão" },
  { name: "Campos do Jordão", district: "Campos do Jordão" },
  { name: "São Bento do Sapucaí", district: "Campos do Jordão" },
  // Biritiba Mirim
  { name: "Biritiba Mirim", district: "Biritiba Mirim" },
  { name: "Salesópolis", district: "Biritiba Mirim" },
  { name: "Cocuéra", district: "Biritiba Mirim" },
  // Bananal
  { name: "Bananal", district: "Bananal" },
  { name: "Boa Esperança", district: "Bananal" },
  { name: "Fazendinha", district: "Bananal" },
  // Esperança
  { name: "Esperança", district: "Esperança" },
  { name: "Igarapés", district: "Esperança" },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Popular o Firestore com as igrejas da APV (executa apenas uma vez)
async function seedChurchesIfEmpty(): Promise<Church[]> {
  const churchesRef = collection(db, 'churches');
  const snap = await getDocs(churchesRef);
  const existing = snap.docs.map(d => ({ id: d.id, ...d.data() } as Church));

  if (existing.length > 0) return existing;

  // Seed
  const seeded: Church[] = [];
  for (const c of APV_CHURCHES) {
    const id = toSlug(c.name);
    const church: Church = { id, name: c.name, district: c.district, directorUid: null };
    await setDoc(doc(churchesRef, id), {
      ...c,
      associationId: 'APV',
      directorUid: null,
      createdAt: new Date(),
    }, { merge: true });
    seeded.push(church);
  }
  return seeded;
}

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div style={{
      background: '#BA7517',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .splash-logo { animation: fadeInUp 0.6s ease forwards; }
        .splash-dots { display:flex;gap:6px;margin-top:16px; }
        .splash-dot { width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.7);animation:pulse 1.2s ease-in-out infinite; }
        .splash-dot:nth-child(2){animation-delay:0.2s}
        .splash-dot:nth-child(3){animation-delay:0.4s}
      `}</style>
      <div className="splash-logo" style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 72, lineHeight: 1, color: '#fff', letterSpacing: -2 }}>
          <span style={{ color: '#000' }}>7</span>Teen
        </div>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: 3, color: 'rgba(0,0,0,0.55)', marginTop: 4, textTransform: 'uppercase' }}>
          Associação Paulista do Vale
        </div>
      </div>
      <div className="splash-dots">
        <div className="splash-dot" />
        <div className="splash-dot" />
        <div className="splash-dot" />
      </div>
    </div>
  );
}

// ── Church list ───────────────────────────────────────────────────────────────
interface SelectProps {
  groups: Record<string, Church[]>;
  search: string;
  onSearch: (v: string) => void;
  onPick: (church: Church) => void;
  loading: boolean;
}

function SelectChurchScreen({ groups, search, onSearch, onPick, loading }: SelectProps) {
  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700&display=swap');
        .church-row:active { background: rgba(186,117,23,0.08) !important; }
        input::placeholder { color: #555; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '48px 20px 20px',
        background: 'linear-gradient(180deg, rgba(186,117,23,0.12) 0%, transparent 100%)',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 36, lineHeight: 1, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>
          <span style={{ color: '#BA7517' }}>7</span>Teen
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 4 }}>
          Qual é a sua Igreja?
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#666' }}>
          Personalize sua experiência na APV
        </div>

        {/* Search */}
        <div style={{ marginTop: 16, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg style={{ position: 'absolute', left: 12, flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar igreja ou cidade..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 36px',
              borderRadius: 12,
              border: '1px solid #2a2a2a',
              background: '#111',
              color: '#fff',
              fontFamily: 'Barlow, sans-serif',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', paddingBottom: 40 }}>
        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>
            Carregando igrejas...
          </div>
        )}

        {!loading && Object.keys(groups).length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#555', fontFamily: 'Barlow, sans-serif', fontSize: 14 }}>
            Nenhuma igreja encontrada
          </div>
        )}

        {!loading && Object.entries(groups).map(([district, churches]) => (
          <div key={district}>
            {/* District label */}
            <div style={{
              padding: '14px 20px 6px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 2,
              color: '#BA7517',
              textTransform: 'uppercase',
            }}>
              {district}
            </div>

            {churches.map((church, i) => (
              <button
                key={church.id}
                className="church-row"
                onClick={() => onPick(church)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < churches.length - 1 ? '1px solid #111' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                {/* Church icon */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(186,117,23,0.1)',
                  border: '1px solid rgba(186,117,23,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Barlow, sans-serif',
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#e7e9ea',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {church.name}
                  </div>
                </div>

                {/* Chevron */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'splash' | 'select'>('splash');
  const [search, setSearch] = useState('');
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedChurch } = useChurch();

  useEffect(() => {
    // Busca igrejas do Firestore; se vazio, popula automaticamente
    seedChurchesIfEmpty()
      .then(list => {
        // Ordenar: primeiro por distrito, depois por nome
        const sorted = [...list].sort((a, b) => {
          const dc = a.district.localeCompare(b.district, 'pt-BR');
          return dc !== 0 ? dc : a.name.localeCompare(b.name, 'pt-BR');
        });
        setChurches(sorted);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: usar lista local se Firestore falhar
        const local = APV_CHURCHES.map(c => ({
          id: toSlug(c.name),
          name: c.name,
          district: c.district,
          directorUid: null,
        }));
        setChurches(local);
        setLoading(false);
      });

    const t = setTimeout(() => setPhase('select'), 2000);
    return () => clearTimeout(t);
  }, []);

  const filtered = churches.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por distrito mantendo a ordem de inserção
  const grouped = filtered.reduce<Record<string, Church[]>>((acc, c) => {
    if (!acc[c.district]) acc[c.district] = [];
    acc[c.district].push(c);
    return acc;
  }, {});

  const handlePick = (church: Church) => {
    setSelectedChurch(church);
    onDone();
  };

  if (phase === 'splash') return <SplashScreen />;

  return (
    <SelectChurchScreen
      groups={grouped}
      search={search}
      onSearch={setSearch}
      onPick={handlePick}
      loading={loading}
    />
  );
}
