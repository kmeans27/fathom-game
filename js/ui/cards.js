/* cards.js — the site card: name, flavour, zone badge, danger note (§8.1 BRIEF). */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var D = F.dom;

  F.cards = {
    build: function (contact) {
      var z = F.zones.get(contact.zone);
      var card = D.el('div', 'card');
      card.appendChild(D.el('h3')).appendChild(D.txt(contact.site.name));
      card.appendChild(D.el('p')).appendChild(D.txt(contact.site.flavour));
      var badge = D.el('div', 'zone-badge');
      badge.appendChild(D.txt(z.label + ' \u00B7 ' + z.fromM + '\u2013' + z.toM + ' m'));
      card.appendChild(badge);
      if (contact.decoys.length > 0) {
        var danger = D.el('div', 'danger');
        danger.appendChild(D.txt('DANGER \u2014 ' + contact.decoys.length +
          ' decoy contact(s) in this water'));
        card.appendChild(danger);
      }
      return card;
    }
  };
})(window.FATHOM);
