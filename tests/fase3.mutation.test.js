const { CheckoutService } = require('../src/services/CheckoutService');
const { CheckoutValidator } = require('../src/services/validation/CheckoutValidator');
const { RetryPolicy } = require('../src/services/resilience/RetryPolicy');
const { CircuitBreaker } = require('../src/services/resilience/CircuitBreaker');
const { PedidoBuilder } = require('./builders/PedidoBuilder');

describe('Fase 3 - Mutation Testing Focused Specs', () => {
  describe('CheckoutValidator', () => {
    test.each([
      ['pedido ausente', null],
      ['email vazio', PedidoBuilder.umPedido().comEmail('').build()],
      ['email inválido', PedidoBuilder.umPedido().comEmail('usuario-sem-arroba').build()],
      ['valor zero', PedidoBuilder.umPedido().comValorZero().build()],
      ['cartão ausente', PedidoBuilder.umPedido().semCartao().build()],
      ['número do cartão ausente', { ...PedidoBuilder.umPedido().build(), cartao: { validade: '12/30', cvv: '123' } }],
      ['validade ausente', { ...PedidoBuilder.umPedido().build(), cartao: { numero: '4111111111111111', cvv: '123' } }],
      ['cvv ausente', { ...PedidoBuilder.umPedido().build(), cartao: { numero: '4111111111111111', validade: '12/30' } }]
    ])('rejeita %s', (_, pedido) => {
      expect(() => CheckoutValidator.validar(pedido)).toThrow('Dados incompletos para checkout');
    });
  });

  describe('RetryPolicy', () => {
    test('reexecuta até obter sucesso antes do limite máximo', async () => {
      const retryPolicy = new RetryPolicy({ maxAttempts: 3, backoffMs: 0, timeoutMs: 100 });
      let attempts = 0;

      const resultado = await retryPolicy.execute(async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('Falha transitória');
        }

        return 'ok';
      });

      expect(resultado).toBe('ok');
      expect(attempts).toBe(3);
    });

    test('falha quando o timeout operacional é excedido', async () => {
      jest.setTimeout(1000);
      const retryPolicy = new RetryPolicy({ maxAttempts: 1, backoffMs: 0, timeoutMs: 10 });

      await expect(retryPolicy.execute(() => new Promise(() => {}))).rejects.toThrow('Timeout operacional do gateway');
    });

    test('repassa o ultimo erro apos esgotar todas as tentativas', async () => {
      const retryPolicy = new RetryPolicy({ maxAttempts: 2, backoffMs: 0, timeoutMs: 100 });
      let attempts = 0;

      await expect(retryPolicy.execute(async () => {
        attempts += 1;
        throw new Error('falha definitiva');
      })).rejects.toThrow('falha definitiva');

      expect(attempts).toBe(2);
    });
  });

  describe('CircuitBreaker', () => {
    test('abre, bloqueia chamadas e volta a fechar após cooldown e sucesso', async () => {
      jest.useFakeTimers({ now: 0 });

      try {
        const circuitBreaker = new CircuitBreaker({ windowSize: 2, minRequests: 2, failureThreshold: 0.5, cooldownMs: 1000 });
        let actionCalls = 0;

        await expect(circuitBreaker.execute(async () => {
          actionCalls += 1;
          throw new Error('erro 1');
        })).rejects.toThrow('erro 1');

        await expect(circuitBreaker.execute(async () => {
          actionCalls += 1;
          throw new Error('erro 2');
        })).rejects.toThrow('erro 2');

        expect(circuitBreaker.isOpen()).toBe(true);
        await expect(circuitBreaker.execute(async () => {
          actionCalls += 1;
          return 'nao deveria executar';
        })).rejects.toThrow('Circuit breaker is open');
        expect(actionCalls).toBe(2);

        jest.advanceTimersByTime(1000);
        expect(circuitBreaker.isOpen()).toBe(false);
        expect(circuitBreaker.state).toBe('HALF_OPEN');

        const resultado = await circuitBreaker.execute(async () => {
          actionCalls += 1;
          return 'ok';
        });

        expect(resultado).toBe('ok');
        expect(circuitBreaker.state).toBe('CLOSED');
        expect(actionCalls).toBe(3);
      } finally {
        jest.useRealTimers();
      }
    });

    test('nao abre antes de atingir o numero minimo de requisicoes', async () => {
      const circuitBreaker = new CircuitBreaker({ windowSize: 5, minRequests: 3, failureThreshold: 0.5, cooldownMs: 1000 });

      await expect(circuitBreaker.execute(async () => {
        throw new Error('falha inicial');
      })).rejects.toThrow('falha inicial');

      expect(circuitBreaker.isOpen()).toBe(false);
      expect(circuitBreaker.state).toBe('CLOSED');
    });

    test('limita o historico ao tamanho da janela configurada', () => {
      const circuitBreaker = new CircuitBreaker({ windowSize: 2, minRequests: 1, failureThreshold: 1 });

      circuitBreaker.recordSuccess();
      circuitBreaker.recordSuccess();
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.history).toHaveLength(2);
      expect(circuitBreaker.history).toEqual([true, true]);
    });
  });

  describe('CheckoutService', () => {
    test('registra a mensagem de erro completa quando o gateway falha', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const gatewayStub = {
        async cobrar() {
          throw new Error('Erro de infraestrutura do gateway');
        }
      };

      const repoMock = {
        async salvar(pedido) {
          return { ...pedido, id: 1 };
        }
      };

      const emailMock = {
        async enviarConfirmacao() {
          return undefined;
        }
      };

      try {
        const checkoutService = new CheckoutService(gatewayStub, repoMock, emailMock, {
          retryPolicy: {
            backoffMs: 0,
            maxAttempts: 1,
            timeoutMs: 50
          }
        });

        await checkoutService.processar(PedidoBuilder.umPedido().build());

        expect(errorSpy).toHaveBeenCalledWith(
          'Falha no processamento do gateway bancário:',
          'Erro de infraestrutura do gateway'
        );
      } finally {
        errorSpy.mockRestore();
      }
    });
  });
});