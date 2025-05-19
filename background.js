// background.js
browser.browserAction.onClicked.addListener(() => {
  browser.windows.create({
    url: "popup/popup.html",
    type: "popup",
    width: 400,
    height: 600
  });
});