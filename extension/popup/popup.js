const toggle = document.getElementById("darkToggle");
const ignoreIfDark = document.getElementById("ignoreIfDark");
const statusText = document.getElementById("statusText");
const pageTheme = document.getElementById("pageTheme");

// Helper: update UI label
function setLabel(isOn) {
  statusText.textContent = isOn ? "ON" : "OFF";
  statusText.className = isOn ? "on" : "off";
}

// Helper: detect and display page theme for current tab
function detectPageTheme(tab) {
  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: () => window.__nophotonGetTheme?.(),
    })
    .then((results) => {
      if (results && results[0]) {
        const theme = results[0].result;
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        pageTheme.textContent = capitalize(theme);
      }
    })
    .catch(() => {
      pageTheme.textContent = "N/A";
    });
}

// Apply dark-mode state to every open tab
function applyToAllTabs(enabled, ignore) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("about:")
      )
        continue;
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: (en, ign) => {
            window.__nophotonSetDark?.(en, ign);
          },
          args: [enabled, ignore],
        })
        .catch(() => {});
    }
  });
}

// Helper: enable/disable the "Ignore if dark" control based on toggle state
function syncIgnoreIfDark(isOn) {
  const wrapper = ignoreIfDark.closest(".checkbox-wrapper");
  ignoreIfDark.disabled = !isOn;
  wrapper.classList.toggle("disabled", !isOn);
}

// Load persisted global state (default: both ON)
chrome.storage.local.get(["darkMode", "ignoreIfDark"], (result) => {
  const isOn = result.darkMode !== undefined ? !!result.darkMode : true;
  const shouldIgnore =
    result.ignoreIfDark !== undefined ? !!result.ignoreIfDark : true;
  toggle.checked = isOn;
  ignoreIfDark.checked = shouldIgnore;
  setLabel(isOn);
  syncIgnoreIfDark(isOn);
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  detectPageTheme(tab);
});

// On user toggle: save global state + notify all tabs
toggle.addEventListener("change", () => {
  const isOn = toggle.checked;
  const shouldIgnore = ignoreIfDark.checked;
  setLabel(isOn);
  syncIgnoreIfDark(isOn);
  chrome.storage.local.set({ darkMode: isOn });
  applyToAllTabs(isOn, shouldIgnore);
});

// Handle "Ignore if dark" checkbox: save global state + notify all tabs
ignoreIfDark.addEventListener("change", () => {
  const shouldIgnore = ignoreIfDark.checked;
  const isOn = toggle.checked;
  chrome.storage.local.set({ ignoreIfDark: shouldIgnore });
  applyToAllTabs(isOn, shouldIgnore);
});
