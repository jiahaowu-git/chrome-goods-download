chrome.runtime.onInstalled.addListener(async () => {
  console.log('chrome-goods-download extension installed');
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Listen for messages from content script and forward to side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message from content script:', message);

  // Forward message to side panel in active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not send message to side panel:', chrome.runtime.lastError.message);
        } else {
          console.log('Message forwarded to side panel:', response);
        }
        sendResponse({ status: 'received' });
      });
    } else {
      console.warn('No active tab found to forward message to');
      sendResponse({ status: 'received' });
    }
  });

  return true;
});
