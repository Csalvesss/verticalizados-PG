import { useState } from 'react';
import { doc, setDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import { getWeekKey } from '../constants';
import type { Screen, Sorteio } from '../types';
interface Props { goTo:(sc:Screen)=>void; currentUserName:string; membrosLista:string[]; sorteioSemana:Sorteio|null; isAdmin:boolean; }
export function OracaoScreen({goTo,currentUserName,membrosLista,sorteioSemana,isAdmin}:Props) {
  const [sorteando,setSorteando] = useState(false);
  const sorteadoAtual = sorteioSemana?.sorteado||null;
  const jaOrou = sorteioSemana?.historico||[];
  const disponiveis = membrosLista.filter(m=>m!==currentUserName&&!jaOrou.includes(m));
  const sortear = async () => {
    if(!disponiveis.length) return; setSorteando(true); let count=0; const pool=[...disponiveis];
    const iv = setInterval(async()=>{ count++; if(count>18){ clearInterval(iv); const escolhido=pool[Math.floor(Math.random()*pool.length)]; await setDoc(doc(db,'sorteios',getWeekKey()),{sorteado:escolhido,historico:arrayUnion(escolhido),semana:getWeekKey()},{merge:true}); setSorteando(false); }},90);
  };
  const resetar = async () => { if(!window.confirm('Resetar o sorteio desta semana?')) return; await deleteDoc(doc(db,'sorteios',getWeekKey())); };
  return <div className="fade" style={s.page}>
    <div style={{...s.pageHeader,justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}><button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button><div style={s.pageTitle}>ORAÇÃO DA SEMANA</div></div>
      {isAdmin&&<button onClick={resetar} style={{background:'rgba(229,57,53,0.1)',border:'1px solid rgba(229,57,53,0.3)',borderRadius:50,padding:'6px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:'Barlow Condensed',fontWeight:700,fontSize:11,letterSpacing:1,color:'#e53935'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>RESETAR</button>}
    </div>
    <div style={{...s.card,padding:22,marginBottom:14}}>
      <div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:3,color:'#D4621A',marginBottom:12,textAlign:'center' as const}}>ESTA SEMANA VOCÊ ORA POR</div>
      <div style={{background:'#1A1A1A',borderRadius:16,padding:'24px 16px',marginBottom:18,minHeight:90,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center'}}>
        {sorteadoAtual?<><div style={{fontFamily:'Bebas Neue',fontSize:48,color:'#F07830',letterSpacing:3}}>{sorteadoAtual}</div><div style={{fontFamily:'Barlow',fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:6}}>Interceda por {sorteadoAtual} esta semana 🙏</div></>:<div style={{fontFamily:'Barlow',fontSize:13,color:'rgba(255,255,255,0.3)'}}>{sorteando?'Sorteando...':'Nenhum sorteio ainda'}</div>}
      </div>
      {!sorteadoAtual&&disponiveis.length>0&&<button onClick={sortear} disabled={sorteando} style={{...s.btnOrange,width:'100%',justifyContent:'center',gap:8}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="#fff"/><circle cx="16" cy="8" r="1.5" fill="#fff"/><circle cx="8" cy="16" r="1.5" fill="#fff"/><circle cx="16" cy="16" r="1.5" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>{sorteando?'Sorteando...':'Sortear membro para orar'}</button>}
      {sorteadoAtual&&<div style={{background:'rgba(240,120,48,0.1)',borderRadius:10,padding:'10px 14px',textAlign:'center' as const}}><div style={{fontFamily:'Barlow',fontSize:12,color:'#1A1A1A',lineHeight:1.6}}>Ore por <strong style={{color:'#D4621A'}}>{sorteadoAtual}</strong> durante a semana!</div></div>}
    </div>
    <div style={{...s.card,padding:16}}>
      <div style={s.cardTag}>MEMBROS DO PG</div>
      <div style={{display:'flex',flexWrap:'wrap' as const,gap:8,marginTop:10}}>
        {membrosLista.filter(m=>m!==currentUserName).map(m=><div key={m} style={{fontFamily:'Barlow',fontSize:12,padding:'5px 14px',borderRadius:50,fontWeight:600,background:m===sorteadoAtual?'#F07830':jaOrou.includes(m)?'#e8e8e8':'#f5f5f5',color:m===sorteadoAtual?'#fff':jaOrou.includes(m)?'#bbb':'#555',textDecoration:jaOrou.includes(m)&&m!==sorteadoAtual?'line-through':'none'}}>{m}</div>)}
      </div>
      {jaOrou.length>0&&<div style={{fontFamily:'Barlow',fontSize:11,color:'#bbb',marginTop:10}}>Riscados = já foram sorteados anteriormente</div>}
    </div>
  </div>;
}
