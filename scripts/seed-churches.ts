/**
 * Script para popular as igrejas da APV no Firestore.
 * Uso: npx ts-node scripts/seed-churches.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista completa — sincronizada com src/screens/Onboarding.tsx (280 igrejas, fonte oficial APV)
const churches = [
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

async function seed() {
  const churchesRef = collection(db, 'churches');
  let count = 0;
  for (const church of churches) {
    const id = toSlug(church.name);
    await setDoc(doc(churchesRef, id), {
      ...church,
      associationId: 'APV',
      directorUid: null,
      createdAt: new Date(),
    }, { merge: true });
    count++;
    console.log(`✓ [${count}/${churches.length}] ${church.name} (${church.district})`);
  }
  console.log(`\n✅ ${count} igrejas populadas com sucesso!`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
