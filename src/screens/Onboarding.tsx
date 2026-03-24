import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useChurch, type Church } from '../contexts/ChurchContext';

// ── Lista completa de igrejas da APV ─────────────────────────────────────────
// Fonte oficial — filtrado por "- APV" do cadastro nacional (280 igrejas)
export const APV_CHURCHES: Array<{ name: string; district: string }> = [
  // Aruja
  { name: "Aruja", district: "Aruja" },
  { name: "Barreto", district: "Aruja" },
  { name: "Jd. Patrícia", district: "Aruja" },
  { name: "Maria Rosa III", district: "Aruja" },
  { name: "Mirante", district: "Aruja" },
  { name: "Pq. Piratininga", district: "Aruja" },

  // Atibaia
  { name: "Atibaia", district: "Atibaia" },
  { name: "Bom Jesus dos Perdões", district: "Atibaia" },
  { name: "Comunidade Adventista Atibaia", district: "Atibaia" },
  { name: "Espaço Novo Tempo Piracaia", district: "Atibaia" },
  { name: "Nazaré Paulista", district: "Atibaia" },
  { name: "Piracaia", district: "Atibaia" },
  { name: "Pq. das Hortênsias", district: "Atibaia" },

  // Bairro dos Pimentas
  { name: "Bairro dos Pimentas", district: "Bairro dos Pimentas" },
  { name: "Conj. Marcos Freire", district: "Bairro dos Pimentas" },
  { name: "Jd. Angélica", district: "Bairro dos Pimentas" },
  { name: "Jd. Santo Afonso", district: "Bairro dos Pimentas" },
  { name: "Pq. Jandaia", district: "Bairro dos Pimentas" },
  { name: "Sítio São Francisco", district: "Bairro dos Pimentas" },
  { name: "Vila Any", district: "Bairro dos Pimentas" },

  // Bananal
  { name: "Arapeí", district: "Bananal" },
  { name: "Bananal", district: "Bananal" },
  { name: "Boa Esperança", district: "Bananal" },
  { name: "Fazendinha", district: "Bananal" },
  { name: "Flor do Paraíso", district: "Bananal" },
  { name: "Vila Bom Jardim", district: "Bananal" },

  // Bela Vista
  { name: "Bela Vista", district: "Bela Vista" },
  { name: "Jd. Marilena", district: "Bela Vista" },
  { name: "Pq. Primavera", district: "Bela Vista" },
  { name: "Recreio São Jorge", district: "Bela Vista" },
  { name: "Taboão", district: "Bela Vista" },

  // Biritiba Mirim
  { name: "Biritiba Mirim", district: "Biritiba Mirim" },
  { name: "Cocuéra", district: "Biritiba Mirim" },
  { name: "Jd. dos Eucaliptos", district: "Biritiba Mirim" },
  { name: "Pomar do Carmo", district: "Biritiba Mirim" },
  { name: "Salesópolis", district: "Biritiba Mirim" },
  { name: "Vila dos Remédios", district: "Biritiba Mirim" },

  // Bosque dos Eucaliptos
  { name: "Bosque dos Eucaliptos", district: "Bosque dos Eucaliptos" },
  { name: "Dom Pedro II", district: "Bosque dos Eucaliptos" },
  { name: "Jd. Colonial", district: "Bosque dos Eucaliptos" },
  { name: "Pq. Interlagos", district: "Bosque dos Eucaliptos" },
  { name: "Vila das Flores", district: "Bosque dos Eucaliptos" },

  // Bragança Paulista
  { name: "Bragança Paulista", district: "Bragança Paulista" },
  { name: "Jardim São Miguel", district: "Bragança Paulista" },
  { name: "Jd. das Laranjeiras", district: "Bragança Paulista" },
  { name: "Tanque", district: "Bragança Paulista" },

  // Caetetuba
  { name: "Caetetuba", district: "Caetetuba" },
  { name: "Capoavinha", district: "Caetetuba" },
  { name: "Jd. Brogotá", district: "Caetetuba" },
  { name: "Jd. Cerejeiras", district: "Caetetuba" },
  { name: "Jd. Gibeon", district: "Caetetuba" },
  { name: "Jd. Imperial", district: "Caetetuba" },
  { name: "Mairiporã", district: "Caetetuba" },
  { name: "Terra Preta", district: "Caetetuba" },

  // Caraguatatuba
  { name: "Caraguatatuba", district: "Caraguatatuba" },
  { name: "Esperança (Caraguatatuba)", district: "Caraguatatuba" },
  { name: "Massaguaçu", district: "Caraguatatuba" },
  { name: "Morro do Algodão", district: "Caraguatatuba" },
  { name: "Rio do Ouro", district: "Caraguatatuba" },
  { name: "Tinga", district: "Caraguatatuba" },
  { name: "Travessão", district: "Caraguatatuba" },

  // Cidade Jardim Cumbica
  { name: "Cidade Jardim Cumbica", district: "Cidade Jardim Cumbica" },
  { name: "Inocoop", district: "Cidade Jardim Cumbica" },
  { name: "Jd. Maria Dirce", district: "Cidade Jardim Cumbica" },
  { name: "Jd. Presidente Dutra", district: "Cidade Jardim Cumbica" },
  { name: "Pq. Uirapuru", district: "Cidade Jardim Cumbica" },
  { name: "Uirapuru II", district: "Cidade Jardim Cumbica" },

  // Cidade Soberana
  { name: "Cidade Seródio", district: "Cidade Soberana" },
  { name: "Cidade Soberana", district: "Cidade Soberana" },
  { name: "Jardim São João", district: "Cidade Soberana" },
  { name: "Jd. Fortaleza", district: "Cidade Soberana" },
  { name: "Jd. Santa Terezinha", district: "Cidade Soberana" },
  { name: "Lavras", district: "Cidade Soberana" },
  { name: "Santos Dumont", district: "Cidade Soberana" },

  // Comunidade Hispana
  { name: "Comunidade Hispana Bandeirantes", district: "Comunidade Hispana" },
  { name: "Comunidade Hispana Coqueiro", district: "Comunidade Hispana" },
  { name: "Comunidade Hispana Jardim Nícea", district: "Comunidade Hispana" },
  { name: "Comunidade Hispana Pequeno Coração", district: "Comunidade Hispana" },
  { name: "Comunidade Hispana Vila Any", district: "Comunidade Hispana" },

  // Cruzeiro
  { name: "Cachoeira Paulista", district: "Cruzeiro" },
  { name: "Cruzeiro", district: "Cruzeiro" },
  { name: "Jd. América (Cruzeiro)", district: "Cruzeiro" },
  { name: "Jd. Paraíso (Cruzeiro)", district: "Cruzeiro" },
  { name: "Queluz", district: "Cruzeiro" },

  // Esperança
  { name: "Esperança", district: "Esperança" },
  { name: "Igarapés", district: "Esperança" },
  { name: "Jd. Emília", district: "Esperança" },
  { name: "Pq. Meia Lua", district: "Esperança" },
  { name: "Rio Comprido", district: "Esperança" },

  // Ferraz de Vasconcelos
  { name: "Ferraz de Vasconcelos", district: "Ferraz de Vasconcelos" },
  { name: "Jd. Juliana", district: "Ferraz de Vasconcelos" },
  { name: "Nove de Julho", district: "Ferraz de Vasconcelos" },
  { name: "Pq. São Francisco", district: "Ferraz de Vasconcelos" },
  { name: "Vila Santo Antonio", district: "Ferraz de Vasconcelos" },
  { name: "Vila São Paulo", district: "Ferraz de Vasconcelos" },

  // Guaratinguetá
  { name: "Aparecida", district: "Guaratinguetá" },
  { name: "Cunha", district: "Guaratinguetá" },
  { name: "Guaratinguetá", district: "Guaratinguetá" },
  { name: "Pedregulho", district: "Guaratinguetá" },
  { name: "Potim", district: "Guaratinguetá" },

  // Guarulhos
  { name: "Gopoúva", district: "Guarulhos" },
  { name: "Guarulhos", district: "Guarulhos" },
  { name: "Itapegica", district: "Guarulhos" },
  { name: "Ponte Grande", district: "Guarulhos" },
  { name: "Vila Augusta", district: "Guarulhos" },

  // Independência
  { name: "Campos do Jordão", district: "Independência" },
  { name: "Independência", district: "Independência" },
  { name: "Jd. Maracaibo", district: "Independência" },
  { name: "Res. Dom Bosco", district: "Independência" },
  { name: "Santo Antonio do Pinhal", district: "Independência" },
  { name: "São Bento do Sapucaí", district: "Independência" },

  // Itaquaquecetuba
  { name: "Itaquaquecetuba", district: "Itaquaquecetuba" },
  { name: "Jd. Gonçalves", district: "Itaquaquecetuba" },
  { name: "Jd. Novo Horizonte", district: "Itaquaquecetuba" },
  { name: "Jd. do Vale", district: "Itaquaquecetuba" },
  { name: "Monte Belo", district: "Itaquaquecetuba" },
  { name: "Quinta da Boa Vista", district: "Itaquaquecetuba" },

  // Jacareí
  { name: "Cidade Salvador", district: "Jacareí" },
  { name: "Jacareí", district: "Jacareí" },
  { name: "Jd. Colonia", district: "Jacareí" },
  { name: "Jd. Paraíso (Jacareí)", district: "Jacareí" },
  { name: "Pq. dos Príncipes", district: "Jacareí" },
  { name: "Santa Branca", district: "Jacareí" },

  // Jardim América
  { name: "Bandeira Branca", district: "Jardim América" },
  { name: "Jd. América", district: "Jardim América" },

  // Jardim Caiuby
  { name: "Jd. Caiuby", district: "Jardim Caiuby" },
  { name: "Maragogipe", district: "Jardim Caiuby" },
  { name: "Paineira", district: "Jardim Caiuby" },
  { name: "Pequeno Coração", district: "Jardim Caiuby" },
  { name: "Pinheirinho", district: "Jardim Caiuby" },
  { name: "Pq. Scaffid II", district: "Jardim Caiuby" },
  { name: "Pq. Viviane", district: "Jardim Caiuby" },

  // Jardim Esplanada
  { name: "Jardins", district: "Jardim Esplanada" },
  { name: "Jd. Esplanada", district: "Jardim Esplanada" },

  // Jardim Gardênia Azul
  { name: "Jd. Dona Benta", district: "Jardim Gardênia Azul" },
  { name: "Jd. Gardênia Azul", district: "Jardim Gardênia Azul" },
  { name: "Jd. São José", district: "Jardim Gardênia Azul" },
  { name: "Miguel Badra", district: "Jardim Gardênia Azul" },
  { name: "Pq. Residencial Marengo", district: "Jardim Gardênia Azul" },
  { name: "Recanto Mônica", district: "Jardim Gardênia Azul" },

  // Jardim Ismênia
  { name: "Caçapava Velha", district: "Jardim Ismênia" },
  { name: "Jd. Ismênia", district: "Jardim Ismênia" },
  { name: "Jd. Maria Elmira", district: "Jardim Ismênia" },
  { name: "Jd. Panorama", district: "Jardim Ismênia" },
  { name: "Jd. Santa Inês", district: "Jardim Ismênia" },
  { name: "Nova Esperança", district: "Jardim Ismênia" },
  { name: "Res. Galo Branco", district: "Jardim Ismênia" },

  // Jardim Nova Bonsucesso
  { name: "Anita Garibaldi", district: "Jardim Nova Bonsucesso" },
  { name: "Jd. Alamo", district: "Jardim Nova Bonsucesso" },
  { name: "Jd. Nova Bonsucesso", district: "Jardim Nova Bonsucesso" },
  { name: "Ponte Alta (Jd. N. Bonsucesso)", district: "Jardim Nova Bonsucesso" },
  { name: "Pq. Residencial Bambi", district: "Jardim Nova Bonsucesso" },
  { name: "Vila Carmela", district: "Jardim Nova Bonsucesso" },

  // Jardim São Paulo
  { name: "Cabuçu", district: "Jardim São Paulo" },
  { name: "Jd. Gracinda", district: "Jardim São Paulo" },
  { name: "Jd. São Paulo", district: "Jardim São Paulo" },
  { name: "Picanço", district: "Jardim São Paulo" },
  { name: "Pq. Continental II", district: "Jardim São Paulo" },
  { name: "Vila Rio de Janeiro", district: "Jardim São Paulo" },

  // Jardim São Pedro
  { name: "Botujuru", district: "Jardim São Pedro" },
  { name: "Cesar de Souza", district: "Jardim São Pedro" },
  { name: "Jd. São Pedro", district: "Jardim São Pedro" },
  { name: "Luis Carlos", district: "Jardim São Pedro" },
  { name: "Sabaúna", district: "Jardim São Pedro" },

  // Lorena
  { name: "Canas", district: "Lorena" },
  { name: "Lorena", district: "Lorena" },
  { name: "Olaria", district: "Lorena" },
  { name: "Piquete", district: "Lorena" },
  { name: "Pq. Cecap", district: "Lorena" },
  { name: "Pq. das Rodovias", district: "Lorena" },
  { name: "Vila Nunes", district: "Lorena" },

  // Mogi das Cruzes
  { name: "Jd. São Lázaro", district: "Mogi das Cruzes" },
  { name: "Mogi das Cruzes", district: "Mogi das Cruzes" },
  { name: "Nipônico", district: "Mogi das Cruzes" },
  { name: "Taiaçupeba", district: "Mogi das Cruzes" },

  // Monte Carmelo
  { name: "Bom Clima", district: "Monte Carmelo" },
  { name: "Jd. Irene", district: "Monte Carmelo" },
  { name: "Jd. Monte Carmelo", district: "Monte Carmelo" },
  { name: "Pq. Continental V", district: "Monte Carmelo" },

  // Parque Alvorada
  { name: "Jd. Alice", district: "Parque Alvorada" },
  { name: "Jd. Brasil", district: "Parque Alvorada" },
  { name: "Jd. Cumbica II", district: "Parque Alvorada" },
  { name: "Jd. Normândia", district: "Parque Alvorada" },
  { name: "Pq. Alvorada", district: "Parque Alvorada" },
  { name: "Vila Isabel", district: "Parque Alvorada" },

  // Parque Industrial
  { name: "Conj. 31 de Março", district: "Parque Industrial" },
  { name: "Jd. Morumbi", district: "Parque Industrial" },
  { name: "Jd. Satélite", district: "Parque Industrial" },
  { name: "Pq. Industrial", district: "Parque Industrial" },
  { name: "Pq. dos Ipês", district: "Parque Industrial" },

  // Parque Novo Horizonte
  { name: "Campos de São José", district: "Parque Novo Horizonte" },
  { name: "Jambeiro", district: "Parque Novo Horizonte" },
  { name: "Paraibuna", district: "Parque Novo Horizonte" },
  { name: "Pinheirinho dos Palmares II", district: "Parque Novo Horizonte" },
  { name: "Pousada do Vale", district: "Parque Novo Horizonte" },
  { name: "Pq. Novo Horizonte", district: "Parque Novo Horizonte" },
  { name: "Res. Jatobá", district: "Parque Novo Horizonte" },
  { name: "Res. São Francisco", district: "Parque Novo Horizonte" },

  // Parque dos Estados
  { name: "Águas Claras", district: "Parque dos Estados" },
  { name: "Joanópolis", district: "Parque dos Estados" },
  { name: "Pedra Bela", district: "Parque dos Estados" },
  { name: "Ponte Alta (Bragança Paulista)", district: "Parque dos Estados" },
  { name: "Pq. dos Estados", district: "Parque dos Estados" },
  { name: "Vargem", district: "Parque dos Estados" },
  { name: "Vila Batista", district: "Parque dos Estados" },

  // Pindamonhangaba
  { name: "Central de Pindamonhangaba", district: "Pindamonhangaba" },
  { name: "Cidade Nova", district: "Pindamonhangaba" },
  { name: "Goiabal", district: "Pindamonhangaba" },
  { name: "Jd. Araretama", district: "Pindamonhangaba" },
  { name: "Mombaça", district: "Pindamonhangaba" },
  { name: "Moreira Cesar", district: "Pindamonhangaba" },
  { name: "Pq. das Palmeiras", district: "Pindamonhangaba" },

  // Poá
  { name: "Arizona", district: "Poá" },
  { name: "Calmon Viana", district: "Poá" },
  { name: "Jd. Mirai", district: "Poá" },
  { name: "Jd. Santo Antonio", district: "Poá" },
  { name: "Poá", district: "Poá" },
  { name: "Rancho Grande", district: "Poá" },

  // Santa Isabel
  { name: "Chácara Guanabara", district: "Santa Isabel" },
  { name: "Guararema", district: "Santa Isabel" },
  { name: "Igaratá", district: "Santa Isabel" },
  { name: "Jd. Eldorado", district: "Santa Isabel" },
  { name: "Parateí", district: "Santa Isabel" },
  { name: "Santa Isabel", district: "Santa Isabel" },

  // Suzano
  { name: "Jd. Cacique", district: "Suzano" },
  { name: "Jd. Casa Branca", district: "Suzano" },
  { name: "Jd. Leblon", district: "Suzano" },
  { name: "Palmeiras", district: "Suzano" },
  { name: "Pq. Maria Helena", district: "Suzano" },
  { name: "Suzano", district: "Suzano" },

  // São José dos Campos
  { name: "Altos de Santana", district: "São José dos Campos" },
  { name: "Bairro dos Freitas", district: "São José dos Campos" },
  { name: "Jd. Boa Vista", district: "São José dos Campos" },
  { name: "Monteiro Lobato", district: "São José dos Campos" },
  { name: "Santana", district: "São José dos Campos" },
  { name: "São José dos Campos", district: "São José dos Campos" },

  // São Sebastião
  { name: "Boiçucanga", district: "São Sebastião" },
  { name: "Canto do Mar", district: "São Sebastião" },
  { name: "Ilhabela", district: "São Sebastião" },
  { name: "Maresias", district: "São Sebastião" },
  { name: "Mirante do Itatinga", district: "São Sebastião" },
  { name: "São Sebastião", district: "São Sebastião" },

  // Taubaté
  { name: "Gurilândia", district: "Taubaté" },
  { name: "Jd. Resende", district: "Taubaté" },
  { name: "Redenção da Serra", district: "Taubaté" },
  { name: "São Luiz do Paraitinga", district: "Taubaté" },
  { name: "Taubaté", district: "Taubaté" },
  { name: "Terra Nova", district: "Taubaté" },

  // Tremembé
  { name: "Tremembé Centro", district: "Tremembé" },
  { name: "Tremembé Colégio", district: "Tremembé" },

  // Ubatuba
  { name: "Ipiranguinha", district: "Ubatuba" },
  { name: "Maranduba", district: "Ubatuba" },
  { name: "Pereque-açú", district: "Ubatuba" },
  { name: "Picinguaba", district: "Ubatuba" },
  { name: "Ubatuba", district: "Ubatuba" },
  { name: "Ubatumirim", district: "Ubatuba" },

  // Vila Galvão
  { name: "Comunidade São Rafael", district: "Vila Galvão" },
  { name: "Jd. Palmira", district: "Vila Galvão" },
  { name: "Jd. Tranquilidade", district: "Vila Galvão" },
  { name: "Pq. Continental 1", district: "Vila Galvão" },
  { name: "Vila Galvão", district: "Vila Galvão" },
  { name: "Vila Sabatina", district: "Vila Galvão" },

  // Vila Natal
  { name: "Jd. Cecília", district: "Vila Natal" },
  { name: "Parque Morumbi", district: "Vila Natal" },
  { name: "Vila Cléo", district: "Vila Natal" },
  { name: "Vila Moraes", district: "Vila Natal" },
  { name: "Vila Natal", district: "Vila Natal" },

  // Vila Nova Jundiapeba
  { name: "Brás Cubas", district: "Vila Nova Jundiapeba" },
  { name: "Jd. Aeroporto III", district: "Vila Nova Jundiapeba" },
  { name: "Jd. Leimar", district: "Vila Nova Jundiapeba" },
  { name: "Jundiapeba", district: "Vila Nova Jundiapeba" },
  { name: "Pq. São Martinho", district: "Vila Nova Jundiapeba" },
  { name: "Varinhas", district: "Vila Nova Jundiapeba" },
  { name: "Vila Nova Jundiapeba", district: "Vila Nova Jundiapeba" },

  // Vila Santa Margarida
  { name: "Bandeirantes", district: "Vila Santa Margarida" },
  { name: "Cidade Kemel", district: "Vila Santa Margarida" },
  { name: "Jd. Picosse", district: "Vila Santa Margarida" },
  { name: "Jd. São João II", district: "Vila Santa Margarida" },
  { name: "Jd. Tv", district: "Vila Santa Margarida" },
  { name: "Vila Santa Margarida", district: "Vila Santa Margarida" },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Retorna sempre a lista local (fonte da verdade).
// Em background, garante que o Firestore tem todas as igrejas atualizadas.
async function seedChurchesIfEmpty(): Promise<Church[]> {
  const local: Church[] = APV_CHURCHES.map(c => ({
    id: toSlug(c.name),
    name: c.name,
    district: c.district,
    directorUid: null,
  }));

  // Background: seed igrejas que ainda não existem no Firestore
  const churchesRef = collection(db, 'churches');
  getDocs(churchesRef).then(snap => {
    const existingIds = new Set(snap.docs.map(d => d.id));
    for (const c of APV_CHURCHES) {
      const id = toSlug(c.name);
      if (!existingIds.has(id)) {
        setDoc(doc(churchesRef, id), {
          name: c.name,
          district: c.district,
          associationId: 'APV',
          directorUid: null,
          createdAt: new Date(),
        }, { merge: true }).catch(() => {});
      }
    }
  }).catch(() => {});

  return local;
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
  isSwitch?: boolean;
  currentChurchId?: string | null;
  onCancel?: () => void;
}

function SelectChurchScreen({ groups, search, onSearch, onPick, loading, isSwitch, onCancel }: SelectProps) {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 36, lineHeight: 1, color: '#fff', letterSpacing: -1 }}>
            <span style={{ color: '#BA7517' }}>7</span>Teen
          </div>
          {isSwitch && onCancel && (
            <button
              onClick={onCancel}
              style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 20, padding: '6px 14px', color: '#71767b', fontFamily: 'Barlow, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 4 }}>
          {isSwitch ? 'Trocar de Igreja' : 'Qual é a sua Igreja?'}
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#666' }}>
          {isSwitch
            ? 'Igrejas com diretor exigem aprovação. Sem diretor, a troca é imediata.'
            : 'Personalize sua experiência na APV'}
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

                {/* Chevron / lock */}
                {isSwitch && church.directorUid ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pending request confirmation screen ───────────────────────────────────────
function RequestSentScreen({ churchName, onBack }: { churchName: string; onBack: () => void }) {
  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700&display=swap');
      `}</style>
      <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(186,117,23,0.15)', border: '2px solid rgba(186,117,23,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', textAlign: 'center', marginBottom: 10 }}>
        Solicitação enviada!
      </div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#71767b', textAlign: 'center', lineHeight: 1.5, marginBottom: 32, maxWidth: 300 }}>
        Seu pedido de entrada foi enviado para o diretor da igreja <span style={{ color: '#e7e9ea', fontWeight: 600 }}>{churchName}</span>. Você será notificado quando for aprovado.
      </div>
      <button
        onClick={onBack}
        style={{
          background: '#BA7517', border: 'none', borderRadius: 999,
          padding: '14px 32px', color: '#fff',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 16, letterSpacing: 0.5, cursor: 'pointer',
        }}
      >
        Voltar ao início
      </button>
    </div>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
interface Props {
  onDone: () => void;
  mode?: 'first' | 'switch';
  uid?: string;
  userName?: string;
  userPhoto?: string;
}

export function OnboardingScreen({ onDone, mode = 'first', uid, userName, userPhoto }: Props) {
  const [phase, setPhase] = useState<'splash' | 'select' | 'requested'>('splash');
  const [requestedChurch, setRequestedChurch] = useState<string>('');
  const [search, setSearch] = useState('');
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedChurch, selectedChurch } = useChurch();

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

    // Skip splash in switch mode
    if (mode === 'switch') {
      setPhase('select');
    } else {
      const t = setTimeout(() => setPhase('select'), 2000);
      return () => clearTimeout(t);
    }
  }, [mode]);

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

  const handlePick = async (church: Church) => {
    if (mode === 'switch' && uid) {
      // Check if the target church has a director
      const hasDirector = !!church.directorUid;

      if (hasDirector) {
        // Check for existing pending request to avoid duplicates
        const existing = await getDocs(
          query(
            collection(db, 'churchJoinRequests'),
            where('fromUid', '==', uid),
            where('toChurchId', '==', church.id),
            where('status', '==', 'pending')
          )
        );
        if (existing.empty) {
          await addDoc(collection(db, 'churchJoinRequests'), {
            fromUid: uid,
            fromName: userName || 'Membro',
            fromPhoto: userPhoto || '',
            fromChurchId: selectedChurch?.id || null,
            fromChurchName: selectedChurch?.name || null,
            toChurchId: church.id,
            toChurchName: church.name,
            status: 'pending',
            createdAt: serverTimestamp(),
          });
        }
        setRequestedChurch(church.name);
        setPhase('requested');
      } else {
        // No director → allow immediate switch
        setSelectedChurch(church, uid);
        onDone();
      }
    } else {
      // First-time selection → immediate join
      setSelectedChurch(church, uid);
      onDone();
    }
  };

  if (phase === 'splash') return <SplashScreen />;

  if (phase === 'requested') {
    return <RequestSentScreen churchName={requestedChurch} onBack={onDone} />;
  }

  return (
    <SelectChurchScreen
      groups={grouped}
      search={search}
      onSearch={setSearch}
      onPick={handlePick}
      loading={loading}
      isSwitch={mode === 'switch'}
      currentChurchId={selectedChurch?.id || null}
      onCancel={mode === 'switch' ? onDone : undefined}
    />
  );
}
