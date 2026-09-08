(() => {
  if (typeof renderStepEditor !== "function" || typeof collectSteps !== "function") return;

  renderStepEditor = function (steps) {
    const list = Array.isArray(steps) ? steps : [];
    const editor = document.getElementById("stepEditor");
    if (!editor) return;

    editor.innerHTML = list.map((step, index) => `
      <div class="stepedit" data-step-index="${index}">
        <div class="stepeditbar">
          <strong>Steg ${index + 1}</strong>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn small" data-step-up="${index}" type="button" ${index === 0 ? "disabled" : ""} aria-label="Flytta steg ${index + 1} upp">↑</button>
            <button class="btn small" data-step-down="${index}" type="button" ${index === list.length - 1 ? "disabled" : ""} aria-label="Flytta steg ${index + 1} ner">↓</button>
            <button class="btn small danger" data-remove-step="${index}" type="button">Ta bort</button>
          </div>
        </div>
        <div class="field"><label>Rubrik</label><input class="stepTitle" value="${esc(step.title || "")}"></div>
        <div class="field"><label>Text</label><textarea class="stepText">${esc(step.text || "")}</textarea></div>
      </div>`).join("");
  };

  document.addEventListener("click", (event) => {
    const up = event.target.closest("[data-step-up]");
    const down = event.target.closest("[data-step-down]");
    if (!up && !down) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const steps = collectSteps();
    const index = Number((up || down).dataset[up ? "stepUp" : "stepDown"]);
    const target = up ? index - 1 : index + 1;
    if (!Number.isInteger(index) || target < 0 || target >= steps.length) return;

    [steps[index], steps[target]] = [steps[target], steps[index]];
    renderStepEditor(steps);
  }, true);
})();
