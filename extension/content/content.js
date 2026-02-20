(() => {
  // Inject the stylesheet once
  const STYLE_ID = "__nophoton_style__";

  // Detect if page is already in dark mode
  function detectPageTheme() {
    // Check OS preference first (many sites respect this)
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    // Check common dark mode classes
    const darkModeClasses = [
      "dark",
      "dark-mode",
      "is-dark",
      "theme-dark",
      "darkmode",
      "nocturne",
    ];
    const htmlClasses = document.documentElement.className.toLowerCase();
    const bodyClasses = document.body.className.toLowerCase();
    if (
      darkModeClasses.some(
        (cls) => htmlClasses.includes(cls) || bodyClasses.includes(cls),
      )
    ) {
      return "dark";
    }

    // Analyze computed colors for luminance
    try {
      const bgColor = window.getComputedStyle(
        document.documentElement,
      ).backgroundColor;
      const textColor = window.getComputedStyle(document.documentElement).color;
      const bgLuminance = getColorLuminance(bgColor);
      const textLuminance = getColorLuminance(textColor);

      // If background is dark and text is light, it's dark mode
      if (bgLuminance < 128 && textLuminance > 128) {
        return "dark";
      }
      // If background is light and text is dark, it's light mode
      if (bgLuminance > 128 && textLuminance < 128) {
        return "light";
      }
    } catch (e) {
      console.log("Error detecting theme:", e);
    }

    return "unknown";
  }

  function getColorLuminance(rgbString) {
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) return 128;
    const [r, g, b] = match.map(Number);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

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

  // Expose functions the popup can call via scripting.executeScript
  window.__nophotonSetDark = (enabled) => {
    enabled ? applyDark() : removeDark();
  };

  window.__nophotonGetTheme = () => {
    return detectPageTheme();
  };

  window.__nophotonSetIgnoreIfDark = (ignore) => {
    if (ignore) {
      // If page is already dark, remove NoPhoton's dark overlay
      const theme = detectPageTheme();
      if (theme === "dark") {
        removeDark();
      }
    } else {
      // Checkbox unchecked: re-run auto-detection
      applyAutoDetectedDarkMode();
    }
  };

  function applyAutoDetectedDarkMode() {
    const theme = detectPageTheme();
    if (theme === "unknown") {
      applyDark();
    }
  }

  // Auto-restore state on page load
  const darkModeKey = `darkMode_${location.origin}`;
  const ignoreIfDarkKey = `ignoreIfDark_${location.origin}`;

  chrome.storage.local.get([darkModeKey, ignoreIfDarkKey], (result) => {
    const isDarkModeOn = !!result[darkModeKey];
    const shouldIgnore = !!result[ignoreIfDarkKey];

    if (isDarkModeOn) {
      // If "Ignore if dark" is on and page is already dark, don't double-apply
      if (shouldIgnore && detectPageTheme() === "dark") {
        return;
      }
      applyDark();
    } else if (!(darkModeKey in result) && !shouldIgnore) {
      applyAutoDetectedDarkMode();
    }
  });
})();
