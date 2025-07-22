// background.js
browser.browserAction.onClicked.addListener(() => {
browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
    const currentUrl = tabs[0].url;
  browser.windows.create({
    url: "popup/popup.html?page=" + encodeURIComponent(currentUrl),
    type: "popup",
    width: 400,
    height: 600
  });
});
});
