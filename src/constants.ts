export const ADMIN_EMAIL = 'ads.cesaralves@gmail.com';
export const LANCHES = ['🧃 Suco', '🥤 Refrigerante', '🍕 Salgado', '🍰 Bolo', '🍪 Biscoito', '🫙 Outro'];

export const DEFAULT_SONGS = [
  { title:'Não Mais Eu', spotify:'https://open.spotify.com/intl-pt/track/55hYoGlIgSyI5TMTNOsSjL', youtube:'https://youtu.be/wcTCKJUEy2Y', ordem:0, letra:'', sections:[
    {label:'Verso 1',type:'verse',lines:['Foi na cruz, foi na cruz, em que ao fim percebi','Meu pecado recaiu em Jesus','Foi então, pela fé, que meus olhos abri','Que prazer sinto agora em sua luz']},
    {label:'Refrão',type:'chorus',lines:['Eu irei para a cruz, onde pude perceber','Esse amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz']},
    {label:'Bridge',type:'bridge',lines:['Não mais eu, não mais eu','É Jesus que vive em mim','Cristo vive em mim','Cristo vive em mim']},
    {label:'Final',type:'chorus',lines:['Eu irei para a cruz, onde pude perceber','Este amor que por mim foi pago','Sua mão me curou, sua morte me salvou','Eu irei, eu irei para a cruz']}
  ]},
  { title:'Digno', spotify:'https://open.spotify.com/intl-pt/track/2XtXerzRGuuHXbxOIbo44e', youtube:'https://youtu.be/ax-25gXlmBk', ordem:1, letra:'', sections:[
    {label:'Verso 1',type:'verse',lines:['Logo estaremos num lindo lugar','Com jardins e um rio de cristal','Onde andaremos na presença do Senhor']},
    {label:'Refrão',type:'chorus',lines:['Digno! É o Cordeiro bendito','Digno! Toda honra e glória a Ti','Tanto esperei por este momento','Pra sempre irei Te adorar, Digno!']},
    {label:'Bridge',type:'bridge',lines:['Cantaremos aleluia','Cantaremos aleluia','(aleluia, aleluia, aleluia...)']}
  ]},
];

export const DEFAULT_CIFRAS = [
  { title:'Não Mais Eu', tom:'G', ordem:0, cifra:'[Intro] G  D  Em  C\n\n[Verso]\nG D Em C\nFoi na cruz, foi na cruz\n\n[Refrão]\nG D\nEu irei para a cruz\nEm C\nonde pude perceber' },
  { title:'Digno', tom:'A', ordem:1, cifra:'[Intro] A  E  F#m  D\n\n[Verso]\nA E\nLogo estaremos num lindo lugar\nF#m D\nCom jardins e um rio de cristal\n\n[Refrão]\nA E\nDigno! É o Cordeiro bendito' },
];

export function getWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

export function tempoRelativo(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts?.toDate) return 'agora';
  const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export function tempoRelativoStr(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export function toHandle(name: string): string {
  return '@' + name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}
