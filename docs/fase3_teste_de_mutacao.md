# Fase 3: Teste de Mutação (Mutation Testing)

Este documento descreve a implementação, configuração e os resultados da Fase 3 do projeto, que teve como objetivo aplicar a técnica de **Teste de Mutação** para validar a eficácia da suíte de testes construída na fase anterior.

---

## 1. Objetivo da Fase 3

Apesar da alta cobertura de código atingida nas Fases 1 e 2 via TDD (Test-Driven Development), a métrica tradicional de *Code Coverage* apenas garante que as linhas de código foram executadas, mas não comprova se as asserções (asserts) estão de fato testando os comportamentos corretos. 

O objetivo do Teste de Mutação é inserir falhas intencionais (mutantes) no código fonte, como alterar condicionais (`>` para `<`), modificadores lógicos (`&&` para `||`) e blocos de código. Se os testes unitários continuarem passando, significa que o mutante "sobreviveu" (um falso positivo na cobertura). Se o teste falhar, o mutante foi "morto", atestando a robustez do teste.

**Meta Obrigatória:** Atingir um *Mutation Score* (Score de Mutação) mínimo de **80%**.

---

## 2. Ferramenta Utilizada e Configuração

Utilizamos o framework **StrykerJS** integrado ao Jest. 

A configuração principal foi versionada no arquivo `stryker.conf.cjs` na raiz do projeto:

```javascript
module.exports = {
  packageManager: 'npm',
  testRunner: 'jest',
  reporters: ['progress', 'clear-text', 'html'],
  mutate: ['src/services/**/*.js'],
  thresholds: {
    high: 80,
    low: 80,
    break: 80
  },
  jest: {
    projectType: 'custom',
    enableFindRelatedTests: true,
    configFile: 'jest.config.cjs'
  },
  coverageAnalysis: 'perTest'
};
```

Nesta configuração, definimos que o build irá falhar (*break threshold*) automaticamente caso o *Mutation Score* caia abaixo de 80%.

---

## 3. Escrita de Testes Focados (Mutation Specs)

Para matar os mutantes sobreviventes nas classes de resiliência e validação, foi criado um arquivo de teste dedicado: `tests/fase3.mutation.test.js`. 

Este arquivo incrementou nossa suíte original com verificações rigorosas que cobriam casos específicos gerados pelo Stryker, focando em:
* **`CheckoutValidator`:** Validação estrita de limites numéricos (valor <= 0) e ausência de campos chave e validações booleanas da presença de campos aninhados (ex: propriedades de `cartao`).
* **`RetryPolicy`:** Asserções sobre o limite exato de repetições lógicas e validações de comportamento nos limites numéricos de tentativas (boundary values).
* **`CircuitBreaker`:** Asserções de estado interno (`isOpen`, `state`, `history`), assegurando que a lógica matemática da janela deslizante não poderia ser corrompida.

---

## 4. Resultados Analíticos (Relatório Oficial)

Ao executar o comando `npm run mutation`, obtivemos os seguintes resultados:

**Score Final de Mutação:** `81.90%` (Meta de 80% Atingida ✅)

| Arquivo | % Mutation Score | Mutantes Mortos | Sobreviventes |
| :--- | :---: | :---: | :---: |
| **All files (Total)** | **81.90%** | **167** | **32** |
| `CheckoutService.js` | 100.00% | 8 | 0 |
| `CheckoutValidator.js` | 85.48% | 53 | 9 |
| `CircuitBreaker.js` | 83.72% | 72 | 11 |
| `RetryPolicy.js` | 68.75% | 17 | 10 |
| `PaymentResult.js` | 77.27% | 17 | 2 |

*Nota: Foram analisados 210 mutantes válidos. A ferramenta gerou o relatório visual completo que pode ser consultado em `reports/mutation/mutation.html`.*

---

## 5. Análise de Mutantes Sobreviventes

Como atingimos a meta global, os mutantes sobreviventes foram classificados como toleráveis. Abaixo destacamos alguns exemplos comuns de mutantes que sobreviveram:

1. **Mutantes Equivalentes ou de Performance (Retry Policy e Circuit Breaker):**
   * *Mutante:* Alteração em inicialização padrão de parâmetros vazios (`options.timeoutMs === undefined` substituindo `!==`).
   * *Mutante:* Blocos `finally {}` vazios no RetryPolicy. Tais blocos lidavam apenas com liberação de timers/memória (`clearTimeout`), logo sua remoção não falha a lógica de negócios atestada nos testes, mas impactaria vazamento de recursos não coberto por unit tests básicos.

2. **Expressões Condicionais (Checkout Validator):**
   * *Mutante:* Troca de `if (!clienteEmail || typeof clienteEmail !== 'string')` por `if (!clienteEmail && ...)`. A lógica estrita dos testes unitários barrou quase todos, mas expressões literais lógicas aninhadas permitiram alguns sobreviventes na falha curta de javascript.

3. **Expressões Regulares:**
   * O Stryker removeu as âncoras `/^` e `$/` das validações de e-mail Regex, e nossos testes não previam testar injeção de email no meio de outras strings longas sem as âncoras delimitadoras.

---

## 6. Como Executar

Para reproduzir os resultados e gerar o relatório HTML localmente, execute na raiz do projeto:

```bash
npm run mutation
```

## 7. Conclusão

A aplicação do teste de mutação elevou a confiança da refatoração da Fase 2. A métrica global de **81.90%** demonstra que nossa base de testes é robusta. A camada vital de orquestração (`CheckoutService`) obteve **100%** de Score de Mutação, o que nos dá máxima segurança de que a regra de negócio central e as lógicas de delegação não sofrerão falsos positivos na esteira de Continuous Integration (CI).
