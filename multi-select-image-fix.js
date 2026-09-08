(() => {
  function setSingleFile(input, file) {
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      return true;
    } catch (error) {
      console.warn("Could not split multi-image selection", error);
      return false;
    }
  }

  function renumberImages(scope) {
    const items = [...scope.querySelectorAll(".multi-image-item")];
    items.forEach((item, index) => {
      const title = item.querySelector(".multi-image-head strong");
      const up = item.querySelector("[data-img-up]");
      const down = item.querySelector("[data-img-down]");
      if (title) title.textContent = `Bild ${index + 1}`;
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === items.length - 1;
    });
  }

  function prepareInput(input) {
    if (!input || input.dataset.multiSelectReady === "1") return;
    input.multiple = true;
    input.dataset.multiSelectReady = "1";
    const field = input.closest(".field");
    const label = field?.querySelector("label");
    if (label) label.textContent = "Ladda upp / byt bild(er)";
    const hint = field?.querySelector(".multiImageName");
    if (hint && !hint.textContent.includes("flera")) {
      hint.textContent = "PNG, JPG eller WebP · max 5 MB per bild · du kan välja flera samtidigt";
    }
  }

  function prepareAll() {
    document.querySelectorAll(".multiImageFile").forEach(prepareInput);
  }

  document.addEventListener("change", (event) => {
    const input = event.target.closest?.(".multiImageFile");
    if (!input) return;

    const files = [...(input.files || [])];
    if (files.length <= 1) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const item = input.closest(".multi-image-item");
    const list = item?.parentElement;
    if (!item || !list) return;

    if (!setSingleFile(input, files[0])) {
      const hint = item.querySelector(".multiImageName");
      if (hint) hint.textContent = `${files.length} bilder valda`;
      return;
    }

    const firstHint = item.querySelector(".multiImageName");
    if (firstHint) firstHint.textContent = `${files[0].name} · ${(files[0].size / 1024 / 1024).toFixed(1)} MB`;

    let anchor = item;
    for (const file of files.slice(1)) {
      const clone = item.cloneNode(true);

      clone.querySelector(".current-shot")?.remove();
      const caption = clone.querySelector(".multiImageCaption");
      const url = clone.querySelector(".multiImageUrl");
      const path = clone.querySelector(".multiImagePath");
      const cloneInput = clone.querySelector(".multiImageFile");
      const hint = clone.querySelector(".multiImageName");

      if (caption) caption.value = "";
      if (url) url.value = "";
      if (path) path.value = "";
      if (cloneInput) {
        cloneInput.dataset.multiSelectReady = "1";
        cloneInput.multiple = true;
        setSingleFile(cloneInput, file);
      }
      if (hint) hint.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;

      anchor.insertAdjacentElement("afterend", clone);
      anchor = clone;
    }

    renumberImages(list);
    window.LH2?.markDirty?.();
  }, true);

  function install() {
    prepareAll();
    const editor = document.getElementById("stepEditor");
    if (!editor) return;
    const observer = new MutationObserver(prepareAll);
    observer.observe(editor, { childList: true, subtree: true });
  }

  if (document.readyState === "complete") setTimeout(install, 80);
  else window.addEventListener("load", () => setTimeout(install, 80));
})();
