window.op = window.op || function () { var n = []; return new Proxy(function () { arguments.length && n.push([].slice.call(arguments)) }, { get: function (t, r) { return "q" === r ? n : function () { n.push([r].concat([].slice.call(arguments))) } }, has: function (t, r) { return "q" === r } }) }();
window.op('init', {
  apiUrl: 'https://analytics.xenon.bot/api',
  clientId: '73f81ab2-5b52-46d7-9735-b9041e96e01c',
  trackScreenViews: true,
  trackOutgoingLinks: true,
});
