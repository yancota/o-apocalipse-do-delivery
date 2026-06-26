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

## 🏁 Próximos Passos (Fase 4 - Caos & SRE)

A próxima etapa consiste em testar a resiliência do microsserviço sob estresse de rede controlado:
1. **Configurar o Toxiproxy:** Crie um proxy intermediando as chamadas do microsserviço ao Gateway de Pagamento.
2. **Injetar Latência:** Force uma latência de rede de `5000ms` usando o Toxiproxy no gateway de pagamentos falso/real.
3. **Executar Testes de Carga com k6:** Dispare requisições concorrentes em lote para o endpoint exposto no servidor [server.js](file:///c:/Git/%20Puc/o-apocalipse-do-delivery/src/server.js) em `POST /api/v1/checkout`.
4. **Verificar SLOs:** O microsserviço deverá ativar o fallback rapidamente (retornando HTTP 500 amigável com status `ERRO_GATEWAY`) e proteger o servidor Express contra o esgotamento do pool de threads, mantendo a taxa de sucesso global de requisições acima de 95% e percentil 95 de latência dentro do estipulado.