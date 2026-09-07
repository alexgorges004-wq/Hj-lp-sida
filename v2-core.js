(() => {
  const cfg = window.LIVESTREAM_SUPABASE;
  if (!cfg?.url || !cfg?.key || !window.supabase) return;

  const supa = window.supabase.createClient(cfg.url, cfg.key);
  const S = window.LH2 = window.LH2 || {};
  S.supa = supa;
  S.hooks = S.hooks || { home: [], page: [], admin: [] };
  S.state = S.state || { cloudReady:false, updatedAt:null, lastSnapshot:null, user:null, role:"admin" };

  S.clone = (v) => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  S.esc = (v="") => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  S.uid = (p="id") => `${p}-${(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0,12)}`;
  S.setStatus = (text, good=true) => {
    const el=document.getElementById("saveState"), dot=document.getElementById("saveDot");
    if(el) el.textContent=text;
    if(dot) dot.className=good?"dot good":"dot";
  };
  S.ensureData = () => {
    if(!data || typeof data!=="object") data={};
    if(!data.settings || typeof data.settings!=="object") data.settings={};
    if(!data.pages || typeof data.pages!=="object") data.pages={};
    if(!Array.isArray(data.categories)) data.categories=[];
    if(!data.homeTextBlocks || typeof data.homeTextBlocks!=="object" || Array.isArray(data.homeTextBlocks)) data.homeTextBlocks={};
    if(!data.settings._v2TextInit){
      if(!Object.keys(data.homeTextBlocks).length) data.homeTextBlocks["mistakes-ok"]={title:"DET ÄR OKEJ ATT GÖRA MISSTAG",text:"",style:"encouragement"};
      data.settings._v2TextInit=true;
    }
    if(!data.globals || typeof data.globals!=="object" || Array.isArray(data.globals)) data.globals={};
    if(!Array.isArray(data.versionHistory)) data.versionHistory=[];
    if(!data.streamDeck || typeof data.streamDeck!=="object") data.streamDeck={};
    if(!Array.isArray(data.streamDeck.buttons)) data.streamDeck.buttons=[];
    while(data.streamDeck.buttons.length<32) data.streamDeck.buttons.push({label:"",description:"",accent:"neutral"});
    data.streamDeck.buttons=data.streamDeck.buttons.slice(0,32);
    if(!Array.isArray(data.deletedGuides)) data.deletedGuides=[];
    if(!Array.isArray(data.deletedCategories)) data.deletedCategories=[];
  };
  S.snapshot = (src=data) => { const x=S.clone(src); delete x.versionHistory; return x; };
  S.resolve = (value="") => { S.ensureData(); return String(value).replace(/\{\{([A-Z0-9_]+)\}\}/g,(m,k)=>data.globals?.[k]===undefined||data.globals[k]===""?m:String(data.globals[k])); };
  S.applyVars = (root) => {
    if(!root) return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), nodes=[];
    while(w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n=>{ if(n.nodeValue?.includes("{{")) n.nodeValue=S.resolve(n.nodeValue); });
  };

  function banner(message, actionLabel="", action=null){
    let b=document.getElementById("v2CloudBanner");
    if(!b){
      b=document.createElement("div"); b.id="v2CloudBanner"; b.className="v2-cloud-banner hidden";
      const bar=document.getElementById("adminBar"); (bar?.parentNode||document.body).insertBefore(b,bar?.nextSibling||null);
    }
    if(!message){ b.classList.add("hidden"); b.innerHTML=""; return; }
    b.classList.remove("hidden");
    b.innerHTML=`<span>${S.esc(message)}</span>${actionLabel?`<button class="btn small" id="v2CloudAction" type="button">${S.esc(actionLabel)}</button>`:""}`;
    const btn=document.getElementById("v2CloudAction"); if(btn&&action) btn.onclick=action;
  }
  S.banner=banner;

  async function fetchCloud(){
    let last;
    for(let i=0;i<2;i++){
      const {data:row,error}=await supa.from("guide_data").select("content,updated_at").eq("id","main").maybeSingle();
      if(!error&&row?.content) return row;
      last=error||new Error("Ingen guide-data hittades.");
      if(i===0) await new Promise(r=>setTimeout(r,450));
    }
    throw last;
  }

  S.reload = async () => {
    try{
      S.setStatus("Laddar…",false);
      const row=await fetchCloud();
      data=row.content; S.ensureData();
      S.state.updatedAt=row.updated_at; S.state.lastSnapshot=S.snapshot(data); S.state.cloudReady=true;
      banner("");
      renderHome(); if(currentPage&&data.pages?.[currentPage]) renderPage(currentPage);
      S.setStatus(admin?"Ansluten":"Online",true);
      return true;
    }catch(err){
      console.error(err); S.state.cloudReady=false; S.setStatus("Kunde inte läsa data",false);
      banner("Kunde inte läsa senaste innehållet från Supabase. Redigering är blockerad tills anslutningen fungerar.","Försök igen",S.reload);
      return false;
    }
  };

  S.save = async () => {
    if(!admin) throw new Error("Du måste vara inloggad som admin för att spara.");
    if(!S.state.cloudReady||!S.state.updatedAt) throw new Error("Sidan är inte synkroniserad med Supabase ännu.");
    S.ensureData(); S.setStatus("Sparar…",false);

    const {data:remote,error:readError}=await supa.from("guide_data").select("updated_at").eq("id","main").maybeSingle();
    if(readError||!remote) throw new Error(readError?.message||"Kunde inte kontrollera senaste versionen.");
    if(remote.updated_at!==S.state.updatedAt){
      banner("Sidan har ändrats av någon annan sedan du öppnade den. Ladda senaste versionen innan du sparar.","Ladda senaste",S.reload);
      S.setStatus("Nyare version finns",false);
      const e=new Error("Sidan har ändrats av en annan admin. Ladda senaste versionen och försök igen."); e.code="CONTENT_CONFLICT"; throw e;
    }

    const nowSnapshot=S.snapshot(data);
    let historyId=null;
    if(S.state.lastSnapshot&&JSON.stringify(nowSnapshot)!==JSON.stringify(S.state.lastSnapshot)){
      historyId=S.uid("rev");
      data.versionHistory.unshift({id:historyId,at:new Date().toISOString(),by:S.state.user?.email||"Admin",snapshot:S.clone(S.state.lastSnapshot)});
      data.versionHistory=data.versionHistory.slice(0,20);
    }
    const stamp=new Date().toISOString();
    const {data:saved,error}=await supa.from("guide_data").update({content:data,updated_at:stamp}).eq("id","main").eq("updated_at",S.state.updatedAt).select("updated_at").maybeSingle();
    if(error||!saved){
      if(historyId) data.versionHistory=data.versionHistory.filter(x=>x.id!==historyId);
      if(!error&&!saved){ banner("Sidan hann ändras av någon annan. Ladda senaste versionen.","Ladda senaste",S.reload); const e=new Error("Sidan har ändrats av en annan admin."); e.code="CONTENT_CONFLICT"; throw e; }
      throw new Error(error?.message||"Kunde inte spara.");
    }
    S.state.updatedAt=saved.updated_at; S.state.lastSnapshot=S.snapshot(data); banner(""); S.setStatus("Sparat online",true); toast("Sparat online");
    return saved;
  };
  S.save._statusWrapped=true;

  S.deleteStorage = async (paths=[]) => {
    const unique=[...new Set(paths.filter(Boolean))]; if(!unique.length) return;
    const {error}=await supa.storage.from("guide-images").remove(unique); if(error) console.warn("Kunde inte städa media",error);
  };
  S.upload = async (file,pageKey,index,type) => {
    const image=type==="image", ext=(file.name.split(".").pop()||"").toLowerCase();
    if(image){ if(!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Screenshot måste vara PNG, JPG eller WebP."); if(file.size>5*1024*1024) throw new Error("Screenshoten är större än 5 MB."); }
    else { if(!/^(video\/(mp4|webm|quicktime))$/.test(file.type)&&!["mp4","webm","mov"].includes(ext)) throw new Error("Skärminspelningen måste vara MP4, WebM eller MOV."); if(file.size>50*1024*1024) throw new Error("Skärminspelningen är större än 50 MB."); }
    const safe=(file.name||"file").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-70);
    const path=`${pageKey}/${image?"image":"video"}-${Date.now()}-${index+1}-${S.uid("f")}-${safe}`;
    const contentType=file.type||(image?"image/jpeg":ext==="webm"?"video/webm":ext==="mov"?"video/quicktime":"video/mp4");
    const {error}=await supa.storage.from("guide-images").upload(path,file,{upsert:false,cacheControl:"3600",contentType});
    if(error) throw new Error(`Kunde inte ladda upp filen: ${error.message}`);
    const {data:pub}=supa.storage.from("guide-images").getPublicUrl(path); return {path,url:pub.publicUrl};
  };

  async function adminState(){
    const {data:{session}}=await supa.auth.getSession(); S.state.user=session?.user||null;
    if(!S.state.user) return {ok:false,role:"admin"};
    const r=await supa.from("admins").select("role").eq("user_id",S.state.user.id).maybeSingle();
    if(!r.error&&r.data) return {ok:true,role:r.data.role==="owner"?"owner":"admin"};
    const legacy=await supa.from("admins").select("user_id").eq("user_id",S.state.user.id).maybeSingle();
    return !legacy.error&&legacy.data?{ok:true,role:"owner"}:{ok:false,role:"admin"};
  }
  S.getAdminState=adminState;
  S.updateIdentity=()=>{ const e=document.getElementById("adminUserText"); if(e) e.textContent=S.state.user?`${S.state.user.email||"Admin"} · ${S.state.role==="owner"?"Ägare":"Admin"}`:"–"; };
  S.markDirty=(id="editPageModal")=>{ const m=document.getElementById(id); if(m) m.dataset.dirty="1"; };

  const css=document.createElement("style");
  css.textContent=`.v2-cloud-banner{max-width:1080px;margin:10px auto 0;padding:10px 16px;border:1px solid #7b4a4a;border-radius:12px;background:#2b171b;color:#ffd1d1;display:flex;align-items:center;justify-content:space-between;gap:12px}.v2-cloud-banner.hidden{display:none!important}@media(max-width:720px){.v2-cloud-banner{margin:8px 12px 0;flex-direction:column;align-items:stretch}}`;
  document.head.appendChild(css);

  let installed=false;
  function install(){
    if(installed) return; installed=true;
    const rh=renderHome; renderHome=function(){ S.ensureData(); rh(); S.hooks.home.forEach(fn=>{try{fn()}catch(e){console.error(e)}}); S.applyVars(document.getElementById("homeView")); };
    const rp=renderPage; renderPage=function(k){ rp(k); S.applyVars(document.getElementById("pageView")); S.hooks.page.forEach(fn=>{try{fn(k)}catch(e){console.error(e)}}); };
    const sa=showAdmin; showAdmin=function(){ sa(); S.updateIdentity(); S.hooks.admin.forEach(fn=>{try{fn()}catch(e){console.error(e)}}); };
    const uv=updateAdminView; updateAdminView=function(){ try{uv()}catch{} S.updateIdentity(); S.hooks.admin.forEach(fn=>{try{fn()}catch(e){console.error(e)}}); };
    saveContent=S.save;
  }

  async function routeInitial(ok){
    const wanted=String(window.__initialHash||location.hash||"#home").replace(/^#/,"");
    if(!ok) return;
    if(wanted==="admin"&&admin) showAdmin();
    else if(wanted&&wanted!=="home"&&data.pages?.[wanted]) showPage(wanted);
    else showHome();
  }

  async function bootstrap(){
    const ok=await S.reload();
    const a=await adminState(); S.state.role=a.role; setAdmin(a.ok); S.updateIdentity();
    await routeInitial(ok);
  }

  supa.auth.onAuthStateChange((_event,session)=>setTimeout(async()=>{ S.state.user=session?.user||null; const a=await adminState(); S.state.role=a.role; setAdmin(a.ok); S.updateIdentity(); },0));
  window.addEventListener("unhandledrejection",e=>{ const m=e.reason?.message; if(m&&(e.reason?.code==="CONTENT_CONFLICT"||/spara|ändrats|Supabase/i.test(m))){toast(m);e.preventDefault();} });
  window.addEventListener("load",()=>{ install(); setTimeout(()=>{ saveContent=S.save; renderHome(); },20); bootstrap(); });
})();