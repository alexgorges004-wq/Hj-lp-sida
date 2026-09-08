(() => {
  const S = window.LH2;
  if (!S) return;

  const presets = {
    encouragement: { bg: "#12302e", color: "#d7fff1" },
    plain: { bg: "#102036", color: "#f3f6fb" },
    info: { bg: "#102b49", color: "#d8eaff" },
    warning: { bg: "#342812", color: "#ffe1a3" }
  };

  let resize = null;

  function applyBlock(node) {
    const id = node?.dataset?.homeText;
    const block = id ? data.homeTextBlocks?.[id] : null;
    if (!node || !block) return;

    const preset = presets[block.style] || presets.plain;
    const width = Math.max(30, Math.min(100, Number(block.widthPct) || 100));
    const minHeight = Math.max(0, Math.min(700, Number(block.minHeight) || 0));
    const textAlign = ["left", "center", "right"].includes(block.textAlign) ? block.textAlign : "left";

    node.style.width = `${width}%`;
    node.style.maxWidth = "100%";
    node.style.height = "auto";
    node.style.minHeight = minHeight ? `${minHeight}px` : "0px";
    node.style.overflow = "visible";
    node.style.background = block.bg || preset.bg;
    node.style.color = block.color || preset.color;
    node.style.textAlign = textAlign;
    node.style.fontFamily = block.fontFamily === "serif"
      ? "Georgia,serif"
      : block.fontFamily === "mono"
        ? "ui-monospace,SFMono-Regular,Consolas,monospace"
        : "inherit";
    node.style.fontStyle = block.italic ? "italic" : "normal";
    node.style.fontWeight = block.bold ? "700" : "inherit";

    const boxAlign = ["left", "center", "right"].includes(block.boxAlign) ? block.boxAlign : "left";
    node.style.marginLeft = boxAlign === "center" || boxAlign === "right" ? "auto" : "0";
    node.style.marginRight = boxAlign === "center" || boxAlign === "left" ? "auto" : "0";

    const title = node.querySelector("h2");
    const body = node.querySelector("p");
    if (title) {
      title.style.fontSize = `${Math.max(16, Math.min(64, Number(block.titleSize) || 27))}px`;
      title.style.color = block.color || preset.color;
      title.style.textAlign = textAlign;
    }
    if (body) {
      body.style.fontSize = `${Math.max(11, Math.min(32, Number(block.bodySize) || 15))}px`;
      body.style.color = block.color || preset.color;
      body.style.textAlign = textAlign;
    }

    const oldHandle = node.querySelector(".v2-height-resize-handle");
    if (!admin) {
      oldHandle?.remove();
      return;
    }

    if (!oldHandle) {
      const handle = document.createElement("span");
      handle.className = "v2-height-resize-handle";
      handle.title = "Dra för att ändra bredd och höjd";
      handle.setAttribute("aria-label", "Ändra storlek på textblocket");
      node.appendChild(handle);
    }
  }

  function applyAll() {
    document.querySelectorAll(".home-text-block[data-home-text]").forEach(applyBlock);
    const note = document.querySelector("#v2TextModal .v2-note");
    if (note) note.textContent = "0 px betyder automatisk höjd efter innehållet. Dra i handtaget nere till höger för att ändra bredd och höjd. På mobil blir blocket automatiskt fullbrett.";
  }

  S.hooks.home.push(applyAll);

  const style = document.createElement("style");
  style.textContent = `
    .v2-resizable{resize:none!important;overflow:visible!important;max-width:100%!important}
    .home-text-block.v2-layout-item:has(.home-text-controls) .home-text-controls{position:absolute!important;top:10px!important;right:10px!important;margin:0!important;z-index:6!important}
    .home-text-block.v2-layout-item:has(.home-text-controls) h2{padding-right:0!important;padding-top:44px}
    .v2-height-resize-handle{position:absolute;right:6px;bottom:6px;width:18px;height:18px;border-right:3px solid rgba(255,255,255,.48);border-bottom:3px solid rgba(255,255,255,.48);border-radius:0 0 5px 0;cursor:nwse-resize;z-index:7;touch-action:none}
    .v2-height-resize-handle:hover{border-color:#fff}
    @media(max-width:720px){
      .v2-height-resize-handle{display:none!important}
      .home-text-block.v2-layout-item:has(.home-text-controls) .home-text-controls{position:static!important;margin:-5px -5px 12px!important}
      .home-text-block.v2-layout-item:has(.home-text-controls) h2{padding-right:0!important;padding-top:0}
      .home-text-block[data-home-text]{width:100%!important;min-height:0!important}
    }
  `;
  document.head.appendChild(style);

  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".v2-height-resize-handle");
    const node = handle?.closest(".home-text-block[data-home-text]");
    const box = document.getElementById("v2HomeLayout");
    if (!handle || !node || !box || !admin) return;

    event.preventDefault();
    const rect = node.getBoundingClientRect();
    resize = {
      handle,
      node,
      box,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };
    handle.setPointerCapture?.(event.pointerId);
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.preventDefault();

    const dx = event.clientX - resize.startX;
    const dy = event.clientY - resize.startY;
    const boxWidth = Math.max(1, resize.box.getBoundingClientRect().width);
    const widthPx = Math.max(boxWidth * 0.30, Math.min(boxWidth, resize.startWidth + dx));
    const heightPx = Math.max(54, Math.min(700, resize.startHeight + dy));

    resize.node.style.width = `${Math.max(30, Math.min(100, widthPx / boxWidth * 100))}%`;
    resize.node.style.height = "auto";
    resize.node.style.minHeight = `${Math.round(heightPx)}px`;
  }, true);

  const clearResize = (event) => {
    if (!resize || resize.pointerId !== event.pointerId) return;
    try { resize.handle.releasePointerCapture?.(event.pointerId); } catch {}
    resize = null;
  };

  document.addEventListener("pointerup", clearResize, true);
  document.addEventListener("pointercancel", clearResize, true);

  window.addEventListener("load", () => setTimeout(applyAll, 80));
})();
