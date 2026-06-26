#!/bin/bash
# =============================================================================
# SCRIPT DE EXECUÇÃO COMPLETA - Fase 4: Engenharia do Caos
# =============================================================================
# Este script orquestra todo o experimento de caos para demonstração em vídeo.
# Uso: bash infra/run-chaos-experiment.sh
# =============================================================================

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "  🔥 EntregasJá - Engenharia do Caos e Testes de Desempenho"
echo "  📋 Fase 4: Black Friday Resilience Test"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# 1. Subir infraestrutura
echo "📦 [1/5] Subindo ambiente de homologação (Docker Compose)..."
docker-compose up -d --build
echo "   ✅ Serviços iniciados"
echo ""

# 2. Aguardar serviços
echo "⏳ [2/5] Aguardando serviços ficarem saudáveis..."
sleep 5

# Verificar app
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  echo "   Aguardando app..."
  sleep 2
done
echo "   ✅ App online"

# Verificar Toxiproxy
until curl -sf http://localhost:8474/version > /dev/null 2>&1; do
  echo "   Aguardando Toxiproxy..."
  sleep 2
done
echo "   ✅ Toxiproxy online"
echo ""

# 3. Configurar proxies
echo "📡 [3/5] Configurando proxies no Toxiproxy..."
bash infra/setup-toxiproxy.sh
echo ""

# 4. Teste de carga baseline (sem caos)
echo "═══════════════════════════════════════════════════════════════════════"
echo "  📊 [4/5] BASELINE: Teste de carga sem injeção de falhas"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
k6 run k6/load-test.js
echo ""
echo "   ✅ Baseline completo"
echo ""

# 5. Teste principal: Carga + Caos
echo "═══════════════════════════════════════════════════════════════════════"
echo "  🔥 [5/5] CENÁRIO PRINCIPAL: Carga massiva + Injeção de Caos"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "   Iniciando k6 (carga) e chaos-injector (falhas) em paralelo..."
echo ""

# Executa k6 em background e chaos-injector em paralelo
k6 run k6/chaos-load-test.js &
K6_PID=$!

# Espera 5s para k6 iniciar, depois injeta caos
sleep 5
node k6/chaos-injector.js

# Aguarda k6 finalizar
wait $K6_PID

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  ✅ EXPERIMENTO COMPLETO"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "  📁 Relatórios gerados em: reports/k6/"
echo "  📊 Relatório de caos: reports/k6/chaos-report.json"
echo ""
echo "  Para encerrar infraestrutura: docker-compose down"
echo ""
