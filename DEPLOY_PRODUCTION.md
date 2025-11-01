# 🚀 Guía de Despliegue en Producción (EC2)

## 📋 Resumen de Cambios
Esta guía documenta los cambios realizados para corregir Swagger y CORS en producción.

### Problemas Resueltos:
- ✅ Swagger mostraba `localhost:2727` en lugar del dominio público
- ✅ "Try it out" no funcionaba en producción
- ✅ Token JWT se perdía al recargar la página
- ✅ CORS solo aceptaba un origen

---

## 🔧 Cambios Realizados en el Código

### 1. **src/main.ts** - Configuración de Swagger
- Agregado `document.servers = [{ url: '/api/v1' }]` para usar rutas relativas
- Agregado `persistAuthorization: true` para mantener el token JWT

### 2. **src/main.ts** - Configuración de CORS
- Cambiado de origen único a múltiples orígenes permitidos:
  - `https://sukadex.net`
  - `https://www.sukadex.net`
  - `https://api.sukadex.net`
  - `http://localhost:5173` (desarrollo frontend)
  - `http://localhost:2769` (desarrollo alternativo)

### 3. **nginx-sukaback.conf** - Configuración de Nginx
- Creado archivo de configuración de Nginx para el servidor EC2
- Incluye manejo de preflight CORS (OPTIONS)
- Pasa correctamente el header `Authorization`

---

## 🖥️ Despliegue en Servidor EC2

### **Paso 1: Conectar al servidor**
```bash
ssh -i "tu-clave.pem" ubuntu@tu-ip-ec2
# o si ya tienes configurado el host:
ssh sukaback-server
```

### **Paso 2: Navegar al directorio del proyecto**
```bash
cd /home/ubuntu/SukaBack
# o la ruta donde tengas el proyecto
```

### **Paso 3: Actualizar el código desde GitHub**
```bash
git pull origin main
```

### **Paso 4: Instalar dependencias**
```bash
pnpm install --frozen-lockfile
```

### **Paso 5: Compilar el proyecto**
```bash
pnpm run build
```

### **Paso 6: Reiniciar PM2**
```bash
# Ver el estado actual
pm2 status

# Reiniciar la aplicación
pm2 restart sukaback

# Ver los logs en tiempo real
pm2 logs sukaback --lines 50
```

### **Paso 7: Configurar Nginx**

#### Opción A: Copiar el archivo de configuración
```bash
sudo cp nginx-sukaback.conf /etc/nginx/conf.d/sukaback.conf
```

#### Opción B: Crear manualmente
```bash
sudo nano /etc/nginx/conf.d/sukaback.conf
```

Luego pega el contenido del archivo `nginx-sukaback.conf` de este repositorio.

**⚠️ IMPORTANTE:** Ajusta las rutas de los certificados SSL según tu configuración:
```nginx
ssl_certificate /etc/letsencrypt/live/api.sukadex.net/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.sukadex.net/privkey.pem;
```

### **Paso 8: Validar y recargar Nginx**
```bash
# Verificar que la configuración sea válida
sudo nginx -t

# Si todo está OK, recargar Nginx
sudo systemctl reload nginx

# O reiniciar Nginx si es necesario
sudo systemctl restart nginx
```

### **Paso 9: Verificar el despliegue**

#### Verificar el backend
```bash
# Health check
curl -I https://api.sukadex.net/health

# API base
curl -I https://api.sukadex.net/api/v1/auth/login

# Swagger
curl -I https://api.sukadex.net/docs
```

#### Verificar en el navegador
1. Abrir: `https://api.sukadex.net/docs`
2. Verificar que el campo "Servers" muestre: `/api/v1`
3. Probar "Try it out" en cualquier endpoint
4. Verificar que no haya errores de CORS en la consola del navegador

---

## 🔍 Verificación de Logs

### Ver logs de PM2
```bash
pm2 logs sukaback --lines 100
```

### Ver logs de Nginx
```bash
# Logs de acceso
sudo tail -f /var/log/nginx/sukaback-access.log

# Logs de errores
sudo tail -f /var/log/nginx/sukaback-error.log
```

---

## 🐛 Troubleshooting

### Problema: Swagger sigue mostrando localhost
**Solución:**
```bash
# Limpiar caché del navegador
# O abrir en modo incógnito

# Verificar que el código se haya actualizado
pm2 logs sukaback | grep "Swagger"
```

### Problema: Error de CORS
**Solución:**
```bash
# Verificar que Nginx esté pasando los headers correctamente
curl -I -X OPTIONS https://api.sukadex.net/api/v1/auth/login \
  -H "Origin: https://sukadex.net" \
  -H "Access-Control-Request-Method: POST"
```

### Problema: Token JWT no se mantiene
**Solución:**
- Verificar que `persistAuthorization: true` esté en el código
- Limpiar localStorage del navegador
- Volver a hacer login en Swagger

### Problema: 502 Bad Gateway
**Solución:**
```bash
# Verificar que PM2 esté corriendo
pm2 status

# Verificar que el puerto 2727 esté escuchando
sudo netstat -tulpn | grep 2727

# Reiniciar PM2 si es necesario
pm2 restart sukaback
```

---

## 📊 Comandos Útiles de PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs sukaback

# Reiniciar
pm2 restart sukaback

# Recargar sin downtime
pm2 reload sukaback

# Ver monitoreo en tiempo real
pm2 monit

# Guardar configuración actual
pm2 save

# Ver información detallada
pm2 info sukaback
```

---

## ✅ Checklist de Verificación

- [ ] Código actualizado desde GitHub
- [ ] Dependencias instaladas
- [ ] Proyecto compilado (`pnpm run build`)
- [ ] PM2 reiniciado y corriendo
- [ ] Nginx configurado correctamente
- [ ] Nginx validado (`nginx -t`)
- [ ] Nginx recargado
- [ ] Swagger carga en `https://api.sukadex.net/docs`
- [ ] Swagger muestra `/api/v1` como servidor base
- [ ] "Try it out" funciona correctamente
- [ ] No hay errores de CORS en la consola
- [ ] Token JWT se mantiene tras recargar

---

## 🎯 Resultado Esperado

1. ✅ **Swagger UI**: Se ve correctamente en `https://api.sukadex.net/docs`
2. ✅ **Servidor Base**: Muestra `/api/v1` en lugar de `localhost:2727`
3. ✅ **Try it out**: Funciona correctamente contra el dominio público
4. ✅ **Autenticación**: Token JWT se mantiene después de recargar
5. ✅ **CORS**: Sin errores en la consola del navegador
6. ✅ **Producción**: Todo funciona igual que en desarrollo

---

## 📞 Soporte

Si encuentras problemas, revisa:
1. Logs de PM2: `pm2 logs sukaback`
2. Logs de Nginx: `sudo tail -f /var/log/nginx/sukaback-error.log`
3. Estado del servidor: `pm2 status` y `sudo systemctl status nginx`
