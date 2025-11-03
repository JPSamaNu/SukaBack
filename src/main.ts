import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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

  // CORS configurado para frontend React - Permite múltiples orígenes
  const corsOrigins = configService.get('CORS_ORIGIN', 'http://localhost:2769');
  const allowedOrigins = corsOrigins.split(',').map((origin: string) => origin.trim());
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como Postman, curl, apps móviles)
      if (!origin) {
        return callback(null, true);
      }
      
      // Verificar si el origin está en la lista de permitidos
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      
      // Rechazar otros orígenes
      console.log(`❌ CORS: Origen rechazado - ${origin}`);
      console.log(`✅ CORS: Orígenes permitidos - ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 horas de cache para preflight requests
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
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'SukaBack API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Puerto del servidor
  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 SukaBack está ejecutándose en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/docs`);
  console.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);
}

bootstrap();