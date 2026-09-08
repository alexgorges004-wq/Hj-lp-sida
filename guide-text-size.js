(() => {
  const style = document.createElement("style");
  style.textContent = `
    .step h3 {
      font-size: 18px !important;
      line-height: 1.35 !important;
    }
    .step p {
      font-size: 16px !important;
      line-height: 1.65 !important;
      white-space: pre-line !important;
    }
    .guide-shot-wrap figcaption,
    .guide-video-wrap figcaption {
      font-size: 14px !important;
      line-height: 1.5 !important;
    }
    @media (max-width: 720px) {
      .step h3 { font-size: 17px !important; }
      .step p { font-size: 15.5px !important; }
    }
  `;
  document.head.appendChild(style);
})();
