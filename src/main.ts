import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Middleware de seguridad
  app.use(helmet());
  app.use(cookieParser());

  // CORS configurado para frontend React (desarrollo y producción)
  const allowedOrigins = [
    'https://sukadex.net',
    'https://www.sukadex.net',
    'https://api.sukadex.net',
    'http://localhost:5173',
    'http://localhost:2769',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Interceptors globales
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Filtros globales
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('SukaBack API')
    .setDescription('API del backend oficial para SukaDex')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y autorización')
    .addTag('users', 'Gestión de usuarios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Configurar servidor base de Swagger (relativo para funcionar en cualquier dominio)
  document.servers = [
    {
      url: '/api/v1',
      description: 'Servidor actual (producción o desarrollo)',
    },
  ];

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'SukaBack API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true, // Mantener el token JWT tras recargar
    },
  });

  // Puerto del servidor
  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 SukaBack está ejecutándose en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/docs`);
  console.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);
}

bootstrap();