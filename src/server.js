const express = require('express');
const http = require('http');
const { CheckoutService } = require('./services/CheckoutService');

const app = express();
app.use(express.json());

// ============ CONFIGURAÇÃO DE INFRAESTRUTURA ============
const GATEWAY_HOST = process.env.GATEWAY_PROXY_HOST || 'localhost';
const GATEWAY_PORT = process.env.GATEWAY_PROXY_PORT || '4000';
const USE_REAL_GATEWAY = process.env.PAYMENT_GATEWAY_URL ? true : false;

// ============ GATEWAY DE PAGAMENTO ============
// Em produção/homologação: chama o gateway real (via Toxiproxy)
// Em desenvolvimento local: usa mock in-memory
const gatewayPagamento = {
  cobrar: async (valor, cartao) => {
    if (!USE_REAL_GATEWAY) {
      // Mock local para desenvolvimento/testes unitários
      return new Promise(resolve => setTimeout(() => resolve({ status: 'APROVADO' }), 300));
    }

    // Chamada real via HTTP ao gateway (proxied pelo Toxiproxy em homologação)
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ valor, cartao });
      const options = {
        hostname: GATEWAY_HOST,
        port: parseInt(GATEWAY_PORT),
        path: '/api/cobrar',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 8000,  // Timeout de 8s para evitar thread starvation
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Resposta inválida do gateway'));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout operacional do gateway'));
      });

      req.on('error', (err) => {
        reject(new Error(`Erro de conexão com gateway: ${err.message}`));
      });

      req.write(postData);
      req.end();
    });
  }
};

// ============ REPOSITÓRIO DE PEDIDOS ============
const pedidoRepository = {
  salvar: async (pedido) => {
    // Em produção, seria uma chamada ao PostgreSQL
    // Simula latência de escrita no banco (5-20ms)
    return new Promise(resolve => {
      setTimeout(() => resolve({ ...pedido, id: Math.floor(Math.random() * 100000) }), Math.random() * 15 + 5);
    });
  }
};

// ============ SERVIÇO DE E-MAIL ============
const emailService = {
  enviarConfirmacao: async (email, msg) => {
    // Fire-and-forget (não bloqueia o fluxo principal)
    console.log(`📧 E-mail enviado para ${email}: ${msg}`);
  }
};

// ============ INSTANCIAÇÃO DO SERVIÇO COM RESILIÊNCIA ============
const checkoutService = new CheckoutService(gatewayPagamento, pedidoRepository, emailService, {
  circuitBreaker: {
    windowSize: 10,
    minRequests: 5,
    failureThreshold: 0.5,
    cooldownMs: 10000,  // 10s de cooldown antes de tentar reabrir
  },
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 500,       // Backoff entre tentativas
    timeoutMs: 3000,      // Timeout por tentativa individual
  },
});

// ============ MÉTRICAS PARA MONITORAMENTO ============
let metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
  startTime: Date.now(),
};

// ============ ENDPOINTS ============

// ENDPOINT CRÍTICO: Processamento de Checkout (alvo do teste de carga)
app.post('/api/v1/checkout', async (req, res) => {
  const startTime = Date.now();
  metrics.totalRequests++;

  const { clienteEmail, valor, cartao } = req.body;
  const pedido = { clienteEmail, valor, cartao, status: 'PENDENTE' };

  try {
    const resultado = await checkoutService.processar(pedido);

    const responseTime = Date.now() - startTime;
    metrics.avgResponseTime = (metrics.avgResponseTime + responseTime) / 2;

    if (resultado && resultado.status === 'PROCESSADO') {
      metrics.successfulRequests++;
      return res.status(200).json({ mensagem: 'Pedido finalizado com sucesso!', pedido: resultado });
    }

    metrics.failedRequests++;
    return res.status(500).json({ erro: 'Não foi possível processar seu pagamento. Tente mais tarde.' });
  } catch (error) {
    metrics.failedRequests++;
    const responseTime = Date.now() - startTime;
    metrics.avgResponseTime = (metrics.avgResponseTime + responseTime) / 2;

    if (error.message === 'Dados incompletos para checkout') {
      return res.status(400).json({ erro: 'Dados incompletos para checkout' });
    }
    return res.status(500).json({ erro: 'Não foi possível processar seu pagamento. Tente mais tarde.' });
  }
});

// Endpoint para simular Thundering Herd (flush do cache)
app.post('/api/v1/cache/flush', (req, res) => {
  console.log("💥 CACHE LIMPO ABRUPTAMENTE - Thundering Herd simulado!");
  res.json({ status: 'cache_invalidated', timestamp: new Date().toISOString() });
});

// Health check endpoint (útil para monitoramento durante testes)
app.get('/health', (req, res) => {
  const uptime = (Date.now() - metrics.startTime) / 1000;
  res.json({
    status: 'UP',
    uptime_seconds: uptime,
    metrics: {
      total_requests: metrics.totalRequests,
      successful: metrics.successfulRequests,
      failed: metrics.failedRequests,
      error_rate: metrics.totalRequests > 0
        ? ((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      avg_response_time_ms: metrics.avgResponseTime.toFixed(2),
    },
  });
});

// Endpoint de métricas (para monitoramento durante teste de carga)
app.get('/metrics', (req, res) => {
  res.json(metrics);
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor EntregasJá rodando na porta ${PORT}`);
  console.log(`   Gateway: ${USE_REAL_GATEWAY ? `${GATEWAY_HOST}:${GATEWAY_PORT} (via Toxiproxy)` : 'Mock local'}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
