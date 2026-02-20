const toggle = document.getElementById("darkToggle");
const statusText = document.getElementById("statusText");

// Helper: update UI label
function setLabel(isOn) {
  statusText.textContent = isOn ? "ON" : "OFF";
  statusText.className = isOn ? "on" : "off";
}

// Load persisted state for the current tab's origin
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const key = `darkMode_${new URL(tab.url).origin}`;
  chrome.storage.local.get([key], (result) => {
    const isOn = !!result[key];
    toggle.checked = isOn;
    setLabel(isOn);
  });
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
