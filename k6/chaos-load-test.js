/**
 * =============================================================================
 * TESTE DE CARGA COM INJEÇÃO DE CAOS (CENÁRIO PRINCIPAL DA FASE 4)
 * =============================================================================
 * Este é o teste definitivo: executa carga massiva no estilo Black Friday
 * enquanto coordena com scripts externos que injetam falhas via Toxiproxy.
 * 
 * CENÁRIOS DE CAOS:
 *   1. Thundering Herd: flush do cache com 10.000 reqs simultâneas
 *   2. Gateway Lento: latência de 5000ms na API de pagamento
 * 
 * SLI/SLO:
 *   - p95 latência < 5000ms
 *   - Taxa de erro < 5%
 *   - Sistema deve demonstrar Degradação Graciosa (graceful degradation)
 * 
 * EXECUÇÃO:
 *   Terminal 1: docker-compose up
 *   Terminal 2: k6 run k6/chaos-load-test.js
 *   Terminal 3: node k6/chaos-injector.js (injeta falhas durante o teste)
 * =============================================================================
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// ============ MÉTRICAS CUSTOMIZADAS ============
const errorRate = new Rate('error_rate');
const checkoutP95 = new Trend('checkout_p95', true);
const successCount = new Counter('successful_requests');
const failCount = new Counter('failed_requests');
const circuitBreakerTrips = new Counter('circuit_breaker_trips');
const currentVUs = new Gauge('current_vus');

// ============ CONFIGURAÇÃO: BLACK FRIDAY + CAOS ============
export const options = {
  scenarios: {
    // Cenário principal: carga sustentada estilo Black Friday
    black_friday_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 50 },     // Aquecimento
        { duration: '20s', target: 150 },    // Ramp-up para pico
        { duration: '1m', target: 200 },     // Steady state (pico BF)
        { duration: '30s', target: 200 },    // Mantém durante injeção de caos
        { duration: '30s', target: 200 },    // Observa recuperação
        { duration: '20s', target: 0 },      // Ramp-down
      ],
      gracefulRampDown: '10s',
    },

    // Cenário de Thundering Herd: burst massivo de 10.000 requisições
    thundering_herd: {
      executor: 'shared-iterations',
      vus: 500,
      iterations: 10000,
      startTime: '1m',         // Inicia após 1 minuto de carga normal
      maxDuration: '30s',       // Deve completar em 30s
    },
  },

  thresholds: {
    // SLOs rigorosos
    'http_req_duration{scenario:black_friday_load}': [
      { threshold: 'p(95)<5000', abortOnFail: false },
    ],
    'error_rate': [
      { threshold: 'rate<0.05', abortOnFail: false },
    ],
    'http_req_failed': [
      { threshold: 'rate<0.10', abortOnFail: false },
    ],
  },
};

// ============ GERAÇÃO DE DADOS ============
function gerarPedido() {
  return {
    clienteEmail: `blackfriday-${__VU}@entregasja.com`,
    valor: Math.floor(Math.random() * 999) + 1,
    cartao: {
      numero: '4111111111111111',
      validade: '12/2027',
      cvv: '123',
    },
  };
}

// ============ CENÁRIO PRINCIPAL ============
export default function () {
  currentVUs.add(__VU);

  const payload = JSON.stringify(gerarPedido());
  const params = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
    tags: { scenario: 'black_friday_load' },
  };

  let res;

  group('Checkout - Processamento de Pedido', () => {
    res = http.post('http://localhost:3000/api/v1/checkout', payload, params);

    checkoutP95.add(res.timings.duration);

    const checkResult = check(res, {
      'status 200 (sucesso)': (r) => r.status === 200,
      'não é timeout': (r) => r.timings.duration < 10000,
      'resposta válida': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      'SLO: latência < 5s': (r) => r.timings.duration < 5000,
    });

    if (res.status >= 500) {
      errorRate.add(1);
      failCount.add(1);

      // Detecta circuit breaker (resposta rápida com erro = CB aberto)
      if (res.timings.duration < 100 && res.status === 500) {
        circuitBreakerTrips.add(1);
      }
    } else {
      errorRate.add(0);
      if (res.status === 200) {
        successCount.add(1);
      }
    }
  });

  sleep(Math.random() * 1.5 + 0.3);
}

// ============ RELATÓRIO FINAL ============
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  console.log('\n' + '='.repeat(70));
  console.log('  📊 RELATÓRIO FINAL - TESTE DE CARGA COM CAOS');
  console.log('='.repeat(70));
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log('');

  // Análise de SLO
  const p95 = data.metrics?.http_req_duration?.values?.['p(95)'];
  const errRate = data.metrics?.error_rate?.values?.rate;

  console.log('  📋 VERIFICAÇÃO DE SLOs:');
  console.log(`     SLO 1 (p95 < 5000ms): ${p95 ? p95.toFixed(2) + 'ms' : 'N/A'} ${p95 < 5000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`     SLO 2 (erro < 5%):    ${errRate ? (errRate * 100).toFixed(2) + '%' : 'N/A'} ${errRate < 0.05 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  console.log('='.repeat(70));

  return {
    [`reports/k6/chaos-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}
