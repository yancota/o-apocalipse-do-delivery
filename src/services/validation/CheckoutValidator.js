class CheckoutValidator {
  static validar(pedido) {
    if (!pedido) {
      throw new Error("Dados incompletos para checkout");
    }

    const { clienteEmail, valor, cartao } = pedido;

    // Validate email
    if (!clienteEmail || typeof clienteEmail !== 'string') {
      throw new Error("Dados incompletos para checkout");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteEmail)) {
      throw new Error("Dados incompletos para checkout");
    }

    // Validate valor
    if (typeof valor !== 'number' || valor <= 0) {
      throw new Error("Dados incompletos para checkout");
    }

    // Validate cartao
    if (!cartao || typeof cartao !== 'object') {
      throw new Error("Dados incompletos para checkout");
    }
    const { numero, validade, cvv } = cartao;
    if (!numero || !validade || !cvv) {
      throw new Error("Dados incompletos para checkout");
    }
  }
}

module.exports = { CheckoutValidator };
