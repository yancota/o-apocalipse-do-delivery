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
class RetryPolicy {
  constructor(options = {}) {
    if (stryMutAct_9fa48("116")) {
      {}
    } else {
      stryCov_9fa48("116");
      this.maxAttempts = (stryMutAct_9fa48("119") ? options.maxAttempts === undefined : stryMutAct_9fa48("118") ? false : stryMutAct_9fa48("117") ? true : (stryCov_9fa48("117", "118", "119"), options.maxAttempts !== undefined)) ? options.maxAttempts : 4; // 1 initial + 3 retries
      this.backoffMs = (stryMutAct_9fa48("122") ? options.backoffMs === undefined : stryMutAct_9fa48("121") ? false : stryMutAct_9fa48("120") ? true : (stryCov_9fa48("120", "121", "122"), options.backoffMs !== undefined)) ? options.backoffMs : 500;
      this.timeoutMs = (stryMutAct_9fa48("125") ? options.timeoutMs === undefined : stryMutAct_9fa48("124") ? false : stryMutAct_9fa48("123") ? true : (stryCov_9fa48("123", "124", "125"), options.timeoutMs !== undefined)) ? options.timeoutMs : 2000;
    }
  }
  async execute(action) {
    if (stryMutAct_9fa48("126")) {
      {}
    } else {
      stryCov_9fa48("126");
      let lastError;
      for (let attempt = 1; stryMutAct_9fa48("129") ? attempt > this.maxAttempts : stryMutAct_9fa48("128") ? attempt < this.maxAttempts : stryMutAct_9fa48("127") ? false : (stryCov_9fa48("127", "128", "129"), attempt <= this.maxAttempts); stryMutAct_9fa48("130") ? attempt-- : (stryCov_9fa48("130"), attempt++)) {
        if (stryMutAct_9fa48("131")) {
          {}
        } else {
          stryCov_9fa48("131");
          try {
            if (stryMutAct_9fa48("132")) {
              {}
            } else {
              stryCov_9fa48("132");
              return await this.executeWithTimeout(action);
            }
          } catch (error) {
            if (stryMutAct_9fa48("133")) {
              {}
            } else {
              stryCov_9fa48("133");
              lastError = error;
              if (stryMutAct_9fa48("137") ? attempt >= this.maxAttempts : stryMutAct_9fa48("136") ? attempt <= this.maxAttempts : stryMutAct_9fa48("135") ? false : stryMutAct_9fa48("134") ? true : (stryCov_9fa48("134", "135", "136", "137"), attempt < this.maxAttempts)) {
                if (stryMutAct_9fa48("138")) {
                  {}
                } else {
                  stryCov_9fa48("138");
                  await new Promise(stryMutAct_9fa48("139") ? () => undefined : (stryCov_9fa48("139"), resolve => setTimeout(resolve, this.backoffMs)));
                }
              }
            }
          }
        }
      }
      throw lastError;
    }
  }
  async executeWithTimeout(action) {
    if (stryMutAct_9fa48("140")) {
      {}
    } else {
      stryCov_9fa48("140");
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        if (stryMutAct_9fa48("141")) {
          {}
        } else {
          stryCov_9fa48("141");
          timeoutId = setTimeout(() => {
            if (stryMutAct_9fa48("142")) {
              {}
            } else {
              stryCov_9fa48("142");
              reject(new Error(stryMutAct_9fa48("143") ? "" : (stryCov_9fa48("143"), "Timeout operacional do gateway")));
            }
          }, this.timeoutMs);
        }
      });
      try {
        if (stryMutAct_9fa48("144")) {
          {}
        } else {
          stryCov_9fa48("144");
          const result = await Promise.race(stryMutAct_9fa48("145") ? [] : (stryCov_9fa48("145"), [action(), timeoutPromise]));
          return result;
        }
      } finally {
        if (stryMutAct_9fa48("146")) {
          {}
        } else {
          stryCov_9fa48("146");
          clearTimeout(timeoutId);
        }
      }
    }
  }
}
module.exports = stryMutAct_9fa48("147") ? {} : (stryCov_9fa48("147"), {
  RetryPolicy
});