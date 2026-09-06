(() => {
  const DEFAULT_CATEGORIES = [
    { id: "main", title: "Vanligaste uppgifterna", layout: "large" },
    { id: "trouble", title: "Felsökning", layout: "compact" },
    { id: "other", title: "Övrigt", layout: "compact" }
  ];

  function categoryId() {
    const uid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `cat-${uid.slice(0, 12)}`;
  }

  function pageId() {
    const uid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `guide-${uid.slice(0, 12)}`;
  }

  function ensureCategories() {
    if (!Array.isArray(data.categories) || !data.categories.length) {
      data.categories = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
    }
    const known = new Set(data.categories.map((c) => c.id));
    const groups = [...new Set(Object.values(data.pages || {}).map((p) => p.group).filter(Boolean))];
    for (const group of groups) {
      if (!known.has(group)) {
        data.categories.push({ id: group, title: group, layout: "compact" });
        known.add(group);
      }
    }
    data.categories = data.categories.map((c) => ({
      id: c.id,
      title: c.title || "Namnlös kategori",
      layout: c.layout === "large" ? "large" : "compact"
    }));
  }

  function categoryMarkup(cat, index) {
    const pages = Object.entries(data.pages || {}).filter(([, p]) => p.group === cat.id);
    const controls = admin ? `
      <div class="category-admin-controls">
        <button class="btn small" type="button" data-cat-up="${esc(cat.id)}" ${index === 0 ? "disabled" : ""} title="Flytta upp">↑</button>
        <button class="btn small" type="button" data-cat-down="${esc(cat.id)}" ${index === data.categories.length - 1 ? "disabled" : ""} title="Flytta ner">↓</button>
        <button class="btn small" type="button" data-edit-category="${esc(cat.id)}">✎ Kategori</button>
        <button class="btn small primary" type="button" data-add-guide="${esc(cat.id)}">+ Guide</button>
      </div>` : "";

    const cards = pages.length
      ? pages.map(([key, p]) => {
          if (cat.layout === "large") {
            return `<div class="card" data-page="${esc(key)}"><div class="ico">${esc(p.icon || "•")}</div><h2>${esc(p.title || "Namnlös guide")}</h2><p>${esc(p.summary || "")}</p><span class="more">Öppna guide →</span>${admin ? `<button class="editfab" data-edit="${esc(key)}" type="button">✎</button>` : ""}</div>`;
          }
          return `<div class="quickitem" data-page="${esc(key)}"><div><strong>${esc(p.icon || "•")} ${esc(p.title || "Namnlös guide")}</strong><small>${esc(p.summary || "")}</small></div><div class="arr">›</div>${admin ? `<button class="editfab" data-edit="${esc(key)}" type="button">✎</button>` : ""}</div>`;
        }).join("")
      : `<div class="category-empty">${admin ? "Kategorin är tom. Klicka på + Guide för att lägga till en guide." : "Inga guider ännu."}</div>`;

    return `<section class="front-category" data-category="${esc(cat.id)}"><div class="category-heading"><div class="sectionlabel">${esc(cat.title)}</div>${controls}</div><div class="${cat.layout === "large" ? "grid" : "quick"}">${cards}</div></section>`;
  }

  function ensureDynamicHome() {
    const home = document.getElementById("homeView");
    if (!home) return null;
    let holder = document.getElementById("dynamicCategories");
    if (!holder) {
      [...home.children].forEach((child) => {
        if (!child.classList.contains("hero")) child.classList.add("legacy-home-section");
      });
      holder = document.createElement("div");
      holder.id = "dynamicCategories";
      home.appendChild(holder);
    }
    return holder;
  }

  const originalRenderHome = renderHome;
  renderHome = function () {
    ensureCategories();
    renderHeader();
    const editSite = document.getElementById("editSiteBtn");
    if (editSite) editSite.classList.toggle("hidden", !admin);
    const holder = ensureDynamicHome();
    if (!holder) return originalRenderHome();
    holder.innerHTML = `${admin ? `<div class="front-admin-toolbar"><div><strong>Redigera startsidan</strong><span>Lägg till, byt namn och ordna kategorier direkt här.</span></div><button class="btn primary" type="button" id="addCategoryBtn">+ Ny kategori</button></div>` : ""}${data.categories.map(categoryMarkup).join("")}`;
  };

  const style = document.createElement("style");
  style.textContent = `
    .legacy-home-section{display:none!important}
    #dynamicCategories{margin-top:4px}
    .front-category{margin-top:28px}
    .category-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .category-heading .sectionlabel{margin:0}
    .category-admin-controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
    .category-admin-controls .btn[disabled]{opacity:.35;cursor:not-allowed}
    .front-admin-toolbar{margin:18px 0 4px;padding:14px 15px;border:1px solid #344a69;border-radius:16px;background:linear-gradient(180deg,#12233a,#0c1929);display:flex;align-items:center;justify-content:space-between;gap:14px}
    .front-admin-toolbar strong{display:block;color:#f3f6fb;margin-bottom:3px}.front-admin-toolbar span{display:block;color:#9cacc1;font-size:13px}
    .category-empty{grid-column:1/-1;border:1px dashed #304763;border-radius:15px;padding:17px;color:#8fa2ba;background:#091523;font-size:13px}
    .quickitem .editfab{top:50%;right:12px;transform:translateY(-50%)}
    .quickitem:has(.editfab){padding-right:58px}
    .category-modal-note{padding:11px 12px;border-radius:12px;background:#0a1727;border:1px solid #293f5b;color:#9cacc1;font-size:13px;line-height:1.45}
    .group-field-note{margin-top:6px;color:#8fa2ba;font-size:12px}
    @media(max-width:720px){.category-heading,.front-admin-toolbar{align-items:stretch;flex-direction:column}.category-admin-controls{justify-content:flex-start}.category-admin-controls .btn{flex:1}.front-admin-toolbar .btn{width:100%}}
  `;
  document.head.appendChild(style);

  let editingCategoryId = null;

  function ensureCategoryModal() {
    if (document.getElementById("categoryEditModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modalback hidden" id="categoryEditModal"><div class="modal"><div class="modalhead"><h2 id="categoryModalTitle">Kategori</h2><button class="close" type="button" id="closeCategoryModal">×</button></div><div class="modalbody"><div class="field"><label>Namn på kategorin</label><input id="categoryName" maxlength="80" placeholder="T.ex. Kameror"></div><div class="field"><label>Utseende</label><select id="categoryLayout"><option value="large">Stora kort</option><option value="compact">Kompakta rader</option></select><div class="group-field-note">Stora kort passar viktiga uppgifter. Kompakta rader passar extra hjälp och felsökning.</div></div><div class="category-modal-note" id="categoryDeleteNote"></div></div><div class="modalfooter"><button class="btn danger hidden" type="button" id="deleteCategoryBtn">Ta bort kategori</button><div style="flex:1"></div><button class="btn" type="button" id="cancelCategoryBtn">Avbryt</button><button class="btn primary" type="button" id="saveCategoryBtn">Spara</button></div></div></div>`);

    const close = () => document.getElementById("categoryEditModal").classList.add("hidden");
    document.getElementById("closeCategoryModal").onclick = close;
    document.getElementById("cancelCategoryBtn").onclick = close;

    document.getElementById("saveCategoryBtn").onclick = async () => {
      const name = document.getElementById("categoryName").value.trim();
      const layout = document.getElementById("categoryLayout").value;
      if (!name) return toast("Skriv ett namn på kategorin.");
      if (editingCategoryId) {
        const cat = data.categories.find((c) => c.id === editingCategoryId);
        if (!cat) return;
        cat.title = name;
        cat.layout = layout;
      } else {
        data.categories.push({ id: categoryId(), title: name, layout });
      }
      await saveContent();
      renderHome();
      close();
    };

    document.getElementById("deleteCategoryBtn").onclick = async () => {
      if (!editingCategoryId) return;
      const count = Object.values(data.pages || {}).filter((p) => p.group === editingCategoryId).length;
      if (count) return toast("Flytta eller ta bort guiderna i kategorin först.");
      const cat = data.categories.find((c) => c.id === editingCategoryId);
      if (!cat || !confirm(`Ta bort kategorin “${cat.title}”?`)) return;
      data.categories = data.categories.filter((c) => c.id !== editingCategoryId);
      await saveContent();
      renderHome();
      close();
    };
  }

  function openCategoryModal(id = null) {
    ensureCategories();
    ensureCategoryModal();
    editingCategoryId = id;
    const cat = id ? data.categories.find((c) => c.id === id) : null;
    document.getElementById("categoryModalTitle").textContent = cat ? "Redigera kategori" : "Ny kategori";
    document.getElementById("categoryName").value = cat?.title || "";
    document.getElementById("categoryLayout").value = cat?.layout || "compact";
    const count = cat ? Object.values(data.pages || {}).filter((p) => p.group === cat.id).length : 0;
    const del = document.getElementById("deleteCategoryBtn");
    del.classList.toggle("hidden", !cat);
    document.getElementById("categoryDeleteNote").textContent = cat ? (count ? `Kategorin innehåller ${count} guide${count === 1 ? "" : "r"}. Flytta eller ta bort dem innan kategorin kan tas bort.` : "Kategorin är tom och kan tas bort.") : "Den nya kategorin visas på startsidan så snart du sparar.";
    document.getElementById("categoryEditModal").classList.remove("hidden");
    setTimeout(() => document.getElementById("categoryName").focus(), 0);
  }

  async function moveCategory(id, delta) {
    const i = data.categories.findIndex((c) => c.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= data.categories.length) return;
    [data.categories[i], data.categories[j]] = [data.categories[j], data.categories[i]];
    await saveContent();
    renderHome();
  }

  async function createGuide(groupId) {
    const cat = data.categories.find((c) => c.id === groupId);
    if (!cat) return;
    const key = pageId();
    data.pages[key] = {
      group: groupId,
      icon: "•",
      kicker: cat.title,
      title: "Ny guide",
      summary: "Skriv en kort beskrivning.",
      intro: "Skriv en kort introduktion till guiden.",
      steps: [{ title: "Första steget", text: "Skriv instruktionen här." }],
      note: "",
      noteType: "info"
    };
    await saveContent();
    renderHome();
    openEditPage(key);
  }

  document.addEventListener("click", async (event) => {
    if (!admin) return;
    const addCategory = event.target.closest("#addCategoryBtn");
    if (addCategory) { event.preventDefault(); openCategoryModal(); return; }

    const editCategory = event.target.closest("[data-edit-category]");
    if (editCategory) { event.preventDefault(); event.stopPropagation(); openCategoryModal(editCategory.dataset.editCategory); return; }

    const addGuide = event.target.closest("[data-add-guide]");
    if (addGuide) { event.preventDefault(); event.stopPropagation(); await createGuide(addGuide.dataset.addGuide); return; }

    const up = event.target.closest("[data-cat-up]");
    if (up) { event.preventDefault(); await moveCategory(up.dataset.catUp, -1); return; }

    const down = event.target.closest("[data-cat-down]");
    if (down) { event.preventDefault(); await moveCategory(down.dataset.catDown, 1); return; }
  }, true);

  function ensurePageGroupField() {
    const modalBody = document.querySelector("#editPageModal .modalbody");
    if (!modalBody || document.getElementById("editPageGroup")) return;
    const field = document.createElement("div");
    field.className = "field";
    field.id = "editPageGroupField";
    field.innerHTML = `<label>Kategori på startsidan</label><select id="editPageGroup"></select><div class="group-field-note">Här väljer du under vilken kategori guiden ska visas.</div>`;
    modalBody.insertBefore(field, modalBody.firstChild);

    const footer = document.querySelector("#editPageModal .modalfooter");
    if (footer && !document.getElementById("deleteGuideBtn")) {
      const del = document.createElement("button");
      del.className = "btn danger";
      del.type = "button";
      del.id = "deleteGuideBtn";
      del.textContent = "Ta bort guide";
      footer.insertBefore(del, footer.firstChild);
      const spacer = document.createElement("div");
      spacer.style.flex = "1";
      footer.insertBefore(spacer, del.nextSibling);
      del.onclick = async () => {
        const key = editingPageKey;
        const page = data.pages[key];
        if (!page || !confirm(`Ta bort guiden “${page.title}”?`)) return;
        const cfg = window.LIVESTREAM_SUPABASE;
        if (cfg?.url && cfg?.key && window.supabase) {
          const client = window.supabase.createClient(cfg.url, cfg.key);
          const paths = [];
          (page.steps || []).forEach((s) => { if (s.imagePath) paths.push(s.imagePath); if (s.videoPath) paths.push(s.videoPath); });
          if (paths.length) await client.storage.from("guide-images").remove(paths);
        }
        delete data.pages[key];
        await saveContent();
        closeModal("editPageModal");
        showHome();
        toast("Guiden är borttagen.");
      };
    }
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      ensureCategories();
      ensureCategoryModal();
      ensurePageGroupField();

      const baseOpenEditPage = openEditPage;
      openEditPage = function (key) {
        ensureCategories();
        ensurePageGroupField();
        baseOpenEditPage(key);
        const select = document.getElementById("editPageGroup");
        if (select) {
          select.innerHTML = data.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("");
          select.value = data.pages[key]?.group || data.categories[0]?.id || "";
        }
      };

      const savePageBtn = document.getElementById("savePageBtn");
      if (savePageBtn) {
        savePageBtn.addEventListener("click", () => {
          const select = document.getElementById("editPageGroup");
          if (editingPageKey && data.pages[editingPageKey] && select?.value) data.pages[editingPageKey].group = select.value;
        }, true);
      }

      renderHome();
    }, 0);
  });
})();
