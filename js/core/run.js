/* run.js — the run state machine (plan §5.4). Pure: no DOM, no Date.now,
   no Math.random. Also owns the event bus: it is the only module that emits
   gameplay events; fx/audio/ui/render subscribe. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  if (!F.bus) {
    var handlers = {};
    F.bus = {
      on: function (evt, fn) { (handlers[evt] || (handlers[evt] = [])).push(fn); },
      emit: function (evt, payload) {
        var list = handlers[evt];
        if (!list) return;
        for (var i = 0; i < list.length; i++) list[i](payload);
      }
    };
  }

  var RUN_EVENTS = ['run:start', 'run:pick', 'run:stake', 'run:act', 'run:lock',
                    'run:resolve', 'run:zone', 'run:crush', 'run:finish'];

  var self = null; // the active run; F.run.state() returns it

  function initContact(rs, contact) {
    rs.pickSu = Math.round((rs.round.lo + rs.round.hi) / 2);
    rs.round = F.sonar.init(contact);
    rs.stake = 1;
  }

  function create(opts) {
    var mode = opts.mode === 'endless' ? 'endless' : 'daily';
    var contacts = F.rounds.generate(opts.seed);
    var rs = {
      mode: mode,
      seed: opts.seed,
      dayKey: opts.dayKey || null,
      contacts: contacts,
      contact: 0,
      points: 0,
      depthM: 0,
      crushedRun: false,
      pings: CFG.RUN.pingBudget,
      hull: CFG.RUN.hull,
      stake: 1,
      pickSu: 500,
      round: F.sonar.init(contacts[0]),
      results: [],
      status: 'playing'
    };
    self = rs;
    F.bus.emit('run:start', { mode: mode, seed: opts.seed, dayKey: rs.dayKey });
    return rs;
  }

  function setPick(su) {
    if (!self || self.status !== 'playing') return false;
    var v = Math.max(0, Math.min(CFG.SCOPE.maxSu, Math.round(su)));
    self.pickSu = v;
    F.bus.emit('run:pick', { pickSu: v });
    return true;
  }

  function setStake(n) {
    if (!self || self.status !== 'playing') return false;
    if (!(n === 1 || n === 2 || n === 3)) return false;
    self.stake = n;
    F.bus.emit('run:stake', { stake: n });
    return true;
  }

  function act(action) {
    if (!self || self.status !== 'playing') return false;
    var price = CFG.PRICES[action];
    if (price === undefined) return false;
    if (self.pings < price) return false;
    var truth = self.contacts[self.contact].truth;
    var next = null;
    if (action === 'sweep') next = F.sonar.sweep(self.round, truth);
    else if (action === 'echo') next = F.sonar.echo(self.round, truth);
    else if (action === 'gain') next = F.sonar.gain(self.round);
    if (!next) return false;
    self.round = next;
    self.pings -= price;
    F.bus.emit('run:act', { action: action, round: next, pingsLeft: self.pings });
    return true;
  }

  function lock() {
    if (!self || self.status !== 'playing') return null;
    var contact = self.contacts[self.contact];
    var pingsUsed = F.sonar.pingsUsed(self.round);
    var res = F.scoring.evaluate({
      pickSu: self.pickSu,
      truthSu: contact.truth,
      pingsUsed: pingsUsed,
      stake: self.stake,
      zoneId: contact.zone
    });
    var cr = {
      i: self.contact,
      zoneId: contact.zone,
      tier: res.tier,
      errSu: res.errSu,
      silent: res.silent,
      stake: self.stake,
      points: res.points,
      metres: res.metres,
      hullCost: res.hullCost,
      surveyHeal: res.surveyHeal,
      truthSu: contact.truth,
      pickSu: self.pickSu,
      pingsUsed: pingsUsed
    };
    self.results.push(cr);
    self.points += res.points;
    self.depthM += res.metres;
    self.hull = Math.min(CFG.SURVEY_HEAL.cap, self.hull - res.hullCost + res.surveyHeal);
    F.bus.emit('run:lock', { contact: cr });
    if (self.hull <= 0) {
      self.status = 'crushed';
      self.crushedRun = true;
      F.bus.emit('run:crush', { depthM: self.depthM });
    }
    F.bus.emit('run:resolve', { contact: cr, depthM: self.depthM, hull: self.hull });
    return cr;
  }

  function next() {
    if (!self) return 'results';
    if (self.status === 'crushed') {
      self.status = 'results';
      return 'crushed';
    }
    if (self.contact + 1 >= CFG.RUN.contacts) {
      self.status = 'results';
      F.bus.emit('run:finish', { results: self.results, depthM: self.depthM });
      return 'results';
    }
    self.contact++;
    initContact(self, self.contacts[self.contact]);
    var zone = F.zones.get(self.contacts[self.contact].zone);
    F.bus.emit('run:zone', { zone: zone.id, depthM: self.depthM });
    return 'contact';
  }

  function results() {
    if (!self) return null;
    var stakePlan = self.results.map(function (r) { return r.stake; });
    return {
      mode: self.mode,
      dayKey: self.dayKey,
      seed: self.seed,
      depthM: self.depthM,
      points: self.points,
      hull: self.hull,
      pingsLeft: self.pings,
      crushed: self.crushedRun,
      stakePlan: stakePlan,
      results: self.results,
      deepestZone: self.results.length
        ? self.results[self.results.length - 1].zoneId
        : null
    };
  }

  F.run = {
    create: create,
    state: function () { return self; },
    setPick: setPick,
    setStake: setStake,
    act: act,
    lock: lock,
    next: next,
    results: results
  };

  // Events list for tooling/tests (not behaviour).
  F.run.RUN_EVENTS = RUN_EVENTS;
})(window.FATHOM);
