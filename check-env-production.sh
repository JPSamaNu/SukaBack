#!/bin/bash
# Script para verificar la configuración de CORS en producción

echo "🔍 Verificando configuración de CORS..."
echo ""
echo "📄 Contenido de CORS_ORIGIN:"
grep "CORS_ORIGIN" /var/www/SukaBack/.env || echo "❌ Variable CORS_ORIGIN no encontrada"
echo ""
echo "📊 Últimos errores de CORS en los logs:"
pm2 logs sukaback --lines 100 --nostream | grep -i "cors" | tail -20
echo ""
echo "💡 Si ves errores, verifica que el dominio de tu frontend esté en CORS_ORIGIN"
