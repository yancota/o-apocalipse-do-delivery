# O Apocalipse do Delivery

## Integrantes
* Lucas Azevedo
* Raphael Sena
* Mateus Faissal
* Yan Cota

---

## 📄 Relatório Técnico (Fases 1 e 2)
A análise estrutural do código legado, o cálculo da **Complexidade Ciclomática ($V(G) = 3$)**, as estimativas formais de esforço de teste (170 h/h) e as justificativas detalhadas das refatorações arquiteturais estão disponíveis em [docs/relatorio_fases_1_e_2.md](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/docs/relatorio_fases_1_e_2.md).

---

## 🚀 Sobre o Projeto
Este microsserviço de **Processamento de Pedidos e Checkout** foi redesenhado para suportar alta carga (como em cenários de Black Friday) e mitigar falhas em cascata no ecossistema da *EntregasJá S.A.*

A arquitetura atual foi implementada utilizando **TDD (Test-First)** e **BDD** com padrões de design resilientes para blindar o sistema contra instabilidades de APIs de terceiros.

---

## 🛠️ Arquitetura e Padrões Aplicados

* **Validação Rígida de Contrato:** Realizada por [CheckoutValidator.js](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/src/services/validation/CheckoutValidator.js) (RF01) antes de qualquer chamada externa ou de banco.
* **Resiliência de Rede:** 
  * **Timeout Operacional:** Limite estrito de 2 segundos para chamadas ao gateway implementado em [RetryPolicy.js](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/src/services/resilience/RetryPolicy.js).
  * **Retry Policy:** Mecanismo de até 3 retentativas automáticas adicionais com intervalo de backoff fixo de 500ms.
  * **Circuit Breaker:** Estado gerido por [CircuitBreaker.js](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/src/services/resilience/CircuitBreaker.js) que abre após 50% de taxa de falhas nos últimos 10 pedidos, falhando rapidamente (Fast Fail) e protegendo a infraestrutura.
* **Polimorfismo em Resultados de Pagamento:** Substituição de condicionais complexas (`if/else`) pela hierarquia polimórfica [PaymentResult.js](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/src/services/payment/PaymentResult.js) (`ApprovedPaymentResult`, `DeclinedPaymentResult`, `ErrorPaymentResult`).
* **Testes Sem Acoplamento (Obscure Setup Smell):** Utilização do padrão Data Builder em [PedidoBuilder.js](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/tests/builders/PedidoBuilder.js) para inicialização modularizada de objetos de teste.

---

## 📦 Como Instalar as Dependências
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado na versão 18 ou superior.

No diretório raiz do projeto, instale as dependências:
```bash
npm install
```

---

## 🏃 Como Executar a Aplicação

### 1. Iniciar o Servidor Express
Inicie a API localmente:
```bash
node src/server.js
```
O servidor estará rodando na porta `3000`. O endpoint de checkout estará exposto em `POST http://localhost:3000/api/v1/checkout`.

### 2. Rodar a Suíte de Testes (TDD & BDD)
Execute a suíte de testes unitários baseados nas especificações descritas no arquivo de funcionalidade [checkout.feature](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/tests/features/checkout.feature):
```bash
npm test
```

---

## 🔥 Fase 4: Engenharia do Caos e Testes de Desempenho (SRE)

A resiliência do microsserviço é validada sob estresse de rede controlado com injeção de falhas.

### Pré-requisitos
- Docker e Docker Compose instalados
- [k6](https://k6.io/docs/getting-started/installation/) instalado
- Node.js 20+

### SLI/SLO Definidos
| SLO | Threshold |
|-----|-----------|
| p95 Latência | < 5000ms |
| p99 Latência | < 8000ms |
| Taxa de Erro | < 5% |
| Disponibilidade | > 95% |

### Como Executar

```bash
# 1. Subir ambiente de homologação com Toxiproxy
docker-compose up -d --build

# 2. Configurar proxies no Toxiproxy
bash infra/setup-toxiproxy.sh

# 3. Teste de carga baseline (sem caos)
k6 run k6/load-test.js

# 4. Teste de estresse (encontrar ponto de ruptura)
k6 run k6/stress-test.js

# 5. CENÁRIO PRINCIPAL: Carga + Caos (2 terminais)
# Terminal 1:
k6 run k6/chaos-load-test.js
# Terminal 2:
node k6/chaos-injector.js

# OU executar tudo automatizado:
bash infra/run-chaos-experiment.sh

# 6. Encerrar infraestrutura
docker-compose down
```

### Cenários de Caos Implementados
1. **Gateway Lento:** +5000ms de latência na API bancária (Toxiproxy `latency` toxic)
2. **Thundering Herd:** Derruba cache Redis + 10.000 requisições simultâneas em burst
3. **Bandwidth Limit:** Rede saturada a 1KB/s entre app e gateway

### Mecanismos de Resiliência Validados
- **Circuit Breaker:** Abre após 50% de falhas, protege contra efeito cascata
- **Retry Policy + Timeout:** Backoff de 500ms, timeout de 3s/tentativa
- **Degradação Graciosa:** Sistema retorna erro rápido ao invés de travar

### Relatórios
- Relatório de caos: `reports/k6/chaos-report.json`
- Documentação completa: [`docs/fase4_sre_chaos_engineering.md`](docs/fase4_sre_chaos_engineering.md)

---

## 🧪 Fase 3 - Teste de Mutação

A validação por cobertura foi complementada com teste de mutação usando [StrykerJS](https://stryker-mutator.io/). O objetivo desta fase é confirmar que os testes não apenas executam as linhas do código, mas também falham quando operadores condicionais, fluxos de controle e comandos relevantes são alterados artificialmente.

### Como Executar

Para rodar a análise de mutação no projeto:
```bash
npm run mutation
```

### Meta Obrigatória

O projeto deve manter um **Mutation Score mínimo de 80%**. Caso a pontuação fique abaixo disso, a suíte de testes unitários e de integração deve ser enriquecida até eliminar os mutantes sobreviventes.