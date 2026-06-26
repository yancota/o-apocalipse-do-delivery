// @ts-nocheck
const { CheckoutService } = require('../src/services/CheckoutService');
const { PedidoBuilder } = require('./builders/PedidoBuilder');

// Mocks & Stubs setup to avoid obscure setup
class PaymentGatewayStub {
  constructor() {
    this.response = { status: 'APROVADO' };
    this.shouldThrow = false;
    this.delayMs = 0;
    this.callsCount = 0;
  }

  async cobrar(valor, cartao) {
    this.callsCount++;
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    if (this.shouldThrow) {
      throw new Error("Erro de infraestrutura do gateway");
    }
    return this.response;
  }
}

class PedidoRepositoryMock {
  constructor() {
    this.savedPedidos = [];
  }

  async salvar(pedido) {
    const saved = { ...pedido, id: Math.floor(Math.random() * 10000) };
    this.savedPedidos.push(saved);
    return saved;
  }
}

class EmailServiceMock {
  constructor() {
    this.sentEmails = [];
  }

  async enviarConfirmacao(email, mensagem) {
    this.sentEmails.push({ email, mensagem });
  }

  assertEmailSentTo(email, expectedMessage) {
    const match = this.sentEmails.find(e => e.email === email && e.mensagem.includes(expectedMessage));
    if (!match) {
      throw new Error(`E-mail com mensagem "${expectedMessage}" nao foi enviado para ${email}`);
    }
  }

  assertNoEmailSent() {
    if (this.sentEmails.length > 0) {
      throw new Error("Nenhum e-mail deveria ter sido enviado");
    }
  }
}

describe('CheckoutService BDD Specifications', () => {
  let gatewayStub;
  let repoMock;
  let emailMock;
  let checkoutService;

  beforeEach(() => {
    gatewayStub = new PaymentGatewayStub();
    repoMock = new PedidoRepositoryMock();
    emailMock = new EmailServiceMock();
    // Instanciar o servico com as dependencias mockadas/stubadas e backoff rápido para testes
    checkoutService = new CheckoutService(gatewayStub, repoMock, emailMock, {
      retryPolicy: {
        backoffMs: 0
      }
    });
  });

  // Cenário 1
  test('Processamento de Pagamento Autorizado (Caminho Feliz)', async () => {
    // Dado que o cliente envia um pedido válido
    const pedido = PedidoBuilder.umPedido().comValor(150.00).build();
    // E o gateway está respondendo com APROVADO
    gatewayStub.response = { status: 'APROVADO' };

    // Quando o checkout é processado
    const resultado = await checkoutService.processar(pedido);

    // Então o status deve ser PROCESSADO e salvo
    expect(resultado).not.toBeNull();
    expect(resultado.status).toBe('PROCESSADO');
    expect(repoMock.savedPedidos.length).toBe(1);
    expect(repoMock.savedPedidos[0].status).toBe('PROCESSADO');

    // E o email de confirmação deve ser enviado de forma assíncrona
    // Nota: Como o e-mail é assíncrono (non-blocking), podemos aguardar uma fração de tempo nos testes para verificar o disparo.
    await new Promise(resolve => setTimeout(resolve, 50));
    emailMock.assertEmailSentTo(pedido.clienteEmail, "Pagamento Aprovado");
  });

  // Cenário 2
  test('Tratamento de Pagamento Recusado (Falha de Negócio)', async () => {
    // Dado que o cliente envia um pedido válido
    const pedido = PedidoBuilder.umPedido().comValor(80.00).build();
    // E o gateway recusa a transação
    gatewayStub.response = { status: 'RECUSADO' };

    // Quando o checkout é processado
    const resultado = await checkoutService.processar(pedido);

    // Então o status deve ser FALHOU e salvo
    expect(resultado).toBeNull();
    expect(repoMock.savedPedidos.length).toBe(1);
    expect(repoMock.savedPedidos[0].status).toBe('FALHOU');

    // E nenhum e-mail deve ser disparado
    emailMock.assertNoEmailSent();
  });

  // Cenário 3
  test('Resiliência com Retentativa Bem-sucedida (Falha Temporária)', async () => {
    // Dado que o cliente envia um pedido válido
    const pedido = PedidoBuilder.umPedido().comValor(120.00).build();

    // E o gateway falha na primeira tentativa e responde APROVADO na segunda
    let attempt = 0;
    gatewayStub.cobrar = async (valor, cartao) => {
      attempt++;
      gatewayStub.callsCount++;
      if (attempt === 1) {
        throw new Error("Erro temporário de conexão");
      }
      return { status: 'APROVADO' };
    };

    // Quando o checkout é processado
    const resultado = await checkoutService.processar(pedido);

    // Então o status deve ser PROCESSADO, salvo e e-mail disparado
    expect(resultado).not.toBeNull();
    expect(resultado.status).toBe('PROCESSADO');
    expect(gatewayStub.callsCount).toBe(2);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    emailMock.assertEmailSentTo(pedido.clienteEmail, "Pagamento Aprovado");
  });

  // Cenário 4
  test('Falha de Infraestrutura Persistente com Retentativas Esgotadas (Fallback)', async () => {
    // Dado que o cliente envia um pedido válido
    const pedido = PedidoBuilder.umPedido().comValor(200.00).build();
    // E o gateway apresenta falha de infraestrutura persistente (timeout ou erro de conexão)
    gatewayStub.shouldThrow = true;

    // Quando o checkout é processado
    const resultado = await checkoutService.processar(pedido);

    // Então o status deve ser ERRO_GATEWAY, salvo e nenhum e-mail enviado
    expect(resultado).toBeNull();
    expect(repoMock.savedPedidos.length).toBe(1);
    expect(repoMock.savedPedidos[0].status).toBe('ERRO_GATEWAY');
    expect(gatewayStub.callsCount).toBe(4); // Inicial + 3 retentativas
    emailMock.assertNoEmailSent();
  });

  // Cenário 5
  test('Validação de Entrada de Dados - Payload Incompleto ou Inválido', async () => {
    // Dado que o cliente envia um pedido inválido sem e-mail
    const pedidoSemEmail = PedidoBuilder.umPedido().semEmail().build();
    const pedidoValorInvalido = PedidoBuilder.umPedido().comValorZero().build();
    const pedidoSemCartao = PedidoBuilder.umPedido().semCartao().build();

    // Quando e Então: deve lançar erro de validação
    await expect(checkoutService.processar(pedidoSemEmail)).rejects.toThrow("Dados incompletos para checkout");
    await expect(checkoutService.processar(pedidoValorInvalido)).rejects.toThrow("Dados incompletos para checkout");
    await expect(checkoutService.processar(pedidoSemCartao)).rejects.toThrow("Dados incompletos para checkout");

    // E nenhuma chamada deve ser feita ao gateway ou ao repositório
    expect(gatewayStub.callsCount).toBe(0);
    expect(repoMock.savedPedidos.length).toBe(0);
  });

  // Cenário 6
  test('Circuit Breaker Aberto devido a Alta Taxa de Falhas', async () => {
    // Para abrir o circuit breaker, simulamos falhas no gateway
    gatewayStub.shouldThrow = true;
    
    // Dispara 5 requisições de falha para abrir o circuit breaker (erro >= 50%)
    for (let i = 0; i < 5; i++) {
      const p = PedidoBuilder.umPedido().build();
      await checkoutService.processar(p);
    }
    
    expect(gatewayStub.callsCount).toBe(20); // 5 x (1 inicial + 3 retentativas)
    
    // Agora o circuit breaker deve estar ABERTO. Nova requisição deve falhar imediatamente.
    gatewayStub.callsCount = 0;
    const pedidoNovo = PedidoBuilder.umPedido().build();
    
    const resultado = await checkoutService.processar(pedidoNovo);
    
    expect(resultado).toBeNull();
    expect(gatewayStub.callsCount).toBe(0); // Não chamou o gateway
    expect(repoMock.savedPedidos[repoMock.savedPedidos.length - 1].status).toBe('ERRO_GATEWAY');
  });
});
