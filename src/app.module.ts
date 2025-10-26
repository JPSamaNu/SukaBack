import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { PokemonModule } from './pokemon/pokemon.module';
import { GenerationsModule } from './generations/generations.module';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting básico
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 60, // 60 requests por minuto
      },
    ]),
    
    // Módulos principales
    DatabaseModule,
    AuthModule,
    UsersModule,
    PokemonModule,
    GenerationsModule,
    
    // Módulo de salud para monitoring
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}