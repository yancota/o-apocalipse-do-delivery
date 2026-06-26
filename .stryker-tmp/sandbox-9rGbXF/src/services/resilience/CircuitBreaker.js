// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
class CircuitBreaker {
  constructor(options = {}) {
    if (stryMutAct_9fa48("30")) {
      {}
    } else {
      stryCov_9fa48("30");
      this.windowSize = (stryMutAct_9fa48("33") ? options.windowSize === undefined : stryMutAct_9fa48("32") ? false : stryMutAct_9fa48("31") ? true : (stryCov_9fa48("31", "32", "33"), options.windowSize !== undefined)) ? options.windowSize : 10;
      this.minRequests = (stryMutAct_9fa48("36") ? options.minRequests === undefined : stryMutAct_9fa48("35") ? false : stryMutAct_9fa48("34") ? true : (stryCov_9fa48("34", "35", "36"), options.minRequests !== undefined)) ? options.minRequests : 5;
      this.failureThreshold = (stryMutAct_9fa48("39") ? options.failureThreshold === undefined : stryMutAct_9fa48("38") ? false : stryMutAct_9fa48("37") ? true : (stryCov_9fa48("37", "38", "39"), options.failureThreshold !== undefined)) ? options.failureThreshold : 0.5; // >= 50%
      this.cooldownMs = (stryMutAct_9fa48("42") ? options.cooldownMs === undefined : stryMutAct_9fa48("41") ? false : stryMutAct_9fa48("40") ? true : (stryCov_9fa48("40", "41", "42"), options.cooldownMs !== undefined)) ? options.cooldownMs : 10000;
      this.state = stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), 'CLOSED');
      this.history = stryMutAct_9fa48("44") ? ["Stryker was here"] : (stryCov_9fa48("44"), []); // true for success, false for failure
      this.nextAllowedTime = 0;
    }
  }
  isOpen() {
    if (stryMutAct_9fa48("45")) {
      {}
    } else {
      stryCov_9fa48("45");
      this.checkCooldown();
      return stryMutAct_9fa48("48") ? this.state !== 'OPEN' : stryMutAct_9fa48("47") ? false : stryMutAct_9fa48("46") ? true : (stryCov_9fa48("46", "47", "48"), this.state === (stryMutAct_9fa48("49") ? "" : (stryCov_9fa48("49"), 'OPEN')));
    }
  }
  checkCooldown() {
    if (stryMutAct_9fa48("50")) {
      {}
    } else {
      stryCov_9fa48("50");
      if (stryMutAct_9fa48("53") ? this.state === 'OPEN' || Date.now() >= this.nextAllowedTime : stryMutAct_9fa48("52") ? false : stryMutAct_9fa48("51") ? true : (stryCov_9fa48("51", "52", "53"), (stryMutAct_9fa48("55") ? this.state !== 'OPEN' : stryMutAct_9fa48("54") ? true : (stryCov_9fa48("54", "55"), this.state === (stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), 'OPEN')))) && (stryMutAct_9fa48("59") ? Date.now() < this.nextAllowedTime : stryMutAct_9fa48("58") ? Date.now() > this.nextAllowedTime : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59"), Date.now() >= this.nextAllowedTime)))) {
        if (stryMutAct_9fa48("60")) {
          {}
        } else {
          stryCov_9fa48("60");
          this.state = stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), 'HALF_OPEN');
        }
      }
    }
  }
  async execute(action) {
    if (stryMutAct_9fa48("62")) {
      {}
    } else {
      stryCov_9fa48("62");
      if (stryMutAct_9fa48("64") ? false : stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63", "64"), this.isOpen())) {
        if (stryMutAct_9fa48("65")) {
          {}
        } else {
          stryCov_9fa48("65");
          throw new Error(stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), "Circuit breaker is open"));
        }
      }
      try {
        if (stryMutAct_9fa48("67")) {
          {}
        } else {
          stryCov_9fa48("67");
          const result = await action();
          this.recordSuccess();
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("68")) {
          {}
        } else {
          stryCov_9fa48("68");
          this.recordFailure();
          throw error;
        }
      }
    }
  }
  recordSuccess() {
    if (stryMutAct_9fa48("69")) {
      {}
    } else {
      stryCov_9fa48("69");
      if (stryMutAct_9fa48("72") ? this.state !== 'HALF_OPEN' : stryMutAct_9fa48("71") ? false : stryMutAct_9fa48("70") ? true : (stryCov_9fa48("70", "71", "72"), this.state === (stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), 'HALF_OPEN')))) {
        if (stryMutAct_9fa48("74")) {
          {}
        } else {
          stryCov_9fa48("74");
          this.state = stryMutAct_9fa48("75") ? "" : (stryCov_9fa48("75"), 'CLOSED');
          this.history = stryMutAct_9fa48("76") ? ["Stryker was here"] : (stryCov_9fa48("76"), []);
        }
      }
      this.pushHistory(stryMutAct_9fa48("77") ? false : (stryCov_9fa48("77"), true));
    }
  }
  recordFailure() {
    if (stryMutAct_9fa48("78")) {
      {}
    } else {
      stryCov_9fa48("78");
      this.pushHistory(stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79"), false));
      this.evaluateState();
    }
  }
  pushHistory(success) {
    if (stryMutAct_9fa48("80")) {
      {}
    } else {
      stryCov_9fa48("80");
      this.history.push(success);
      if (stryMutAct_9fa48("84") ? this.history.length <= this.windowSize : stryMutAct_9fa48("83") ? this.history.length >= this.windowSize : stryMutAct_9fa48("82") ? false : stryMutAct_9fa48("81") ? true : (stryCov_9fa48("81", "82", "83", "84"), this.history.length > this.windowSize)) {
        if (stryMutAct_9fa48("85")) {
          {}
        } else {
          stryCov_9fa48("85");
          this.history.shift();
        }
      }
    }
  }
  evaluateState() {
    if (stryMutAct_9fa48("86")) {
      {}
    } else {
      stryCov_9fa48("86");
      if (stryMutAct_9fa48("89") ? this.state !== 'HALF_OPEN' : stryMutAct_9fa48("88") ? false : stryMutAct_9fa48("87") ? true : (stryCov_9fa48("87", "88", "89"), this.state === (stryMutAct_9fa48("90") ? "" : (stryCov_9fa48("90"), 'HALF_OPEN')))) {
        if (stryMutAct_9fa48("91")) {
          {}
        } else {
          stryCov_9fa48("91");
          this.state = stryMutAct_9fa48("92") ? "" : (stryCov_9fa48("92"), 'OPEN');
          this.nextAllowedTime = stryMutAct_9fa48("93") ? Date.now() - this.cooldownMs : (stryCov_9fa48("93"), Date.now() + this.cooldownMs);
          return;
        }
      }
      if (stryMutAct_9fa48("96") ? this.state === 'CLOSED' || this.history.length >= this.minRequests : stryMutAct_9fa48("95") ? false : stryMutAct_9fa48("94") ? true : (stryCov_9fa48("94", "95", "96"), (stryMutAct_9fa48("98") ? this.state !== 'CLOSED' : stryMutAct_9fa48("97") ? true : (stryCov_9fa48("97", "98"), this.state === (stryMutAct_9fa48("99") ? "" : (stryCov_9fa48("99"), 'CLOSED')))) && (stryMutAct_9fa48("102") ? this.history.length < this.minRequests : stryMutAct_9fa48("101") ? this.history.length > this.minRequests : stryMutAct_9fa48("100") ? true : (stryCov_9fa48("100", "101", "102"), this.history.length >= this.minRequests)))) {
        if (stryMutAct_9fa48("103")) {
          {}
        } else {
          stryCov_9fa48("103");
          const failures = stryMutAct_9fa48("104") ? this.history.length : (stryCov_9fa48("104"), this.history.filter(stryMutAct_9fa48("105") ? () => undefined : (stryCov_9fa48("105"), s => stryMutAct_9fa48("106") ? s : (stryCov_9fa48("106"), !s))).length);
          const rate = stryMutAct_9fa48("107") ? failures * this.history.length : (stryCov_9fa48("107"), failures / this.history.length);
          if (stryMutAct_9fa48("111") ? rate < this.failureThreshold : stryMutAct_9fa48("110") ? rate > this.failureThreshold : stryMutAct_9fa48("109") ? false : stryMutAct_9fa48("108") ? true : (stryCov_9fa48("108", "109", "110", "111"), rate >= this.failureThreshold)) {
            if (stryMutAct_9fa48("112")) {
              {}
            } else {
              stryCov_9fa48("112");
              this.state = stryMutAct_9fa48("113") ? "" : (stryCov_9fa48("113"), 'OPEN');
              this.nextAllowedTime = stryMutAct_9fa48("114") ? Date.now() - this.cooldownMs : (stryCov_9fa48("114"), Date.now() + this.cooldownMs);
            }
          }
        }
      }
    }
  }
}
module.exports = stryMutAct_9fa48("115") ? {} : (stryCov_9fa48("115"), {
  CircuitBreaker
});