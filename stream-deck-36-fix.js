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

  function renderDeckMap(key) {
    if (key !== "equipment") return;
    S.ensureData();
    const body = document.getElementById("pageBody");
    if (!body) return;

    document.getElementById("v2DeckMap")?.remove();
    const sec = document.createElement("section");
    sec.id = "v2DeckMap";
    sec.className = "panel";
    sec.innerHTML = `<h2>Stream Deck XL · 36 knappar</h2><p>${admin ? "Klicka på en knapp för att redigera vad den gör." : "Klicka på en knapp för att läsa vad den gör."}</p><div class="v2-deck-scroll"><div class="v2-deck-grid">${data.streamDeck.buttons.map((b, i) => `<button class="v2-deck-key v2-deck-${S.esc(b.accent || "neutral")}" data-v2-deck="${i}" type="button"><span>${S.esc(b.label || String(i + 1))}</span><small>${b.label ? `#${i + 1}` : "Ej inställd"}</small></button>`).join("")}</div></div><div id="v2DeckDetail" class="v2-deck-detail">Välj en knapp för att se beskrivningen.</div>`;
    body.appendChild(sec);
    S.applyVars?.(sec);
  }

  function install() {
    if (typeof renderPage !== "function" || renderPage.__deck36Wrapped) return;
    const baseRenderPage = renderPage;
    const wrapped = function (key) {
      const result = baseRenderPage(key);
      renderDeckMap(key);
      return result;
    };
    wrapped.__deck36Wrapped = true;
    renderPage = wrapped;

    if (currentPage === "equipment" || location.hash === "#equipment") {
      renderDeckMap("equipment");
    }
  }

  // multi-image-fix.js replaces renderPage shortly after window.load.
  // Install after that replacement so the Stream Deck map is not lost.
  if (document.readyState === "complete") setTimeout(install, 150);
  else window.addEventListener("load", () => setTimeout(install, 150), { once: true });
})();
