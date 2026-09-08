(() => {
  let installed = false;

  function decorateStepOrderControls() {
    const editor = document.getElementById("stepEditor");
    if (!editor) return;
    const rows = [...editor.querySelectorAll(".stepedit")];

    rows.forEach((row, index) => {
      row.dataset.index = String(index);
      const bar = row.querySelector(".stepeditbar");
      if (!bar) return;

      const title = bar.querySelector("strong");
      if (title) title.textContent = `Steg ${index + 1}`;

      let controls = bar.querySelector(".step-order-controls");
      if (!controls) {
        controls = document.createElement("div");
        controls.className = "step-order-controls";
        controls.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap";

        const up = document.createElement("button");
        up.className = "btn small";
        up.type = "button";
        up.textContent = "↑";
        up.setAttribute("data-step-up", "");
        controls.appendChild(up);

        const down = document.createElement("button");
        down.className = "btn small";
        down.type = "button";
        down.textContent = "↓";
        down.setAttribute("data-step-down", "");
        controls.appendChild(down);

        const remove = bar.querySelector("[data-remove-step]");
        if (remove) controls.appendChild(remove);
        bar.appendChild(controls);
      }

      const up = controls.querySelector("[data-step-up]");
      const down = controls.querySelector("[data-step-down]");
      const remove = controls.querySelector("[data-remove-step]");

      if (up) {
        up.dataset.stepUp = String(index);
        up.disabled = index === 0;
        up.setAttribute("aria-label", `Flytta steg ${index + 1} upp`);
        up.title = "Flytta upp";
      }
      if (down) {
        down.dataset.stepDown = String(index);
        down.disabled = index === rows.length - 1;
        down.setAttribute("aria-label", `Flytta steg ${index + 1} ner`);
        down.title = "Flytta ner";
      }
      if (remove) remove.dataset.removeStep = String(index);
    });
  }

  function install() {
    if (installed || typeof renderStepEditor !== "function") return;
    installed = true;

    const baseRenderStepEditor = renderStepEditor;
    renderStepEditor = function (steps) {
      baseRenderStepEditor(steps);
      decorateStepOrderControls();
    };

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-step-up],[data-step-down]");
      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const row = button.closest(".stepedit");
      const editor = document.getElementById("stepEditor");
      if (!row || !editor) return;

      if (button.hasAttribute("data-step-up")) {
        const previous = row.previousElementSibling;
        if (previous) editor.insertBefore(row, previous);
      } else {
        const next = row.nextElementSibling;
        if (next) editor.insertBefore(next, row);
      }

      decorateStepOrderControls();
      window.LH2?.markDirty?.();
    }, true);

    decorateStepOrderControls();
  }

  // config.js replaces renderStepEditor on window load, so install after that
  // replacement has happened instead of wrapping the older basic editor.
  if (document.readyState === "complete") setTimeout(install, 0);
  else window.addEventListener("load", () => setTimeout(install, 0));
})();
