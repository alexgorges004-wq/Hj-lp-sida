(() => {
  const S = window.LH2;
  if (!S?.supa) return;

  const sitePath = window.location.pathname || "/";
  const initialSearch = String(window.__initialSearch ?? window.location.search ?? "");
  const query = new URLSearchParams(initialSearch);
  const initialHash = String(window.__initialHash || window.location.hash || "");
  const hashParams = new URLSearchParams(initialHash.replace(/^#/, ""));

  const setupRequested = query.get("setup") === "admin";
  const callbackType = String(hashParams.get("type") || query.get("type") || "").toLowerCase();
  const accessToken = hashParams.get("access_token") || "";
  const refreshToken = hashParams.get("refresh_token") || "";
  const callbackCode = query.get("code") || "";
  const urlError = hashParams.get("error_description") || query.get("error_description") || "";

  const tokenCallback = setupRequested && ["invite", "recovery"].includes(callbackType) && Boolean(accessToken && refreshToken);
  const codeCallback = setupRequested && Boolean(callbackCode);
  const inviteFlow = setupRequested;

  function jwtSubject(token) {
    try {
      const part = String(token || "").split(".")[1];
      if (!part) return "";
      const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
      return String(JSON.parse(atob(padded))?.sub || "");
    } catch {
      return "";
    }
  }

  const expectedUserId = tokenCallback ? jwtSubject(accessToken) : "";
  let validatedUserId = "";
  let callbackConsumed = false;

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

      const { data: { session } } = await S.supa.auth.getSession();
      if (!validatedUserId || !session?.user || session.user.id !== validatedUserId) {
        error.textContent = "Inbjudan matchar inte den aktiva sessionen. Öppna länken igen eller be ägaren skicka en ny.";
        return;
      }

      const btn = document.getElementById("v2InviteSave");
      btn.disabled = true;
      btn.textContent = "Sparar…";
      error.textContent = "";

      try {
        const { error: updateError } = await S.supa.auth.updateUser({ password: p1 });
        if (updateError) throw updateError;

        document.getElementById("v2InvitePassword").value = "";
        document.getElementById("v2InvitePassword2").value = "";
        document.getElementById("v2InviteForm").classList.add("hidden");
        document.getElementById("v2InviteText").textContent = "Kontot är aktiverat.";
        document.getElementById("v2InviteDone").classList.remove("hidden");
        history.replaceState(null, "", `${sitePath}#admin`);
      } catch (updateError) {
        error.textContent = updateError?.message || "Kunde inte spara lösenordet.";
        btn.disabled = false;
        btn.textContent = "Skapa lösenord";
      }
    };

    document.getElementById("v2InviteContinue").onclick = () => {
      window.location.replace(`${window.location.origin}${sitePath}#admin`);
    };

    return screen;
  }

  function showError(message) {
    ensureInviteScreen();
    const form = document.getElementById("v2InviteForm");
    if (form) form.classList.add("hidden");
    const text = document.getElementById("v2InviteText");
    if (text) text.textContent = message;
  }

  function showForm(session) {
    if (!session?.user) {
      showError("Kunde inte verifiera adminkontot. Be ägaren skicka en ny inbjudan.");
      return;
    }
    if (expectedUserId && session.user.id !== expectedUserId) {
      showError("Inbjudan matchar inte adminkontot. Be ägaren skicka en ny inbjudan.");
      return;
    }

    validatedUserId = session.user.id;
    ensureInviteScreen();
    document.getElementById("v2InviteText").textContent = `Välj ett lösenord för ${session.user.email || "ditt adminkonto"}.`;
    document.getElementById("v2InviteForm").classList.remove("hidden");
  }

  async function establishInviteSession() {
    if (!inviteFlow || callbackConsumed) return;
    callbackConsumed = true;
    ensureInviteScreen();

    if (urlError) {
      showError("Länken är ogiltig eller har gått ut. Be ägaren skicka ett nytt lösenordsmejl.");
      return;
    }

    if (!tokenCallback && !codeCallback) {
      showError("Den här sidan kan bara öppnas från en giltig admininbjudan eller lösenordslänk.");
      return;
    }

    try {
      let session = null;

      if (tokenCallback) {
        const { data, error } = await S.supa.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) throw error;
        session = data?.session || null;
      } else {
        const { data, error } = await S.supa.auth.exchangeCodeForSession(callbackCode);
        if (error) throw error;
        session = data?.session || null;
      }

      if (!session?.user) throw new Error("Ingen giltig session skapades från länken.");
      if (expectedUserId && session.user.id !== expectedUserId) throw new Error("Länken hör till ett annat konto.");

      history.replaceState(null, "", `${sitePath}?setup=admin`);
      showForm(session);
    } catch (error) {
      console.error("Kunde inte verifiera adminlänken", error);
      showError("Länken är ogiltig eller har gått ut. Be ägaren skicka en ny inbjudan.");
    }
  }

  if (inviteFlow) establishInviteSession();
})();
