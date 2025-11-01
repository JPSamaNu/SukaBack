# 🔍 Diagnóstico de Problemas en Producción

## ❌ Problemas Reportados
1. No se puede acceder a `https://api.sukadex.net/api/v1/health`
2. `/docs` muestra errores incluso en el login

---

## 🔧 Comandos de Diagnóstico

### 1. Verificar que PM2 esté corriendo
```bash
pm2 status
pm2 logs sukaback --lines 50
```

### 2. Verificar que el puerto 2727 esté escuchando
```bash
sudo netstat -tulpn | grep 2727
# o
sudo ss -tulpn | grep 2727
```

### 3. Probar el backend localmente (dentro del servidor)
```bash
curl -I http://127.0.0.1:2727/api/v1/health
curl http://127.0.0.1:2727/api/v1/health
```

### 4. Verificar logs de Nginx
```bash
sudo tail -f /var/log/nginx/sukaback-error.log
sudo tail -f /var/log/nginx/error.log
```

### 5. Verificar configuración de Nginx
```bash
sudo nginx -t
sudo cat /etc/nginx/conf.d/sukaback.conf
```

### 6. Verificar que Nginx esté corriendo
```bash
sudo systemctl status nginx
```

---

## 🛠️ Soluciones Comunes

### Problema 1: Nginx no arranca o tiene errores de configuración

**Síntoma:** Error al hacer `sudo nginx -t`

**Solución:**
```bash
# Corregir el warning de http2
# Editar el archivo
sudo nano /etc/nginx/conf.d/sukaback.conf

# Cambiar:
#   listen 443 ssl http2;
# Por:
#   listen 443 ssl;
#   http2 on;

# Validar y recargar
sudo nginx -t
sudo systemctl reload nginx
```

---

### Problema 2: PM2 no está corriendo

**Síntoma:** `pm2 status` muestra "stopped" o "errored"

**Solución:**
```bash
cd /var/www/SukaBack
pm2 restart sukaback
pm2 logs sukaback
```

---

### Problema 3: Puerto 2727 no está escuchando

**Síntoma:** `netstat` no muestra el puerto 2727

**Solución:**
```bash
cd /var/www/SukaBack
pm2 delete sukaback
pm2 start dist/main.js --name sukaback
pm2 save
```

---

### Problema 4: Nginx no puede conectar al backend

**Síntoma:** Error 502 Bad Gateway

**Solución:**
```bash
# Verificar que PM2 esté corriendo
pm2 status

# Verificar que el puerto sea correcto en Nginx
sudo cat /etc/nginx/conf.d/sukaback.conf | grep proxy_pass
# Debe mostrar: proxy_pass http://127.0.0.1:2727;

# Verificar SELinux (si está habilitado)
sudo setsebool -P httpd_can_network_connect 1
```

---

### Problema 5: Certificados SSL incorrectos o no existen

**Síntoma:** Error SSL o Nginx no arranca

**Solución:**
```bash
# Verificar que los certificados existan
ls -la /etc/letsencrypt/live/api.sukadex.net/

# Si no existen, generar con certbot
sudo certbot --nginx -d api.sukadex.net
```

---

## 📋 Checklist de Verificación

Ejecuta estos comandos en el servidor y anota los resultados:

- [ ] **PM2 Status**
  ```bash
  pm2 status
  ```
  ¿Muestra "online"? ___

- [ ] **Puerto 2727**
  ```bash
  sudo netstat -tulpn | grep 2727
  ```
  ¿Hay algo escuchando? ___

- [ ] **Backend Local**
  ```bash
  curl http://127.0.0.1:2727/api/v1/health
  ```
  ¿Responde con 200 OK? ___

- [ ] **Nginx Status**
  ```bash
  sudo systemctl status nginx
  ```
  ¿Está activo? ___

- [ ] **Nginx Config**
  ```bash
  sudo nginx -t
  ```
  ¿Muestra "syntax is ok"? ___

- [ ] **Certificados SSL**
  ```bash
  ls -la /etc/letsencrypt/live/api.sukadex.net/
  ```
  ¿Existen fullchain.pem y privkey.pem? ___

---

## 🔄 Proceso de Reinicio Completo

Si nada funciona, ejecuta en orden:

```bash
# 1. Detener todo
pm2 stop sukaback
sudo systemctl stop nginx

# 2. Verificar que no haya procesos zombies
sudo netstat -tulpn | grep 2727
sudo netstat -tulpn | grep 443

# 3. Reiniciar backend
cd /var/www/SukaBack
pm2 restart sukaback
pm2 logs sukaback --lines 20

# 4. Verificar backend
curl http://127.0.0.1:2727/api/v1/health

# 5. Si el backend funciona, reiniciar Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl status nginx

# 6. Verificar desde fuera
curl -I https://api.sukadex.net/api/v1/health
```

---

## 🧪 Pruebas Específicas

### Probar CORS desde el servidor
```bash
curl -I -X OPTIONS https://api.sukadex.net/api/v1/auth/login \
  -H "Origin: https://sukadex.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type"
```

### Probar endpoint de Swagger
```bash
curl -I https://api.sukadex.net/docs
```

### Probar con verbose para ver detalles
```bash
curl -v https://api.sukadex.net/api/v1/health
```

---

## 📞 Información Necesaria para Debug

Por favor ejecuta estos comandos y comparte los resultados:

```bash
# 1. Estado general
pm2 status
sudo systemctl status nginx

# 2. Logs recientes
pm2 logs sukaback --lines 30 --nostream
sudo tail -20 /var/log/nginx/sukaback-error.log
sudo tail -20 /var/log/nginx/error.log

# 3. Configuración actual
sudo cat /etc/nginx/conf.d/sukaback.conf

# 4. Puerto y conexiones
sudo netstat -tulpn | grep -E "(2727|443)"

# 5. Prueba local
curl -v http://127.0.0.1:2727/api/v1/health
```

---

## 🎯 Configuración Actualizada de Nginx

Si necesitas reemplazar completamente el archivo:

```bash
sudo nano /etc/nginx/conf.d/sukaback.conf
```

Y pega esta configuración actualizada (corrige el warning de http2):

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name api.sukadex.net;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/api.sukadex.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sukadex.net/privkey.pem;

    # Seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/sukaback-access.log;
    error_log /var/log/nginx/sukaback-error.log;

    # Aumentar tamaños de buffer
    client_max_body_size 10M;
    client_body_buffer_size 128k;

    location / {
        # Manejar preflight CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $http_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy al backend
        proxy_pass http://127.0.0.1:2727;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts aumentados
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
        
        # Buffer sizes
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name api.sukadex.net;
    return 301 https://$server_name$request_uri;
}
```

Luego:
```bash
sudo nginx -t
sudo systemctl reload nginx
```
