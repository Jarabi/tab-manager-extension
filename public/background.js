chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getTabs') {
        chrome.tabs.query({}, (tabs) => {
            sendResponse({ tabs });
        });
        return true; // Required for sendResponse to be called asynchronously
    }
});
