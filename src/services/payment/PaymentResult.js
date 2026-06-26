class PaymentResult {
  static fromResponse(response) {
    if (response && response.status === 'APROVADO') {
      return new ApprovedPaymentResult(response);
    }
    return new DeclinedPaymentResult(response);
  }

  static fromError(error) {
    return new ErrorPaymentResult(error);
  }

  constructor(data) {
    this.data = data;
  }

  async applyTo(pedido, pedidoRepository, emailService) {
    throw new Error("Method applyTo must be implemented");
  }
}

class ApprovedPaymentResult extends PaymentResult {
  async applyTo(pedido, pedidoRepository, emailService) {
    pedido.status = 'PROCESSADO';
    const pedidoSalvo = await pedidoRepository.salvar(pedido);
    
    // Non-blocking asynchronous email dispatch
    emailService.enviarConfirmacao(pedido.clienteEmail, "Pagamento Aprovado")
      .catch(err => console.error("Erro assincrono de e-mail:", err.message));
      
    return pedidoSalvo;
  }
}

class DeclinedPaymentResult extends PaymentResult {
  async applyTo(pedido, pedidoRepository, emailService) {
    pedido.status = 'FALHOU';
    await pedidoRepository.salvar(pedido);
    return null;
  }
}

class ErrorPaymentResult extends PaymentResult {
  async applyTo(pedido, pedidoRepository, emailService) {
    pedido.status = 'ERRO_GATEWAY';
    await pedidoRepository.salvar(pedido);
    return null;
  }
}

module.exports = {
  PaymentResult,
  ApprovedPaymentResult,
  DeclinedPaymentResult,
  ErrorPaymentResult
};
