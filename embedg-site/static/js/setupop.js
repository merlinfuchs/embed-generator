window.op = window.op || function () { var n = []; return new Proxy(function () { arguments.length && n.push([].slice.call(arguments)) }, { get: function (t, r) { return "q" === r ? n : function () { n.push([r].concat([].slice.call(arguments))) } }, has: function (t, r) { return "q" === r } }) }();
window.op('init', {
  apiUrl: 'https://analytics.vaven.io/api',
  clientId: 'f4dd2f20-2d9f-4ff5-9486-6d88b5326fc7',
  trackScreenViews: true,
  trackOutgoingLinks: true,
});
