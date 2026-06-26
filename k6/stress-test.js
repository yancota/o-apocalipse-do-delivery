/**
 * =============================================================================
 * TESTE DE ESTRESSE - Limites do Sistema
 * =============================================================================
 * Teste progressivo para encontrar o ponto de ruptura da aplicação.
 * Escala além da capacidade esperada para identificar degradação.
 * =============================================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const checkoutDuration = new Trend('checkout_duration', true);

export const options = {
  stages: [
    { duration: '20s', target: 100 },    // Aquecimento
    { duration: '30s', target: 300 },    // Carga alta
    { duration: '30s', target: 500 },    // Carga muito alta (estresse)
    { duration: '20s', target: 800 },    // Acima da capacidade (ruptura)
    { duration: '30s', target: 800 },    // Mantém no limite
    { duration: '20s', target: 0 },      // Recuperação
  ],

  thresholds: {
    'http_req_duration': [
      { threshold: 'p(95)<5000', abortOnFail: false },
    ],
    'error_rate': [
      { threshold: 'rate<0.05', abortOnFail: false },
    ],
  },
};

function gerarPedido() {
  return {
    clienteEmail: `stress-${__VU}-${__ITER}@teste.com`,
    valor: Math.floor(Math.random() * 1000) + 1,
    cartao: {
      numero: '4111111111111111',
      validade: '12/2027',
      cvv: '123',
    },
  };
}

export default function () {
  const payload = JSON.stringify(gerarPedido());
  const params = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '15s',
  };

  const res = http.post('http://localhost:3000/api/v1/checkout', payload, params);

  checkoutDuration.add(res.timings.duration);

  check(res, {
    'status não é 5xx': (r) => r.status < 500,
    'resposta recebida': (r) => r.body !== '',
  });

  errorRate.add(res.status >= 500 ? 1 : 0);

  sleep(Math.random() * 0.5);
}
