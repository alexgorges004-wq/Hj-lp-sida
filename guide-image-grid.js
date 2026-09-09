(() => {
  const style = document.createElement("style");
  style.textContent = `
    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 14px;
      row-gap: 0;
    }

    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > h3,
    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > p,
    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > .guide-video-wrap {
      grid-column: 1 / -1;
    }

    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > .guide-shot-wrap {
      width: 100%;
      max-width: none;
      min-width: 0;
      margin: 16px 0 2px;
    }

    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > .guide-shot-wrap .guide-shot-link,
    .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > .guide-shot-wrap .guide-shot {
      width: 100%;
    }

    @media (max-width: 720px) {
      .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) {
        grid-template-columns: 1fr;
      }

      .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > .guide-shot-wrap,
      .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > h3,
      .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > p,
      .stepcontent:has(> .guide-shot-wrap + .guide-shot-wrap) > .guide-video-wrap {
        grid-column: 1;
      }
    }
  `;
  document.head.appendChild(style);
})();
