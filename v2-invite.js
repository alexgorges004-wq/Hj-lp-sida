(() => {
  const S = window.LH2;
  if (!S?.supa) return;

  const sitePath = window.location.pathname || "/";
  const query = new URLSearchParams(window.location.search);
  const initialHash = String(window.__initialHash || window.location.hash || "");
  const inviteFlow = query.get("setup") === "admin" || /(?:^|[&#])type=(invite|recovery)(?:&|$)/i.test(initialHash);

  const css = document.createElement("style");
  css.textContent = `
    .v2-invite-screen{position:fixed;inset:0;z-index:10000;background:#06111f;display:flex;align-items:center;justify-content:center;padding:22px}
    .v2-invite-card{width:min(520px,100%);background:#102036;border:1px solid #29425f;border-radius:20px;padding:26px;box-shadow:0 24px 70px rgba(0,0,0,.45);color:#f3f6fb}
    .v2-invite-card h1{font-size:28px;margin:0 0 8px}.v2-invite-card p{color:#aebfd3;line-height:1.55;margin:0 0 18px}
    .v2-invite-card .field{margin:14px 0}.v2-invite-card label{display:block;font-weight:700;margin-bottom:7px}
    .v2-invite-card input{width:100%;box-sizing:border-box;border:1px solid #31506f;border-radius:12px;background:#091728;color:#fff;padding:12px 13px;font:inherit}
    .v2-invite-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}.v2-invite-error{color:#ffb7b7;min-height:22px;margin-top:10px}.v2-invite-ok{color:#bfffd9}
    @media(max-width:600px){.v2-invite-card{padding:20px}.v2-invite-actions{flex-direction:column}.v2-invite-actions .btn{width:100%}}
  `;
  document.head.appendChild(css);

  function inviteErrorFromUrl() {
    const hp = new URLSearchParams(initialHash.replace(/^#/, ""));
    return hp.get("error_description") || query.get("error_description") || "";
  }

  function ensureInviteScreen() {
    let screen = document.getElementById("v2InviteScreen");
    if (screen) return screen;
    screen = document.createElement("div");
    screen.id = "v2InviteScreen";
    screen.className = "v2-invite-screen";
    screen.innerHTML = `
      <div class="v2-invite-card">
        <h1>Skapa ditt adminlösenord</h1>
        <p id="v2InviteText">Verifierar din inbjudan…</p>
        <div id="v2InviteForm" class="hidden">
          <div class="field"><label for="v2InvitePassword">Nytt lösenord</label><input id="v2InvitePassword" type="password" autocomplete="new-password" minlength="8"></div>
          <div class="field"><label for="v2InvitePassword2">Bekräfta lösenord</label><input id="v2InvitePassword2" type="password" autocomplete="new-password" minlength="8"></div>
          <div id="v2InviteError" class="v2-invite-error" role="alert"></div>
          <div class="v2-invite-actions"><button class="btn primary" id="v2InviteSave" type="button">Skapa lösenord</button></div>
        </div>
        <div id="v2InviteDone" class="hidden">
          <p class="v2-invite-ok">Lösenordet är sparat. Ditt adminkonto är klart.</p>
          <div class="v2-invite-actions"><button class="btn primary" id="v2InviteContinue" type="button">Fortsätt till admin</button></div>
        </div>
      </div>`;
    document.body.appendChild(screen);

    document.getElementById("v2InviteSave").onclick = async () => {
      const p1 = document.getElementById("v2InvitePassword").value;
      const p2 = document.getElementById("v2InvitePassword2").value;
      const error = document.getElementById("v2InviteError");
      if (p1.length < 8) { error.textContent = "Lösenordet måste vara minst 8 tecken."; return; }
      if (p1 !== p2) { error.textContent = "Lösenorden matchar inte."; return; }
      const btn = document.getElementById("v2InviteSave");
      btn.disabled = true; btn.textContent = "Sparar…"; error.textContent = "";
      const { error: updateError } = await S.supa.auth.updateUser({ password: p1 });
      if (updateError) {
        error.textContent = updateError.message || "Kunde inte spara lösenordet.";
        btn.disabled = false; btn.textContent = "Skapa lösenord";
        return;
      }
      document.getElementById("v2InviteForm").classList.add("hidden");
      document.getElementById("v2InviteText").textContent = "Kontot är aktiverat.";
      document.getElementById("v2InviteDone").classList.remove("hidden");
    };

    document.getElementById("v2InviteContinue").onclick = () => {
      window.location.replace(`${window.location.origin}${sitePath}#admin`);
    };
    return screen;
  }

  async function showInviteIfReady(session) {
    if (!inviteFlow) return;
    ensureInviteScreen();
    const text = document.getElementById("v2InviteText");
    const form = document.getElementById("v2InviteForm");
    const urlError = inviteErrorFromUrl();
    if (urlError) {
      text.textContent = "Länken är ogiltig eller har gått ut. Be ägaren skicka ett nytt lösenordsmejl.";
      return;
    }
    if (!session?.user) {
      text.textContent = "Verifierar länken…";
      return;
    }
    text.textContent = `Välj ett lösenord för ${session.user.email || "ditt adminkonto"}.`;
    form.classList.remove("hidden");
  }

  if (inviteFlow) {
    ensureInviteScreen();
    S.supa.auth.getSession().then(({ data }) => showInviteIfReady(data?.session));
    S.supa.auth.onAuthStateChange((_event, session) => setTimeout(() => showInviteIfReady(session), 0));
  }

  async function adminApi(action, payload = {}) {
    const { data: { session } } = await S.supa.auth.getSession();
    if (!session?.access_token) throw new Error("Du är inte inloggad.");
    const r = await fetch("/.netlify/functions/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action, ...payload })
    });
    let body = {};
    try { body = await r.json(); } catch {}
    if (!r.ok) throw new Error(body.error || "Adminfunktionen kunde inte köras.");
    return body;
  }

  async function refreshAdmins() {
    const list = document.getElementById("v2AdminsList");
    if (!list) return;
    const r = await adminApi("list");
    const users = r.users || [];
    list.innerHTML = users.length ? users.map(x => `<div class="v2-list-item"><div><strong>${S.esc(x.email || x.id)}</strong><small>${S.esc(x.id)}</small></div><div class="v2-admin-actions"><select data-admin-role="${S.esc(x.id)}"><option value="admin" ${x.role === "admin" ? "selected" : ""}>Admin</option><option value="owner" ${x.role === "owner" ? "selected" : ""}>Ägare</option></select><button class="btn small danger" data-remove-admin="${S.esc(x.id)}" type="button">Ta bort</button></div></div>`).join("") : '<div class="trash-empty">Inga admins hittades.</div>';
  }

  function enhanceInviteButton() {
    const btn = document.getElementById("v2AdminInvite");
    if (!btn || btn.dataset.inviteV2 === "1") return;
    btn.dataset.inviteV2 = "1";
    btn.onclick = async () => {
      const emailInput = document.getElementById("v2AdminEmail");
      const email = emailInput?.value.trim() || "";
      if (!email) return toast("Skriv en e-postadress.");
      const oldText = btn.textContent;
      btn.disabled = true; btn.textContent = "Skickar…";
      try {
        const r = await adminApi("invite", { email });
        if (emailInput) emailInput.value = "";
        await refreshAdmins();
        if (r.setupSent && r.invited === false) toast("Nytt lösenordsmejl skickat till adminen.");
        else if (r.invited === true) toast("Admininbjudan skickad.");
        else toast("Användaren har redan adminbehörighet.");
      } catch (e) {
        toast(e.message || "Kunde inte bjuda in admin.");
      } finally {
        btn.disabled = false; btn.textContent = oldText;
      }
    };
  }

  const observer = new MutationObserver(enhanceInviteButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceInviteButton);
  else enhanceInviteButton();
})();
