# 🚀 SukaBack - Backend Oficial SukaDex

Backend robusto y escalable construido con **NestJS 10**, **TypeScript**, **PostgreSQL** (AWS RDS) y **JWT** para el ecosistema SukaDex.

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [API Endpoints](#-api-endpoints)
- [Autenticación](#-autenticación)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Arquitectura](#-arquitectura)

## 🛠 Stack Tecnológico

- **Framework**: NestJS 10 con TypeScript estricto
- **Base de Datos**: PostgreSQL (AWS RDS)
- **ORM**: TypeORM con sincronización automática
- **Autenticación**: JWT (Access + Refresh tokens)
- **Validación**: class-validator + class-transformer
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Documentación**: Swagger (OpenAPI 3.0)
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier

## ✨ Características

- 🔐 **Autenticación JWT completa** (registro, login, refresh)
- 👥 **Gestión de usuarios** con CRUD completo
- 🛡️ **Seguridad robusta** (bcrypt, helmet, rate limiting)
- 📚 **Documentación automática** con Swagger
- 🧪 **Testing configurado** (unit + e2e)
- 🌐 **CORS configurado** para React frontend
- 📦 **Arquitectura modular** y escalable
- 🔄 **Refresh tokens** en cookies httpOnly
- ⚡ **Validación estricta** de DTOs
- 🐳 **Ready para Docker/AWS**

## 📋 Requisitos Previos

- Node.js 18+ 
- npm/pnpm/yarn
- PostgreSQL (AWS RDS configurado)
- Git

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd SukaBack
```

2. **Instalar dependencias**
```bash
npm install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

## ⚙️ Configuración

Edita el archivo `.env` con tus credenciales:

```env
# Puerto del servidor
PORT=3000

# JWT Secrets (CAMBIAR en producción)
JWT_SECRET=tu_secret_super_seguro_para_access_tokens
JWT_REFRESH_SECRET=tu_secret_super_seguro_para_refresh_tokens

# JWT Timeouts
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Base de datos PostgreSQL (AWS RDS)
DATABASE_URL=postgresql://suka:TU_PASSWORD@sukadb.c6pq4u2yk89i.us-east-1.rds.amazonaws.com:5432/sukadb

# CORS para frontend React
CORS_ORIGIN=http://localhost:5173

# Entorno
NODE_ENV=development
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

### Testing
```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

### Linting
```bash
npm run lint
npm run format
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Documentación
```
http://localhost:3000/docs
```

### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Registrar usuario | - |
| `POST` | `/auth/login` | Iniciar sesión | - |
| `POST` | `/auth/refresh` | Renovar token | - |
| `POST` | `/auth/logout` | Cerrar sesión | 🔒 |
| `GET` | `/auth/me` | Usuario actual | 🔒 |

### Usuarios
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/users` | Listar usuarios | 🔒 |
| `GET` | `/users/me` | Mi perfil | 🔒 |
| `GET` | `/users/:id` | Usuario por ID | 🔒 |
| `PATCH` | `/users/:id` | Actualizar usuario | 🔒 |
| `DELETE` | `/users/:id` | Eliminar usuario | 🔒 |

## 🔐 Autenticación

### Flujo JWT
1. **Registro/Login**: Devuelve `access_token` y guarda `refresh_token` en cookie httpOnly
2. **Requests**: Usar `Authorization: Bearer <access_token>`
3. **Refresh**: Automático con cookie o manual con token
4. **Logout**: Limpia cookies y tokens

### Ejemplo de Login
```javascript
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Para cookies
  body: JSON.stringify({
    email: 'usuario@sukadex.com',
    password: 'miPassword123'
  })
});

const { access_token, user } = await response.json();
```

### Ejemplo de Request Autenticado
```javascript
const response = await fetch('http://localhost:3000/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  },
  credentials: 'include'
});
```

## 🧪 Testing

### Estructura de Tests
```
test/
├── auth.e2e-spec.ts          # Tests e2e de autenticación
└── jest-e2e.json             # Configuración Jest e2e

src/
└── users/
    └── users.service.spec.ts  # Tests unitarios de servicio
```

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Solo unitarios
npm run test:watch

# Solo e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 🐳 Despliegue

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### AWS ECS/Fargate
1. Configurar variables de entorno en ECS
2. Actualizar `DATABASE_URL` con RDS endpoint
3. Configurar Load Balancer y Target Groups
4. Habilitar HTTPS en producción

## 🏗 Arquitectura

### Estructura de Directorios
```
src/
├── app.module.ts              # Módulo principal
├── main.ts                    # Punto de entrada
├── config/
│   └── ormconfig.ts           # Configuración TypeORM
├── common/
│   ├── guards/
│   │   └── jwt-auth.guard.ts  # Guard JWT
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── database/
│   └── database.module.ts     # Módulo de base de datos
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   └── dto/
│       └── auth.dto.ts
└── users/
    ├── users.module.ts
    ├── users.service.ts
    ├── users.controller.ts
    ├── entities/
    │   └── user.entity.ts
    └── dto/
        └── user.dto.ts
```

### Decisiones de Arquitectura

#### ¿Por qué TypeORM?
- **Integración nativa** con NestJS
- **Type-safe** con TypeScript
- **Migrations automáticas** en desarrollo
- **Decoradores** para entidades limpias

#### ¿Por qué JWT + Refresh?
- **Stateless** para escalabilidad
- **Seguridad mejorada** con tokens de corta duración
- **Cookies httpOnly** para refresh tokens
- **Compatible** con SPAs React

#### ¿Por qué Arquitectura Modular?
- **Separación de responsabilidades**
- **Fácil testing** unitario
- **Escalabilidad** horizontal
- **Mantenimiento** simplificado

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Modo watch con nodemon
npm run start:debug        # Modo debug

# Producción
npm run build              # Compilar TypeScript
npm run start:prod         # Ejecutar compilado

# Calidad de código
npm run lint               # ESLint + autofix
npm run format             # Prettier format
npm run test               # Jest unitarios
npm run test:e2e           # Jest e2e
npm run test:cov           # Coverage report
```

## 🚨 Consideraciones de Seguridad

- ✅ **Bcrypt** con 12 rounds para passwords
- ✅ **Helmet** para headers de seguridad
- ✅ **Rate limiting** (60 req/min)
- ✅ **CORS** restringido a frontend
- ✅ **JWT secrets** configurables
- ✅ **Refresh tokens** en httpOnly cookies
- ✅ **Validación estricta** de inputs
- ✅ **PostgreSQL** con SSL en AWS

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

## 👥 Equipo

**SukaDex Team** - Backend oficial para el ecosistema SukaDex

---

⭐ **¡Si te gusta el proyecto, no olvides darle una estrella!** ⭐