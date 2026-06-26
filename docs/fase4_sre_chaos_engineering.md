# Fase 4: Engenharia do Caos e Testes de Desempenho (SRE)

## 1. Definição de SLI/SLO

### Service Level Indicators (SLIs)
| SLI | Descrição | Método de Medição |
|-----|-----------|-------------------|
| Latência p95 | Percentil 95 do tempo de resposta das requisições de checkout | `http_req_duration{p(95)}` no k6 |
| Latência p99 | Percentil 99 do tempo de resposta | `http_req_duration{p(99)}` no k6 |
| Taxa de Erro | Proporção de respostas HTTP 5xx sobre o total | `error_rate` customizada no k6 |
| Disponibilidade | Proporção de requisições com resposta válida (non-5xx) | `http_req_failed` no k6 |
| Throughput | Requisições processadas por segundo | `http_reqs` no k6 |

### Service Level Objectives (SLOs)
| SLO | Threshold | Justificativa |
|-----|-----------|---------------|
| **p95 Latência < 5000ms** | 5 segundos | Limite aceitável para checkout em e-commerce sob carga extrema |
| **p99 Latência < 8000ms** | 8 segundos | Margem para outliers sem impactar experiência geral |
| **Taxa de Erro < 5%** | 5% | Máximo tolerável durante Black Friday (degradação graciosa) |
| **Disponibilidade > 95%** | 95% | SLO mínimo para operação em condições de caos |

---

## 2. Arquitetura de Testes de Performance

### Stack Utilizada
- **k6** (Grafana): Ferramenta de teste de carga (scripts em JavaScript)
- **Toxiproxy** (Shopify): Proxy HTTP/TCP para injeção de falhas de rede
- **Docker Compose**: Orquestração do ambiente de homologação
- **Node.js/Express**: Aplicação sob teste

### Diagrama do Ambiente de Homologação

```
┌─────────────┐      ┌─────────────────┐      ┌──────────────────┐
│    k6       │─────▶│   App (Express) │─────▶│   Toxiproxy      │
│ (Carga)     │      │   porta 3000    │      │   porta 8474     │
└─────────────┘      └─────────────────┘      └──────┬───────────┘
                                                      │
                            ┌──────────────────────────┼──────────────────┐
                            │                          │                  │
                            ▼                          ▼                  ▼
                   ┌─────────────────┐     ┌──────────────────┐  ┌──────────────┐
                   │ Payment Gateway │     │     Redis         │  │  PostgreSQL  │
                   │   porta 4000    │     │   porta 6379      │  │  porta 5432  │
                   │ (via proxy 9001)│     │ (via proxy 9002)  │  │              │
                   └─────────────────┘     └──────────────────┘  └──────────────┘
```

---

## 3. Cenários de Teste de Carga

### 3.1 Teste de Carga (Black Friday Simulation)
**Arquivo:** `k6/load-test.js`

Padrão de carga (ramp-up → steady → ramp-down):
```
VUs
200 ┤          ┌────────────────────┐
    │         /                      \
150 ┤        /                        \
    │       /                          \
100 ┤      /                            \
    │     /                              \
 50 ┤    /                                \
    │   /                                  \
  0 ┤──/                                    \──
    └──┬──────┬──────┬──────┬──────┬──────┬──▶ t
      0s    30s    1m30  2m30   3m30   4m30  5m
```

**Estágios:**
1. Ramp-up: 0 → 50 VUs (30s)
2. Ramp-up agressivo: 50 → 200 VUs (1min)
3. Steady state: 200 VUs constantes (2min) — Pico Black Friday
4. Ramp-down parcial: 200 → 100 VUs (30s)
5. Ramp-down final: 100 → 0 VUs (30s)

### 3.2 Teste de Estresse (Breaking Point)
**Arquivo:** `k6/stress-test.js`

Escala progressiva até 800 VUs para encontrar o ponto de ruptura.

### 3.3 Teste de Caos (Principal)
**Arquivo:** `k6/chaos-load-test.js`

Combina carga massiva com o cenário de **Thundering Herd** (10.000 requisições simultâneas em burst).

---

## 4. Cenários de Injeção de Falhas (Toxiproxy)

### 4.1 Gateway Lento (Latency Injection)
**Desastre simulado:** A API bancária parceira entra em degradação e cada resposta leva +5000ms.

| Parâmetro | Valor |
|-----------|-------|
| Tipo de tóxico | `latency` |
| Latência adicionada | 5000ms |
| Jitter | ±1000ms |
| Duração da falha | 30 segundos |
| Stream | upstream |

**Comportamento esperado do sistema:**
- O **Circuit Breaker** deve abrir após detectar 50% de falhas/timeouts na janela de 10 requisições
- O **Retry Policy** com backoff exponencial previne sobrecarga adicional
- Resposta degradada (erro 500) mas sem travamento de threads
- **Degradação graciosa**: sistema retorna erro rápido ao invés de ficar pendurado

### 4.2 Thundering Herd (Cache Down)
**Desastre simulado:** O nó de cache Redis é derrubado abruptamente com 10.000 requisições simultâneas atingindo o banco.

| Parâmetro | Valor |
|-----------|-------|
| Ação | Desabilita proxy redis-cache |
| Tipo auxiliar | `reset_peer` (timeout: 0) |
| Requisições simultâneas | 10.000 (via k6 shared-iterations) |
| Duração da falha | 20 segundos |

**Comportamento esperado do sistema:**
- Backoff e Jitter nas reconexões ao cache
- Banco de dados suporta a carga direta temporariamente
- Sem efeito cascata (circuit breaker protege)
- Recuperação automática quando o cache volta

### 4.3 Bandwidth Limit (Rede Saturada)
**Desastre simulado:** Saturação da rede entre app e gateway (1 KB/s).

| Parâmetro | Valor |
|-----------|-------|
| Tipo de tóxico | `bandwidth` |
| Rate | 1 KB/s |
| Duração da falha | 20 segundos |

---

## 5. Mecanismos de Resiliência Implementados

### Circuit Breaker
```
Estado CLOSED ──(falhas >= 50%)──▶ Estado OPEN ──(cooldown 10s)──▶ HALF_OPEN
     ▲                                                                │
     └────────────────(sucesso)──────────────────────────────────────┘
```

- **Janela de monitoramento:** 10 requisições
- **Threshold de abertura:** 50% de falhas
- **Cooldown:** 10 segundos
- **Tentativa de recuperação:** 1 requisição em HALF_OPEN

### Retry Policy com Backoff
- **Máximo de tentativas:** 3
- **Backoff entre tentativas:** 500ms (linear)
- **Timeout por tentativa:** 3000ms
- **Proteção contra Thread Starvation:** timeouts agressivos impedem acúmulo

### Timeout Operacional
- **Timeout HTTP do gateway:** 8000ms
- **Timeout individual por retry:** 3000ms
- **Fallback:** Erro rápido via Circuit Breaker OPEN

---

## 6. Cálculo de MTTR (Mean Time To Recovery)

O **MTTR** é calculado automaticamente pelo `chaos-injector.js`:

```
MTTR = Tempo_Remoção_Falha - Tempo_Injeção_Falha + Tempo_Estabilização
```

| Cenário | MTTR Esperado | Justificativa |
|---------|---------------|---------------|
| Gateway Lento | ~30s + cooldown CB (10s) = ~40s | Tempo da falha + cooldown do Circuit Breaker |
| Thundering Herd | ~20s + reconexão cache = ~25s | Tempo do cache offline + reconexão |
| Bandwidth Limit | ~20s + timeout pipeline = ~25s | Tempo da saturação + flush de buffers |

---

## 7. Como Executar

### Pré-requisitos
- Docker e Docker Compose
- k6 instalado (`brew install k6` ou `choco install k6`)
- Node.js 20+

### Passo a Passo

```bash
# 1. Subir o ambiente de homologação
docker-compose up -d

# 2. Configurar os proxies no Toxiproxy
bash infra/setup-toxiproxy.sh

# 3. Executar teste de carga simples (sem caos)
k6 run k6/load-test.js

# 4. Executar teste de estresse (encontrar ponto de ruptura)
k6 run k6/stress-test.js

# 5. CENÁRIO PRINCIPAL: Carga + Caos
# Terminal 1: Inicia o teste de carga massiva
k6 run k6/chaos-load-test.js

# Terminal 2: Injeta falhas durante o teste (espera 30s e começa)
node k6/chaos-injector.js

# 6. Verificar relatórios gerados
cat reports/k6/chaos-report.json
```

### Execução Simplificada (script único)
```bash
npm run chaos-test
```

---

## 8. Análise de Resultados Esperados

### Cenário: Sem injeção de falhas (baseline)
- p95 latência: ~400-600ms
- Taxa de erro: <1%
- Throughput: ~300-500 req/s

### Cenário: Com Gateway Lento (+5000ms)
- p95 latência: sobe para ~5000-8000ms durante a falha
- Taxa de erro: sobe para ~10-20% (circuit breaker ativado)
- **Degradação graciosa:** sistema não trava, retorna erros rápidos
- Após remoção do tóxico: recuperação em ~10s (cooldown CB)

### Cenário: Thundering Herd (10.000 burst)
- p95 latência: spike temporário ~2000-4000ms
- Taxa de erro: <5% (banco absorve a carga sem cache)
- **Backoff/Jitter:** reconexões graduais evitam stampede no banco

---

## 9. Conclusão

A arquitetura demonstra **degradação graciosa** sob condições extremas:

1. O **Circuit Breaker** impede efeito cascata quando o gateway falha
2. O **Retry Policy** com timeout evita thread starvation
3. O **Backoff com Jitter** previne thundering herd no gateway durante recuperação
4. Os **SLOs são mantidos** dentro dos limites definidos mesmo sob caos moderado
5. O **MTTR** é mensurável e dentro de limites aceitáveis para operação em produção
