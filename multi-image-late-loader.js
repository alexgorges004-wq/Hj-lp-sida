(() => {
  let loaded = false;

  function loadMultiImageEditor() {
    if (loaded || window.__multiImageEditorLateLoaded) return;
    loaded = true;
    window.__multiImageEditorLateLoaded = true;

    const script = document.createElement("script");
    script.src = `multi-image-fix.js?v=${Date.now()}`;
    script.async = false;
    document.head.appendChild(script);
  }

  // config.js replaces renderStepEditor/renderPage inside its window load
  // handler. Load the multi-image editor after that handler has finished so
  // those overrides stay active instead of being replaced by the old
  // single-screenshot editor.
  if (document.readyState === "complete") setTimeout(loadMultiImageEditor, 0);
  else window.addEventListener("load", () => setTimeout(loadMultiImageEditor, 0), { once: true });
})();
