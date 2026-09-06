(() => {
  const TEXT_TYPES = new Set(["plain", "encouragement", "info", "warning"]);

  function uid(prefix) {
    const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${value.slice(0, 12)}`;
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function ensureHomeState() {
    if (!data.homeTextBlocks || Array.isArray(data.homeTextBlocks) || typeof data.homeTextBlocks !== "object") {
      data.homeTextBlocks = {};
    }

    Object.entries(data.homeTextBlocks).forEach(([id, block]) => {
      if (!block || typeof block !== "object") delete data.homeTextBlocks[id];
      else {
        block.title = block.title || "";
        block.text = block.text || "";
        block.style = TEXT_TYPES.has(block.style) ? block.style : "plain";
      }
    });

    const categoryIds = new Set((data.categories || []).map((category) => category.id));
    const textIds = new Set(Object.keys(data.homeTextBlocks));
    const seen = new Set();
    let layout = Array.isArray(data.homeLayout) ? data.homeLayout.filter((ref) => typeof ref === "string") : [];

    layout = layout.filter((ref) => {
      if (seen.has(ref)) return false;
      const [type, ...rest] = ref.split(":");
      const id = rest.join(":");
      const valid = type === "cat" ? categoryIds.has(id) : type === "text" ? textIds.has(id) : false;
      if (valid) seen.add(ref);
      return valid;
    });

    (data.categories || []).forEach((category) => {
      const ref = `cat:${category.id}`;
      if (!seen.has(ref)) {
        layout.push(ref);
        seen.add(ref);
      }
    });

    Object.keys(data.homeTextBlocks).forEach((id) => {
      const ref = `text:${id}`;
      if (!seen.has(ref)) layout.push(ref);
    });

    data.homeLayout = layout;
    return layout;
  }

  function textBlockMarkup(id, block, index, total) {
    const controls = admin ? `<div class="home-text-controls">
      <button class="btn small" type="button" data-home-up="text:${escapeHtml(id)}" ${index === 0 ? "disabled" : ""} title="Flytta upp">↑</button>
      <button class="btn small" type="button" data-home-down="text:${escapeHtml(id)}" ${index === total - 1 ? "disabled" : ""} title="Flytta ner">↓</button>
      <button class="btn small" type="button" data-edit-home-text="${escapeHtml(id)}">✎ Redigera</button>
    </div>` : "";

    return `<section class="home-text-block home-text-${escapeHtml(block.style || "plain")}" data-home-text="${escapeHtml(id)}">
      ${controls}
      ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
      ${block.text ? `<p>${escapeHtml(block.text).replace(/\n/g, "<br>")}</p>` : ""}
    </section>`;
  }

  function enhanceHome() {
    const holder = document.getElementById("dynamicCategories");
    if (!holder) return;
    const layout = ensureHomeState();
    const toolbar = holder.querySelector(".front-admin-toolbar");

    if (toolbar && admin) {
      const description = toolbar.querySelector("span");
      if (description) description.textContent = "Lägg till och flytta kategorier, guider och textblock direkt här.";

      if (!document.getElementById("addHomeTextBtn")) {
        const add = document.createElement("button");
        add.className = "btn";
        add.type = "button";
        add.id = "addHomeTextBtn";
        add.textContent = "+ Textblock";
        const addCategory = toolbar.querySelector("#addCategoryBtn");
        if (addCategory) addCategory.parentNode.insertBefore(add, addCategory);
        else toolbar.appendChild(add);
      }
    }

    const categoryNodes = new Map();
    holder.querySelectorAll(".front-category[data-category]").forEach((section) => {
      const id = section.dataset.category;
      categoryNodes.set(id, section);
      const ref = `cat:${id}`;
      const index = layout.indexOf(ref);
      const up = section.querySelector("[data-cat-up]");
      const down = section.querySelector("[data-cat-down]");
      if (up) {
        up.removeAttribute("data-cat-up");
        up.dataset.homeUp = ref;
        up.disabled = index <= 0;
        up.title = "Flytta upp på startsidan";
      }
      if (down) {
        down.removeAttribute("data-cat-down");
        down.dataset.homeDown = ref;
        down.disabled = index < 0 || index >= layout.length - 1;
        down.title = "Flytta ner på startsidan";
      }
    });

    holder.querySelectorAll(".home-text-block").forEach((node) => node.remove());

    layout.forEach((ref, index) => {
      const [type, ...rest] = ref.split(":");
      const id = rest.join(":");
      let node = null;
      if (type === "cat") node = categoryNodes.get(id) || null;
      if (type === "text" && data.homeTextBlocks[id]) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = textBlockMarkup(id, data.homeTextBlocks[id], index, layout.length).trim();
        node = wrapper.firstElementChild;
      }
      if (node) holder.appendChild(node);
    });
  }

  const style = document.createElement("style");
  style.textContent = `
    .home-text-block{position:relative;margin-top:22px;border:1px solid #2c4360;border-radius:18px;padding:20px 21px;background:linear-gradient(180deg,#102036,#0c1828);box-shadow:0 12px 34px rgba(0,0,0,.18)}
    .home-text-block h2{margin:0 0 7px;font-size:clamp(20px,3vw,27px);letter-spacing:-.02em}.home-text-block p{margin:0;color:#b2c0d2;line-height:1.6;font-size:15px}
    .home-text-encouragement{border-color:#375b57;background:linear-gradient(180deg,#12302e,#0d211f)}.home-text-encouragement h2{color:#d7fff1}
    .home-text-info{border-color:#31527c;background:linear-gradient(180deg,#102b49,#0c1e34)}.home-text-info h2{color:#d8eaff}
    .home-text-warning{border-color:#6f5730;background:linear-gradient(180deg,#342812,#241c0e)}.home-text-warning h2{color:#ffe1a3}
    .home-text-controls{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin:-5px -5px 12px}.home-text-controls .btn[disabled]{opacity:.35;cursor:not-allowed}
    .home-text-modal-note{padding:11px 12px;border:1px solid #2e4664;border-radius:12px;background:#0a1727;color:#9fb0c5;font-size:13px;line-height:1.45}
    @media(max-width:720px){.home-text-block{padding:17px}.home-text-controls{justify-content:flex-start}.home-text-controls .btn{flex:1}.front-admin-toolbar{flex-wrap:wrap}}
  `;
  document.head.appendChild(style);

  let editingTextId = null;

  function ensureTextModal() {
    if (document.getElementById("homeTextModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modalback hidden" id="homeTextModal"><div class="modal">
        <div class="modalhead"><h2 id="homeTextModalTitle">Textblock</h2><button class="close" type="button" id="closeHomeTextModal">×</button></div>
        <div class="modalbody">
          <div class="field"><label>Rubrik</label><input id="homeTextTitle" maxlength="140" placeholder="T.ex. DET ÄR OKEJ ATT GÖRA MISSTAG"></div>
          <div class="field"><label>Text <span style="font-weight:500;color:#8fa2ba">(valfritt)</span></label><textarea id="homeTextBody" placeholder="Skriv en kort text här."></textarea></div>
          <div class="field"><label>Stil</label><select id="homeTextStyle"><option value="encouragement">Uppmuntran</option><option value="plain">Vanlig</option><option value="info">Info</option><option value="warning">Varning</option></select></div>
          <div class="home-text-modal-note">Efter att du sparat kan textblocket flyttas upp eller ner mellan alla kategorier på startsidan.</div>
        </div>
        <div class="modalfooter"><button class="btn danger hidden" type="button" id="deleteHomeTextBtn">Ta bort</button><div style="flex:1"></div><button class="btn" type="button" id="cancelHomeTextBtn">Avbryt</button><button class="btn primary" type="button" id="saveHomeTextBtn">Spara</button></div>
      </div></div>`);

    const close = () => document.getElementById("homeTextModal").classList.add("hidden");
    document.getElementById("closeHomeTextModal").onclick = close;
    document.getElementById("cancelHomeTextBtn").onclick = close;

    document.getElementById("saveHomeTextBtn").onclick = async () => {
      const title = document.getElementById("homeTextTitle").value.trim();
      const text = document.getElementById("homeTextBody").value.trim();
      const blockStyle = document.getElementById("homeTextStyle").value;
      if (!title && !text) return toast("Skriv en rubrik eller text.");
      ensureHomeState();
      if (editingTextId) {
        data.homeTextBlocks[editingTextId] = { title, text, style: blockStyle };
      } else {
        const id = uid("text");
        data.homeTextBlocks[id] = { title, text, style: blockStyle };
        data.homeLayout.push(`text:${id}`);
      }
      await saveContent();
      renderHome();
      close();
    };

    document.getElementById("deleteHomeTextBtn").onclick = async () => {
      if (!editingTextId) return;
      const block = data.homeTextBlocks?.[editingTextId];
      if (!block || !confirm(`Ta bort textblocket${block.title ? ` “${block.title}”` : ""}?`)) return;
      delete data.homeTextBlocks[editingTextId];
      data.homeLayout = (data.homeLayout || []).filter((ref) => ref !== `text:${editingTextId}`);
      await saveContent();
      renderHome();
      close();
    };
  }

  function openTextModal(id = null) {
    ensureHomeState();
    ensureTextModal();
    editingTextId = id;
    const block = id ? data.homeTextBlocks[id] : null;
    document.getElementById("homeTextModalTitle").textContent = block ? "Redigera textblock" : "Nytt textblock";
    document.getElementById("homeTextTitle").value = block?.title || "";
    document.getElementById("homeTextBody").value = block?.text || "";
    document.getElementById("homeTextStyle").value = block?.style || "encouragement";
    document.getElementById("deleteHomeTextBtn").classList.toggle("hidden", !block);
    document.getElementById("homeTextModal").classList.remove("hidden");
    setTimeout(() => document.getElementById("homeTextTitle").focus(), 0);
  }

  async function moveHomeItem(ref, delta) {
    const layout = ensureHomeState();
    const index = layout.indexOf(ref);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= layout.length) return;
    [layout[index], layout[target]] = [layout[target], layout[index]];
    data.homeLayout = layout;
    await saveContent();
    renderHome();
  }

  const baseRenderHome = renderHome;
  renderHome = function () {
    baseRenderHome();
    enhanceHome();
  };

  document.addEventListener("click", async (event) => {
    if (!admin) return;

    const add = event.target.closest("#addHomeTextBtn");
    if (add) { event.preventDefault(); openTextModal(); return; }

    const edit = event.target.closest("[data-edit-home-text]");
    if (edit) { event.preventDefault(); event.stopPropagation(); openTextModal(edit.dataset.editHomeText); return; }

    const up = event.target.closest("[data-home-up]");
    if (up) { event.preventDefault(); event.stopPropagation(); await moveHomeItem(up.dataset.homeUp, -1); return; }

    const down = event.target.closest("[data-home-down]");
    if (down) { event.preventDefault(); event.stopPropagation(); await moveHomeItem(down.dataset.homeDown, 1); }
  }, true);

  window.addEventListener("load", () => {
    ensureTextModal();
    setTimeout(() => {
      ensureHomeState();
      renderHome();
    }, 0);
  });
})();
