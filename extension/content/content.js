(() => {
  // Inject the stylesheet once
  const STYLE_ID = "__nophoton_style__";

  function applyDark() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html, body, * {
        background-color: #1b1b1b !important;
        color: #ffffff !important;
        border-color: #444444 !important;
      }
      a, a * {
        color: #7eb8f7 !important;
      }
      img, video, canvas, svg {
        filter: brightness(0.85);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function removeDark() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  // Expose a function the popup can call via scripting.executeScript
  window.__nophotonSetDark = (enabled) => {
    enabled ? applyDark() : removeDark();
  };

  // Auto-restore state on page load
  const key = `darkMode_${location.origin}`;
  chrome.storage.local.get([key], (result) => {
    if (result[key]) applyDark();
  });
})();
