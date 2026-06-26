#!/bin/bash
# =============================================================================
# Script de configuração inicial dos proxies no Toxiproxy
# Executar após o docker-compose up para criar os proxies de rede
# =============================================================================

TOXIPROXY_API="http://localhost:8474"

echo "⏳ Aguardando Toxiproxy inicializar..."
until curl -s "$TOXIPROXY_API/version" > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Toxiproxy online!"

echo ""
echo "📡 Criando proxy: payment-gateway (porta 9001 → payment-gateway:4000)"
curl -s -X POST "$TOXIPROXY_API/proxies" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment-gateway",
    "listen": "0.0.0.0:9001",
    "upstream": "payment-gateway:4000",
    "enabled": true
  }'

echo ""
echo "📡 Criando proxy: redis-cache (porta 9002 → redis:6379)"
curl -s -X POST "$TOXIPROXY_API/proxies" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "redis-cache",
    "listen": "0.0.0.0:9002",
    "upstream": "redis:6379",
    "enabled": true
  }'

echo ""
echo "✅ Proxies configurados com sucesso!"
echo ""
echo "📋 Proxies ativos:"
curl -s "$TOXIPROXY_API/proxies" | python3 -m json.tool 2>/dev/null || curl -s "$TOXIPROXY_API/proxies"
