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
const {
  CheckoutValidator
} = require('./validation/CheckoutValidator');
const {
  PaymentResult
} = require('./payment/PaymentResult');
const {
  CircuitBreaker
} = require('./resilience/CircuitBreaker');
const {
  RetryPolicy
} = require('./resilience/RetryPolicy');
class CheckoutService {
  constructor(gatewayPagamento, pedidoRepository, emailService, options = {}) {
    if (stryMutAct_9fa48("0")) {
      {}
    } else {
      stryCov_9fa48("0");
      this.gatewayPagamento = gatewayPagamento;
      this.pedidoRepository = pedidoRepository;
      this.emailService = emailService;
      this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
      this.retryPolicy = new RetryPolicy(options.retryPolicy);
    }
  }
  async processar(pedido) {
    if (stryMutAct_9fa48("1")) {
      {}
    } else {
      stryCov_9fa48("1");
      // 1. RF01: Validação de Entrada de Dados (Sanitização)
      CheckoutValidator.validar(pedido);
      let paymentResult;
      try {
        if (stryMutAct_9fa48("2")) {
          {}
        } else {
          stryCov_9fa48("2");
          // 2. Executa a cobrança no gateway bancário sob Circuit Breaker + Retry Policy
          const resposta = await this.circuitBreaker.execute(async () => {
            if (stryMutAct_9fa48("3")) {
              {}
            } else {
              stryCov_9fa48("3");
              return await this.retryPolicy.execute(async () => {
                if (stryMutAct_9fa48("4")) {
                  {}
                } else {
                  stryCov_9fa48("4");
                  return await this.gatewayPagamento.cobrar(pedido.valor, pedido.cartao);
                }
              });
            }
          });

          // 3. Mapeia a resposta para um resultado polimórfico
          paymentResult = PaymentResult.fromResponse(resposta);
        }
      } catch (error) {
        if (stryMutAct_9fa48("5")) {
          {}
        } else {
          stryCov_9fa48("5");
          console.error(stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), "Falha no processamento do gateway bancário:"), error.message);
          // 4. Mapeia o erro para o fallback do resultado polimórfico de erro
          paymentResult = PaymentResult.fromError(error);
        }
      }

      // 5. Executa a ação do resultado polimorficamente (salvar status, disparar email)
      return await paymentResult.applyTo(pedido, this.pedidoRepository, this.emailService);
    }
  }
}
module.exports = stryMutAct_9fa48("7") ? {} : (stryCov_9fa48("7"), {
  CheckoutService
});