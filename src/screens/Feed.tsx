import { useState, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Ico } from '../icons';
import { s } from '../styles';
import { tempoRelativo } from '../constants';
import type { Post, CurrentUser, Screen } from '../types';
interface Props { posts:Post[]; loading:boolean; currentUser:CurrentUser; isAdmin:boolean; uid:string; goTo:(sc:Screen)=>void; }
export function FeedScreen({posts,loading,currentUser,isAdmin,uid,goTo}:Props) {
  const [text,setText] = useState(''); const [img,setImg] = useState<string|null>(null);
  const [commentingOn,setCommentingOn] = useState<string|null>(null); const [commentText,setCommentText] = useState('');
  const [repostingOn,setRepostingOn] = useState<string|null>(null); const [repostText,setRepostText] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);
  const postar = async () => { if(!text.trim()&&!img) return; const t=text,i=img; setText(''); setImg(null); await addDoc(collection(db,'posts'),{user:currentUser.name,userId:uid,photo:currentUser.photo,text:t,imageUrl:i||null,likes:[],comments:[],createdAt:serverTimestamp()}); };
  const curtir = async (p:Post) => { await updateDoc(doc(db,'posts',p.id),{likes:p.likes?.includes(uid)?arrayRemove(uid):arrayUnion(uid)}); };
  const comentar = async (id:string) => { if(!commentText.trim()) return; await updateDoc(doc(db,'posts',id),{comments:arrayUnion({user:currentUser.name,userId:uid,photo:currentUser.photo,text:commentText,time:new Date().toISOString()})}); setCommentText(''); setCommentingOn(null); };
  const repostar = async (p:Post) => { await addDoc(collection(db,'posts'),{user:currentUser.name,userId:uid,photo:currentUser.photo,text:repostText,imageUrl:null,likes:[],comments:[],createdAt:serverTimestamp(),repostOf:{user:p.user,text:p.text}}); setRepostText(''); setRepostingOn(null); };
  const deletar = async (id:string) => { await deleteDoc(doc(db,'posts',id)); };
  const handleImg = (e:React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{if(ev.target?.result) setImg(ev.target.result as string);}; r.readAsDataURL(f); };
  return <div className="fade">
    <div style={s.instaHeader}><button style={s.backBtn} onClick={()=>goTo('home')}>{Ico.back()}</button><div style={s.pageTitle}>FEED DO PG</div><div style={{width:32}}/></div>
    <div style={{background:'#FFF8F0',borderBottom:'1px solid #ede8e0',padding:'12px 14px'}}>
      <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
        <img src={currentUser.photo} style={s.avatarFeed} alt=""/>
        <div style={{flex:1,minWidth:0}}>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Compartilhe algo com o PG..." style={{...s.textarea,border:'none',background:'transparent',padding:'4px 0',fontSize:14,color:'#1A1A1A',textAlign:'left' as const,resize:'none',minHeight:40}} rows={2}/>
          {img&&<div style={{position:'relative' as const,marginTop:8}}><img src={img} style={{width:'100%',borderRadius:12,maxHeight:180,objectFit:'cover' as const}} alt=""/><button onClick={()=>setImg(null)} style={{position:'absolute' as const,top:6,right:6,background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'50%',width:24,height:24,color:'#fff',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button></div>}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,paddingTop:8,borderTop:'1px solid #ede8e0'}}>
        <button onClick={()=>imgRef.current?.click()} style={{...s.iconBtn,gap:6,fontFamily:'Barlow',fontSize:12,color:'#aaa'}}>{Ico.image()} <span>Foto</span></button>
        <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} style={{display:'none'}}/>
        <button onClick={postar} disabled={!text.trim()&&!img} style={{...s.btnOrange,padding:'8px 22px',fontSize:13,opacity:(!text.trim()&&!img)?0.5:1}}>Publicar</button>
      </div>
    </div>
    {loading&&<div style={s.empty}>Carregando...</div>}
    {!loading&&posts.length===0&&<div style={s.empty}>Nenhum post ainda. Seja o primeiro! 🙌</div>}
    {posts.map(post=>{const liked=post.likes?.includes(uid); const podeApagar=post.userId===uid||isAdmin; return <div key={post.id} style={{background:'#FFF8F0',borderBottom:'1px solid #ede8e0'}}>
      {post.repostOf&&<div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px 0',color:'#aaa',fontFamily:'Barlow',fontSize:11}}>{Ico.repost('#ccc')} <span>{post.user} repostou</span></div>}
      <div style={{display:'flex',gap:10,padding:'12px 14px 0',alignItems:'flex-start'}}>
        <img src={post.photo} style={{...s.avatarFeed,flexShrink:0}} alt=""/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><span style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:15,color:'#1A1A1A'}}>{post.user}</span><span style={{fontFamily:'Barlow',fontSize:12,color:'#bbb',marginLeft:5}}>· {tempoRelativo(post.createdAt)}</span></div>
            {podeApagar&&<button onClick={()=>deletar(post.id)} style={{...s.iconBtn,color:'#ddd'}}>{Ico.trash()}</button>}
          </div>
          {post.repostOf&&<div style={{border:'1.5px solid #ede8e0',borderRadius:10,padding:'8px 12px',marginTop:6,background:'#faf7f3'}}><div style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,color:'#888'}}>{post.repostOf.user}</div><div style={{fontFamily:'Barlow',fontSize:13,color:'#555',lineHeight:1.6,textAlign:'left' as const}}>{post.repostOf.text}</div></div>}
          {post.text&&<div style={{fontFamily:'Barlow',fontSize:14,color:'#1A1A1A',lineHeight:1.7,marginTop:4,textAlign:'left' as const,wordBreak:'break-word' as const}}>{post.text}</div>}
        </div>
      </div>
      {post.imageUrl&&<img src={post.imageUrl} style={{width:'100%',maxHeight:320,objectFit:'cover' as const,marginTop:8,display:'block'}} alt=""/>}
      <div style={{display:'flex',padding:'4px 14px 4px 60px',borderTop:'1px solid #f5f0ea',marginTop:8}}>
        <button className="post-action" onClick={()=>curtir(post)} style={{...s.actionBtn,color:liked?'#F07830':'#999',flex:1,justifyContent:'center',padding:'8px 0'}}>{Ico.heart(liked||false)} <span style={{fontSize:13,marginLeft:4}}>{post.likes?.length||0}</span></button>
        <button className="post-action" onClick={()=>setCommentingOn(commentingOn===post.id?null:post.id)} style={{...s.actionBtn,color:'#999',flex:1,justifyContent:'center',padding:'8px 0'}}>{Ico.comment()} <span style={{fontSize:13,marginLeft:4}}>{post.comments?.length||0}</span></button>
        <button className="post-action" onClick={()=>setRepostingOn(repostingOn===post.id?null:post.id)} style={{...s.actionBtn,color:'#999',flex:1,justifyContent:'center',padding:'8px 0'}}>{Ico.repost()} <span style={{fontSize:13,marginLeft:4}}>Repostar</span></button>
      </div>
      {post.comments?.length>0&&<div style={{padding:'0 14px 8px 60px',display:'flex',flexDirection:'column' as const,gap:6}}>{post.comments.map((c,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}><img src={c.photo} style={{width:24,height:24,borderRadius:'50%',flexShrink:0}} alt=""/><div style={{background:'#f5f0ea',borderRadius:12,padding:'6px 10px',flex:1,minWidth:0}}><span style={{fontFamily:'Barlow Condensed',fontWeight:700,fontSize:12,color:'#555'}}>{c.user} </span><span style={{fontFamily:'Barlow',fontSize:13,color:'#444',wordBreak:'break-word' as const}}>{c.text}</span></div></div>)}</div>}
      {commentingOn===post.id&&<div style={{display:'flex',gap:8,padding:'0 14px 10px 60px',alignItems:'center'}}><input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&comentar(post.id)} placeholder="Comentar..." style={{flex:1,border:'1px solid #ede8e0',borderRadius:20,padding:'8px 14px',fontFamily:'Barlow',fontSize:13,color:'#1A1A1A',background:'#fff',outline:'none'}}/><button onClick={()=>comentar(post.id)} style={{...s.btnOrange,padding:'7px 14px',fontSize:13}}>↑</button></div>}
      {repostingOn===post.id&&<div style={{margin:'0 14px 10px',background:'#faf7f3',borderRadius:10,padding:12,border:'1px solid #ede8e0'}}><div style={{fontFamily:'Barlow Condensed',fontSize:10,fontWeight:700,letterSpacing:2,color:'#D4621A',marginBottom:8}}>REPOSTAR COM COMENTÁRIO (opcional)</div><textarea value={repostText} onChange={e=>setRepostText(e.target.value)} placeholder="Adicione seu comentário..." style={{...s.textarea,marginBottom:10,minHeight:50,color:'#1A1A1A',textAlign:'left' as const}} rows={2}/><div style={{display:'flex',gap:8}}><button onClick={()=>repostar(post)} style={s.btnOrange}>Repostar</button><button onClick={()=>setRepostingOn(null)} style={{...s.btnOrange,background:'#e0e0e0',color:'#666'}}>Cancelar</button></div></div>}
    </div>;})}
  </div>;
}
