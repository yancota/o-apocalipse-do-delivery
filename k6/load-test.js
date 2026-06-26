/**
 * =============================================================================
 * TESTE DE CARGA - Black Friday Simulation
 * =============================================================================
 * Simula a volumetria da Black Friday no endpoint de Checkout.
 * Padrão: ramp-up → steady → ramp-down
 * 
 * SLI/SLO definidos:
 *   - p95 latência < 5000ms (5 segundos)
 *   - Taxa de erro (HTTP 5xx) < 5%
 *   - p99 latência < 8000ms
 *   - Disponibilidade mínima: 95%
 * =============================================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============ MÉTRICAS CUSTOMIZADAS ============
const errorRate = new Rate('error_rate');
const checkoutDuration = new Trend('checkout_duration', true);
const successfulCheckouts = new Counter('successful_checkouts');
const failedCheckouts = new Counter('failed_checkouts');

// ============ CONFIGURAÇÃO DE CARGA ============
export const options = {
  // Padrão ramp-up, steady, ramp-down simulando pico de Black Friday
  stages: [
    { duration: '30s', target: 50 },    // Ramp-up: 0 → 50 VUs em 30s
    { duration: '1m', target: 200 },     // Ramp-up agressivo: 50 → 200 VUs em 1min
    { duration: '2m', target: 200 },     // Steady state: mantém 200 VUs por 2min (pico BF)
    { duration: '30s', target: 100 },    // Ramp-down parcial: 200 → 100 VUs
    { duration: '30s', target: 0 },      // Ramp-down final: 100 → 0 VUs
  ],

  // ============ THRESHOLDS DE SLO ============
  thresholds: {
    // SLO 1: p95 da latência deve ficar abaixo de 5 segundos
    'http_req_duration': [
      { threshold: 'p(95)<5000', abortOnFail: false },
      { threshold: 'p(99)<8000', abortOnFail: false },
    ],
    // SLO 2: Taxa de erro deve ser menor que 5%
    'error_rate': [
      { threshold: 'rate<0.05', abortOnFail: false },
    ],
    // SLO 3: Pelo menos 95% de taxa de sucesso nos checks
    'checks': [
      { threshold: 'rate>0.95', abortOnFail: false },
    ],
    // Métrica customizada de duração do checkout
    'checkout_duration': [
      { threshold: 'p(95)<5000', abortOnFail: false },
    ],
  },
};

// ============ DADOS DE TESTE ============
function gerarPedido() {
  const emails = [
    'cliente@email.com', 'joao@teste.com', 'maria@loja.com',
    'pedro@empresa.com', 'ana@dev.com', 'lucas@shop.com',
  ];
  const email = emails[Math.floor(Math.random() * emails.length)];
  const valor = Math.floor(Math.random() * 500) + 10; // R$10 a R$510

  return {
    clienteEmail: email,
    valor: valor,
    cartao: {
      numero: '4111111111111111',
      validade: '12/2027',
      cvv: '123',
    },
  };
}

// ============ CENÁRIO PRINCIPAL ============
export default function () {
  const payload = JSON.stringify(gerarPedido());
  const params = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  };

  const startTime = Date.now();
  const res = http.post('http://localhost:3000/api/v1/checkout', payload, params);
  const duration = Date.now() - startTime;

  checkoutDuration.add(duration);

  // Verifica se a resposta está dentro dos critérios de SLO
  const isSuccess = check(res, {
    'status é 200 (sucesso)': (r) => r.status === 200,
    'latência < 5s (SLO p95)': (r) => r.timings.duration < 5000,
    'resposta contém mensagem': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.mensagem !== undefined || body.erro !== undefined;
      } catch {
        return false;
      }
    },
  });

  // Registra métricas de erro
  if (res.status >= 500) {
    errorRate.add(1);
    failedCheckouts.add(1);
  } else {
    errorRate.add(0);
    if (res.status === 200) {
      successfulCheckouts.add(1);
    }
  }

  // Think time realista entre requisições (simula comportamento de usuário)
  sleep(Math.random() * 2 + 0.5);
}

// ============ RESUMO FINAL ============
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    [`reports/k6/load-test-${now}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  // k6 fornece o summary automaticamente no stdout
  return '';
}
