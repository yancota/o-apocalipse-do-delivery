const express = require('express');
const app = express();

app.use(express.json());

// Simula a API do gateway bancário parceiro com latência realista
app.post('/api/cobrar', (req, res) => {
  const { valor } = req.body;

  // Simula processamento de 100-400ms (latência realista de API bancária)
  const latencia = Math.floor(Math.random() * 300) + 100;

  setTimeout(() => {
    // 95% de aprovação em condições normais
    if (Math.random() < 0.95) {
      return res.json({ status: 'APROVADO', transacaoId: `TXN-${Date.now()}` });
    }
    // 5% de recusa (cartão sem limite, etc.)
    return res.json({ status: 'RECUSADO', motivo: 'Saldo insuficiente' });
  }, latencia);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'UP' }));

const PORT = 4000;
app.listen(PORT, () => console.log(`💳 Gateway de Pagamento Mock rodando na porta ${PORT}`));
