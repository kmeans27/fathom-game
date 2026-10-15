/* hud.js — top HUD strip: points, depth, zone, pings, hull pips, contact n/8 (§8.1). */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var D = F.dom;

  var hud = D.el('div', 'hud');
  var points = D.el('span', 'hud-points');
  var depth = D.el('span', 'hud-depth');
  var zone = D.el('span', 'hud-zone');
  var pings = D.el('span', 'hud-pings');
  var hull = D.el('span', 'hud-hull');
  var contact = D.el('span', 'hud-contact');
  hud.appendChild(points); hud.appendChild(depth); hud.appendChild(zone);
  hud.appendChild(pings); hud.appendChild(hull); hud.appendChild(contact);

  F.hud = {
    build: function () { return hud; },
    update: function (rs) {
      points.textContent = String(rs.points);
      depth.textContent = D.fmtInt(rs.depthM) + ' m';
      zone.textContent = F.zones.get(rs.contacts[rs.contact].zone).label;
      pings.textContent = rs.pings + ' pings';
      var pips = '';
      for (var i = 0; i < F.config.RUN.hull; i++) pips += i < rs.hull ? '\u25CF' : '\u25CB';
      hull.textContent = pips;
      contact.textContent = (rs.contact + 1) + '/' + F.config.RUN.contacts;
    }
  };
})(window.FATHOM);
