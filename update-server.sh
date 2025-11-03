#!/bin/bash

# Script de actualización rápida para servidor EC2
# Uso: bash update-server.sh

set -e  # Salir si hay errores

echo "🚀 Actualizando SukaBack en producción..."
echo ""

# 1. Navegar al directorio del proyecto
cd /var/www/SukaBack || exit 1
echo "✅ En directorio: $(pwd)"
echo ""

# 2. Actualizar código desde GitHub
echo "📥 Descargando cambios desde GitHub..."
git pull origin main
echo ""

# 3. Limpiar dependencias antiguas
echo "🧹 Limpiando node_modules antiguo..."
rm -rf node_modules
rm -rf package-lock.json
echo ""

# 4. Instalar dependencias con npm
echo "📦 Instalando dependencias con npm..."
npm install
echo ""

# 5. Compilar el proyecto
echo "🔨 Compilando proyecto..."
npm run build
echo ""

# 6. Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart sukaback
echo ""

# 7. Esperar 3 segundos
echo "⏳ Esperando 3 segundos..."
sleep 3
echo ""

# 8. Mostrar logs
echo "📋 Logs recientes:"
pm2 logs sukaback --lines 20 --nostream
echo ""

# 9. Verificar estado
echo "📊 Estado de PM2:"
pm2 status
echo ""

# 10. Probar endpoint local
echo "🧪 Probando endpoint local..."
curl -s http://127.0.0.1:2727/api/v1/health || echo "❌ Error en health check local"
echo ""
echo ""

echo "✅ ¡Actualización completada!"
echo "🌐 Verifica en: https://api.sukadex.net/docs"
