import type { Timestamp } from 'firebase/firestore';

export type Screen =
  | 'home'
  | 'musicas'
  | 'cifras'
  | 'oracao'
  | 'feed'
  | 'eventos'
  | 'perfil'
  | 'admin'
  | 'comunhao'
  | 'notificacoes'
  | 'buscar'
  | 'jogandoEmComunhao'
  | 'userPerfil'
  | 'onboarding';

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

export interface Reply {
  id: string;
  user: string;
  userId: string;
  photo: string;
  text: string;
  time: string;
}

export interface Comment {
  id?: string;
  user: string;
  userId: string;
  photo: string;
  text: string;
  time: string;
  replies?: Reply[];
}

export interface RepostOf {
  user: string;
  text: string;
  imageUrl?: string;
  userEmail?: string;
}

export interface Post {
  id: string;
  user: string;
  userId: string;
  photo: string;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
  createdAt: Timestamp | null;
  repostOf?: RepostOf;
  userEmail?: string;
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

export interface Notificacao {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto: string;
  type: 'like' | 'comment' | 'repost' | 'reply';
  postText: string;
  postId?: string;
  postImageUrl?: string;
  read: boolean;
  createdAt: import('firebase/firestore').Timestamp | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  fullName: string;
  photo: string;
  email: string;
  username?: string;
  bio?: string;
  link?: string;
  pinnedPostId?: string;
}