const tabPetStates = new Map();

const storageKey = (tabId) => `tabPets_tab_${tabId}`;

function persistTabState(tabId, positions) {
  chrome.storage.local.set({ [storageKey(tabId)]: positions });
}

function clearTabState(tabId) {
  tabPetStates.delete(tabId);
  chrome.storage.local.remove(storageKey(tabId));
}

function broadcastToAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) continue;
      chrome.tabs.sendMessage(tab.id, message, () => { void chrome.runtime.lastError; });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender?.tab?.id;

  switch (msg.type) {
    case "TAB_PETS_INIT": {
      const cached = tabPetStates.get(tabId) || null;
      if (cached) {
        sendResponse({ positions: cached });
      } else {
        chrome.storage.local.get(storageKey(tabId), (result) => {
          const saved = result[storageKey(tabId)] || null;
          if (saved) tabPetStates.set(tabId, saved);
          sendResponse({ positions: saved });
        });
        return true;
      }
      break;
    }

    case "TAB_PETS_POSITIONS_UPDATE": {
      if (!tabId || !msg.positions) break;
      tabPetStates.set(tabId, msg.positions);
      persistTabState(tabId, msg.positions);
      break;
    }

    case "TAB_PETS_RESET_ALL": {
      const keys = [...tabPetStates.keys()].map(storageKey);
      if (keys.length > 0) chrome.storage.local.remove(keys);
      tabPetStates.clear();
      broadcastToAllTabs({ type: "TAB_PETS_RESET" });
      sendResponse({ ok: true });
      break;
    }

    default:
      break;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabState(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    clearTabState(tabId);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  console.log(`[Tab Pets SW] 👀 Active tab: ${tabId}`);
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log(`[Tab Pets SW] 🐣 New tab: ${tab.id}`);
});
