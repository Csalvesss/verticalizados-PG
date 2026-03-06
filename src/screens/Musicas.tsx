import { useState } from 'react';
import { Ico } from '../icons';
import { s } from '../styles';
import type { Song, Screen } from '../types';
export function MusicasScreen({songs,goTo}:{songs:Song[];goTo:(sc:Screen)=>void}) {
  const [open,setOpen] = useState<string|null>(null);
  return <div className="fade" style={s.page}>
    <div style={s.pageHeader}><button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button><div style={s.pageTitle}>MÚSICAS DA SEMANA</div></div>
    {songs.length===0&&<div style={s.empty}>Nenhuma música cadastrada ainda.</div>}
    {songs.map((song,idx)=>{const isOpen=open===song.id;return <div key={song.id} style={s.card}>
      <div style={s.cardTop} onClick={()=>setOpen(isOpen?null:song.id)}>
        <div style={s.cardNum}><span style={{fontFamily:'Bebas Neue',fontSize:34,color:'#fff',opacity:0.5}}>{idx+1}</span></div>
        <div style={{flex:1,padding:'14px 12px'}}><div style={s.cardTag}>MÚSICA</div><div style={s.cardTitle}>{song.title}</div><div style={s.cardHint}>{isOpen?'Toque para fechar':'Toque para ver a letra'}</div></div>
        {Ico.chevron(isOpen)}<div style={{width:14}}/>
      </div>
      {isOpen&&<div style={{borderTop:'1px dashed rgba(240,120,48,0.25)',padding:'16px 16px 4px'}}>
        {(song.sections||[]).map((sec,i)=><div key={i} style={{marginBottom:16,...(sec.type==='chorus'?{background:'#F07830',borderRadius:12,padding:'12px 14px'}:{}),...(sec.type==='bridge'?{borderLeft:'4px solid #F07830',paddingLeft:12}:{})}}>
          <div style={{fontFamily:'Barlow Condensed',fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase' as const,marginBottom:5,color:sec.type==='chorus'?'rgba(0,0,0,0.4)':'#D4621A'}}>{sec.label}</div>
          {sec.lines.map((line,j)=><div key={j} style={{fontFamily:'Barlow',fontSize:13.5,lineHeight:1.85,fontWeight:sec.type==='chorus'?700:500,color:sec.type==='chorus'?'#1A1A1A':'#333'}}>{line||'\u00A0'}</div>)}
        </div>)}
      </div>}
      <div style={{background:'#1A1A1A',padding:'10px 14px',display:'flex',gap:10}}>
        {song.spotify&&<a href={song.spotify} target="_blank" rel="noreferrer" style={s.btnSpotify}><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>Spotify</a>}
        {song.youtube&&<a href={song.youtube} target="_blank" rel="noreferrer" style={s.btnYoutube}><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>YouTube</a>}
      </div>
    </div>;})}
  </div>;
}
