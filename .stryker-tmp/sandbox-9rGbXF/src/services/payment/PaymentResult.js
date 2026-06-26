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
class PaymentResult {
  static fromResponse(response) {
    if (stryMutAct_9fa48("8")) {
      {}
    } else {
      stryCov_9fa48("8");
      if (stryMutAct_9fa48("11") ? response || response.status === 'APROVADO' : stryMutAct_9fa48("10") ? false : stryMutAct_9fa48("9") ? true : (stryCov_9fa48("9", "10", "11"), response && (stryMutAct_9fa48("13") ? response.status !== 'APROVADO' : stryMutAct_9fa48("12") ? true : (stryCov_9fa48("12", "13"), response.status === (stryMutAct_9fa48("14") ? "" : (stryCov_9fa48("14"), 'APROVADO')))))) {
        if (stryMutAct_9fa48("15")) {
          {}
        } else {
          stryCov_9fa48("15");
          return new ApprovedPaymentResult(response);
        }
      }
      return new DeclinedPaymentResult(response);
    }
  }
  static fromError(error) {
    if (stryMutAct_9fa48("16")) {
      {}
    } else {
      stryCov_9fa48("16");
      return new ErrorPaymentResult(error);
    }
  }
  constructor(data) {
    if (stryMutAct_9fa48("17")) {
      {}
    } else {
      stryCov_9fa48("17");
      this.data = data;
    }
  }
  async applyTo(pedido, pedidoRepository, emailService) {
    if (stryMutAct_9fa48("18")) {
      {}
    } else {
      stryCov_9fa48("18");
      throw new Error(stryMutAct_9fa48("19") ? "" : (stryCov_9fa48("19"), "Method applyTo must be implemented"));
    }
  }
}
class ApprovedPaymentResult extends PaymentResult {
  async applyTo(pedido, pedidoRepository, emailService) {
    if (stryMutAct_9fa48("20")) {
      {}
    } else {
      stryCov_9fa48("20");
      pedido.status = stryMutAct_9fa48("21") ? "" : (stryCov_9fa48("21"), 'PROCESSADO');
      const pedidoSalvo = await pedidoRepository.salvar(pedido);

      // Non-blocking asynchronous email dispatch
      emailService.enviarConfirmacao(pedido.clienteEmail, stryMutAct_9fa48("22") ? "" : (stryCov_9fa48("22"), "Pagamento Aprovado")).catch(stryMutAct_9fa48("23") ? () => undefined : (stryCov_9fa48("23"), err => console.error(stryMutAct_9fa48("24") ? "" : (stryCov_9fa48("24"), "Erro assincrono de e-mail:"), err.message)));
      return pedidoSalvo;
    }
  }
}
class DeclinedPaymentResult extends PaymentResult {
  async applyTo(pedido, pedidoRepository, emailService) {
    if (stryMutAct_9fa48("25")) {
      {}
    } else {
      stryCov_9fa48("25");
      pedido.status = stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), 'FALHOU');
      await pedidoRepository.salvar(pedido);
      return null;
    }
  }
}
class ErrorPaymentResult extends PaymentResult {
  async applyTo(pedido, pedidoRepository, emailService) {
    if (stryMutAct_9fa48("27")) {
      {}
    } else {
      stryCov_9fa48("27");
      pedido.status = stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), 'ERRO_GATEWAY');
      await pedidoRepository.salvar(pedido);
      return null;
    }
  }
}
module.exports = stryMutAct_9fa48("29") ? {} : (stryCov_9fa48("29"), {
  PaymentResult,
  ApprovedPaymentResult,
  DeclinedPaymentResult,
  ErrorPaymentResult
});