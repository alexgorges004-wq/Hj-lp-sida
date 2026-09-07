(() => {
  const DEFAULT_TEXT_ID = "mistakes-ok";

  function ensureDefaultText() {
    if (data.homeTextBlocks && typeof data.homeTextBlocks === "object" && !Array.isArray(data.homeTextBlocks)) return false;
    data.homeTextBlocks = {
      [DEFAULT_TEXT_ID]: {
        title: "DET ÄR OKEJ ATT GÖRA MISSTAG",
        text: "",
        style: "encouragement"
      }
    };
    return true;
  }

  function ensureGuideOrder() {
    if (!data.guideOrder || typeof data.guideOrder !== "object" || Array.isArray(data.guideOrder)) data.guideOrder = {};
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const validGroups = new Set(categories.map((c) => c.id));
    Object.keys(data.guideOrder).forEach((id) => { if (!validGroups.has(id)) delete data.guideOrder[id]; });

    for (const cat of categories) {
      const keys = Object.entries(data.pages || {}).filter(([, p]) => p.group === cat.id).map(([key]) => key);
      const valid = new Set(keys);
      const hadOrder = Array.isArray(data.guideOrder[cat.id]);
      const seen = new Set();
      let order = hadOrder ? data.guideOrder[cat.id].filter((key) => {
        if (!valid.has(key) || seen.has(key)) return false;
        seen.add(key); return true;
      }) : [];
      keys.forEach((key) => { if (!seen.has(key)) { order.push(key); seen.add(key); } });
      if (!hadOrder && cat.id === "main") {
        const priority = (key) => key === "start" ? 0 : key === "stop" ? 1 : 2;
        order = order.map((key, index) => ({key, index})).sort((a,b) => priority(a.key)-priority(b.key) || a.index-b.index).map((x) => x.key);
      }
      data.guideOrder[cat.id] = order;
    }
  }

  function applyGuideOrder() {
    ensureGuideOrder();
    document.querySelectorAll(".front-category[data-category]").forEach((section) => {
      const group = section.dataset.category;
      const holder = section.querySelector(".grid,.quick");
      if (!holder) return;
      const nodes = new Map([...holder.querySelectorAll("[data-page]")].map((node) => [node.dataset.page, node]));
      const order = data.guideOrder[group] || [];
      order.forEach((key, index) => {
        const node = nodes.get(key);
        if (!node) return;
        holder.appendChild(node);
        node.querySelectorAll(".guide-sort-btn").forEach((el) => el.remove());
        if (!admin) return;
        const up = document.createElement("button");
        up.className = "btn small guide-sort-btn guide-sort-up";
        up.type = "button"; up.dataset.guideSort = key; up.dataset.delta = "-1"; up.textContent = "↑"; up.title = "Flytta guiden upp"; up.disabled = index === 0;
        const down = document.createElement("button");
        down.className = "btn small guide-sort-btn guide-sort-down";
        down.type = "button"; down.dataset.guideSort = key; down.dataset.delta = "1"; down.textContent = "↓"; down.title = "Flytta guiden ner"; down.disabled = index === order.length - 1;
        node.append(up, down);
      });
    });
  }

  async function moveGuide(key, delta) {
    ensureGuideOrder();
    const group = data.pages?.[key]?.group;
    const order = group ? data.guideOrder[group] : null;
    if (!order) return;
    const i = order.indexOf(key), j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    await saveContent();
    renderHome();
  }

  const baseRenderHome = renderHome;
  renderHome = function () {
    const madeDefault = ensureDefaultText();
    baseRenderHome();
    if (madeDefault && Array.isArray(data.homeLayout)) {
      const ref = `text:${DEFAULT_TEXT_ID}`;
      data.homeLayout = [ref, ...data.homeLayout.filter((x) => x !== ref)];
      baseRenderHome();
    }
    applyGuideOrder();
  };

  const style = document.createElement("style");
  style.textContent = `
    .guide-sort-btn{position:absolute!important;z-index:5!important;top:12px!important;padding:6px 8px!important;min-width:32px!important}
    .guide-sort-up{right:92px!important}.guide-sort-down{right:52px!important}.guide-sort-btn[disabled]{opacity:.35!important;cursor:not-allowed!important}
    .quickitem .guide-sort-btn{top:50%!important;transform:translateY(-50%)!important}.quickitem:has(.guide-sort-btn){padding-right:132px!important}
    .image-lightbox{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.9);display:grid;place-items:center;padding:24px;cursor:zoom-out}.image-lightbox.hidden{display:none!important}
    .image-lightbox img{max-width:min(96vw,1500px);max-height:92vh;object-fit:contain;border-radius:12px;box-shadow:0 20px 80px rgba(0,0,0,.55);cursor:default}.image-lightbox-close{position:fixed;top:16px;right:18px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(10,15,24,.8);color:#fff;font-size:26px;display:grid;place-items:center;z-index:501}
    @media(max-width:720px){.guide-sort-up{right:92px!important}.guide-sort-down{right:52px!important}.quickitem:has(.guide-sort-btn){padding-right:132px!important}}
    @media print{
      :root{--bg:#fff!important;--surface:#fff!important;--surface2:#fff!important;--text:#000!important;--muted:#333!important;--line:#bbb!important}
      body{background:#fff!important;color:#000!important}.topbar,.adminbar,.footer,.back,#editPageBtn,.front-admin-toolbar,.category-admin-controls,.guide-sort-btn,.editfab,.home-text-controls,.guide-video-wrap,.toast,.image-lightbox{display:none!important}
      .shell{max-width:none!important;padding:0!important}.page{margin:0!important}.panel,.step,.callout,.card,.quickitem,.home-text-block{background:#fff!important;color:#000!important;box-shadow:none!important;border-color:#bbb!important;break-inside:avoid}
      .step p,.lead,.panel p,.callout p,.guide-shot-wrap figcaption{color:#222!important}.num{background:#000!important;color:#fff!important}.guide-shot-link{border-color:#bbb!important}.guide-shot{max-height:none!important;break-inside:avoid}.zoom-hint{display:none!important}a{color:#000!important;text-decoration:none!important}
    }
  `;
  document.head.appendChild(style);

  if (!document.querySelector('link[rel~="icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "icon"; icon.href = "/favicon.ico"; document.head.appendChild(icon);
  }

  function ensureLightbox() {
    if (document.getElementById("imageLightbox")) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="image-lightbox hidden" id="imageLightbox" aria-hidden="true"><button class="image-lightbox-close" id="imageLightboxClose" type="button" aria-label="Stäng">×</button><img id="imageLightboxImg" alt="Förstorad screenshot"></div>`);
    const close = () => {
      const box = document.getElementById("imageLightbox");
      box.classList.add("hidden"); box.setAttribute("aria-hidden","true");
      document.getElementById("imageLightboxImg").removeAttribute("src"); document.body.style.overflow = "";
    };
    document.getElementById("imageLightboxClose").onclick = close;
    document.getElementById("imageLightbox").onclick = (event) => { if (event.target.id === "imageLightbox") close(); };
  }
  ensureLightbox();

  function setStatus(text, good = true) {
    const state = document.getElementById("saveState"), dot = document.getElementById("saveDot");
    if (state) state.textContent = text;
    if (dot) dot.className = good ? "dot good" : "dot";
  }
  function wrapSaveContent() {
    if (typeof saveContent !== "function" || saveContent._statusWrapped) return;
    const base = saveContent;
    const wrapped = async function (...args) {
      setStatus("Sparar…", false);
      try { const out = await base.apply(this,args); setStatus("Sparat online",true); return out; }
      catch (error) { setStatus("Kunde inte spara",false); throw error; }
    };
    wrapped._statusWrapped = true; saveContent = wrapped;
  }
  const baseSetAdmin = setAdmin;
  setAdmin = function (value) {
    baseSetAdmin(value);
    if (value) { wrapSaveContent(); setStatus("Ansluten", true); }
  };

  const dirtyIds = new Set(["editPageModal","editSiteModal","categoryEditModal","homeTextModal"]);
  const isDirty = (id) => document.getElementById(id)?.dataset.dirty === "1";
  const markClean = (id) => { const el = document.getElementById(id); if (el) el.dataset.dirty = "0"; };
  const markDirty = (id) => { const el = document.getElementById(id); if (el) el.dataset.dirty = "1"; };
  document.addEventListener("input", (event) => { const modal = event.target.closest(".modalback"); if (modal && dirtyIds.has(modal.id)) markDirty(modal.id); });
  document.addEventListener("change", (event) => { const modal = event.target.closest(".modalback"); if (modal && dirtyIds.has(modal.id)) markDirty(modal.id); });

  document.addEventListener("click", async (event) => {
    const sort = event.target.closest("[data-guide-sort]");
    if (sort && admin) {
      event.preventDefault(); event.stopImmediatePropagation();
      await moveGuide(sort.dataset.guideSort, Number(sort.dataset.delta)); return;
    }
    const shot = event.target.closest(".guide-shot-link");
    if (shot) {
      event.preventDefault(); event.stopPropagation(); ensureLightbox();
      const img = shot.querySelector("img"), box = document.getElementById("imageLightbox"), large = document.getElementById("imageLightboxImg");
      large.src = shot.href || img?.src || ""; large.alt = img?.alt || "Förstorad screenshot"; box.classList.remove("hidden"); box.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden"; return;
    }

    const closeTarget = event.target.closest('[data-close="editPageModal"],[data-close="editSiteModal"],#closeCategoryModal,#cancelCategoryBtn,#closeHomeTextModal,#cancelHomeTextBtn');
    if (closeTarget) {
      const id = closeTarget.dataset.close || (closeTarget.id.includes("Category") ? "categoryEditModal" : closeTarget.id.includes("HomeText") ? "homeTextModal" : null);
      if (id && isDirty(id)) {
        if (!confirm("Du har osparade ändringar. Vill du verkligen avbryta?")) {
          event.preventDefault(); event.stopImmediatePropagation(); return;
        }
        markClean(id);
      }
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("imageLightbox")?.classList.contains("hidden")) document.getElementById("imageLightboxClose")?.click();
  });
  window.addEventListener("beforeunload", (event) => {
    const active = [...dirtyIds].some((id) => isDirty(id) && !document.getElementById(id)?.classList.contains("hidden"));
    if (active) { event.preventDefault(); event.returnValue = ""; }
  });

  function observeDirtyModals() {
    dirtyIds.forEach((id) => {
      const modal = document.getElementById(id); if (!modal || modal._dirtyObserved) return;
      modal._dirtyObserved = true; let wasHidden = modal.classList.contains("hidden");
      new MutationObserver(() => {
        const hidden = modal.classList.contains("hidden");
        if (wasHidden && !hidden) markClean(id);
        wasHidden = hidden;
      }).observe(modal,{attributes:true,attributeFilter:["class"]});
    });
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      observeDirtyModals();
      if (admin) { wrapSaveContent(); setStatus("Ansluten",true); }
      renderHome();
    }, 150);
  });
})();
