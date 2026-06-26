const DEFAULTS = {
  enabled:      true,
  petCount:     3,
  selectedPets: ["cat", "dog", "bird"],
  speed:        2,
};

const SPEED_LABELS = { 1: "Slow", 2: "Normal", 3: "Fast" };

const enableToggle  = document.getElementById("enable-toggle");
const statusPill    = document.getElementById("status-pill");
const statusLabel   = document.getElementById("status-label");
const petCount      = document.getElementById("pet-count");
const speedSlider   = document.getElementById("speed-slider");
const speedDisplay  = document.getElementById("speed-display");
const resetBtn      = document.getElementById("reset-btn");
const saveToast     = document.getElementById("save-toast");
const petCheckboxes = document.querySelectorAll('input[name="pets"]');

let toastTimer = null;

function showToast(msg = "✓ Saved") {
  saveToast.textContent = msg;
  saveToast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => saveToast.classList.remove("visible"), 1800);
}

function setStatus(active) {
  if (active) {
    statusPill.classList.remove("inactive");
    statusLabel.textContent = "Active";
  } else {
    statusPill.classList.add("inactive");
    statusLabel.textContent = "Paused";
  }
}

function readSettings() {
  const selected = [];
  petCheckboxes.forEach((cb) => { if (cb.checked) selected.push(cb.value); });
  return {
    enabled:      enableToggle.checked,
    petCount:     parseInt(petCount.value, 10),
    selectedPets: selected,
    speed:        parseInt(speedSlider.value, 10),
  };
}

function applyToUI(settings) {
  enableToggle.checked = settings.enabled;
  petCount.value       = settings.petCount;
  speedSlider.value    = settings.speed;
  speedDisplay.textContent = SPEED_LABELS[settings.speed] || "Normal";
  petCheckboxes.forEach((cb) => { cb.checked = settings.selectedPets.includes(cb.value); });
  setStatus(settings.enabled);
}

function sendToContentScript(settings) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;
    chrome.tabs.sendMessage(tab.id, { type: "TAB_PETS_SETTINGS_UPDATE", settings }, () => {
      void chrome.runtime.lastError;
    });
  });
}

function saveSettings(settings) {
  chrome.storage.local.set({ tabPetsSettings: settings }, () => {
    showToast("✓ Saved");
    sendToContentScript(settings);
  });
}

function loadSettings() {
  chrome.storage.local.get("tabPetsSettings", (result) => {
    applyToUI(result.tabPetsSettings || DEFAULTS);
  });
}

enableToggle.addEventListener("change", () => {
  setStatus(enableToggle.checked);
  saveSettings(readSettings());
});

petCount.addEventListener("change", () => saveSettings(readSettings()));

petCheckboxes.forEach((cb) => {
  cb.addEventListener("change", () => saveSettings(readSettings()));
});

speedSlider.addEventListener("input", () => {
  speedDisplay.textContent = SPEED_LABELS[speedSlider.value] || "Normal";
});

speedSlider.addEventListener("change", () => saveSettings(readSettings()));

resetBtn.addEventListener("click", () => {
  applyToUI(DEFAULTS);
  chrome.storage.local.set({ tabPetsSettings: DEFAULTS });
  chrome.runtime.sendMessage({ type: "TAB_PETS_RESET_ALL" }, (response) => {
    void chrome.runtime.lastError;
    showToast("🔄 All tabs reset!");
  });
});

loadSettings();
