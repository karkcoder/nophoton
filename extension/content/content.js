(() => {
  // Inject the stylesheet once
  const STYLE_ID = "__nophoton_style__";

  // Detect if page is already in dark mode
  function detectPageTheme() {
    // Check common dark/light mode classes on <html> and <body>
    const darkModeClasses = [
      "dark",
      "dark-mode",
      "is-dark",
      "theme-dark",
      "darkmode",
      "nocturne",
    ];
    const lightModeClasses = ["light", "light-mode", "is-light", "theme-light"];
    const htmlClasses = document.documentElement.className.toLowerCase();
    const bodyClasses = document.body
      ? document.body.className.toLowerCase()
      : "";
    if (
      darkModeClasses.some(
        (cls) => htmlClasses.includes(cls) || bodyClasses.includes(cls),
      )
    ) {
      return "dark";
    }
    if (
      lightModeClasses.some(
        (cls) => htmlClasses.includes(cls) || bodyClasses.includes(cls),
      )
    ) {
      return "light";
    }

    // Analyze computed background color for luminance.
    // Walk up from <body> to find the first non-transparent background.
    try {
      const candidates = [document.body, document.documentElement].filter(
        Boolean,
      );
      let bgLuminance = null;
      for (const el of candidates) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (
          bg &&
          !bg.includes("rgba(0, 0, 0, 0)") &&
          !bg.includes("transparent")
        ) {
          bgLuminance = getColorLuminance(bg);
          break;
        }
      }

      // If all backgrounds are transparent, fall back to OS preference as a hint
      if (bgLuminance === null) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "unknown";
      }

      const textColor = window.getComputedStyle(document.documentElement).color;
      const textLuminance = getColorLuminance(textColor);

      // If background is dark and text is light, it's dark mode
      if (bgLuminance < 128 && textLuminance > 128) {
        return "dark";
      }
      // If background is light and text is dark, it's light mode
      if (bgLuminance > 128 && textLuminance < 128) {
        return "light";
      }
      // Background alone is enough when text color is ambiguous
      if (bgLuminance >= 128) {
        return "light";
      }
      if (bgLuminance < 128) {
        return "dark";
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
  // ignore: whether to skip applying dark when the page is already dark
  window.__nophotonSetDark = (enabled, ignore) => {
    if (!enabled) {
      removeDark();
      return;
    }
    if (ignore && detectPageTheme() === "dark") {
      removeDark();
      return;
    }
    applyDark();
  };

  window.__nophotonGetTheme = () => {
    return detectPageTheme();
  };

  window.__nophotonSetIgnoreIfDark = (ignore) => {
    if (ignore) {
      // If page is already dark, remove NoPhoton's dark overlay
      const theme = detectPageTheme();
      if (theme === "dark") {
        // keep existing logic below
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

  // Auto-restore global state on page load (default: dark mode ON, ignore-if-dark ON)
  chrome.storage.local.get(["darkMode", "ignoreIfDark"], (result) => {
    const isDarkModeOn =
      result.darkMode !== undefined ? !!result.darkMode : true;
    const shouldIgnore =
      result.ignoreIfDark !== undefined ? !!result.ignoreIfDark : true;

    if (isDarkModeOn) {
      // If "Ignore if dark" is on and page is already dark, don't double-apply
      if (shouldIgnore && detectPageTheme() === "dark") {
        return;
      }
      applyDark();
    }
    // If explicitly turned off, leave the page as-is
  });
})();
