document.addEventListener("DOMContentLoaded", function () {
  swetrix.init("GAvFu5AdIuRx", {
    apiURL: `https://swetrix.vaven.io/log`,
  });
  swetrix.trackViews();
  swetrix.trackErrors({
    sampleRate: 1,
    callback: () => {
      return true;
    },
  });
});
