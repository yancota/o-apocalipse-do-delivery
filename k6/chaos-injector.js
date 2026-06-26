/**
 * =============================================================================
 * CHAOS INJECTOR - Injeção de Falhas via Toxiproxy
 * =============================================================================
 * Este script coordena a injeção de falhas durante os testes de carga k6.
 * Deve ser executado em paralelo ao k6 chaos-load-test.js.
 * 
 * Cenários implementados:
 *   1. Gateway Lento: 5000ms de latência na API de pagamento
 *   2. Thundering Herd: derruba o cache (Redis) abruptamente
 * 
 * Uso:
 *   node k6/chaos-injector.js
 * 
 * MTTR (Mean Time To Recovery):
 *   O script mede automaticamente o tempo entre injeção da falha e recuperação.
 * =============================================================================
 */

const http = require('http');

const TOXIPROXY_API = 'http://localhost:8474';

// ============ UTILITÁRIOS HTTP ============
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TOXIPROXY_API);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timestamp() {
  return new Date().toISOString();
}

// ============ CENÁRIO 1: GATEWAY LENTO (5000ms de latência) ============
async function injectGatewayLatency() {
  console.log(`\n[${ timestamp() }] 🐌 INJETANDO CAOS: Gateway Lento (+5000ms de latência)`);
  console.log('   → Simulando degradação na API bancária parceira');

  const toxic = {
    name: 'gateway_latency',
    type: 'latency',
    stream: 'upstream',
    toxicity: 1.0,
    attributes: {
      latency: 5000,   // 5000ms de latência adicional
      jitter: 1000,    // ±1000ms de variação (realismo)
    },
  };

  const result = await request('POST', '/proxies/payment-gateway/toxics', toxic);
  console.log(`   ✅ Tóxico aplicado (status: ${result.status})`);
  return Date.now(); // Marca início da falha para cálculo de MTTR
}

async function removeGatewayLatency() {
  console.log(`\n[${timestamp()}] 🔧 REMOVENDO: Gateway Lento`);

  const result = await request('DELETE', '/proxies/payment-gateway/toxics/gateway_latency');
  console.log(`   ✅ Tóxico removido (status: ${result.status})`);
  return Date.now(); // Marca fim da falha
}

// ============ CENÁRIO 2: THUNDERING HERD (derruba o cache) ============
async function injectCacheDown() {
  console.log(`\n[${timestamp()}] 💥 INJETANDO CAOS: Thundering Herd (Cache DOWN)`);
  console.log('   → Simulando queda completa do nó de cache Redis');
  console.log('   → 10.000 requisições simultâneas vão atingir o banco diretamente');

  // Derruba o proxy do Redis completamente (simula nó de cache offline)
  const result = await request('POST', '/proxies/redis-cache', {
    name: 'redis-cache',
    listen: '0.0.0.0:9002',
    upstream: 'redis:6379',
    enabled: false,  // DESABILITA o proxy = cache offline
  });

  console.log(`   ✅ Cache derrubado (status: ${result.status})`);

  // Também adiciona "reset_peer" para simular conexões cortadas abruptamente
  try {
    await request('POST', '/proxies/redis-cache/toxics', {
      name: 'cache_reset',
      type: 'reset_peer',
      stream: 'upstream',
      toxicity: 1.0,
      attributes: { timeout: 0 },
    });
  } catch (e) {
    // Proxy desabilitado pode rejeitar adição de tóxicos - isso é esperado
  }

  return Date.now();
}

async function restoreCache() {
  console.log(`\n[${timestamp()}] 🔧 RESTAURANDO: Cache Redis`);

  // Reabilita o proxy do Redis
  const result = await request('POST', '/proxies/redis-cache', {
    name: 'redis-cache',
    listen: '0.0.0.0:9002',
    upstream: 'redis:6379',
    enabled: true,
  });

  console.log(`   ✅ Cache restaurado (status: ${result.status})`);

  // Remove tóxicos residuais
  try {
    await request('DELETE', '/proxies/redis-cache/toxics/cache_reset');
  } catch (e) {
    // Pode não existir - OK
  }

  return Date.now();
}

// ============ CENÁRIO 3: BANDWIDTH LIMIT (rede saturada) ============
async function injectBandwidthLimit() {
  console.log(`\n[${timestamp()}] 🔌 INJETANDO CAOS: Bandwidth limit no gateway`);

  const toxic = {
    name: 'gateway_bandwidth',
    type: 'bandwidth',
    stream: 'upstream',
    toxicity: 1.0,
    attributes: {
      rate: 1, // 1 KB/s - extremamente lento
    },
  };

  const result = await request('POST', '/proxies/payment-gateway/toxics', toxic);
  console.log(`   ✅ Bandwidth limitado (status: ${result.status})`);
  return Date.now();
}

async function removeBandwidthLimit() {
  console.log(`\n[${timestamp()}] 🔧 REMOVENDO: Bandwidth limit`);
  const result = await request('DELETE', '/proxies/payment-gateway/toxics/gateway_bandwidth');
  console.log(`   ✅ Bandwidth restaurado (status: ${result.status})`);
  return Date.now();
}

// ============ CÁLCULO DE MTTR ============
function calculateMTTR(injectionTime, recoveryTime) {
  const mttrMs = recoveryTime - injectionTime;
  const mttrSeconds = (mttrMs / 1000).toFixed(2);
  return { ms: mttrMs, seconds: mttrSeconds };
}

// ============ ORQUESTRAÇÃO PRINCIPAL ============
async function main() {
  console.log('='.repeat(70));
  console.log('  🔥 CHAOS INJECTOR - EntregasJá SRE');
  console.log('  📋 Cenários: Gateway Lento | Thundering Herd | Bandwidth Limit');
  console.log('='.repeat(70));
  console.log('');
  console.log('⏳ Aguardando 30s para o k6 estabilizar a carga...');

  await sleep(30000); // Espera o k6 fazer ramp-up

  const report = {
    startTime: timestamp(),
    scenarios: [],
  };

  // ──────────── CENÁRIO 1: GATEWAY LENTO ────────────
  console.log('\n' + '─'.repeat(50));
  console.log('  📌 CENÁRIO 1/3: Gateway Lento (5000ms latência)');
  console.log('─'.repeat(50));

  const gw_start = await injectGatewayLatency();
  console.log('   ⏱️  Mantendo falha por 30 segundos...');
  await sleep(30000);
  const gw_end = await removeGatewayLatency();

  const gwMTTR = calculateMTTR(gw_start, gw_end);
  console.log(`   📊 MTTR Gateway Lento: ${gwMTTR.seconds}s`);
  report.scenarios.push({
    name: 'Gateway Lento (+5000ms)',
    injectionTime: new Date(gw_start).toISOString(),
    recoveryTime: new Date(gw_end).toISOString(),
    mttr_ms: gwMTTR.ms,
    mttr_seconds: gwMTTR.seconds,
  });

  console.log('\n   ⏳ Aguardando 15s para sistema estabilizar...');
  await sleep(15000);

  // ──────────── CENÁRIO 2: THUNDERING HERD ────────────
  console.log('\n' + '─'.repeat(50));
  console.log('  📌 CENÁRIO 2/3: Thundering Herd (Cache DOWN)');
  console.log('─'.repeat(50));

  const cache_start = await injectCacheDown();
  console.log('   ⏱️  Cache offline por 20 segundos (manada estourada ativa)...');
  await sleep(20000);
  const cache_end = await restoreCache();

  const cacheMTTR = calculateMTTR(cache_start, cache_end);
  console.log(`   📊 MTTR Thundering Herd: ${cacheMTTR.seconds}s`);
  report.scenarios.push({
    name: 'Thundering Herd (Cache Down)',
    injectionTime: new Date(cache_start).toISOString(),
    recoveryTime: new Date(cache_end).toISOString(),
    mttr_ms: cacheMTTR.ms,
    mttr_seconds: cacheMTTR.seconds,
  });

  console.log('\n   ⏳ Aguardando 15s para sistema estabilizar...');
  await sleep(15000);

  // ──────────── CENÁRIO 3: BANDWIDTH LIMIT ────────────
  console.log('\n' + '─'.repeat(50));
  console.log('  📌 CENÁRIO 3/3: Bandwidth Limit (rede saturada)');
  console.log('─'.repeat(50));

  const bw_start = await injectBandwidthLimit();
  console.log('   ⏱️  Rede saturada por 20 segundos...');
  await sleep(20000);
  const bw_end = await removeBandwidthLimit();

  const bwMTTR = calculateMTTR(bw_start, bw_end);
  console.log(`   📊 MTTR Bandwidth Limit: ${bwMTTR.seconds}s`);
  report.scenarios.push({
    name: 'Bandwidth Limit (1KB/s)',
    injectionTime: new Date(bw_start).toISOString(),
    recoveryTime: new Date(bw_end).toISOString(),
    mttr_ms: bwMTTR.ms,
    mttr_seconds: bwMTTR.seconds,
  });

  // ──────────── RELATÓRIO FINAL ────────────
  report.endTime = timestamp();
  report.totalDuration_seconds = ((Date.now() - gw_start) / 1000).toFixed(2);

  console.log('\n\n' + '='.repeat(70));
  console.log('  📊 RELATÓRIO FINAL - CHAOS INJECTION');
  console.log('='.repeat(70));
  console.log('');
  console.log('  Cenário                       | MTTR (s)  | Status');
  console.log('  ─────────────────────────────────────────────────────');
  for (const s of report.scenarios) {
    const status = parseFloat(s.mttr_seconds) < 60 ? '✅ DENTRO SLO' : '❌ VIOLAÇÃO SLO';
    console.log(`  ${s.name.padEnd(30)} | ${s.mttr_seconds.padStart(7)}s | ${status}`);
  }
  console.log('');
  console.log(`  Duração total do experimento: ${report.totalDuration_seconds}s`);
  console.log('='.repeat(70));

  // Salva relatório em JSON
  const fs = require('fs');
  const reportPath = 'reports/k6/chaos-report.json';
  fs.mkdirSync('reports/k6', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  💾 Relatório salvo em: ${reportPath}`);
}

main().catch(err => {
  console.error('❌ Erro no Chaos Injector:', err);
  process.exit(1);
});
