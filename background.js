chrome.runtime.onInstalled.addListener(async () => {
  console.log('chrome-goods-download extension installed');
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getPageData') {
    chrome.tabs.query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (!tabs[0]) {
          sendResponse({ status: 'error', error: 'No active tab' });
          return;
        }
        return chrome.tabs.sendMessage(tabs[0].id, message);
      })
      .then((response) => {
        if (response) sendResponse(response);
        else sendResponse({ status: 'ok' });
      })
      .catch((e) => {
        sendResponse({ status: 'error', error: e.message });
      });
    return true;
  }

  if (message.type === 'pageData') {
    chrome.runtime.sendMessage(message);
    return false;
  }

  return false;
});
