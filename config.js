// Public Supabase browser configuration.
// The publishable key is intended for frontend use; access is protected by RLS.
window.LIVESTREAM_SUPABASE = {
  url: "https://toluklygrkzsfpqoxkvm.supabase.co",
  key: "sb_publishable_dgn8kMvfYxmq48nBhvXfnA_nSpYEeyF"
};

window.addEventListener("load", async () => {
  const cfg = window.LIVESTREAM_SUPABASE;
  if (!cfg?.url || !cfg?.key || !window.supabase) return;

  const supa = window.supabase.createClient(cfg.url, cfg.key);

  async function isAdmin() {
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return false;
    const { data: row, error } = await supa
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    return !error && !!row;
  }

  async function refreshFromCloud() {
    const { data: row, error } = await supa
      .from("guide_data")
      .select("content")
      .eq("id", "main")
      .maybeSingle();
    if (!error && row?.content) {
      data = row.content;
      renderHome();
      if (currentPage) renderPage(currentPage);
    }
  }

  updateAdminView = function () {
    if (document.getElementById("adminModeText")) document.getElementById("adminModeText").textContent = "Supabase Auth";
    if (document.getElementById("storageModeText")) document.getElementById("storageModeText").textContent = "Supabase database";
    if (document.getElementById("backendModeText")) document.getElementById("backendModeText").textContent = "Ansluten";
    if (document.getElementById("realLogin")) document.getElementById("realLogin").classList.remove("hidden");
    if (document.getElementById("demoLogin")) document.getElementById("demoLogin").classList.add("hidden");
  };

  saveContent = async function () {
    if (!admin) return;
    const { error } = await supa.from("guide_data").upsert({
      id: "main",
      content: data,
      updated_at: new Date().toISOString()
    });
    if (error) {
      toast("Kunde inte spara online: " + error.message);
      return;
    }
    if (document.getElementById("saveDot")) document.getElementById("saveDot").className = "dot good";
    if (document.getElementById("saveState")) document.getElementById("saveState").textContent = "Sparat online";
    toast("Sparat online");
  };

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      updateAdminView();
      openModal("loginModal");
    };
  }

  const submit = document.getElementById("submitLoginBtn");
  if (submit) {
    submit.onclick = async () => {
      const email = document.getElementById("loginEmail")?.value.trim();
      const password = document.getElementById("loginPassword")?.value || "";
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        toast(error.message);
        return;
      }
      if (!(await isAdmin())) {
        await supa.auth.signOut();
        toast("Kontot har inte adminbehörighet");
        return;
      }
      setAdmin(true);
      closeModal("loginModal");
      updateAdminView();
      toast("Inloggad");
    };
  }

  const logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.onclick = async () => {
      await supa.auth.signOut();
      setAdmin(false);
      showHome();
      toast("Utloggad");
    };
  }

  await refreshFromCloud();
  const { data: { session } } = await supa.auth.getSession();
  if (session && await isAdmin()) setAdmin(true);
  updateAdminView();
});
