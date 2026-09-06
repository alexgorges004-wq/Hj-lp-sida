// Public Supabase browser configuration.
// The publishable key is intended for frontend use; access is protected by RLS.
window.LIVESTREAM_SUPABASE = {
  url: "https://toluklygrkzsfpqoxkvm.supabase.co",
  key: "sb_publishable_dgn8kMvfYxmq48nBhvXfnA_nSpYEeyF"
};

window.addEventListener("load", async () => {
  const cfg = window.LIVESTREAM_SUPABASE;
  if (!cfg?.url || !cfg?.key || !window.supabase) return;

  // Dark, simpler UI + screenshot styles. Injected here so Netlify only needs this file update.
  const style = document.createElement("style");
  style.textContent = `
    :root{--bg:#07101d!important;--surface:#0d1828!important;--text:#f3f6fb!important;--muted:#9cacc1!important;--line:#23344c!important;--primary:#7c5cff!important;--soft:#17263a!important;--shadow:0 18px 50px rgba(0,0,0,.28)!important}
    body{background:radial-gradient(circle at 15% 0%,#10223c 0,#07101d 38%,#050b14 100%)!important;color:var(--text)!important;min-height:100vh}
    .topbar{background:rgba(7,16,29,.9)!important;border-bottom-color:var(--line)!important}
    .logo{background:linear-gradient(145deg,#7c5cff,#4b7cff)!important;box-shadow:0 7px 24px rgba(91,92,255,.25)}
    .hero,.card,.quickitem,.panel,.step,.modal,.stepedit,.admincard{background:linear-gradient(180deg,#111f33,#0d1828)!important;border-color:#23344c!important;box-shadow:var(--shadow)!important;color:#f3f6fb!important}
    .hero p,.lead,.card p,.quickitem small,.step p,.panel p,.hint,.admincard span,.brand span{color:#9cacc1!important}
    .card,.quickitem{transition:transform .16s ease,border-color .16s ease,background .16s ease;cursor:pointer}
    .card:hover,.quickitem:hover{transform:translateY(-2px);border-color:#526789!important;background:#12243a!important}
    .card .ico{background:#192b45!important;color:#dce6ff!important}.card .more{color:#b9c7dd!important}.arr{color:#6f83a0!important}
    .btn{background:#101e31!important;border-color:#2b405d!important;color:#f3f6fb!important}.btn:hover{background:#162943!important}.btn.primary{background:linear-gradient(135deg,#7c5cff,#5b7cff)!important;border-color:#7c5cff!important;color:#fff!important}.btn.danger{background:#a63442!important;border-color:#b94252!important;color:#fff!important}
    .back{color:#b1c0d3!important}.kicker,.sectionlabel{color:#8293aa!important}.num{background:linear-gradient(135deg,#7c5cff,#5b7cff)!important}
    .field input,.field textarea,.field select{background:#091523!important;border-color:#2a3d58!important;color:#f3f6fb!important}.field input::placeholder,.field textarea::placeholder{color:#62748c!important}
    .close{background:#101e31!important;border-color:#2a3d58!important;color:#fff!important}.modalback{background:rgba(1,5,12,.78)!important;backdrop-filter:blur(6px)}
    .adminbar{background:#171329!important;border-bottom-color:#3c3267!important;color:#d8ceff!important}.statuspill{background:#112236!important;color:#c9d5e6!important}.dot.good{background:#3bd17e!important}
    .toast{background:#f4f7fb!important;color:#101828!important;box-shadow:0 12px 35px rgba(0,0,0,.35)}
    .guide-shot-wrap{margin:16px 0 2px;max-width:820px}.guide-shot-link{display:block;position:relative;border:1px solid #314765;border-radius:14px;overflow:hidden;background:#050b14;text-decoration:none}.guide-shot{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;background:#050b14}.zoom-hint{position:absolute;right:10px;bottom:10px;background:rgba(4,10,20,.78);color:#eaf0fa;padding:6px 9px;border-radius:9px;font-size:12px;font-weight:750}.guide-shot-wrap figcaption{margin-top:7px;color:#9cacc1;font-size:13px;line-height:1.45}
    .guide-video-wrap{margin:16px 0 2px;max-width:820px}.guide-video{display:block;width:100%;max-height:520px;border:1px solid #314765;border-radius:14px;background:#050b14}.guide-video-wrap figcaption{margin-top:7px;color:#9cacc1;font-size:13px;line-height:1.45}
    .shot-editor{margin-top:12px;padding:13px;border:1px dashed #355071;border-radius:14px;background:#091523}.shot-editor-title{font-weight:800;margin-bottom:12px}.shot-editor-title span{font-weight:600;color:#9cacc1;font-size:12px;margin-left:5px}.current-shot{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:10px;background:#0c1a2a;border:1px solid #273c57;border-radius:12px}.current-shot img{width:130px;max-height:90px;object-fit:cover;border-radius:9px;border:1px solid #314865}.current-shot small{display:block;color:#9cacc1;margin-bottom:7px}.stepcontent{min-width:0}
    @media(max-width:720px){.guide-shot{max-height:380px}.current-shot{align-items:flex-start;flex-direction:column}.current-shot img{width:100%;max-height:180px}.hero{padding:20px!important}.card{padding:17px!important}}
  `;
  document.head.appendChild(style);

  const supa = window.supabase.createClient(cfg.url, cfg.key);
  const BUCKET = "guide-images";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

  async function isAdmin() {
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return false;
    const { data: row, error } = await supa.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    return !error && !!row;
  }

  async function refreshFromCloud() {
    const { data: row, error } = await supa.from("guide_data").select("content").eq("id", "main").maybeSingle();
    if (!error && row?.content) {
      data = row.content;
      renderHome();
      if (currentPage) renderPage(currentPage);
    }
  }

  updateAdminView = function () {
    if (document.getElementById("adminModeText")) document.getElementById("adminModeText").textContent = "Supabase Auth";
    if (document.getElementById("storageModeText")) document.getElementById("storageModeText").textContent = "Supabase + media";
    if (document.getElementById("backendModeText")) document.getElementById("backendModeText").textContent = "Ansluten";
    if (document.getElementById("loginConnected")) document.getElementById("loginConnected").classList.remove("hidden");
    if (document.getElementById("loginDemo")) document.getElementById("loginDemo").classList.add("hidden");
  };

  saveContent = async function () {
    if (!admin) return;
    const { error } = await supa.from("guide_data").upsert({ id: "main", content: data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    if (document.getElementById("saveDot")) document.getElementById("saveDot").className = "dot good";
    if (document.getElementById("saveState")) document.getElementById("saveState").textContent = "Sparat online";
    toast("Sparat online");
  };

  // Render screenshots directly under the relevant step.
  renderPage = function (key) {
    const p = data.pages[key];
    if (!p) return showHome();
    currentPage = key;
    document.getElementById("pageKicker").textContent = p.kicker || "";
    document.getElementById("pageTitle").textContent = p.title;
    document.getElementById("pageIntro").textContent = p.intro || "";
    document.getElementById("editPageBtn").classList.toggle("hidden", !admin);
    let html = '<div class="steps">';
    (p.steps || []).forEach((step, i) => {
      const shot = step.imageUrl ? `<figure class="guide-shot-wrap"><a class="guide-shot-link" href="${esc(step.imageUrl)}" target="_blank" rel="noopener"><img class="guide-shot" src="${esc(step.imageUrl)}" alt="${esc(step.imageCaption || ('Screenshot för ' + (step.title || 'detta steg')))}" loading="lazy"><span class="zoom-hint">Klicka för större bild</span></a>${step.imageCaption ? `<figcaption>${esc(step.imageCaption)}</figcaption>` : ""}</figure>` : "";
      const video = step.videoUrl ? `<figure class="guide-video-wrap"><video class="guide-video" controls preload="metadata" playsinline src="${esc(step.videoUrl)}"></video>${step.videoCaption ? `<figcaption>${esc(step.videoCaption)}</figcaption>` : ""}</figure>` : "";
      html += `<div class="step"><div class="num">${i + 1}</div><div class="stepcontent"><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p>${shot}${video}</div></div>`;
    });
    html += "</div>";
    if (p.note) html += `<div class="callout ${p.noteType || 'info'}"><strong>Viktigt</strong><p>${esc(p.note)}</p></div>`;
    document.getElementById("pageBody").innerHTML = html;
  };

  function editorMarkup(step = {}, i = 0) {
    const hasImage = !!step.imageUrl;
    const hasVideo = !!step.videoUrl;
    return `<div class="stepedit" data-index="${i}" data-remove-image="0" data-remove-video="0"><div class="stepeditbar"><strong>Steg ${i + 1}</strong><button class="btn small danger" data-remove-step="${i}" type="button">Ta bort</button></div><div class="field"><label>Rubrik</label><input class="stepTitle" value="${esc(step.title || '')}"></div><div class="field"><label>Text</label><textarea class="stepText">${esc(step.text || '')}</textarea></div><div class="shot-editor"><div class="shot-editor-title">Screenshot <span>valfritt</span></div><div class="current-shot ${hasImage ? '' : 'hidden'}">${hasImage ? `<img src="${esc(step.imageUrl)}" alt="Nuvarande screenshot"><div><small>Nuvarande bild</small><button class="btn small" type="button" data-remove-image>Ta bort screenshot</button></div>` : ''}</div><div class="field"><label>Ladda upp / byt screenshot</label><input class="stepImageFile" type="file" accept="image/png,image/jpeg,image/webp"><div class="hint selected-file-name">PNG, JPG eller WebP · max 5 MB</div></div><div class="field"><label>Bildtext</label><input class="stepImageCaption" value="${esc(step.imageCaption || '')}" placeholder="T.ex. Klicka på Go Live uppe till höger"></div><input class="stepImageUrl" type="hidden" value="${esc(step.imageUrl || '')}"><input class="stepImagePath" type="hidden" value="${esc(step.imagePath || '')}"></div><div class="shot-editor"><div class="shot-editor-title">Skärminspelning <span>valfritt</span></div><div class="current-shot ${hasVideo ? '' : 'hidden'}">${hasVideo ? `<video src="${esc(step.videoUrl)}" controls preload="metadata" style="width:180px;max-height:110px;border-radius:9px;background:#050b14"></video><div><small>Nuvarande inspelning</small><button class="btn small" type="button" data-remove-video>Ta bort inspelning</button></div>` : ''}</div><div class="field"><label>Ladda upp / byt skärminspelning</label><input class="stepVideoFile" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"><div class="hint selected-video-file-name">MP4, WebM eller MOV · max 50 MB. MP4 fungerar bäst på alla enheter.</div></div><div class="field"><label>Videotext</label><input class="stepVideoCaption" value="${esc(step.videoCaption || '')}" placeholder="T.ex. Så här startar du streamen"></div><input class="stepVideoUrl" type="hidden" value="${esc(step.videoUrl || '')}"><input class="stepVideoPath" type="hidden" value="${esc(step.videoPath || '')}"></div></div>`;
  }

  renderStepEditor = function (steps) {
    const stepEditor = document.getElementById("stepEditor");
    stepEditor.innerHTML = (steps || []).map((s, i) => editorMarkup(s, i)).join("");

    // Bind media remove buttons directly after each render. This is more reliable
    // than depending only on delegated document click handling inside the modal.
    stepEditor.querySelectorAll("[data-remove-image]").forEach((button) => {
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const editor = button.closest(".stepedit");
        if (!editor) return;
        editor.dataset.removeImage = "1";
        const preview = button.closest(".current-shot");
        if (preview) preview.style.display = "none";
        const fileInput = editor.querySelector(".stepImageFile");
        if (fileInput) fileInput.value = "";
        const label = editor.querySelector(".selected-file-name");
        if (label) label.textContent = "Screenshot tas bort när du sparar.";
        toast("Screenshot markerad för borttagning – tryck Spara.");
      };
    });

    stepEditor.querySelectorAll("[data-remove-video]").forEach((button) => {
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const editor = button.closest(".stepedit");
        if (!editor) return;
        editor.dataset.removeVideo = "1";
        const preview = button.closest(".current-shot");
        if (preview) preview.style.display = "none";
        const fileInput = editor.querySelector(".stepVideoFile");
        if (fileInput) fileInput.value = "";
        const label = editor.querySelector(".selected-video-file-name");
        if (label) label.textContent = "Skärminspelningen tas bort när du sparar.";
        toast("Skärminspelning markerad för borttagning – tryck Spara.");
      };
    });
  };

  collectSteps = function () {
    return [...document.querySelectorAll("#stepEditor .stepedit")].map((el) => {
      const step = {
        title: el.querySelector(".stepTitle").value.trim(),
        text: el.querySelector(".stepText").value.trim()
      };
      const imageUrl = el.querySelector(".stepImageUrl")?.value || "";
      const imagePath = el.querySelector(".stepImagePath")?.value || "";
      const imageCaption = el.querySelector(".stepImageCaption")?.value.trim() || "";
      const videoUrl = el.querySelector(".stepVideoUrl")?.value || "";
      const videoPath = el.querySelector(".stepVideoPath")?.value || "";
      const videoCaption = el.querySelector(".stepVideoCaption")?.value.trim() || "";
      if (imageUrl) {
        step.imageUrl = imageUrl;
        step.imagePath = imagePath;
        if (imageCaption) step.imageCaption = imageCaption;
      }
      if (videoUrl) {
        step.videoUrl = videoUrl;
        step.videoPath = videoPath;
        if (videoCaption) step.videoCaption = videoCaption;
      }
      return step;
    }).filter((s) => s.title || s.text || s.imageUrl || s.videoUrl);
  };

  openEditPage = function (key) {
    editingPageKey = key;
    const p = data.pages[key];
    document.getElementById("editPageIcon").value = p.icon || "";
    document.getElementById("editPageKicker").value = p.kicker || "";
    document.getElementById("editPageTitle").value = p.title || "";
    document.getElementById("editPageSummary").value = p.summary || "";
    document.getElementById("editPageIntro").value = p.intro || "";
    document.getElementById("editPageNote").value = p.note || "";
    document.getElementById("editPageNoteType").value = p.noteType || "info";
    renderStepEditor(p.steps || []);
    openModal("editPageModal");
  };

  function safeFileName(name) {
    const ext = (name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const stem = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 45) || "screenshot";
    return `${stem}.${ext}`;
  }

  async function deleteOld(path) {
    if (!path) return;
    const { error } = await supa.storage.from(BUCKET).remove([path]);
    if (error) console.warn("Could not remove old screenshot", error);
  }

  async function uploadScreenshot(file, stepIndex) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Screenshot måste vara PNG, JPG eller WebP.");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Screenshoten är större än 5 MB.");
    const uid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${editingPageKey}/${Date.now()}-${stepIndex + 1}-${uid}-${safeFileName(file.name)}`;
    const { error } = await supa.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw new Error(`Kunde inte ladda upp screenshot: ${error.message}`);
    const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(path);
    return { imagePath: path, imageUrl: pub.publicUrl };
  }

  async function uploadRecording(file, stepIndex) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowedType = /^(video\/(mp4|webm|quicktime))$/.test(file.type) || ["mp4","webm","mov"].includes(ext);
    if (!allowedType) throw new Error("Skärminspelningen måste vara MP4, WebM eller MOV.");
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Skärminspelningen är större än 50 MB.");
    const uid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${editingPageKey}/video-${Date.now()}-${stepIndex + 1}-${uid}-${safeFileName(file.name)}`;
    const contentType = file.type || (ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4");
    const { error } = await supa.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType });
    if (error) throw new Error(`Kunde inte ladda upp skärminspelning: ${error.message}`);
    const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(path);
    return { videoPath: path, videoUrl: pub.publicUrl };
  }

  async function collectStepsWithUploads() {
    const out = [];
    const editors = [...document.querySelectorAll("#stepEditor .stepedit")];
    for (let i = 0; i < editors.length; i++) {
      const el = editors[i];
      const title = el.querySelector(".stepTitle").value.trim();
      const text = el.querySelector(".stepText").value.trim();

      const imageCaption = el.querySelector(".stepImageCaption").value.trim();
      const imageFile = el.querySelector(".stepImageFile").files[0];
      let imageUrl = el.querySelector(".stepImageUrl").value;
      let imagePath = el.querySelector(".stepImagePath").value;

      const videoCaption = el.querySelector(".stepVideoCaption").value.trim();
      const videoFile = el.querySelector(".stepVideoFile").files[0];
      let videoUrl = el.querySelector(".stepVideoUrl").value;
      let videoPath = el.querySelector(".stepVideoPath").value;

      if (imageFile) {
        const old = imagePath;
        const uploaded = await uploadScreenshot(imageFile, i);
        imageUrl = uploaded.imageUrl;
        imagePath = uploaded.imagePath;
        if (old) await deleteOld(old);
      } else if (el.dataset.removeImage === "1") {
        if (imagePath) await deleteOld(imagePath);
        imageUrl = "";
        imagePath = "";
      }

      if (videoFile) {
        const old = videoPath;
        const uploaded = await uploadRecording(videoFile, i);
        videoUrl = uploaded.videoUrl;
        videoPath = uploaded.videoPath;
        if (old) await deleteOld(old);
      } else if (el.dataset.removeVideo === "1") {
        if (videoPath) await deleteOld(videoPath);
        videoUrl = "";
        videoPath = "";
      }

      if (title || text || imageUrl || videoUrl) {
        const step = { title, text };
        if (imageUrl) {
          step.imageUrl = imageUrl;
          step.imagePath = imagePath;
          if (imageCaption) step.imageCaption = imageCaption;
        }
        if (videoUrl) {
          step.videoUrl = videoUrl;
          step.videoPath = videoPath;
          if (videoCaption) step.videoCaption = videoCaption;
        }
        out.push(step);
      }
    }
    return out;
  }

  // Replace the original add/save actions with screenshot-aware versions.
  const addStep = document.getElementById("addStepBtn");
  if (addStep) addStep.onclick = () => {
    const current = collectSteps();
    current.push({ title: "Nytt steg", text: "Skriv instruktionen här." });
    renderStepEditor(current);
  };

  const savePage = document.getElementById("savePageBtn");
  if (savePage) savePage.onclick = async () => {
    savePage.disabled = true;
    savePage.textContent = "Sparar…";
    try {
      const p = data.pages[editingPageKey];
      p.icon = document.getElementById("editPageIcon").value.trim();
      p.kicker = document.getElementById("editPageKicker").value.trim();
      p.title = document.getElementById("editPageTitle").value.trim();
      p.summary = document.getElementById("editPageSummary").value.trim();
      p.intro = document.getElementById("editPageIntro").value.trim();
      p.steps = await collectStepsWithUploads();
      p.note = document.getElementById("editPageNote").value.trim();
      p.noteType = document.getElementById("editPageNoteType").value;
      await saveContent();
      renderHome();
      if (currentPage === editingPageKey) renderPage(currentPage);
      closeModal("editPageModal");
    } catch (error) {
      console.error(error);
      toast(error.message || "Kunde inte spara");
    } finally {
      savePage.disabled = false;
      savePage.textContent = "Spara";
    }
  };

  document.addEventListener("change", (event) => {
    if (event.target.matches(".stepImageFile")) {
      const editor = event.target.closest(".stepedit");
      const file = event.target.files[0];
      if (!editor || !file) return;
      editor.dataset.removeImage = "0";
      const label = editor.querySelector(".selected-file-name");
      if (label) label.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      return;
    }

    if (event.target.matches(".stepVideoFile")) {
      const editor = event.target.closest(".stepedit");
      const file = event.target.files[0];
      if (!editor || !file) return;
      editor.dataset.removeVideo = "0";
      const label = editor.querySelector(".selected-video-file-name");
      if (label) label.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
    }
  });

  // Real Supabase login (no demo password).
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.onclick = () => { updateAdminView(); openModal("loginModal"); };

  const submit = document.getElementById("submitLoginBtn");
  if (submit) submit.onclick = async () => {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value || "";
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return toast(error.message);
    if (!(await isAdmin())) {
      await supa.auth.signOut();
      return toast("Kontot har inte adminbehörighet");
    }
    setAdmin(true);
    closeModal("loginModal");
    updateAdminView();
    toast("Inloggad");
  };

  const logout = document.getElementById("logoutBtn");
  if (logout) logout.onclick = async () => {
    await supa.auth.signOut();
    setAdmin(false);
    showHome();
    toast("Utloggad");
  };

  await refreshFromCloud();
  const { data: { session } } = await supa.auth.getSession();
  if (session && await isAdmin()) setAdmin(true);
  updateAdminView();
});
