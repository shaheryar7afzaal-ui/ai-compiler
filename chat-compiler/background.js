// Toggles the panel from the toolbar icon or the keyboard shortcut.
// On sites without the auto-injected content script, inject it on demand
// (activeTab grants permission for the current tab after a user gesture).

async function toggle(tab) {
  if (!tab || !tab.id || !/^https?:/.test(tab.url || "")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "cc:toggle" });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await chrome.tabs.sendMessage(tab.id, { type: "cc:toggle" });
  }
}

chrome.action.onClicked.addListener(toggle);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-panel") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  toggle(tab);
});
