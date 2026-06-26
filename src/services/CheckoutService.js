const { CheckoutValidator } = require('./validation/CheckoutValidator');
const { PaymentResult } = require('./payment/PaymentResult');
const { CircuitBreaker } = require('./resilience/CircuitBreaker');
const { RetryPolicy } = require('./resilience/RetryPolicy');

class CheckoutService {
  constructor(gatewayPagamento, pedidoRepository, emailService, options = {}) {
    this.gatewayPagamento = gatewayPagamento;
    this.pedidoRepository = pedidoRepository;
    this.emailService = emailService;
    
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    this.retryPolicy = new RetryPolicy(options.retryPolicy);
  }

  async processar(pedido) {
    // 1. RF01: Validação de Entrada de Dados (Sanitização)
    CheckoutValidator.validar(pedido);

    let paymentResult;
    try {
      // 2. Executa a cobrança no gateway bancário sob Circuit Breaker + Retry Policy
      const resposta = await this.circuitBreaker.execute(async () => {
        return await this.retryPolicy.execute(async () => {
          return await this.gatewayPagamento.cobrar(pedido.valor, pedido.cartao);
        });
      });
      
      // 3. Mapeia a resposta para um resultado polimórfico
      paymentResult = PaymentResult.fromResponse(resposta);
    } catch (error) {
      console.error("Falha no processamento do gateway bancário:", error.message);
      // 4. Mapeia o erro para o fallback do resultado polimórfico de erro
      paymentResult = PaymentResult.fromError(error);
    }

    // 5. Executa a ação do resultado polimorficamente (salvar status, disparar email)
    return await paymentResult.applyTo(pedido, this.pedidoRepository, this.emailService);
  }
}

module.exports = { CheckoutService };