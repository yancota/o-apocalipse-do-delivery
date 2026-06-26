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
class CheckoutValidator {
  static validar(pedido) {
    if (stryMutAct_9fa48("148")) {
      {}
    } else {
      stryCov_9fa48("148");
      if (stryMutAct_9fa48("151") ? false : stryMutAct_9fa48("150") ? true : stryMutAct_9fa48("149") ? pedido : (stryCov_9fa48("149", "150", "151"), !pedido)) {
        if (stryMutAct_9fa48("152")) {
          {}
        } else {
          stryCov_9fa48("152");
          throw new Error(stryMutAct_9fa48("153") ? "" : (stryCov_9fa48("153"), "Dados incompletos para checkout"));
        }
      }
      const {
        clienteEmail,
        valor,
        cartao
      } = pedido;

      // Validate email
      if (stryMutAct_9fa48("156") ? !clienteEmail && typeof clienteEmail !== 'string' : stryMutAct_9fa48("155") ? false : stryMutAct_9fa48("154") ? true : (stryCov_9fa48("154", "155", "156"), (stryMutAct_9fa48("157") ? clienteEmail : (stryCov_9fa48("157"), !clienteEmail)) || (stryMutAct_9fa48("159") ? typeof clienteEmail === 'string' : stryMutAct_9fa48("158") ? false : (stryCov_9fa48("158", "159"), typeof clienteEmail !== (stryMutAct_9fa48("160") ? "" : (stryCov_9fa48("160"), 'string')))))) {
        if (stryMutAct_9fa48("161")) {
          {}
        } else {
          stryCov_9fa48("161");
          throw new Error(stryMutAct_9fa48("162") ? "" : (stryCov_9fa48("162"), "Dados incompletos para checkout"));
        }
      }
      const emailRegex = stryMutAct_9fa48("173") ? /^[^\s@]+@[^\s@]+\.[^\S@]+$/ : stryMutAct_9fa48("172") ? /^[^\s@]+@[^\s@]+\.[\s@]+$/ : stryMutAct_9fa48("171") ? /^[^\s@]+@[^\s@]+\.[^\s@]$/ : stryMutAct_9fa48("170") ? /^[^\s@]+@[^\S@]+\.[^\s@]+$/ : stryMutAct_9fa48("169") ? /^[^\s@]+@[\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("168") ? /^[^\s@]+@[^\s@]\.[^\s@]+$/ : stryMutAct_9fa48("167") ? /^[^\S@]+@[^\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("166") ? /^[\s@]+@[^\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("165") ? /^[^\s@]@[^\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("164") ? /^[^\s@]+@[^\s@]+\.[^\s@]+/ : stryMutAct_9fa48("163") ? /[^\s@]+@[^\s@]+\.[^\s@]+$/ : (stryCov_9fa48("163", "164", "165", "166", "167", "168", "169", "170", "171", "172", "173"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      if (stryMutAct_9fa48("176") ? false : stryMutAct_9fa48("175") ? true : stryMutAct_9fa48("174") ? emailRegex.test(clienteEmail) : (stryCov_9fa48("174", "175", "176"), !emailRegex.test(clienteEmail))) {
        if (stryMutAct_9fa48("177")) {
          {}
        } else {
          stryCov_9fa48("177");
          throw new Error(stryMutAct_9fa48("178") ? "" : (stryCov_9fa48("178"), "Dados incompletos para checkout"));
        }
      }

      // Validate valor
      if (stryMutAct_9fa48("181") ? typeof valor !== 'number' && valor <= 0 : stryMutAct_9fa48("180") ? false : stryMutAct_9fa48("179") ? true : (stryCov_9fa48("179", "180", "181"), (stryMutAct_9fa48("183") ? typeof valor === 'number' : stryMutAct_9fa48("182") ? false : (stryCov_9fa48("182", "183"), typeof valor !== (stryMutAct_9fa48("184") ? "" : (stryCov_9fa48("184"), 'number')))) || (stryMutAct_9fa48("187") ? valor > 0 : stryMutAct_9fa48("186") ? valor < 0 : stryMutAct_9fa48("185") ? false : (stryCov_9fa48("185", "186", "187"), valor <= 0)))) {
        if (stryMutAct_9fa48("188")) {
          {}
        } else {
          stryCov_9fa48("188");
          throw new Error(stryMutAct_9fa48("189") ? "" : (stryCov_9fa48("189"), "Dados incompletos para checkout"));
        }
      }

      // Validate cartao
      if (stryMutAct_9fa48("192") ? !cartao && typeof cartao !== 'object' : stryMutAct_9fa48("191") ? false : stryMutAct_9fa48("190") ? true : (stryCov_9fa48("190", "191", "192"), (stryMutAct_9fa48("193") ? cartao : (stryCov_9fa48("193"), !cartao)) || (stryMutAct_9fa48("195") ? typeof cartao === 'object' : stryMutAct_9fa48("194") ? false : (stryCov_9fa48("194", "195"), typeof cartao !== (stryMutAct_9fa48("196") ? "" : (stryCov_9fa48("196"), 'object')))))) {
        if (stryMutAct_9fa48("197")) {
          {}
        } else {
          stryCov_9fa48("197");
          throw new Error(stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), "Dados incompletos para checkout"));
        }
      }
      const {
        numero,
        validade,
        cvv
      } = cartao;
      if (stryMutAct_9fa48("201") ? (!numero || !validade) && !cvv : stryMutAct_9fa48("200") ? false : stryMutAct_9fa48("199") ? true : (stryCov_9fa48("199", "200", "201"), (stryMutAct_9fa48("203") ? !numero && !validade : stryMutAct_9fa48("202") ? false : (stryCov_9fa48("202", "203"), (stryMutAct_9fa48("204") ? numero : (stryCov_9fa48("204"), !numero)) || (stryMutAct_9fa48("205") ? validade : (stryCov_9fa48("205"), !validade)))) || (stryMutAct_9fa48("206") ? cvv : (stryCov_9fa48("206"), !cvv)))) {
        if (stryMutAct_9fa48("207")) {
          {}
        } else {
          stryCov_9fa48("207");
          throw new Error(stryMutAct_9fa48("208") ? "" : (stryCov_9fa48("208"), "Dados incompletos para checkout"));
        }
      }
    }
  }
}
module.exports = stryMutAct_9fa48("209") ? {} : (stryCov_9fa48("209"), {
  CheckoutValidator
});