import { Ico } from '../icons';
import { s } from '../styles';
import type { Screen } from '../types';
const NAV = [{id:'home' as Screen,label:'Início',icon:Ico.home},{id:'musicas' as Screen,label:'Músicas',icon:Ico.music},{id:'cifras' as Screen,label:'Cifras',icon:Ico.guitar},{id:'oracao' as Screen,label:'Oração',icon:Ico.pray},{id:'feed' as Screen,label:'Feed',icon:Ico.feed},{id:'eventos' as Screen,label:'Eventos',icon:Ico.event}];
export function BottomNav({screen,goTo}:{screen:Screen;goTo:(sc:Screen)=>void}) {
  return <div style={s.bottomNav}>{NAV.map(item=>{const active=screen===item.id;return <button key={item.id} onClick={()=>goTo(item.id)} style={{...s.navBtn,background:active?'rgba(240,120,48,0.12)':'transparent'}}>{item.icon(active?'#F07830':'#555')}<span style={{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:0.5,color:active?'#F07830':'#555'}}>{item.label}</span></button>;})}</div>;
}
