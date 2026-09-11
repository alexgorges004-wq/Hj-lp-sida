(() => {
  const S = window.LH2;
  if (!S) return;

  const baseEnsureData = S.ensureData;
  S.ensureData = () => {
    baseEnsureData?.();
    if (!data.streamDeck || typeof data.streamDeck !== "object") data.streamDeck = {};
    if (!Array.isArray(data.streamDeck.buttons)) data.streamDeck.buttons = [];
    while (data.streamDeck.buttons.length < 36) {
      data.streamDeck.buttons.push({ label: "", description: "", accent: "neutral" });
    }
    data.streamDeck.buttons = data.streamDeck.buttons.slice(0, 36);
  };

  const style = document.createElement("style");
  style.textContent = `
    .v2-deck-grid {
      grid-template-columns: repeat(9, 86px) !important;
      grid-template-rows: repeat(4, 72px) !important;
      min-width: 854px !important;
    }
  `;
  document.head.appendChild(style);

  S.hooks?.page?.push((key) => {
    if (key !== "equipment") return;
    const heading = document.querySelector("#v2DeckMap h2");
    if (heading) heading.textContent = "Stream Deck XL · 36 knappar";
  });
})();
