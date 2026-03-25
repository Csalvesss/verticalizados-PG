export type CursoId = 'daniel' | 'apocalipse';

export interface Curso {
  id: CursoId;
  titulo: string;
  subtitulo: string;
  descricao: string;
  totalLicoes: number;
  cor: string;
  corSecundaria: string;
  icone: string; // emoji
}

export const CURSOS: Curso[] = [
  {
    id: 'daniel',
    titulo: 'Profecias de Daniel',
    subtitulo: '16 lições',
    descricao: 'Explore as grandes profecias de Daniel — dos impérios mundiais ao julgamento celestial — e descubra como a história confirma a Palavra de Deus.',
    totalLicoes: 16,
    cor: '#1a6b3c',
    corSecundaria: '#0d4a2a',
    icone: '📜',
  },
  {
    id: 'apocalipse',
    titulo: 'Apocalipse',
    subtitulo: '12 lições',
    descricao: 'Revelações de Esperança: desvendando os símbolos proféticos do Apocalipse para encontrar esperança e propósito no tempo do fim.',
    totalLicoes: 12,
    cor: '#5a1a8a',
    corSecundaria: '#3a0d5e',
    icone: '✨',
  },
];
