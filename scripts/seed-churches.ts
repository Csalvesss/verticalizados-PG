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

// Lista completa — sincronizada com src/screens/Onboarding.tsx
const churches = [
  { name: "Altos de Santana", district: "São José dos Campos" },
  { name: "São José dos Campos", district: "São José dos Campos" },
  { name: "Santana", district: "São José dos Campos" },
  { name: "Monteiro Lobato", district: "São José dos Campos" },
  { name: "Bosque dos Eucaliptos", district: "São José dos Campos" },
  { name: "Bairro dos Freitas", district: "São José dos Campos" },
  { name: "Parque Novo Horizonte", district: "São José dos Campos" },
  { name: "Cidade Soberana", district: "São José dos Campos" },
  { name: "Guaratinguetá", district: "Guaratinguetá" },
  { name: "Aparecida", district: "Guaratinguetá" },
  { name: "Potim", district: "Guaratinguetá" },
  { name: "Pedregulho", district: "Guaratinguetá" },
  { name: "Taubaté", district: "Taubaté" },
  { name: "Terra Nova", district: "Taubaté" },
  { name: "Gurilândia", district: "Taubaté" },
  { name: "Redenção da Serra", district: "Taubaté" },
  { name: "Jacareí", district: "Jacareí" },
  { name: "Jd. Paraíso", district: "Jacareí" },
  { name: "Jd. Colonia", district: "Jacareí" },
  { name: "Santa Branca", district: "Jacareí" },
  { name: "Caraguatatuba", district: "Caraguatatuba" },
  { name: "Massaguaçu", district: "Caraguatatuba" },
  { name: "Morro do Algodão", district: "Caraguatatuba" },
  { name: "Rio do Ouro", district: "Caraguatatuba" },
  { name: "Tinga", district: "Caraguatatuba" },
  { name: "São Sebastião", district: "São Sebastião" },
  { name: "Ilhabela", district: "São Sebastião" },
  { name: "Maresias", district: "São Sebastião" },
  { name: "Mirante do Itatinga", district: "São Sebastião" },
  { name: "Ubatuba", district: "Ubatuba" },
  { name: "Ubatumirim", district: "Ubatuba" },
  { name: "Maranduba", district: "Ubatuba" },
  { name: "Atibaia", district: "Atibaia" },
  { name: "Bom Jesus dos Perdões", district: "Atibaia" },
  { name: "Nazaré Paulista", district: "Atibaia" },
  { name: "Piracaia", district: "Atibaia" },
  { name: "Bragança Paulista", district: "Bragança Paulista" },
  { name: "Jardim São Miguel", district: "Bragança Paulista" },
  { name: "Tanque", district: "Bragança Paulista" },
  { name: "Pedra Bela", district: "Bragança Paulista" },
  { name: "Cruzeiro", district: "Cruzeiro" },
  { name: "Queluz", district: "Cruzeiro" },
  { name: "Lorena", district: "Lorena" },
  { name: "Piquete", district: "Lorena" },
  { name: "Canas", district: "Lorena" },
  { name: "Guarulhos", district: "Guarulhos" },
  { name: "Gopoúva", district: "Guarulhos" },
  { name: "Vila Augusta", district: "Guarulhos" },
  { name: "Itapegica", district: "Guarulhos" },
  { name: "Mogi das Cruzes", district: "Mogi das Cruzes" },
  { name: "Nipônico", district: "Mogi das Cruzes" },
  { name: "Taiaçupeba", district: "Mogi das Cruzes" },
  { name: "Ferraz de Vasconcelos", district: "Ferraz de Vasconcelos" },
  { name: "Nove de Julho", district: "Ferraz de Vasconcelos" },
  { name: "Poá", district: "Poá" },
  { name: "Arizona", district: "Poá" },
  { name: "Calmon Viana", district: "Poá" },
  { name: "Suzano", district: "Suzano" },
  { name: "Jd. Leblon", district: "Suzano" },
  { name: "Aruja", district: "Aruja" },
  { name: "Mirante", district: "Aruja" },
  { name: "Maria Rosa III", district: "Aruja" },
  { name: "Itaquaquecetuba", district: "Itaquaquecetuba" },
  { name: "Jd. do Vale", district: "Itaquaquecetuba" },
  { name: "Monte Belo", district: "Itaquaquecetuba" },
  { name: "Independência", district: "Campos do Jordão" },
  { name: "Campos do Jordão", district: "Campos do Jordão" },
  { name: "São Bento do Sapucaí", district: "Campos do Jordão" },
  { name: "Biritiba Mirim", district: "Biritiba Mirim" },
  { name: "Salesópolis", district: "Biritiba Mirim" },
  { name: "Cocuéra", district: "Biritiba Mirim" },
  { name: "Bananal", district: "Bananal" },
  { name: "Boa Esperança", district: "Bananal" },
  { name: "Fazendinha", district: "Bananal" },
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
