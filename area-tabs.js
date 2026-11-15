(() => {
  const S = window.LH2;
  if (!S) return;

  const PALETTE = ["#7357ff","#e05b47","#2687d8","#2e9b6f","#c78b24","#b14fc7","#2b9aa5","#d14b77"];
  let activeArea = "";
  let pendingArea = "";
  let categoryIdsBeforeAdd = null;
  let savingAssignment = false;

  const makeId = () => "area-" + ((globalThis.crypto?.randomUUID?.() || (Date.now()+"-"+Math.random().toString(36).slice(2))).slice(0,12));

  function ensureAreas() {
    S.ensureData();
    if (!Array.isArray(data.areas) || !data.areas.length) {
      data.areas = [{ id:"livestream", title:"Livestream", icon:"🔴", color:PALETTE[0] }];
    }
    data.areas = data.areas.filter(a=>a&&a.id).map((a,i)=>({
      id:String(a.id),
      title:String(a.title||"Namnlös flik"),
      icon:String(a.icon||"📁"),
      color:String(a.color||PALETTE[i%PALETTE.length])
    }));
    if (!data.areaCategories || typeof data.areaCategories !== "object" || Array.isArray(data.areaCategories)) data.areaCategories = {};
    const ids = new Set(data.areas.map(a=>a.id));
    const fallback = data.areas[0]?.id || "livestream";
    (data.categories||[]).forEach(cat=>{
      if (!ids.has(data.areaCategories[cat.id])) data.areaCategories[cat.id]=fallback;
    });
    if (activeArea && !ids.has(activeArea)) activeArea="";
  }

  function areaForPage(key) {
    ensureAreas();
    const group=data.pages?.[key]?.group;
    const areaId=group ? data.areaCategories[group] : "";
    return data.areas.find(a=>a.id===areaId) || null;
  }

  function currentArea() {
    ensureAreas();
    return data.areas.find(a=>a.id===activeArea) || null;
  }

  function ensureGlobalNav() {
    let nav=document.getElementById("globalAreaNav");
    if(nav) return nav;
    const top=document.querySelector(".topbar");
    if(!top) return null;
    nav=document.createElement("div");
    nav.id="globalAreaNav";
    nav.className="area-global-nav";
    top.appendChild(nav);
    return nav;
  }

  function renderGlobalNav(highlightId=activeArea) {
    ensureAreas();
    const nav=ensureGlobalNav();
    if(!nav)return;
    nav.innerHTML=`<div class="area-global-nav-inner">
      <button class="area-home-link ${!highlightId?"active":""}" data-area-home type="button">Hem</button>
      ${data.areas.map(a=>`<button class="area-nav-tab ${a.id===highlightId?"active":""}" data-area-nav="${S.esc(a.id)}" type="button" style="--area-color:${S.esc(a.color)}"><span>${S.esc(a.icon)}</span>${S.esc(a.title)}</button>`).join("")}
      ${admin?'<button class="area-manage-top" id="manageAreasTopBtn" type="button">⚙ Hantera flikar</button>':""}
    </div>`;
  }

  function ensurePortal() {
    const home=document.getElementById("homeView");
    if(!home)return null;
    let portal=document.getElementById("areaPortal");
    if(!portal){
      portal=document.createElement("section");
      portal.id="areaPortal";
      home.prepend(portal);
    }
    return portal;
  }

  function renderPortal() {
    const portal=ensurePortal();
    if(!portal)return;
    portal.innerHTML=`<div class="area-portal-title"><div class="kicker">Hjälpcenter</div><h1>Vad behöver du hjälp med?</h1><p>Välj ett område för att öppna guider och instruktioner.</p></div>
      <div class="area-portal-grid">${data.areas.map(a=>`<button class="area-portal-card" data-area-nav="${S.esc(a.id)}" type="button" style="--area-color:${S.esc(a.color)}"><span class="area-portal-icon">${S.esc(a.icon)}</span><strong>${S.esc(a.title)}</strong><span>Öppna →</span></button>`).join("")}</div>`;
  }

  function ensureAreaPageHead() {
    const home=document.getElementById("homeView");
    if(!home)return null;
    let head=document.getElementById("areaPageHead");
    if(!head){
      head=document.createElement("div");
      head.id="areaPageHead";
      const layout=document.getElementById("v2HomeLayout");
      if(layout) home.insertBefore(head,layout);
      else home.prepend(head);
    }
    return head;
  }

  function decorateCategoryArea(section, categoryId) {
    const controls=section.querySelector(".category-admin-controls");
    if(!controls)return;
    let select=controls.querySelector(".category-area-select");
    if(!select){
      select=document.createElement("select");
      select.className="category-area-select";
      select.dataset.categoryArea=categoryId;
      select.title="Flytta kategorin till en annan flik";
      controls.prepend(select);
    }
    select.innerHTML=data.areas.map(a=>`<option value="${S.esc(a.id)}">${S.esc(a.icon)} ${S.esc(a.title)}</option>`).join("");
    select.value=data.areaCategories[categoryId]||data.areas[0]?.id||"";
  }

  function applyHomeMode() {
    ensureAreas();
    renderGlobalNav(activeArea);
    const portal=ensurePortal();
    const head=ensureAreaPageHead();
    const hero=document.querySelector("#homeView .hero");
    const toolbar=document.querySelector(".front-admin-toolbar");
    const homeTexts=document.querySelectorAll("#homeView .home-text-block");
    const categories=document.querySelectorAll(".front-category[data-category]");

    if(!activeArea){
      renderPortal();
      portal?.classList.remove("hidden");
      head?.classList.add("hidden");
      hero?.classList.add("area-structure-hidden");
      toolbar?.classList.add("area-structure-hidden");
      homeTexts.forEach(n=>n.classList.add("area-structure-hidden"));
      categories.forEach(n=>n.classList.add("area-hidden"));
      return;
    }

    const area=currentArea();
    portal?.classList.add("hidden");
    hero?.classList.add("area-structure-hidden");
    homeTexts.forEach(n=>n.classList.add("area-structure-hidden"));
    if(head){
      head.classList.remove("hidden");
      head.innerHTML=`<div class="area-page-heading" style="--area-color:${S.esc(area?.color||PALETTE[0])}"><span class="area-page-icon">${S.esc(area?.icon||"📁")}</span><div><div class="kicker">Område</div><h1>${S.esc(area?.title||"")}</h1><p>Välj en guide eller instruktion nedan.</p></div></div>`;
    }
    toolbar?.classList.toggle("area-structure-hidden",!admin);
    if(toolbar){
      const note=toolbar.querySelector("span");
      if(note) note.textContent=`Du redigerar “${area?.title||""}”. Nya kategorier läggs i den här fliken.`;
    }
    categories.forEach(section=>{
      const id=section.dataset.category;
      section.classList.toggle("area-hidden",data.areaCategories[id]!==activeArea);
      if(admin)decorateCategoryArea(section,id);
    });
  }

  function navigateArea(id) {
    ensureAreas();
    if(!data.areas.some(a=>a.id===id))return;
    activeArea=id;
    baseShowHome();
    history.replaceState(null,"","#area-"+encodeURIComponent(id));
    renderHome();
    setTimeout(applyHomeMode,0);
    window.scrollTo(0,0);
  }

  function navigatePortal() {
    activeArea="";
    baseShowHome();
    history.replaceState(null,"","#home");
    renderHome();
    setTimeout(applyHomeMode,0);
    window.scrollTo(0,0);
  }

  function ensureAreaModal() {
    if(document.getElementById("areaManagerModal"))return;
    document.body.insertAdjacentHTML("beforeend",`
      <div class="modalback hidden" id="areaManagerModal"><div class="modal">
        <div class="modalhead"><h2>Hantera flikar</h2><button class="close" id="areaManagerClose" type="button">×</button></div>
        <div class="modalbody">
          <p class="area-manager-intro">Flikarna ligger i huvudmenyn och på startsidan. Varje flik kan ha egen ikon och färg.</p>
          <div id="areaManagerRows"></div>
          <button class="btn small" id="addAreaBtn" type="button">+ Ny flik</button>
        </div>
        <div class="modalfooter"><button class="btn" id="areaManagerDone" type="button">Stäng</button></div>
      </div></div>`);
    const close=()=>document.getElementById("areaManagerModal").classList.add("hidden");
    document.getElementById("areaManagerClose").onclick=close;
    document.getElementById("areaManagerDone").onclick=close;
    document.getElementById("addAreaBtn").onclick=async()=>{
      const before=S.clone(data);
      try{
        const id=makeId();
        data.areas.push({id,title:"Ny flik",icon:"📁",color:PALETTE[data.areas.length%PALETTE.length]});
        await S.save();
        renderHome();
        openAreaManager();
      }catch(e){data=before;toast(e.message||"Kunde inte skapa fliken.");}
    };
  }

  function openAreaManager() {
    ensureAreas();
    ensureAreaModal();
    const rows=document.getElementById("areaManagerRows");
    rows.innerHTML=data.areas.map(a=>{
      const count=(data.categories||[]).filter(c=>data.areaCategories[c.id]===a.id).length;
      return `<div class="area-manager-row" data-area-row="${S.esc(a.id)}">
        <input class="area-icon-input" maxlength="4" value="${S.esc(a.icon)}" aria-label="Ikon">
        <input class="area-name-input" maxlength="50" value="${S.esc(a.title)}" aria-label="Namn på flik">
        <input class="area-color-input" type="color" value="${S.esc(a.color)}" aria-label="Färg">
        <small>${count} kategor${count===1?"i":"ier"}</small>
        <button class="btn small danger" data-delete-area="${S.esc(a.id)}" type="button" ${data.areas.length===1?"disabled":""}>Ta bort</button>
      </div>`;
    }).join("");
    document.getElementById("areaManagerModal").classList.remove("hidden");
  }

  async function saveAreaRow(row) {
    const area=data.areas.find(a=>a.id===row?.dataset.areaRow);
    if(!area)return;
    const before=S.clone(data);
    try{
      area.icon=row.querySelector(".area-icon-input").value.trim()||"📁";
      area.title=row.querySelector(".area-name-input").value.trim()||"Namnlös flik";
      area.color=row.querySelector(".area-color-input").value||PALETTE[0];
      await S.save();
      renderHome();
      if(currentPage)renderGlobalNav(areaForPage(currentPage)?.id||"");
    }catch(e){data=before;toast(e.message||"Kunde inte spara fliken.");}
  }

  async function deleteArea(id) {
    ensureAreas();
    if(data.areas.length<=1)return;
    const area=data.areas.find(a=>a.id===id);
    if(!area||!confirm(`Ta bort fliken “${area.title}”? Kategorierna flyttas till en annan flik.`))return;
    const before=S.clone(data);
    try{
      const fallback=data.areas.find(a=>a.id!==id)?.id;
      (data.categories||[]).forEach(c=>{if(data.areaCategories[c.id]===id)data.areaCategories[c.id]=fallback});
      data.areas=data.areas.filter(a=>a.id!==id);
      if(activeArea===id)activeArea="";
      await S.save();
      renderHome();
      openAreaManager();
    }catch(e){data=before;toast(e.message||"Kunde inte ta bort fliken.");}
  }

  const baseRenderHome=renderHome;
  renderHome=function(...args){
    const beforeIds=new Set((data.categories||[]).map(c=>c.id));
    const result=baseRenderHome.apply(this,args);
    ensureAreas();

    if(pendingArea && categoryIdsBeforeAdd){
      const newCats=(data.categories||[]).filter(c=>!categoryIdsBeforeAdd.has(c.id));
      if(newCats.length){
        newCats.forEach(c=>data.areaCategories[c.id]=pendingArea);
        pendingArea="";
        categoryIdsBeforeAdd=null;
        if(admin&&!savingAssignment){
          savingAssignment=true;
          S.save().catch(e=>console.warn("Kunde inte spara fliktilldelning",e)).finally(()=>savingAssignment=false);
        }
      }
    }

    setTimeout(applyHomeMode,0);
    return result;
  };

  const baseRenderPage=renderPage;
  renderPage=function(key){
    const result=baseRenderPage(key);
    const area=areaForPage(key);
    renderGlobalNav(area?.id||"");
    return result;
  };

  const baseShowHome=showHome;
  showHome=function(){
    activeArea="";
    const result=baseShowHome();
    renderHome();
    setTimeout(applyHomeMode,0);
    return result;
  };

  document.addEventListener("click",e=>{
    const tab=e.target.closest("[data-area-nav]");
    if(tab){e.preventDefault();navigateArea(tab.dataset.areaNav);return;}
    if(e.target.closest("[data-area-home]")){e.preventDefault();navigatePortal();return;}
    if(e.target.closest("#manageAreasTopBtn")){e.preventDefault();openAreaManager();return;}
    if(e.target.closest("#addCategoryBtn")){
      pendingArea=activeArea||data.areas[0]?.id||"";
      categoryIdsBeforeAdd=new Set((data.categories||[]).map(c=>c.id));
    }
    const del=e.target.closest("[data-delete-area]");
    if(del){e.preventDefault();deleteArea(del.dataset.deleteArea);}
  },true);

  document.addEventListener("change",async e=>{
    const sel=e.target.closest(".category-area-select");
    if(sel){
      e.preventDefault();
      e.stopImmediatePropagation();
      const before=S.clone(data);
      try{
        data.areaCategories[sel.dataset.categoryArea]=sel.value;
        await S.save();
        renderHome();
      }catch(err){data=before;toast(err.message||"Kunde inte flytta kategorin.");}
      return;
    }
    const input=e.target.closest(".area-icon-input,.area-name-input,.area-color-input");
    if(input)await saveAreaRow(input.closest(".area-manager-row"));
  },true);

  const css=document.createElement("style");
  css.textContent=`
    .topbar{padding-bottom:0}
    .area-global-nav{border-top:1px solid rgba(255,255,255,.06);background:rgba(7,16,29,.96)}
    .area-global-nav-inner{max-width:1080px;margin:0 auto;padding:0 16px;display:flex;align-items:stretch;gap:2px;overflow-x:auto}
    .area-home-link,.area-nav-tab,.area-manage-top{border:0;background:transparent;color:#aebdd0;min-height:46px;padding:0 14px;font-weight:800;white-space:nowrap;border-bottom:3px solid transparent}
    .area-home-link:hover,.area-nav-tab:hover{color:#fff;background:rgba(255,255,255,.035)}
    .area-home-link.active{color:#fff;border-bottom-color:#d8e0eb}
    .area-nav-tab{display:flex;align-items:center;gap:7px}.area-nav-tab.active{color:#fff;border-bottom-color:var(--area-color);background:color-mix(in srgb,var(--area-color) 14%,transparent)}
    .area-nav-tab span{font-size:15px}.area-manage-top{margin-left:auto;color:#c9d5e6}
    #areaPortal{padding-top:34px}.area-portal-title{text-align:center;max-width:720px;margin:0 auto 26px}.area-portal-title h1{margin:8px 0 10px}.area-portal-title p{color:#9cacc1;margin:0}
    .area-portal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .area-portal-card{position:relative;overflow:hidden;min-height:170px;border:1px solid color-mix(in srgb,var(--area-color) 55%,#263b58);border-radius:22px;padding:22px;background:linear-gradient(145deg,color-mix(in srgb,var(--area-color) 22%,#111f33),#0b1727 72%);color:#fff;text-align:left;box-shadow:0 16px 38px rgba(0,0,0,.24);transition:transform .16s ease,border-color .16s ease}
    .area-portal-card:hover{transform:translateY(-3px);border-color:var(--area-color)}.area-portal-card:before{content:"";position:absolute;inset:auto -30px -55px auto;width:150px;height:150px;border-radius:50%;background:var(--area-color);opacity:.13}
    .area-portal-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--area-color) 32%,#0a1524);font-size:23px;margin-bottom:19px}
    .area-portal-card strong{display:block;font-size:22px;margin-bottom:8px}.area-portal-card>span:last-child{color:#bac7d9;font-weight:700;font-size:13px}
    #areaPageHead{margin-top:26px}.area-page-heading{display:flex;align-items:center;gap:16px;padding:20px 22px;border:1px solid color-mix(in srgb,var(--area-color) 48%,#263b58);border-radius:20px;background:linear-gradient(120deg,color-mix(in srgb,var(--area-color) 16%,#111f33),#0d1828)}
    .area-page-icon{width:54px;height:54px;display:grid;place-items:center;border-radius:15px;background:color-mix(in srgb,var(--area-color) 28%,#0b1727);font-size:26px}.area-page-heading h1{font-size:30px;margin:3px 0 4px}.area-page-heading p{margin:0;color:#9cacc1}
    .area-structure-hidden,.front-category.area-hidden{display:none!important}
    .category-area-select{max-width:160px;border:1px solid #344862;border-radius:9px;background:#091523;color:#f3f6fb;padding:7px 8px;font-size:12px}
    .area-manager-intro{color:#9cacc1;margin:0 0 14px;line-height:1.5}.area-manager-row{display:grid;grid-template-columns:64px minmax(0,1fr) 56px auto auto;gap:8px;align-items:center;margin-bottom:9px}
    .area-manager-row input{width:100%;border:1px solid #2a3d58;border-radius:10px;padding:9px 10px;background:#091523;color:#f3f6fb}.area-manager-row .area-color-input{padding:3px;height:40px}.area-manager-row small{color:#8fa2ba;white-space:nowrap}
    @media(max-width:720px){.area-global-nav-inner{padding:0 8px}.area-home-link,.area-nav-tab{padding:0 11px}.area-portal-grid{grid-template-columns:1fr}.area-manager-row{grid-template-columns:58px 1fr 52px}.area-manager-row small,.area-manager-row .danger{grid-column:1/-1}.category-area-select{max-width:none;width:100%}.area-page-heading{align-items:flex-start}.area-page-heading h1{font-size:26px}}
  `;
  document.head.appendChild(css);

  window.addEventListener("load",()=>setTimeout(()=>{
    ensureAreas();
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash.startsWith("area-")){
      const id=hash.slice(5);
      if(data.areas.some(a=>a.id===id))activeArea=id;
    }else if(currentPage){
      activeArea=areaForPage(currentPage)?.id||"";
    }else{
      activeArea="";
    }
    renderGlobalNav(currentPage?areaForPage(currentPage)?.id||"":activeArea);
    if(!currentPage)renderHome();
  },140));
})();