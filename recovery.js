(() => {
  function ensureTrash() {
    if (!Array.isArray(data.deletedGuides)) data.deletedGuides = [];
    return data.deletedGuides;
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function formatDeletedAt(value) {
    if (!value) return "Okänd tid";
    try {
      return new Intl.DateTimeFormat("sv-SE", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function enhanceFrontToolbar() {
    if (!admin) return;
    const toolbar = document.querySelector(".front-admin-toolbar");
    if (!toolbar || document.getElementById("trashGuidesBtn")) return;

    const actions = document.createElement("div");
    actions.className = "front-recovery-actions";

    const count = ensureTrash().length;
    const trash = document.createElement("button");
    trash.className = "btn";
    trash.type = "button";
    trash.id = "trashGuidesBtn";
    trash.innerHTML = `🗑 Papperskorg${count ? ` (${count})` : ""}`;

    const addCategory = toolbar.querySelector("#addCategoryBtn");
    if (addCategory) {
      addCategory.parentNode.insertBefore(actions, addCategory);
      actions.appendChild(trash);
      actions.appendChild(addCategory);
    } else {
      toolbar.appendChild(actions);
      actions.appendChild(trash);
    }
  }

  const recoveryStyle = document.createElement("style");
  recoveryStyle.textContent = `
    .front-recovery-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .trash-list{display:grid;gap:10px}
    .trash-empty{padding:18px;border:1px dashed #304763;border-radius:14px;background:#091523;color:#8fa2ba;text-align:center}
    .trash-item{border:1px solid #2a405c;border-radius:14px;background:#0b1829;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:14px}
    .trash-item-main{min-width:0}.trash-item-title{font-weight:850;color:#f3f6fb;margin-bottom:4px}.trash-item-meta{color:#93a6bf;font-size:12px;line-height:1.45}
    .trash-item-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .recovery-note{margin-bottom:14px;padding:11px 12px;border:1px solid #2e4664;border-radius:12px;background:#0a1727;color:#9fb0c5;font-size:13px;line-height:1.45}
    @media(max-width:720px){.front-recovery-actions{width:100%}.front-recovery-actions .btn{flex:1}.trash-item{align-items:stretch;flex-direction:column}.trash-item-actions{justify-content:flex-start}.trash-item-actions .btn{flex:1}}
  `;
  document.head.appendChild(recoveryStyle);

  function ensureTrashModal() {
    if (document.getElementById("trashGuidesModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modalback hidden" id="trashGuidesModal">
        <div class="modal">
          <div class="modalhead">
            <h2>Papperskorg</h2>
            <button class="close" type="button" id="closeTrashGuides">×</button>
          </div>
          <div class="modalbody">
            <div class="recovery-note">Borttagna guider sparas här tills du tar bort dem permanent. Screenshots och skärminspelningar behålls också, så guiden kan återställas komplett.</div>
            <div id="trashGuidesList" class="trash-list"></div>
          </div>
          <div class="modalfooter">
            <button class="btn" type="button" id="closeTrashGuidesFooter">Stäng</button>
          </div>
        </div>
      </div>`);

    const close = () => document.getElementById("trashGuidesModal").classList.add("hidden");
    document.getElementById("closeTrashGuides").onclick = close;
    document.getElementById("closeTrashGuidesFooter").onclick = close;
  }

  function renderTrash() {
    ensureTrashModal();
    const list = document.getElementById("trashGuidesList");
    const trash = ensureTrash();

    if (!trash.length) {
      list.innerHTML = `<div class="trash-empty">Papperskorgen är tom.</div>`;
      return;
    }

    list.innerHTML = trash.map((item) => {
      const title = item.page?.title || "Namnlös guide";
      const category = item.categoryTitle || "Okänd kategori";
      return `<div class="trash-item" data-trash-key="${escapeHtml(item.key)}">
        <div class="trash-item-main">
          <div class="trash-item-title">${escapeHtml(title)}</div>
          <div class="trash-item-meta">Från: ${escapeHtml(category)} · Borttagen ${escapeHtml(formatDeletedAt(item.deletedAt))}</div>
        </div>
        <div class="trash-item-actions">
          <button class="btn primary" type="button" data-restore-guide="${escapeHtml(item.key)}">Återställ</button>
          <button class="btn danger" type="button" data-delete-forever="${escapeHtml(item.key)}">Ta bort permanent</button>
        </div>
      </div>`;
    }).join("");
  }

  async function restoreGuide(key) {
    const trash = ensureTrash();
    const index = trash.findIndex((item) => item.key === key);
    if (index < 0) return;

    const item = trash[index];
    const page = JSON.parse(JSON.stringify(item.page || {}));
    let restoreKey = item.key;
    if (data.pages[restoreKey]) restoreKey = `restored-${Date.now()}`;

    const group = page.group || item.groupId;
    if (group && !data.categories?.some((c) => c.id === group)) {
      if (!Array.isArray(data.categories)) data.categories = [];
      data.categories.push({
        id: group,
        title: item.categoryTitle || "Återställda guider",
        layout: "compact"
      });
    }

    if (!page.group) page.group = group || data.categories?.[0]?.id || "other";
    data.pages[restoreKey] = page;
    trash.splice(index, 1);

    await saveContent();
    renderHome();
    renderTrash();
    toast("Guiden är återställd.");
  }

  async function deleteMediaForPage(page) {
    const paths = [];
    (page?.steps || []).forEach((step) => {
      if (step.imagePath) paths.push(step.imagePath);
      if (step.videoPath) paths.push(step.videoPath);
    });
    if (!paths.length) return;

    const cfg = window.LIVESTREAM_SUPABASE;
    if (!cfg?.url || !cfg?.key || !window.supabase) return;
    const client = window.supabase.createClient(cfg.url, cfg.key);
    const { error } = await client.storage.from("guide-images").remove(paths);
    if (error) throw new Error(`Kunde inte ta bort media: ${error.message}`);
  }

  async function deleteForever(key) {
    const trash = ensureTrash();
    const index = trash.findIndex((item) => item.key === key);
    if (index < 0) return;
    const item = trash[index];
    const title = item.page?.title || "guiden";

    if (!confirm(`Ta bort “${title}” permanent? Detta går inte att ångra.`)) return;

    await deleteMediaForPage(item.page);
    trash.splice(index, 1);
    await saveContent();
    renderHome();
    renderTrash();
    toast("Guiden är permanent borttagen.");
  }

  // Wrap the dynamic home renderer so the trash button is always restored after re-rendering.
  const baseRenderHome = renderHome;
  renderHome = function () {
    baseRenderHome();
    enhanceFrontToolbar();
  };

  // Intercept the existing delete-guide button before its old permanent-delete handler runs.
  document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("#deleteGuideBtn");
    if (!deleteButton || !admin) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const key = editingPageKey;
    const page = data.pages?.[key];
    if (!page) return;
    if (!confirm(`Flytta guiden “${page.title}” till papperskorgen?`)) return;

    ensureTrash();
    const category = data.categories?.find((c) => c.id === page.group);
    data.deletedGuides.unshift({
      key,
      page: JSON.parse(JSON.stringify(page)),
      groupId: page.group || "",
      categoryTitle: category?.title || "",
      deletedAt: new Date().toISOString()
    });

    delete data.pages[key];
    await saveContent();
    closeModal("editPageModal");
    showHome();
    toast("Guiden flyttades till papperskorgen.");
  }, true);

  document.addEventListener("click", async (event) => {
    if (!admin) return;

    const trashButton = event.target.closest("#trashGuidesBtn");
    if (trashButton) {
      event.preventDefault();
      renderTrash();
      document.getElementById("trashGuidesModal").classList.remove("hidden");
      return;
    }

    const restore = event.target.closest("[data-restore-guide]");
    if (restore) {
      event.preventDefault();
      try { await restoreGuide(restore.dataset.restoreGuide); }
      catch (error) { console.error(error); toast(error.message || "Kunde inte återställa guiden."); }
      return;
    }

    const permanent = event.target.closest("[data-delete-forever]");
    if (permanent) {
      event.preventDefault();
      try { await deleteForever(permanent.dataset.deleteForever); }
      catch (error) { console.error(error); toast(error.message || "Kunde inte ta bort guiden permanent."); }
    }
  }, true);

  window.addEventListener("load", () => {
    ensureTrash();
    ensureTrashModal();
    setTimeout(() => {
      renderHome();
    }, 0);
  });
})();
