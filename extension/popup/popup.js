const toggle = document.getElementById("darkToggle");
const ignoreIfDark = document.getElementById("ignoreIfDark");
const statusText = document.getElementById("statusText");
const pageTheme = document.getElementById("pageTheme");

// Helper: update UI label
function setLabel(isOn) {
  statusText.textContent = isOn ? "ON" : "OFF";
  statusText.className = isOn ? "on" : "off";
}

// Helper: detect and display page theme
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
    .catch((error) => {
      pageTheme.textContent = "N/A";
    });
}

// Load persisted state for the current tab's origin
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const origin = new URL(tab.url).origin;
  const darkModeKey = `darkMode_${origin}`;
  const ignoreIfDarkKey = `ignoreIfDark_${origin}`;

  chrome.storage.local.get([darkModeKey, ignoreIfDarkKey], (result) => {
    const isOn = !!result[darkModeKey];
    const shouldIgnore = !!result[ignoreIfDarkKey];
    toggle.checked = isOn;
    ignoreIfDark.checked = shouldIgnore;
    setLabel(isOn);
  });
  detectPageTheme(tab);
});

// On user toggle: save state + notify content script
toggle.addEventListener("change", () => {
  const isOn = toggle.checked;
  setLabel(isOn);

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const key = `darkMode_${new URL(tab.url).origin}`;
    chrome.storage.local.set({ [key]: isOn });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (enabled) => {
        window.__nophotonSetDark(enabled);
      },
      args: [isOn],
    });
  });
});

// Handle "Ignore if dark" checkbox
ignoreIfDark.addEventListener("change", () => {
  const shouldIgnore = ignoreIfDark.checked;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const key = `ignoreIfDark_${new URL(tab.url).origin}`;
    chrome.storage.local.set({ [key]: shouldIgnore });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (ignore) => {
        window.__nophotonSetIgnoreIfDark(ignore);
      },
      args: [shouldIgnore],
    });
  });
});
