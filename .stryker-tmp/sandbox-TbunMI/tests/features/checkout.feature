Funcionalidade: Processamento de Checkout e Liquidação de Pedidos
  Como o microsserviço de checkout do EntregasJá
  Quero processar os pagamentos de pedidos com resiliência, validação e tratamento de falhas
  Para garantir estabilidade em cenários de alta concorrência e evitar falhas em cascata

  Contexto:
    Dado que o microsserviço de checkout está inicializado

  Cenário: Processamento de Pagamento Autorizado (Caminho Feliz)
    Dado que o cliente envia um pedido válido de valor 150.00
    E o gateway de pagamento está respondendo normalmente com "APROVADO"
    Quando o checkout é processado
    Então o status do pedido deve ser alterado para "PROCESSADO"
    E o pedido deve ser persistido no repositório
    E um e-mail de confirmação deve ser disparado de forma assíncrona para o cliente

  Cenário: Tratamento de Pagamento Recusado (Falha de Negócio)
    Dado que o cliente envia um pedido válido de valor 80.00
    E o gateway de pagamento recusa a transação com "RECUSADO"
    Quando o checkout é processado
    Então o status do pedido deve ser alterado para "FALHOU"
    E o pedido deve ser persistido no repositório
    E nenhum e-mail de confirmação deve ser enviado para o cliente

  Cenário: Resiliência com Retentativa Bem-sucedida (Falha Temporária)
    Dado que o cliente envia um pedido válido de valor 120.00
    E o gateway de pagamento falha na primeira tentativa com erro de infraestrutura
    E o gateway de pagamento responde com "APROVADO" na segunda tentativa
    Quando o checkout é processado
    Então o status do pedido deve ser alterado para "PROCESSADO"
    E o pedido deve ser persistido no repositório
    E um e-mail de confirmação deve ser disparado de forma assíncrona para o cliente
    E o gateway de pagamento deve ter sido chamado exatamente 2 vezes

  Cenário: Falha de Infraestrutura Persistente com Retentativas Esgotadas (Fallback)
    Dado que o cliente envia um pedido válido de valor 200.00
    E o gateway de pagamento apresenta falhas de timeout persistentes
    Quando o checkout é processado
    Então o status do pedido deve ser alterado para "ERRO_GATEWAY"
    E o pedido deve ser persistido no repositório
    E nenhum e-mail de confirmação deve ser enviado para o cliente
    E o gateway de pagamento deve ter sido tentado por até 4 vezes no total (inicial + 3 retentativas)

  Cenário: Validação de Entrada de Dados - Payload Incompleto
    Dado que o cliente envia um pedido inválido sem e-mail
    Quando o checkout é processado
    Então a validação deve lançar um erro de payload inválido
    E nenhuma chamada ao repositório ou ao gateway de pagamento deve ser feita

  Cenário: Circuit Breaker Aberto devido a Alta Taxa de Falhas
    Dado que a taxa de falha do gateway de pagamento nos últimos pedidos foi de 100%
    E o Circuit Breaker está no estado "ABERTO"
    Quando o cliente envia um pedido válido
    Então o checkout deve falhar imediatamente sem chamar o gateway de pagamento
    E o status do pedido deve ser alterado para "ERRO_GATEWAY"
    E o pedido deve ser persistido no repositório com o status de erro
