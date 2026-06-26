// @ts-nocheck
class PedidoBuilder {
  constructor() {
    this.pedido = {
      clienteEmail: 'cliente@entregasja.com.br',
      valor: 150.00,
      cartao: {
        numero: '1234-5678-9012-3456',
        validade: '12/28',
        cvv: '123'
      },
      status: 'PENDENTE'
    };
  }

  static umPedido() {
    return new PedidoBuilder();
  }

  comEmail(email) {
    this.pedido.clienteEmail = email;
    return this;
  }

  comValor(valor) {
    this.pedido.valor = valor;
    return this;
  }

  comCartao(cartao) {
    this.pedido.cartao = cartao;
    return this;
  }

  semEmail() {
    delete this.pedido.clienteEmail;
    return this;
  }

  comEmailInvalido() {
    this.pedido.clienteEmail = 'email_invalido';
    return this;
  }

  comValorZero() {
    this.pedido.valor = 0;
    return this;
  }

  comValorNegativo() {
    this.pedido.valor = -50.00;
    return this;
  }

  semCartao() {
    delete this.pedido.cartao;
    return this;
  }

  comCartaoIncompleto() {
    this.pedido.cartao = { numero: '1234' };
    return this;
  }

  comStatus(status) {
    this.pedido.status = status;
    return this;
  }

  build() {
    return JSON.parse(JSON.stringify(this.pedido));
  }
}

module.exports = { PedidoBuilder };
