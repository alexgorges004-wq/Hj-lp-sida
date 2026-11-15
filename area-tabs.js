(() => {
  const S = window.LH2;
  if (!S) return;

  let activeArea = "";
  let pendingNewCategoryArea = "";
  let savingAssignment = false;

  const makeId = () => "area-" + ((globalThis.crypto?.randomUUID?.() || (Date.now()+"-"+Math.random().toString(36).slice(2))).slice(0,12));

  function ensureAreas() {
    S.ensureData();
    if (!Array.isArray(data.areas) || !data.areas.length) {
      data.areas = [{ id: "livestream", title: "Livestream", icon: "🔴" }];
    }
    data.areas = data.areas
      .filter(a => a && a.id)
      .map(a => ({ id: String(a.id), title: String(a.title || "Namnlös flik"), icon: String(a.icon || "📁") }));
    if (!data.areaCategories || typeof data.areaCategories !== "object" || Array.isArray(data.areaCategories)) data.areaCategories = {};
    const ids = new Set(data.areas.map(a => a.id));
    const fallback = data.areas[0]?.id || "livestream";
    (data.categories || []).forEach(cat => {
      if (!ids.has(data.areaCategories[cat.id])) data.areaCategories[cat.id] = fallback;
    });
    if (!ids.has(activeArea)) activeArea = data.areas[0]?.id || "";
  }

  function currentArea() {
    ensureAreas();
    return data.areas.find(a => a.id === activeArea) || data.areas[0];
  }

  function renderAreaTabs() {
    ensureAreas();
    const home = document.getElementById("homeView");
    const layout = document.getElementById("v2HomeLayout");
    const holder = document.getElementById("dynamicCategories");
    if (!home || (!layout && !holder)) return;

    let wrap = document.getElementById("areaTabsWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "areaTabsWrap";
    }

    const tabs = data.areas.map(a =>
      `<button class="area-tab ${a.id===activeArea?"active":""}" data-area-tab="${S.esc(a.id)}" type="button"><span>${S.esc(a.icon||"📁")}</span>${S.esc(a.title)}</button>`
    ).join("");

    wrap.innerHTML = `<div class="area-tabs-head"><div><strong>Område</strong><small>Välj vad du behöver hjälp med.</small></div>${admin?'<button class="btn small" id="manageAreasBtn" type="button">⚙ Hantera flikar</button>':""}</div><div class="area-tabs">${tabs}</div>`;

    if (layout) {
      const hero = layout.querySelector(".hero");
      if (hero) hero.insertAdjacentElement("afterend", wrap);
      else layout.prepend(wrap);
    } else {
      holder.parentNode.insertBefore(wrap, holder);
    }

    document.querySelectorAll(".front-category[data-category]").forEach(section => {
      const id = section.dataset.category;
      section.classList.toggle("area-hidden", data.areaCategories[id] !== activeArea);
      if (admin) decorateCategoryArea(section, id);
    });

    const toolbar = document.querySelector(".front-admin-toolbar");
    if (toolbar) {
      const note = toolbar.querySelector("span");
      if (note) note.textContent = `Du redigerar nu fliken “${currentArea()?.title || ""}”. Nya kategorier läggs här.`;
    }
  }

  function decorateCategoryArea(section, categoryId) {
    const controls = section.querySelector(".category-admin-controls");
    if (!controls) return;
    let select = controls.querySelector(".category-area-select");
    if (!select) {
      select = document.createElement("select");
      select.className = "category-area-select";
      select.dataset.categoryArea = categoryId;
      select.title = "Flytta kategorin till en annan flik";
      controls.prepend(select);
    }
    select.innerHTML = data.areas.map(a => `<option value="${S.esc(a.id)}">${S.esc(a.icon)} ${S.esc(a.title)}</option>`).join("");
    select.value = data.areaCategories[categoryId] || data.areas[0]?.id || "";
  }

  function ensureAreaModal() {
    if (document.getElementById("areaManagerModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modalback hidden" id="areaManagerModal"><div class="modal">
        <div class="modalhead"><h2>Hantera flikar</h2><button class="close" id="areaManagerClose" type="button">×</button></div>
        <div class="modalbody">
          <p class="area-manager-intro">Skapa huvudområden för olika typer av hjälp. Kategorier och guider ligger sedan under en flik.</p>
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
      try {
        const id=makeId();
        data.areas.push({id,title:"Ny flik",icon:"📁"});
        activeArea=id;
        await S.save();
        renderHome();
        openAreaManager();
      } catch(e) { data=before; toast(e.message||"Kunde inte skapa fliken."); }
    };
  }

  function openAreaManager() {
    ensureAreas();
    ensureAreaModal();
    const rows=document.getElementById("areaManagerRows");
    rows.innerHTML=data.areas.map((a,i)=>{
      const count=(data.categories||[]).filter(c=>data.areaCategories[c.id]===a.id).length;
      return `<div class="area-manager-row" data-area-row="${S.esc(a.id)}">
        <input class="area-icon-input" maxlength="4" value="${S.esc(a.icon)}" aria-label="Ikon">
        <input class="area-name-input" maxlength="50" value="${S.esc(a.title)}" aria-label="Namn på flik">
        <small>${count} kategor${count===1?"i":"ier"}</small>
        <button class="btn small danger" data-delete-area="${S.esc(a.id)}" type="button" ${data.areas.length===1?"disabled":""}>Ta bort</button>
      </div>`;
    }).join("");
    document.getElementById("areaManagerModal").classList.remove("hidden");
  }

  async function saveAreaRow(row) {
    const id=row?.dataset.areaRow;
    const area=data.areas.find(a=>a.id===id);
    if(!area)return;
    const before=S.clone(data);
    try {
      area.icon=row.querySelector(".area-icon-input").value.trim()||"📁";
      area.title=row.querySelector(".area-name-input").value.trim()||"Namnlös flik";
      await S.save();
      renderHome();
    } catch(e) { data=before; toast(e.message||"Kunde inte spara fliken."); }
  }

  async function deleteArea(id) {
    ensureAreas();
    if(data.areas.length<=1)return;
    const area=data.areas.find(a=>a.id===id);
    if(!area||!confirm(`Ta bort fliken “${area.title}”? Kategorierna flyttas till en annan flik.`))return;
    const before=S.clone(data);
    try {
      const fallback=data.areas.find(a=>a.id!==id)?.id;
      (data.categories||[]).forEach(c=>{if(data.areaCategories[c.id]===id)data.areaCategories[c.id]=fallback});
      data.areas=data.areas.filter(a=>a.id!==id);
      if(activeArea===id)activeArea=fallback;
      await S.save();
      renderHome();
      openAreaManager();
    } catch(e) { data=before; toast(e.message||"Kunde inte ta bort fliken."); }
  }

  S.hooks.home.push(renderAreaTabs);

  document.addEventListener("click", e => {
    const tab=e.target.closest("[data-area-tab]");
    if(tab){
      e.preventDefault();
      activeArea=tab.dataset.areaTab;
      renderAreaTabs();
      return;
    }
    if(e.target.closest("#manageAreasBtn")){
      e.preventDefault();
      openAreaManager();
      return;
    }
    if(e.target.closest("#addCategoryBtn")){
      pendingNewCategoryArea=activeArea;
    }
    const del=e.target.closest("[data-delete-area]");
    if(del){e.preventDefault();deleteArea(del.dataset.deleteArea);}
  }, true);

  document.addEventListener("change", async e => {
    const sel=e.target.closest(".category-area-select");
    if(sel){
      e.preventDefault();
      e.stopImmediatePropagation();
      const before=S.clone(data);
      try {
        data.areaCategories[sel.dataset.categoryArea]=sel.value;
        await S.save();
        renderHome();
      } catch(err) { data=before; toast(err.message||"Kunde inte flytta kategorin."); }
      return;
    }
    const input=e.target.closest(".area-icon-input,.area-name-input");
    if(input) await saveAreaRow(input.closest(".area-manager-row"));
  }, true);

  const originalRenderHome = renderHome;
  renderHome = function(...args) {
    const result=originalRenderHome.apply(this,args);
    ensureAreas();
    if(pendingNewCategoryArea){
      const unassigned=(data.categories||[]).filter(c=>!data.areaCategories[c.id]);
      if(unassigned.length){
        unassigned.forEach(c=>data.areaCategories[c.id]=pendingNewCategoryArea);
        pendingNewCategoryArea="";
        if(admin&&!savingAssignment){
          savingAssignment=true;
          S.save().catch(e=>console.warn("Kunde inte spara fliktilldelning",e)).finally(()=>savingAssignment=false);
        }
      }
    }
    setTimeout(renderAreaTabs,0);
    return result;
  };

  const css=document.createElement("style");
  css.textContent=`
    #areaTabsWrap{margin:20px 0 6px}
    .area-tabs-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}
    .area-tabs-head strong{display:block;font-size:14px}.area-tabs-head small{display:block;color:#8fa2ba;margin-top:2px}
    .area-tabs{display:flex;gap:8px;flex-wrap:wrap}
    .area-tab{border:1px solid #304763;background:#0b1829;color:#cbd7e8;border-radius:12px;padding:10px 14px;font-weight:800;display:flex;gap:7px;align-items:center}
    .area-tab:hover{background:#12243a;border-color:#526789}.area-tab.active{background:linear-gradient(135deg,#6f55ed,#4f78f2);border-color:#7c5cff;color:#fff}
    .front-category.area-hidden{display:none!important}
    .category-area-select{max-width:155px;border:1px solid #344862;border-radius:9px;background:#091523;color:#f3f6fb;padding:7px 8px;font-size:12px}
    .area-manager-intro{color:#9cacc1;margin:0 0 14px;line-height:1.5}
    .area-manager-row{display:grid;grid-template-columns:70px minmax(0,1fr) auto auto;gap:8px;align-items:center;margin-bottom:9px}
    .area-manager-row input{width:100%;border:1px solid #2a3d58;border-radius:10px;padding:9px 10px;background:#091523;color:#f3f6fb}
    .area-manager-row small{color:#8fa2ba;white-space:nowrap}
    @media(max-width:720px){.area-tabs-head{align-items:stretch;flex-direction:column}.area-tabs{display:grid;grid-template-columns:1fr 1fr}.area-tab{justify-content:center}.area-manager-row{grid-template-columns:64px 1fr}.area-manager-row small{grid-column:1/-1}.area-manager-row .danger{grid-column:1/-1}.category-area-select{max-width:none;width:100%}}
  `;
  document.head.appendChild(css);

  window.addEventListener("load",()=>setTimeout(()=>{ensureAreas();renderHome();},120));
})();