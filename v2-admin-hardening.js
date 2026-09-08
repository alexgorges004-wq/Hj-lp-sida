(() => {
  const S = window.LH2;
  if (!S?.supa) return;

  const API_URL = "/.netlify/functions/admin-users";
  const REQUEST_TIMEOUT_MS = 10000;

  async function adminApi(action, payload = {}) {
    const { data: { session } } = await S.supa.auth.getSession();
    if (!session?.access_token) throw new Error("Du är inte inloggad.");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action, ...payload }),
        signal: controller.signal
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Adminservern svarade inte inom 10 sekunder.");
      }
      throw new Error("Kunde inte kontakta adminservern.");
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let body = {};
    if (text) {
      try { body = JSON.parse(text); } catch {}
    }

    if (!response.ok) {
      throw new Error(body.error || `Serverfel ${response.status} från Netlify.`);
    }
    if (!body || typeof body !== "object") {
      throw new Error("Adminservern skickade ett ogiltigt svar.");
    }
    return body;
  }

  async function readAdminState() {
    const { data: { session } } = await S.supa.auth.getSession();
    S.state.user = session?.user || null;
    if (!session?.user) return { ok: false, role: "admin" };

    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data: row, error } = await S.supa
        .from("admins")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!error) {
        if (!row) return { ok: false, role: "admin" };
        if (row.role === "owner") return { ok: true, role: "owner" };
        if (row.role === "admin") return { ok: true, role: "admin" };
        return { ok: false, role: "admin", error: new Error("Okänd adminroll i Supabase.") };
      }

      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    }

    return { ok: false, role: "admin", error: lastError || new Error("Kunde inte verifiera adminrollen.") };
  }

  async function applyAdminState() {
    const state = await readAdminState();
    S.state.role = state.role;
    if (typeof setAdmin === "function") setAdmin(state.ok);
    S.updateIdentity?.();
    bindOwnerButton();
    if (state.error) console.warn("Adminrollen kunde inte verifieras; behörighet stängdes av.", state.error);
    return state;
  }

  S.getAdminState = readAdminState;
  S.refreshAdminState = applyAdminState;

  function ensureAdminsModal() {
    let modal = document.getElementById("v2AdminsModal");
    if (!modal) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="modalback hidden" id="v2AdminsModal">
          <div class="modal">
            <div class="modalhead">
              <h2>Användare & roller</h2>
              <button class="close" id="v2AdminsClose" type="button">×</button>
            </div>
            <div class="modalbody">
              <div class="v2-note">Ägare kan bjuda in fler admins och ändra deras roller.</div>
              <div class="v2-admin-invite">
                <input id="v2AdminEmail" type="email" placeholder="namn@example.com">
                <button class="btn primary" id="v2AdminInvite" type="button">Bjud in admin</button>
              </div>
              <div id="v2AdminsList" class="v2-list"></div>
            </div>
            <div class="modalfooter">
              <button class="btn" id="v2AdminsDone" type="button">Stäng</button>
            </div>
          </div>
        </div>`);
      modal = document.getElementById("v2AdminsModal");
    }
    bindModal(modal);
    return modal;
  }

  function renderAdmins(users = []) {
    const list = document.getElementById("v2AdminsList");
    if (!list) return;
    list.innerHTML = users.length
      ? users.map((user) => `
          <div class="v2-list-item">
            <div>
              <strong>${S.esc(user.email || user.id)}</strong>
              <small>${S.esc(user.id)}</small>
            </div>
            <div class="v2-admin-actions">
              <select data-admin-role="${S.esc(user.id)}">
                <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                <option value="owner" ${user.role === "owner" ? "selected" : ""}>Ägare</option>
              </select>
              <button class="btn small danger" data-remove-admin="${S.esc(user.id)}" type="button" ${user.id === S.state.user?.id ? "disabled" : ""}>Ta bort</button>
            </div>
          </div>`).join("")
      : '<div class="trash-empty">Inga admins hittades.</div>';
  }

  async function loadAdmins() {
    const list = document.getElementById("v2AdminsList");
    if (!list) return;
    list.innerHTML = '<div class="trash-empty">Laddar…</div>';
    try {
      const result = await adminApi("list");
      renderAdmins(result.users || []);
    } catch (error) {
      list.innerHTML = `<div class="trash-empty">${S.esc(error.message || "Kunde inte läsa admins.")}<br><br><button class="btn small" id="v2AdminsRetry" type="button">Försök igen</button></div>`;
      const retry = document.getElementById("v2AdminsRetry");
      if (retry) retry.onclick = loadAdmins;
    }
  }

  async function inviteAdmin() {
    const input = document.getElementById("v2AdminEmail");
    const button = document.getElementById("v2AdminInvite");
    const email = input?.value.trim() || "";
    if (!email) return toast("Skriv en e-postadress.");

    const oldText = button?.textContent || "Bjud in admin";
    if (button) {
      button.disabled = true;
      button.textContent = "Skickar…";
    }

    try {
      const result = await adminApi("invite", { email });
      if (input) input.value = "";
      if (result.invited === true) toast("Admininbjudan skickad.");
      else if (result.setupSent === true) toast("Nytt lösenordsmejl skickat till adminen.");
      else toast("Användaren har redan adminbehörighet.");
      loadAdmins().catch((error) => console.warn("Kunde inte uppdatera adminlistan", error));
    } catch (error) {
      toast(error.message || "Kunde inte bjuda in admin.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = oldText;
      }
    }
  }

  function bindModal(modal) {
    if (!modal) return;
    const close = () => modal.classList.add("hidden");
    const closeButton = document.getElementById("v2AdminsClose");
    const doneButton = document.getElementById("v2AdminsDone");
    const inviteButton = document.getElementById("v2AdminInvite");
    if (closeButton) closeButton.onclick = close;
    if (doneButton) doneButton.onclick = close;
    if (inviteButton) inviteButton.onclick = inviteAdmin;

    const list = document.getElementById("v2AdminsList");
    if (!list || list.dataset.hardenedAdminEvents === "1") return;
    list.dataset.hardenedAdminEvents = "1";

    list.addEventListener("change", async (event) => {
      const select = event.target.closest("[data-admin-role]");
      if (!select) return;
      event.stopImmediatePropagation();
      const previous = select.value === "owner" ? "admin" : "owner";
      select.disabled = true;
      try {
        await adminApi("setRole", { userId: select.dataset.adminRole, role: select.value });
        toast("Rollen är uppdaterad.");
        await loadAdmins();
        await applyAdminState();
      } catch (error) {
        select.value = previous;
        toast(error.message || "Kunde inte ändra rollen.");
        await loadAdmins();
      } finally {
        select.disabled = false;
      }
    }, true);

    list.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-remove-admin]");
      if (!button) return;
      event.stopImmediatePropagation();
      if (button.disabled || !confirm("Ta bort adminbehörigheten?")) return;
      button.disabled = true;
      try {
        await adminApi("remove", { userId: button.dataset.removeAdmin });
        toast("Adminbehörigheten är borttagen.");
        await loadAdmins();
      } catch (error) {
        toast(error.message || "Kunde inte ta bort admin.");
        await loadAdmins();
      }
    }, true);
  }

  async function openAdmins() {
    const state = await applyAdminState();
    if (!state.ok || state.role !== "owner") {
      toast("Endast Ägare kan hantera admins.");
      return;
    }
    const modal = ensureAdminsModal();
    modal.classList.remove("hidden");
    await loadAdmins();
  }

  function bindOwnerButton() {
    const button = document.getElementById("v2AdminsBtn");
    if (!button) return;
    button.classList.toggle("hidden", S.state.role !== "owner");
    if (button.dataset.hardenedAdminButton === "1") return;
    button.dataset.hardenedAdminButton = "1";
    button.onclick = openAdmins;
  }

  const observer = new MutationObserver(() => {
    bindOwnerButton();
    const modal = document.getElementById("v2AdminsModal");
    if (modal) bindModal(modal);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  S.supa.auth.onAuthStateChange(() => {
    setTimeout(applyAdminState, 80);
    setTimeout(applyAdminState, 700);
  });

  if (document.readyState === "loading") {
    window.addEventListener("load", () => {
      setTimeout(applyAdminState, 900);
      setTimeout(applyAdminState, 2200);
      bindOwnerButton();
    });
  } else {
    setTimeout(applyAdminState, 200);
    setTimeout(applyAdminState, 900);
    bindOwnerButton();
  }
})();
