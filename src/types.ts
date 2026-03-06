export type Screen = 'home' | 'musicas' | 'cifras' | 'oracao' | 'feed' | 'eventos' | 'perfil' | 'admin';

export interface CurrentUser {
  uid: string;
  name: string;
  fullName: string;
  photo: string;
  email: string;
}

export interface Section {
  label: string;
  type: 'verse' | 'chorus' | 'bridge';
  lines: string[];
}

export interface Song {
  id: string;
  title: string;
  spotify?: string;
  youtube?: string;
  ordem: number;
  sections?: Section[];
  letra?: string;
}

export interface Cifra {
  id: string;
  title: string;
  tom: string;
  cifra: string;
  ordem: number;
}

export interface Evento {
  id: string;
  tema: string;
  data: string;
  hora: string;
  local: string;
}

export interface Post {
  id: string;
  user: string;
  userId: string;
  photo: string;
  text: string;
  imageUrl?: string | null;
  likes: string[];
  comments: Comment[];
  createdAt: any;
  repostOf?: { user: string; text: string; imageUrl?: string | null };
}

export interface Comment {
  user: string;
  userId: string;
  photo: string;
  text: string;
  time: string;
}

export interface Confirmacao {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  eventoId: string;
  lanche: string | null;
  hora: string;
}

export interface Sorteio {
  sorteado: string;
  historico: string[];
  semana: string;
}
