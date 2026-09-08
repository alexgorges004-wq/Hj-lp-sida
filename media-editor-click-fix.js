(() => {
  let observer;

  function fixEditorRows() {
    const editor = document.getElementById("stepEditor");
    if (!editor) return;

    editor.querySelectorAll(".stepedit").forEach((row) => {
      // The older media editor used these state attributes on the whole row.
      // Its broad [data-remove-*] binding then accidentally attached a click
      // handler to the row itself, which prevented file inputs from opening.
      if (row.dataset.removeImage === "0") row.removeAttribute("data-remove-image");
      if (row.dataset.removeVideo === "0") row.removeAttribute("data-remove-video");
      row.onclick = null;
    });
  }

  function install() {
    const editor = document.getElementById("stepEditor");
    if (!editor) return;

    fixEditorRows();
    observer?.disconnect();
    observer = new MutationObserver(fixEditorRows);
    observer.observe(editor, { childList: true, subtree: true });

    if (typeof renderStepEditor === "function" && !renderStepEditor.__mediaClickFixed) {
      const baseRenderStepEditor = renderStepEditor;
      const wrapped = function (...args) {
        const result = baseRenderStepEditor(...args);
        fixEditorRows();
        return result;
      };
      wrapped.__mediaClickFixed = true;
      renderStepEditor = wrapped;
    }
  }

  if (document.readyState === "complete") setTimeout(install, 50);
  else window.addEventListener("load", () => setTimeout(install, 50));
})();
